import { describe, expect, it } from "vitest";
import {
  calculateAnalysisCoverage,
  calculateIntelScore,
  clampScore,
  concentrationBandDeduction,
  SCORE_METHODOLOGY_VERSION,
  scoreBandForValue,
} from "./scoring";
import { buildAuthorityAnalysis } from "./authorityAnalysis";
import { buildConcentrationReport, type LargestTokenAccountInput } from "./concentration";
import type { AuthorityAnalysis, ConcentrationReport, MintInspection } from "./schemas";

function mint(overrides: Partial<MintInspection> = {}): MintInspection {
  return {
    mintAddress: "Mint111111111111111111111111111111111111111",
    accountExists: true,
    tokenProgram: "spl-token",
    decimals: 0,
    supply: { rawAmount: "1000", decimals: 0, uiAmountString: "1000" },
    mintAuthority: null,
    mintAuthorityRevoked: true,
    freezeAuthority: null,
    freezeAuthorityRevoked: true,
    ...overrides,
  };
}

function account(index: number, rawAmount: string, ownerAddress = `Owner${index}`): LargestTokenAccountInput {
  return {
    tokenAccountAddress: `TokenAccount${index}`,
    rawAmount,
    uiAmountString: rawAmount,
    decimals: 0,
    ownerAddress,
    resolutionStatus: "resolved",
  };
}

function scoreInput(
  mintInput: MintInspection = mint(),
  concentration: ConcentrationReport = buildConcentrationReport(mintInput, [account(1, "100")]),
  authorityAnalysis: AuthorityAnalysis = buildAuthorityAnalysis(mintInput),
) {
  return { mint: mintInput, authorityAnalysis, concentration };
}

describe("clampScore", () => {
  it("keeps scores inside the 0 to 100 range", () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(55)).toBe(55);
    expect(clampScore(140)).toBe(100);
  });
});

describe("concentrationBandDeduction", () => {
  it.each([
    ["19.9999", 0],
    ["20.0000", 5],
    ["39.9999", 5],
    ["40.0000", 10],
    ["59.9999", 10],
    ["60.0000", 15],
    ["79.9999", 15],
    ["80.0000", 20],
  ])("maps boundary %s to %i points", (percent, points) => {
    expect(concentrationBandDeduction(percent).points).toBe(points);
  });
});

describe("scoreBandForValue", () => {
  it.each([
    [59, "High observed risk characteristics"],
    [60, "Elevated observed risk characteristics"],
    [84, "Elevated observed risk characteristics"],
    [85, "Some observed risk characteristics"],
    [94, "Some observed risk characteristics"],
    [95, "Few observed risk characteristics"],
  ])("maps %i to %s", (value, band) => {
    expect(scoreBandForValue(value)).toBe(band);
  });
});

