import { describe, expect, it } from "vitest";
import { PublicKey, type AccountInfo, type ParsedAccountData } from "@solana/web3.js";
import { fetchLargestTokenAccountsWithOwners } from "./tokenAccounts";

const mint = new PublicKey("So11111111111111111111111111111111111111112");
const accountAddress = new PublicKey("11111111111111111111111111111112");

describe("fetchLargestTokenAccountsWithOwners", () => {
  it("resolves parsed token account owners", async () => {
    const connection = {
      getTokenLargestAccounts: async () => ({
        value: [
          {
            address: accountAddress,
            amount: "100",
            uiAmount: 100,
            uiAmountString: "100",
            decimals: 0,
          },
        ],
      }),
      getMultipleParsedAccounts: async () => ({
        value: [
          {
            data: {
              program: "spl-token",
              parsed: {
                type: "account",
                info: {
                  mint: mint.toBase58(),
                  owner: "Owner1111111111111111111111111111111111",
                },
              },
              space: 165,
            },
            executable: false,
            lamports: 1,
            owner: mint,
            rentEpoch: 1,
          } as AccountInfo<Buffer | ParsedAccountData>,
        ],
      }),
    };

    await expect(fetchLargestTokenAccountsWithOwners(connection as never, mint)).resolves.toEqual([
      {
        tokenAccountAddress: accountAddress.toBase58(),
        rawAmount: "100",
        uiAmountString: "100",
        decimals: 0,
        ownerAddress: "Owner1111111111111111111111111111111111",
        resolutionStatus: "resolved",
      },
    ]);
  });

  it("marks malformed parsed accounts unresolved", async () => {
    const connection = {
      getTokenLargestAccounts: async () => ({
        value: [
          {
            address: accountAddress,
            amount: "100",
            uiAmount: 100,
            uiAmountString: "100",
            decimals: 0,
          },
        ],
      }),
      getMultipleParsedAccounts: async () => ({
        value: [
          {
            data: {
              program: "spl-token",
              parsed: {
                type: "mint",
                info: {},
              },
              space: 82,
            },
            executable: false,
            lamports: 1,
            owner: mint,
            rentEpoch: 1,
          } as AccountInfo<Buffer | ParsedAccountData>,
        ],
      }),
    };

    const result = await fetchLargestTokenAccountsWithOwners(connection as never, mint);

    expect(result[0]).toMatchObject({
      ownerAddress: null,
      resolutionStatus: "unresolved",
    });
  });
});
