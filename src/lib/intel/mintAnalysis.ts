import type { AccountInfo, ParsedAccountData } from "@solana/web3.js";
import { identifyTokenProgram, type SupportedTokenProgram } from "@/lib/solana/constants";
import { createReadOnlyConnection, parseSolanaPublicKey } from "@/lib/solana/rpc";
import { calculateM1Score } from "./scoring";
import type { AnalysisResult, ConcentrationReport, MintInspection, ObservableSignal } from "./schemas";

const concentrationNotImplemented: ConcentrationReport = {
  status: "not-implemented-m1",
  largestTokenAccounts: [],
  top5TokenAccountConcentration: null,
  top10TokenAccountConcentration: null,
  top20TokenAccountConcentration: null,
  note:
    "M1 does not report holder concentration. Solana RPC largest-token-account results are token accounts, not unique human holders.",
};

const baseLimitations = [
  "M1 uses standard read-only Solana RPC only.",
  "Largest token accounts and concentration metrics are reserved for M3 to avoid mislabeling token accounts as unique holders.",
  "This report does not classify a token as safe, unsafe, or malicious.",
];

type ParsedMintInfo = {
  decimals?: number;
  supply?: string;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
};

function isParsedAccountData(data: AccountInfo<Buffer | ParsedAccountData>["data"]): data is ParsedAccountData {
  return !Buffer.isBuffer(data) && typeof data === "object" && "parsed" in data;
}

function getParsedMintInfo(account: AccountInfo<Buffer | ParsedAccountData>): ParsedMintInfo | null {
  if (!isParsedAccountData(account.data)) {
    return null;
  }

  const parsed = account.data.parsed;
  if (parsed?.type !== "mint") {
    return null;
  }

  return parsed.info as ParsedMintInfo;
}

function authoritySignals(mint: MintInspection): ObservableSignal[] {
  const signals: ObservableSignal[] = [];

  if (mint.mintAuthorityRevoked === true) {
    signals.push({
      id: "mint-authority-revoked-observed",
      label: "Mint authority revoked",
      severity: "positive",
      condition: "Parsed mint data reports no mint authority.",
      whyItMatters:
        "A revoked mint authority means the standard token program no longer allows additional supply to be minted through that authority.",
      source: "getParsedAccountInfo.parsed.info.mintAuthority",
    });
  } else if (mint.mintAuthorityRevoked === false) {
    signals.push({
      id: "mint-authority-active-observed",
      label: "Mint authority active",
      severity: "caution",
      condition: "Parsed mint data reports an active mint authority.",
      whyItMatters:
        "An active mint authority can allow additional token supply to be minted, depending on token program rules and authority control.",
      source: "getParsedAccountInfo.parsed.info.mintAuthority",
    });
  }

  if (mint.freezeAuthorityRevoked === true) {
    signals.push({
      id: "freeze-authority-revoked-observed",
      label: "Freeze authority revoked",
      severity: "positive",
      condition: "Parsed mint data reports no freeze authority.",
      whyItMatters:
        "A revoked freeze authority means the standard token program no longer allows token accounts to be frozen through that authority.",
      source: "getParsedAccountInfo.parsed.info.freezeAuthority",
    });
  } else if (mint.freezeAuthorityRevoked === false) {
    signals.push({
      id: "freeze-authority-active-observed",
      label: "Freeze authority active",
      severity: "caution",
      condition: "Parsed mint data reports an active freeze authority.",
      whyItMatters:
        "A freeze authority can freeze token accounts under standard token program rules. This does not prove malicious intent, but it is important to verify.",
      source: "getParsedAccountInfo.parsed.info.freezeAuthority",
    });
  }

  return signals;
}

export async function analyzeMintAddress(input: string): Promise<AnalysisResult> {
  const publicKey = parseSolanaPublicKey(input);
  const generatedAt = new Date().toISOString();

  if (!publicKey) {
    return {
      version: "m1",
      generatedAt,
      input,
      mintAddress: null,
      status: "invalid-address",
      summary: "The input is not a valid canonical Solana public key.",
      mint: null,
      concentration: concentrationNotImplemented,
      score: calculateM1Score(null),
      riskSignals: [],
      limitations: baseLimitations,
    };
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
      return {
        version: "m1",
        generatedAt,
        input,
        mintAddress: publicKey.toBase58(),
        status: "not-found",
        summary: "No account was found at this address on the selected Solana RPC endpoint.",
        mint: null,
        concentration: concentrationNotImplemented,
        score: calculateM1Score(null),
        riskSignals: [],
        limitations: baseLimitations,
      };
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

    if (tokenProgram === "unknown" || !parsedMintInfo) {
      return {
        version: "m1",
        generatedAt,
        input,
        mintAddress: publicKey.toBase58(),
        status: "unsupported-account",
        summary:
          "The account exists, but M1 could not verify it as a parsed SPL Token or Token-2022 mint account.",
        mint,
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
      version: "m1",
      generatedAt,
      input,
      mintAddress: publicKey.toBase58(),
      status: "ok",
      summary: "Read-only mint inspection completed from observable Solana RPC data.",
      mint,
      concentration: concentrationNotImplemented,
      score: calculateM1Score(mint),
      riskSignals: authoritySignals(mint),
      limitations: baseLimitations,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown RPC error";

    return {
      version: "m1",
      generatedAt,
      input,
      mintAddress: publicKey.toBase58(),
      status: "rpc-error",
      summary: `RPC request failed: ${message}`,
      mint: null,
      concentration: concentrationNotImplemented,
      score: calculateM1Score(null),
      riskSignals: [],
      limitations: [
        ...baseLimitations,
        "RPC failures are infrastructure errors, not token-risk conclusions.",
      ],
    };
  }
}
