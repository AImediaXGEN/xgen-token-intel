import { PublicKey, type AccountInfo, type Connection, type ParsedAccountData } from "@solana/web3.js";
import type { LargestTokenAccountInput } from "@/lib/intel/concentration";

const DEFAULT_OWNER_RESOLUTION_BATCH_SIZE = 100;

type FetchLargestTokenAccountsOptions = {
  ownerResolutionBatchSize?: number;
};

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

function normalizeBatchSize(batchSize: number | undefined): number {
  if (!Number.isInteger(batchSize) || batchSize === undefined || batchSize < 1) {
    return DEFAULT_OWNER_RESOLUTION_BATCH_SIZE;
  }

  return batchSize;
}

async function fetchParsedAccountsInBatches(
  connection: Connection,
  addresses: PublicKey[],
  batchSize: number,
): Promise<(AccountInfo<Buffer | ParsedAccountData> | null)[]> {
  const parsedAccounts: (AccountInfo<Buffer | ParsedAccountData> | null)[] = [];

  for (let start = 0; start < addresses.length; start += batchSize) {
    const batch = addresses.slice(start, start + batchSize);
    const response = await connection.getMultipleParsedAccounts(batch, { commitment: "confirmed" });

    if (response.value.length !== batch.length) {
      throw new Error(`Owner resolution RPC returned ${response.value.length} accounts for ${batch.length} requested accounts.`);
    }

    parsedAccounts.push(...response.value);
  }

  return parsedAccounts;
}

export async function fetchLargestTokenAccountsWithOwners(
  connection: Connection,
  mint: PublicKey,
  options: FetchLargestTokenAccountsOptions = {},
): Promise<LargestTokenAccountInput[]> {
  const largestAccounts = await connection.getTokenLargestAccounts(mint, "confirmed");
  const addresses = largestAccounts.value.map((account) => account.address);

  if (addresses.length === 0) {
    return [];
  }

  const parsedAccounts = await fetchParsedAccountsInBatches(
    connection,
    addresses,
    normalizeBatchSize(options.ownerResolutionBatchSize),
  );

  return largestAccounts.value.map((account, index) => {
    const ownerAddress = resolveOwnerFromParsedAccount(parsedAccounts[index], mint);

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
