import { describe, expect, it } from "vitest";
import { analysisResultSchema } from "./schemas";

describe("analysisResultSchema M6 adversarial contract", () => {
  it("allows unscored invalid targets without a normal Intel Score", () => {
    const parsed = analysisResultSchema.parse({
      version: "m4",
      generatedAt: new Date(0).toISOString(),
      input: "not-a-mint",
      mintAddress: null,
      status: "invalid-address",
      summary: "The input is not a valid canonical Solana public key.",
      mint: null,
      authorityAnalysis: null,
      concentration: {
        status: "unavailable",
        methodology: "unavailable",
        tokenAccountConcentration: null,
        resolvedOwnerConcentration: null,
        resolution: {
          quality: "unavailable",
          accountsInspected: 0,
          accountsResolved: 0,
          accountsUnresolved: 0,
          sampledRawBalance: "0",
          sampledSupplyPercent: null,
          resolvedAccountPercent: "0.00",
          sampledBalanceResolvedPercent: "0.00",
        },
        limitations: ["No supported mint."],
      },
      score: null,
      analysisCoverage: {
        status: "limited",
        methodology: "Unknown data reduces coverage.",
        reasons: ["No supported mint was available for full scoring."],
      },
      riskSignals: [],
      limitations: [],
    });

    expect(parsed.score).toBeNull();
  });
});
