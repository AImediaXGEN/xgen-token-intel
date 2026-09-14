import { describe, expect, it } from "vitest";
import { PublicKey, type AccountInfo, type ParsedAccountData } from "@solana/web3.js";
import { buildConcentrationReport } from "@/lib/intel/concentration";
import { calculateIntelScore } from "@/lib/intel/scoring";
import type { MintInspection } from "@/lib/intel/schemas";
import { fetchLargestTokenAccountsWithOwners } from "./tokenAccounts";

const mint = new PublicKey("So11111111111111111111111111111111111111112");

function publicKey(index: number): PublicKey {
  const bytes = new Uint8Array(32);
  bytes[31] = index;
  return new PublicKey(bytes);
}

function parsedTokenAccount(owner: string | null, mintAddress = mint.toBase58()): AccountInfo<Buffer | ParsedAccountData> | null {
  if (owner === null) return null;

  return {
    data: {
      program: "spl-token",
      parsed: {
        type: "account",
        info: {
          mint: mintAddress,
          owner,
        },
      },
      space: 165,
    },
    executable: false,
    lamports: 1,
    owner: mint,
    rentEpoch: 1,
  } as AccountInfo<Buffer | ParsedAccountData>;
}

function connectionFor(accounts: { amount: string; owner: string | null }[], options: { failBatchAt?: number; partialBatchAt?: number } = {}) {
  const calls: number[] = [];
  const addressToIndex = new Map<string, number>();
  const largest = accounts.map((account, index) => {
    const address = publicKey(index + 1);
    addressToIndex.set(address.toBase58(), index);
    return {
      address,
      amount: account.amount,
      uiAmount: Number(account.amount),
      uiAmountString: account.amount,
      decimals: 0,
    };
  });

  const connection = {
    calls,
    getTokenLargestAccounts: async () => ({ value: largest }),
    getMultipleParsedAccounts: async (addresses: PublicKey[]) => {
      calls.push(addresses.length);
      const callIndex = calls.length;
      if (options.failBatchAt === callIndex) throw new Error("batch failed");
      const value = addresses.map((address) => {
        const index = addressToIndex.get(address.toBase58());
        if (index === undefined) return null;
        return parsedTokenAccount(accounts[index].owner);
      });
      return {
        value: options.partialBatchAt === callIndex ? value.slice(0, Math.max(0, value.length - 1)) : value,
      };
    },
  };

  return connection;
}

function mintInspection(rawSupply: string): MintInspection {
  return {
    mintAddress: mint.toBase58(),
    accountExists: true,
    tokenProgram: "spl-token",
    decimals: 0,
    supply: { rawAmount: rawSupply, decimals: 0, uiAmountString: rawSupply },
    mintAuthority: null,
    mintAuthorityRevoked: true,
    freezeAuthority: null,
    freezeAuthorityRevoked: true,
  };
}

