import { describe, expect, it } from "vitest";
import { parseSolanaPublicKey } from "./rpc";

describe("parseSolanaPublicKey", () => {
  it("accepts canonical public keys", () => {
    expect(parseSolanaPublicKey("So11111111111111111111111111111111111111112")?.toBase58()).toBe(
      "So11111111111111111111111111111111111111112",
    );
  });

  it("rejects invalid addresses", () => {
    expect(parseSolanaPublicKey("not-a-mint-address")).toBeNull();
  });

  it("rejects empty input", () => {
    expect(parseSolanaPublicKey("   ")).toBeNull();
  });
});
