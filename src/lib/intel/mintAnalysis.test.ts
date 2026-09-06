import { describe, expect, it } from "vitest";
import { PublicKey, type AccountInfo, type ParsedAccountData } from "@solana/web3.js";
import { SPL_TOKEN_PROGRAM_ID } from "../solana/constants";
import { getParsedMintInfo } from "./mintAnalysis";

describe("getParsedMintInfo", () => {
  it("returns null for parsed non-mint accounts", () => {
    const account = {
      data: {
        program: "spl-token",
        parsed: {
          type: "account",
          info: {},
        },
        space: 165,
      },
      executable: false,
      lamports: 1,
      owner: SPL_TOKEN_PROGRAM_ID,
      rentEpoch: 1,
    } as AccountInfo<Buffer | ParsedAccountData>;

    expect(getParsedMintInfo(account)).toBeNull();
  });

  it("returns null for malformed binary account data", () => {
    const account = {
      data: Buffer.alloc(82),
      executable: false,
      lamports: 1,
      owner: new PublicKey("11111111111111111111111111111111"),
      rentEpoch: 1,
    } as AccountInfo<Buffer | ParsedAccountData>;

    expect(getParsedMintInfo(account)).toBeNull();
  });
});
