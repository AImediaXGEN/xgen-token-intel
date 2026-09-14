import type { AccountInfo, ParsedAccountData } from "@solana/web3.js";
import { identifyTokenProgram, type SupportedTokenProgram } from "@/lib/solana/constants";
import { createReadOnlyConnection, parseSolanaPublicKey } from "@/lib/solana/rpc";
import { fetchLargestTokenAccountsWithOwners } from "@/lib/solana/tokenAccounts";
import { buildAuthorityAnalysis, buildAuthoritySignals } from "./authorityAnalysis";
import { buildConcentrationReport } from "./concentration";
import { calculateAnalysisCoverage, calculateIntelScore } from "./scoring";
import type { AnalysisResult, ConcentrationReport, MintInspection } from "./schemas";

export function sanitizeRpcErrorMessage(message: string): string {
  return message
    .replace(/https?:\/\/\S+/g, "[redacted-rpc-url]")
    .replace(/([?&](?:api[-_]?key|key|token)=)[^\s"&]+/gi, "$1[redacted]");
}

function unavailableConcentration(reason: string): ConcentrationReport {
  return {
    status: "unavailable",
    methodology: "Concentration requires read-only largest-token-account RPC data and current mint supply.",
    tokenAccountConcentration: null,
    resolvedOwnerConcentration: null,
    resolution: {
      quality: "unavailable",
      accountsInspected: 0,
      accountsResolved: 0,
      accountsUnresolved: 0,
      sampledRawBalance: "0",
      sampledSupplyPercent: null,
      resolvedAccountPercent: "0.00",
      sampledBalanceResolvedPercent: "0.00",
    },
    limitations: [reason],
  };
}

const baseLimitations = [
  "M4 uses standard read-only Solana RPC only.",
  "getTokenLargestAccounts returns the largest token accounts, not every token account and not verified owner identities.",
  "This report does not classify a token as safe, unsafe, malicious, or suitable for market action.",
  "The XGEN Intel Score reflects observed risk characteristics within currently analyzed surfaces and is separated from analysis coverage.",
];

type ParsedTokenExtension = {
  extension: string;
  state?: Record<string, unknown>;
};

type ParsedMintInfo = {
  decimals?: number;
  supply?: string;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  extensions?: ParsedTokenExtension[];
};

function isParsedAccountData(data: AccountInfo<Buffer | ParsedAccountData>["data"]): data is ParsedAccountData {
  return !Buffer.isBuffer(data) && typeof data === "object" && "parsed" in data;
}

export function getParsedMintInfo(account: AccountInfo<Buffer | ParsedAccountData>): ParsedMintInfo | null {
  if (!isParsedAccountData(account.data)) return null;
  const parsed = account.data.parsed;
  if (parsed?.type !== "mint") return null;
  return parsed.info as ParsedMintInfo;
}

function emptyResult(
  input: string,
  generatedAt: string,
  status: AnalysisResult["status"],
  summary: string,
  mintAddress: string | null,
): AnalysisResult {
  const concentration = unavailableConcentration("Concentration is unavailable when no supported mint is available.");
  const scoringInput = { mint: null, authorityAnalysis: null, concentration };

  return {
    version: "m4",
    generatedAt,
    input,
    mintAddress,
    status,
    summary,
    mint: null,
    authorityAnalysis: null,
    concentration,
    score: calculateIntelScore(scoringInput),
    analysisCoverage: calculateAnalysisCoverage(scoringInput),
    riskSignals: [],
    limitations: baseLimitations,
  };
}

export async function analyzeMintAddress(input: string): Promise<AnalysisResult> {
  const publicKey = parseSolanaPublicKey(input);
  const generatedAt = new Date().toISOString();

  if (!publicKey) {
    return emptyResult(input, generatedAt, "invalid-address", "The input is not a valid canonical Solana public key.", null);
  }

  try {
    const connection = createReadOnlyConnection();
    const [accountResponse, supplyResponse] = await Promise.allSettled([
      connection.getParsedAccountInfo(publicKey, "confirmed"),
      connection.getTokenSupply(publicKey, "confirmed"),
    ]);

    if (accountResponse.status === "rejected") throw accountResponse.reason;

    const account = accountResponse.value.value;
    if (!account) {
      return emptyResult(input, generatedAt, "not-found", "No account was found at this address on the selected Solana RPC endpoint.", publicKey.toBase58());
    }

    const tokenProgram: SupportedTokenProgram = identifyTokenProgram(account.owner);
    const parsedMintInfo = getParsedMintInfo(account);
    const supplyValue = supplyResponse.status === "fulfilled" ? supplyResponse.value.value : null;
    const supplyLimitation =
      supplyResponse.status === "rejected"
        ? [`Token supply RPC request failed: ${sanitizeRpcErrorMessage(supplyResponse.reason instanceof Error ? supplyResponse.reason.message : String(supplyResponse.reason))}`]
        : [];

    const mint: MintInspection = {
      mintAddress: publicKey.toBase58(),
      accountExists: true,
      tokenProgram,
      decimals: parsedMintInfo?.decimals ?? supplyValue?.decimals ?? null,
      supply: supplyValue
        ? {
            rawAmount: supplyValue.amount,
            decimals: supplyValue.decimals,
            uiAmountString: supplyValue.uiAmountString ?? null,
          }
        : parsedMintInfo?.supply && typeof parsedMintInfo.decimals === "number"
          ? {
              rawAmount: parsedMintInfo.supply,
              decimals: parsedMintInfo.decimals,
              uiAmountString: null,
            }
          : null,
      mintAuthority: parsedMintInfo?.mintAuthority ?? null,
      mintAuthorityRevoked: parsedMintInfo ? parsedMintInfo.mintAuthority == null : null,
      freezeAuthority: parsedMintInfo?.freezeAuthority ?? null,
      freezeAuthorityRevoked: parsedMintInfo ? parsedMintInfo.freezeAuthority == null : null,
    };

    const authorityAnalysis = buildAuthorityAnalysis({
      tokenProgram,
      mintAuthority: mint.mintAuthority,
      mintAuthorityRevoked: mint.mintAuthorityRevoked,
      freezeAuthority: mint.freezeAuthority,
      freezeAuthorityRevoked: mint.freezeAuthorityRevoked,
      extensions: parsedMintInfo?.extensions,
    });

    if (tokenProgram === "unknown" || !parsedMintInfo) {
      const concentration = unavailableConcentration("Concentration is unavailable for unsupported or unparsed mint accounts.");
      const scoringInput = { mint, authorityAnalysis, concentration };

      return {
        version: "m4",
        generatedAt,
        input,
        mintAddress: publicKey.toBase58(),
        status: "unsupported-account",
        summary: "The account exists, but M4 could not verify it as a parsed SPL Token or Token-2022 mint account.",
        mint,
        authorityAnalysis,
        concentration,
        score: calculateIntelScore(scoringInput),
        analysisCoverage: calculateAnalysisCoverage(scoringInput),
        riskSignals: [],
        limitations: [...baseLimitations, ...supplyLimitation, "Unsupported accounts are not interpreted as token mints."],
      };
    }

    let concentration: ConcentrationReport;
    if (mint.supply?.rawAmount === "0") {
      concentration = buildConcentrationReport(mint, []);
    } else {
      try {
        const largestAccounts = await fetchLargestTokenAccountsWithOwners(connection, publicKey);
        concentration = buildConcentrationReport(mint, largestAccounts);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown concentration RPC error";
        concentration = unavailableConcentration(`Concentration RPC request failed: ${sanitizeRpcErrorMessage(message)}`);
      }
    }

    const scoringInput = { mint, authorityAnalysis, concentration };

    return {
      version: "m4",
      generatedAt,
      input,
      mintAddress: publicKey.toBase58(),
      status: "ok",
      summary: "Read-only authority, concentration, and scoring inspection completed from observable Solana RPC data.",
      mint,
      authorityAnalysis,
      concentration,
      score: calculateIntelScore(scoringInput),
      analysisCoverage: calculateAnalysisCoverage(scoringInput),
      riskSignals: [
        ...buildAuthoritySignals(mint),
        {
          id: "token-account-concentration-is-not-holder-identity",
          label: "Token-account concentration is not holder identity",
          severity: "info",
          condition: "M4 separates token-account concentration from resolved-owner concentration.",
          whyItMatters: "A Solana owner address can control multiple token accounts, and a resolved owner is not a verified real-world entity or person.",
          source: "getTokenLargestAccounts + getMultipleParsedAccounts",
        },
      ],
      limitations: [...baseLimitations, ...supplyLimitation, ...authorityAnalysis.limitations, ...concentration.limitations],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RPC error";
    return emptyResult(input, generatedAt, "rpc-error", `RPC request failed: ${sanitizeRpcErrorMessage(message)}`, publicKey.toBase58());
  }
}
