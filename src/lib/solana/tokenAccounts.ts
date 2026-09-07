import { PublicKey, type AccountInfo, type Connection, type ParsedAccountData } from "@solana/web3.js";
import type { LargestTokenAccountInput } from "@/lib/intel/concentration";

function isParsedAccountData(data: AccountInfo<Buffer | ParsedAccountData>["data"]): data is ParsedAccountData {
  return !Buffer.isBuffer(data) && typeof data === "object" && "parsed" in data;
}

function resolveOwnerFromParsedAccount(
  account: AccountInfo<Buffer | ParsedAccountData> | null,
  expectedMint: PublicKey,
): string | null {
  if (!account || !isParsedAccountData(account.data)) {
    return null;
  }

  const parsed = account.data.parsed;
  const info = parsed?.info as { mint?: string; owner?: string } | undefined;

  if (parsed?.type !== "account" || info?.mint !== expectedMint.toBase58() || !info.owner) {
    return null;
  }

  return info.owner;
}

export async function fetchLargestTokenAccountsWithOwners(
  connection: Connection,
  mint: PublicKey,
): Promise<LargestTokenAccountInput[]> {
  const largestAccounts = await connection.getTokenLargestAccounts(mint, "confirmed");
  const addresses = largestAccounts.value.map((account) => account.address);

  if (addresses.length === 0) {
    return [];
  }

  const parsedAccounts = await connection.getMultipleParsedAccounts(addresses, { commitment: "confirmed" });

  return largestAccounts.value.map((account, index) => {
    const ownerAddress = resolveOwnerFromParsedAccount(parsedAccounts.value[index], mint);

    return {
      tokenAccountAddress: account.address.toBase58(),
      rawAmount: account.amount,
      uiAmountString: account.uiAmountString ?? null,
      decimals: account.decimals,
      ownerAddress,
      resolutionStatus: ownerAddress ? "resolved" : "unresolved",
    };
  });
}