describe("calculateIntelScore", () => {
  it("includes methodology version", () => {
    expect(calculateIntelScore(scoreInput()).methodologyVersion).toBe(SCORE_METHODOLOGY_VERSION);
  });

  it("scores both standard authorities revoked", () => {
    const score = calculateIntelScore(scoreInput());
    expect(score.value).toBe(100);
    expect(score.deductions).toEqual([]);
  });

  it("scores active mint authority only", () => {
    const mintInput = mint({ mintAuthority: "MintAuthority111111111111111111111111111111", mintAuthorityRevoked: false });
    const score = calculateIntelScore(scoreInput(mintInput));
    expect(score.value).toBe(80);
    expect(score.deductions.map((deduction) => deduction.ruleId)).toEqual(["AUTH_MINT_ACTIVE"]);
  });

  it("scores active freeze authority only", () => {
    const mintInput = mint({ freezeAuthority: "FreezeAuthority11111111111111111111111111", freezeAuthorityRevoked: false });
    const score = calculateIntelScore(scoreInput(mintInput));
    expect(score.value).toBe(90);
    expect(score.deductions.map((deduction) => deduction.ruleId)).toEqual(["AUTH_FREEZE_ACTIVE"]);
  });

  it("scores both authorities active", () => {
    const mintInput = mint({
      mintAuthority: "MintAuthority111111111111111111111111111111",
      mintAuthorityRevoked: false,
      freezeAuthority: "FreezeAuthority11111111111111111111111111",
      freezeAuthorityRevoked: false,
    });
    const score = calculateIntelScore(scoreInput(mintInput));
    expect(score.value).toBe(70);
    expect(score.totalDeductions).toBe(30);
  });

  it.each([
    ["low concentration", "199", 100, 0],
    ["moderate concentration", "300", 95, 5],
    ["high concentration", "500", 90, 10],
    ["extreme concentration", "850", 80, 20],
  ])("scores %s", (_label, rawAmount, expectedScore, expectedDeduction) => {
    const mintInput = mint();
    const concentration = buildConcentrationReport(mintInput, [account(1, rawAmount)]);
    const score = calculateIntelScore(scoreInput(mintInput, concentration));
    expect(score.value).toBe(expectedScore);
    expect(score.totalDeductions).toBe(expectedDeduction);
  });

  it("adds a small broad top-10 concentration deduction without using token-account substitution", () => {
    const mintInput = mint();
    const concentration = buildConcentrationReport(mintInput, [
      account(1, "400"), account(2, "100"), account(3, "100"), account(4, "100"), account(5, "100"),
      account(6, "20"), account(7, "20"), account(8, "20"), account(9, "20"), account(10, "20"),
    ]);
    const score = calculateIntelScore(scoreInput(mintInput, concentration));
    expect(score.deductions.map((deduction) => deduction.ruleId)).toEqual([
      "CONC_RESOLVED_OWNER_TOP5",
      "CONC_RESOLVED_OWNER_TOP10_EXTREME",
    ]);
    expect(score.totalDeductions).toBe(25);
  });

  it("uses complete owner resolution for concentration scoring", () => {
    const mintInput = mint();
    const concentration = buildConcentrationReport(mintInput, [account(1, "250")]);
    expect(calculateIntelScore(scoreInput(mintInput, concentration)).totalDeductions).toBe(5);
  });

  it("uses acceptable partial owner resolution for concentration scoring", () => {
    const mintInput = mint();
    const concentration = buildConcentrationReport(mintInput, [
      account(1, "150"), account(2, "150"), account(3, "150"), account(4, "150"),
      { ...account(5, "50"), ownerAddress: null, resolutionStatus: "unresolved" },
    ]);
    const score = calculateIntelScore(scoreInput(mintInput, concentration));
    expect(concentration.resolvedOwnerConcentration?.metricsReliable).toBe(true);
    expect(score.totalDeductions).toBe(15);
  });

  it("does not use insufficient owner resolution for concentration scoring", () => {
    const mintInput = mint();
    const concentration = buildConcentrationReport(mintInput, [
      account(1, "900"),
      { ...account(2, "100"), ownerAddress: null, resolutionStatus: "unresolved" },
    ]);
    const score = calculateIntelScore(scoreInput(mintInput, concentration));
    expect(concentration.resolvedOwnerConcentration?.metricsReliable).toBe(false);
    expect(score.deductions.some((deduction) => deduction.category === "concentration")).toBe(false);
  });

  it("does not score unavailable owner resolution as risk", () => {
    const mintInput = mint();
    const concentration = buildConcentrationReport(mintInput, [
      { ...account(1, "900"), ownerAddress: null, resolutionStatus: "unresolved" },
    ]);
    const input = scoreInput(mintInput, concentration);
    expect(calculateIntelScore(input).totalDeductions).toBe(0);
    expect(calculateAnalysisCoverage(input).status).toBe("limited");
  });

  it("keeps Token-2022 incomplete extension coverage separate from score", () => {
    const mintInput = mint({ tokenProgram: "token-2022" });
    const input = scoreInput(mintInput);
    expect(calculateIntelScore(input).totalDeductions).toBe(0);
    expect(calculateAnalysisCoverage(input).status).toBe("partial");
  });

  it("unknown does not become complete coverage", () => {
    const input = { mint: null, authorityAnalysis: null, concentration: buildConcentrationReport(mint(), []) };
    expect(calculateIntelScore(input).value).toBe(100);
    expect(calculateAnalysisCoverage(input).status).toBe("limited");
  });

  it("unknown does not automatically become malicious risk", () => {
    const input = { mint: null, authorityAnalysis: null, concentration: buildConcentrationReport(mint(), []) };
    expect(calculateIntelScore(input).deductions).toEqual([]);
  });

  it("score never falls below 0", () => {
    const mintInput = mint({
      mintAuthority: "MintAuthority111111111111111111111111111111",
      mintAuthorityRevoked: false,
      freezeAuthority: "FreezeAuthority11111111111111111111111111",
      freezeAuthorityRevoked: false,
    });
    const concentration = buildConcentrationReport(mintInput, [
      account(1, "900"), account(2, "20"), account(3, "20"), account(4, "20"), account(5, "20"),
      account(6, "4"), account(7, "4"), account(8, "4"), account(9, "4"), account(10, "4"),
    ]);
    expect(calculateIntelScore(scoreInput(mintInput, concentration)).value).toBeGreaterThanOrEqual(0);
  });

  it("score never rises above 100", () => {
    expect(calculateIntelScore(scoreInput()).value).toBeLessThanOrEqual(100);
  });

  it("deduction total exactly reconciles with final score", () => {
    const mintInput = mint({ mintAuthority: "MintAuthority111111111111111111111111111111", mintAuthorityRevoked: false });
    const concentration = buildConcentrationReport(mintInput, [account(1, "450")]);
    const score = calculateIntelScore(scoreInput(mintInput, concentration));
    const total = score.deductions.reduce((sum, deduction) => sum + deduction.points, 0);
    expect(score.totalDeductions).toBe(total);
    expect(score.value).toBe(100 - total);
  });

  it("same input always produces same score", () => {
    const input = scoreInput();
    expect(calculateIntelScore(input)).toEqual(calculateIntelScore(input));
  });

  it("does not use forbidden verdict or market-action terminology", () => {
    const text = JSON.stringify(calculateIntelScore(scoreInput())).toLowerCase();
    expect(text).not.toContain("safe");
    expect(text).not.toContain("scam");
    expect(text).not.toContain("legit");
    expect(text).not.toContain("buy");
    expect(text).not.toContain("sell");
  });
});
