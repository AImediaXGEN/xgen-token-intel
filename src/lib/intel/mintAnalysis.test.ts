import { describe, expect, it } from "vitest";
import { PublicKey, type AccountInfo, type ParsedAccountData } from "@solana/web3.js";
import { SPL_TOKEN_PROGRAM_ID } from "../solana/constants";
import { parseSolanaPublicKey } from "../solana/rpc";
import { analyzeMintAddress, getParsedMintInfo, sanitizeRpcErrorMessage } from "./mintAnalysis";

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


describe("sanitizeRpcErrorMessage", () => {
  it("redacts credential-bearing RPC URLs from user-facing errors", () => {
    const sanitized = sanitizeRpcErrorMessage(
      "failed at https://example.helius-rpc.com/?api-key=secret-value&other=ok",
    );

    expect(sanitized).not.toContain("secret-value");
    expect(sanitized).not.toContain("example.helius-rpc.com");
    expect(sanitized).toContain("[redacted-rpc-url]");
  });
});


describe("M6 adversarial invalid input handling", () => {
  it.each([
    ["empty", ""],
    ["whitespace", "     \n\t"],
    ["malformed base58", "not-a-mint-address"],
    ["invalid public-key length", "1111"],
    ["extremely long", "1".repeat(2048)],
    ["unicode", "So11111111111111111111111111111111111111112☠"],
    ["control characters", "So11111111111111111111111111111111111111112\u0000"],
  ])("returns an unscored invalid-address result for %s input", async (_label, input) => {
    const result = await analyzeMintAddress(input);

    expect(result.status).toBe("invalid-address");
    expect(result.mint).toBeNull();
    expect(result.score).toBeNull();
    expect(result.analysisCoverage.status).toBe("limited");
    expect(result.summary).not.toMatch(/api[-_]?key|secret|token=/i);
  });

  it("does not expose fake Authorization-style credentials in sanitized RPC errors", () => {
    const sanitized = sanitizeRpcErrorMessage(
      "HTTP 401 Authorization: Bearer fake-secret-token api-key=fake-api-key https://provider.invalid/path?api-key=fake-url-key",
    );

    expect(sanitized).not.toContain("fake-secret-token");
    expect(sanitized).not.toContain("fake-api-key");
    expect(sanitized).not.toContain("fake-url-key");
    expect(sanitized).toContain("[redacted");
  });


  it("canonicalizes leading and trailing whitespace before public-key parsing", () => {
    const parsed = parseSolanaPublicKey(" So11111111111111111111111111111111111111112 ");

    expect(parsed?.toBase58()).toBe("So11111111111111111111111111111111111111112");
  });
});
