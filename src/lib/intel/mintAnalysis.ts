import type { AccountInfo, ParsedAccountData } from "@solana/web3.js";
import { identifyTokenProgram, type SupportedTokenProgram } from "@/lib/solana/constants";
import { createReadOnlyConnection, parseSolanaPublicKey } from "@/lib/solana/rpc";
import { buildAuthorityAnalysis, buildAuthoritySignals } from "./authorityAnalysis";
import { calculateM1Score } from "./scoring";
import type { AnalysisResult, ConcentrationReport, MintInspection } from "./schemas";

const concentrationNotImplemented: ConcentrationReport = {
  status: "not-implemented-m1",
  largestTokenAccounts: [],
  top5TokenAccountConcentration: null,
  top10TokenAccountConcentration: null,
  top20TokenAccountConcentration: null,
  note:
    "M2 does not report holder concentration. Solana RPC largest-token-account results are token accounts, not unique human holders.",
};

const baseLimitations = [
  "M2 uses standard read-only Solana RPC only.",
  "Largest token accounts and concentration metrics are reserved for M3 to avoid mislabeling token accounts as unique holders.",
  "This report does not classify a token as safe, unsafe, or malicious.",
  "The XGEN Intel Score remains the M1 baseline until the M4 scoring methodology milestone.",
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
  if (!isParsedAccountData(account.data)) {
    return null;
  }

  const parsed = account.data.parsed;
  if (parsed?.type !== "mint") {
    return null;
  }

  return parsed.info as ParsedMintInfo;
}

function emptyResult(
  input: string,
  generatedAt: string,
  status: AnalysisResult["status"],
  summary: string,
  mintAddress: string | null,
): AnalysisResult {
  return {
    version: "m2",
    generatedAt,
    input,
    mintAddress,
    status,
    summary,
    mint: null,
    authorityAnalysis: null,
    concentration: concentrationNotImplemented,
    score: calculateM1Score(null),
    riskSignals: [],
    limitations: baseLimitations,
  };
}

export async function analyzeMintAddress(input: string): Promise<AnalysisResult> {
  const publicKey = parseSolanaPublicKey(input);
  const generatedAt = new Date().toISOString();

  if (!publicKey) {
    return emptyResult(
      input,
      generatedAt,
      "invalid-address",
      "The input is not a valid canonical Solana public key.",
      null,
    );
  }

  try {
    const connection = createReadOnlyConnection();
    const [accountResponse, supplyResponse] = await Promise.allSettled([
      connection.getParsedAccountInfo(publicKey, "confirmed"),
      connection.getTokenSupply(publicKey, "confirmed"),
    ]);

    if (accountResponse.status === "rejected") {
      throw accountResponse.reason;
    }

    const account = accountResponse.value.value;
    if (!account) {
      return emptyResult(
        input,
        generatedAt,
        "not-found",
        "No account was found at this address on the selected Solana RPC endpoint.",
        publicKey.toBase58(),
      );
    }

    const tokenProgram: SupportedTokenProgram = identifyTokenProgram(account.owner);
    const parsedMintInfo = getParsedMintInfo(account);
    const supplyValue = supplyResponse.status === "fulfilled" ? supplyResponse.value.value : null;

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
      return {
        version: "m2",
        generatedAt,
        input,
        mintAddress: publicKey.toBase58(),
        status: "unsupported-account",
        summary:
          "The account exists, but M2 could not verify it as a parsed SPL Token or Token-2022 mint account.",
        mint,
        authorityAnalysis,
        concentration: concentrationNotImplemented,
        score: calculateM1Score(mint),
        riskSignals: [],
        limitations: [
          ...baseLimitations,
          "Unsupported accounts are not interpreted as token mints.",
        ],
      };
    }

    return {
      version: "m2",
      generatedAt,
      input,
      mintAddress: publicKey.toBase58(),
      status: "ok",
      summary: "Read-only authority inspection completed from observable Solana RPC data.",
      mint,
      authorityAnalysis,
      concentration: concentrationNotImplemented,
      score: calculateM1Score(mint),
      riskSignals: buildAuthoritySignals(mint),
      limitations: [...baseLimitations, ...authorityAnalysis.limitations],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RPC error";

    return emptyResult(
      input,
      generatedAt,
      "rpc-error",
      `RPC request failed: ${message}`,
      publicKey.toBase58(),
    );
  }
}
