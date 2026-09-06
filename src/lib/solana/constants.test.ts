import { describe, expect, it } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { identifyTokenProgram, SPL_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "./constants";

describe("identifyTokenProgram", () => {
  it("identifies the legacy SPL Token Program", () => {
    expect(identifyTokenProgram(SPL_TOKEN_PROGRAM_ID)).toBe("spl-token");
  });

  it("identifies Token-2022", () => {
    expect(identifyTokenProgram(TOKEN_2022_PROGRAM_ID)).toBe("token-2022");
  });

  it("returns unknown for non-token program owners", () => {
    expect(identifyTokenProgram(new PublicKey("11111111111111111111111111111111"))).toBe("unknown");
  });
});