describe("fetchLargestTokenAccountsWithOwners", () => {
  it("resolves parsed token account owners in one batch", async () => {
    const connection = connectionFor([{ amount: "100", owner: "Owner1" }]);

    await expect(fetchLargestTokenAccountsWithOwners(connection as never, mint)).resolves.toEqual([
      {
        tokenAccountAddress: publicKey(1).toBase58(),
        rawAmount: "100",
        uiAmountString: "100",
        decimals: 0,
        ownerAddress: "Owner1",
        resolutionStatus: "resolved",
      },
    ]);
    expect(connection.calls).toEqual([1]);
  });

  it("uses one batch at the exact batch boundary", async () => {
    const connection = connectionFor(Array.from({ length: 3 }, (_, index) => ({ amount: "1", owner: `Owner${index}` })));

    await fetchLargestTokenAccountsWithOwners(connection as never, mint, { ownerResolutionBatchSize: 3 });

    expect(connection.calls).toEqual([3]);
  });

  it("uses two batches at boundary plus one", async () => {
    const connection = connectionFor(Array.from({ length: 4 }, (_, index) => ({ amount: "1", owner: `Owner${index}` })));

    await fetchLargestTokenAccountsWithOwners(connection as never, mint, { ownerResolutionBatchSize: 3 });

    expect(connection.calls).toEqual([3, 1]);
  });

  it("uses multiple batches", async () => {
    const connection = connectionFor(Array.from({ length: 7 }, (_, index) => ({ amount: "1", owner: `Owner${index}` })));

    await fetchLargestTokenAccountsWithOwners(connection as never, mint, { ownerResolutionBatchSize: 3 });

    expect(connection.calls).toEqual([3, 3, 1]);
  });

  it("preserves ordering across batches", async () => {
    const connection = connectionFor(Array.from({ length: 5 }, (_, index) => ({ amount: String(index + 1), owner: `Owner${index + 1}` })));

    const result = await fetchLargestTokenAccountsWithOwners(connection as never, mint, { ownerResolutionBatchSize: 2 });

    expect(result.map((account) => account.rawAmount)).toEqual(["1", "2", "3", "4", "5"]);
    expect(result.map((account) => account.ownerAddress)).toEqual(["Owner1", "Owner2", "Owner3", "Owner4", "Owner5"]);
  });

  it("preserves unresolved accounts", async () => {
    const connection = connectionFor([
      { amount: "100", owner: "Owner1" },
      { amount: "50", owner: null },
    ]);

    const result = await fetchLargestTokenAccountsWithOwners(connection as never, mint, { ownerResolutionBatchSize: 1 });

    expect(result[1]).toMatchObject({ ownerAddress: null, resolutionStatus: "unresolved" });
  });

  it("throws on partial RPC responses", async () => {
    const connection = connectionFor(
      Array.from({ length: 3 }, (_, index) => ({ amount: "1", owner: `Owner${index}` })),
      { partialBatchAt: 1 },
    );

    await expect(fetchLargestTokenAccountsWithOwners(connection as never, mint, { ownerResolutionBatchSize: 3 })).rejects.toThrow("returned 2 accounts for 3 requested");
  });

  it("throws on batch RPC failure", async () => {
    const connection = connectionFor(
      Array.from({ length: 4 }, (_, index) => ({ amount: "1", owner: `Owner${index}` })),
      { failBatchAt: 2 },
    );

    await expect(fetchLargestTokenAccountsWithOwners(connection as never, mint, { ownerResolutionBatchSize: 2 })).rejects.toThrow("batch failed");
  });

  it("aggregates duplicate owners across batches", async () => {
    const connection = connectionFor([
      { amount: "100", owner: "OwnerA" },
      { amount: "75", owner: "OwnerB" },
      { amount: "25", owner: "OwnerA" },
    ]);
    const accounts = await fetchLargestTokenAccountsWithOwners(connection as never, mint, { ownerResolutionBatchSize: 2 });
    const report = buildConcentrationReport(mintInspection("1000"), accounts);

    expect(report.resolvedOwnerConcentration?.owners[0]).toMatchObject({
      ownerAddress: "OwnerA",
      rawAmount: "125",
      tokenAccountCount: 2,
    });
  });

  it("preserves BigInt precision through batching", async () => {
    const connection = connectionFor([
      { amount: "999999999999999999999999", owner: "OwnerA" },
      { amount: "1", owner: "OwnerB" },
    ]);
    const accounts = await fetchLargestTokenAccountsWithOwners(connection as never, mint, { ownerResolutionBatchSize: 1 });
    const report = buildConcentrationReport(mintInspection("1000000000000000000000000"), accounts);

    expect(report.tokenAccountConcentration?.top5Percent).toBe("100.0000");
    expect(report.resolvedOwnerConcentration?.owners[0].rawAmount).toBe("999999999999999999999999");
  });

  it("produces identical scoring regardless of batch size", async () => {
    const source = [
      { amount: "400", owner: "OwnerA" },
      { amount: "100", owner: "OwnerB" },
      { amount: "100", owner: "OwnerC" },
      { amount: "100", owner: "OwnerD" },
      { amount: "100", owner: "OwnerE" },
      { amount: "20", owner: "OwnerF" },
      { amount: "20", owner: "OwnerG" },
      { amount: "20", owner: "OwnerH" },
      { amount: "20", owner: "OwnerI" },
      { amount: "20", owner: "OwnerJ" },
    ];
    const mintInput = mintInspection("1000");
    const smallBatchAccounts = await fetchLargestTokenAccountsWithOwners(connectionFor(source) as never, mint, { ownerResolutionBatchSize: 2 });
    const largeBatchAccounts = await fetchLargestTokenAccountsWithOwners(connectionFor(source) as never, mint, { ownerResolutionBatchSize: 10 });
    const smallBatchScore = calculateIntelScore({
      mint: mintInput,
      authorityAnalysis: null,
      concentration: buildConcentrationReport(mintInput, smallBatchAccounts),
    });
    const largeBatchScore = calculateIntelScore({
      mint: mintInput,
      authorityAnalysis: null,
      concentration: buildConcentrationReport(mintInput, largeBatchAccounts),
    });

    expect(smallBatchScore).toEqual(largeBatchScore);
  });
});
