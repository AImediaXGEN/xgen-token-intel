import { describe, expect, it } from "vitest";
import {
  authorityStatusLabel,
  compactAddress,
  concentrationStateLabel,
  coverageDisplay,
  deductionSummary,
  compactSignalExplanation,
  concentrationLimitationsSummary,
  displayPercent,
  formatPercentForDisplay,
  publicUiCopy,
  shouldProminentlyPairCoverage,
  uniqueCopyLabel,
} from "./tokenIntelPresentation";
import type { ConcentrationReport, ScoreDeduction } from "@/lib/intel/schemas";

function deduction(ruleId: string, points: number): ScoreDeduction {
  return {
    ruleId,
    category: "authority",
    points,
    condition: "Observed condition.",
    explanation: "Observable explanation.",
    evidence: { source: "test", value: "observed" },
    confidence: "observed",
  };
}

describe("token intel presentation helpers", () => {
  it("keeps 100 plus complete coverage calm", () => {
    expect(coverageDisplay("complete").label).toBe("COMPLETE");
    expect(shouldProminentlyPairCoverage(100, "complete")).toBe(false);
  });

  it("keeps 100 plus limited coverage visually coupled", () => {
    expect(coverageDisplay("limited").description).toContain("Unobserved risk may remain");
    expect(shouldProminentlyPairCoverage(100, "limited")).toBe(true);
  });

  it("keeps 90 plus complete coverage paired without warning emphasis", () => {
    expect(shouldProminentlyPairCoverage(90, "complete")).toBe(false);
  });

  it("keeps 90 plus partial coverage prominent", () => {
    expect(coverageDisplay("partial").label).toBe("PARTIAL");
    expect(shouldProminentlyPairCoverage(90, "partial")).toBe(true);
  });

  it("keeps 55 plus partial Token-2022 coverage visible", () => {
    expect(coverageDisplay("partial").description).toContain("successfully analyzed surfaces");
    expect(shouldProminentlyPairCoverage(55, "partial")).toBe(false);
  });

  it("formats active and revoked authorities", () => {
    expect(authorityStatusLabel("active")).toBe("ACTIVE");
    expect(authorityStatusLabel("revoked")).toBe("REVOKED");
  });

  it("labels concentration unavailable and zero supply states", () => {
    expect(concentrationStateLabel({ status: "unavailable" } as ConcentrationReport)).toBe("UNAVAILABLE");
    expect(concentrationStateLabel({ status: "zero-supply" } as ConcentrationReport)).toBe("ZERO SUPPLY");
  });

  it("uses non-reassuring language when no deductions exist", () => {
    expect(deductionSummary([])).toBe("No score deductions were triggered within successfully analyzed surfaces.");
    expect(deductionSummary([]).toLowerCase()).not.toContain("no risks");
  });

  it("summarizes multiple deductions", () => {
    expect(deductionSummary([deduction("A", 20), deduction("B", 10)])).toBe("2 score deductions triggered.");
  });

  it("truncates long mint and authority addresses", () => {
    const address = "So11111111111111111111111111111111111111112";
    expect(compactAddress(address)).toBe("So1111...111112");
  });

  it("formats concentration percentages as compact display values", () => {
    expect(displayPercent(null)).toBe("N/A");
    expect(displayPercent("70.6823")).toBe("70.68%");
    expect(displayPercent("25.1667")).toBe("25.17%");
    expect(formatPercentForDisplay("100.00")).toBe("100.00%");
  });

  it("keeps malformed percentage strings visible without changing their content", () => {
    expect(displayPercent("unavailable")).toBe("unavailable%");
  });

  it("builds unique accessible copy labels", () => {
    expect(uniqueCopyLabel("mint authority")).toBe("Copy mint authority address");
    expect(uniqueCopyLabel("Transfer hook authority")).toBe("Copy transfer hook authority address");
    expect(uniqueCopyLabel("Canonical mint address")).toBe("Copy canonical mint address");
  });

  it("keeps pending coverage distinct from analyzed coverage states", () => {
    expect(coverageDisplay("pending").label).toBe("PENDING");
    expect(coverageDisplay("pending").description).toContain("after analysis");
    expect(coverageDisplay("complete").description).not.toBe(coverageDisplay("limited").description);
  });

  it("uses public coverage copy without internal milestone wording", () => {
    expect(coverageDisplay("complete").description).toBe("Core authority and concentration surfaces were analyzed.");
    expect(coverageDisplay("complete").description).not.toMatch(/\bM[1-5]\b/);
  });

  it("sanitizes internal milestone wording in public UI copy", () => {
    expect(publicUiCopy("Core M4 authority and concentration surfaces were analyzed.")).toBe(
      "Core authority and concentration surfaces were analyzed.",
    );
    expect(publicUiCopy("M4 does not guess entity labels. Unknown remains unknown.")).toBe(
      "This analysis does not guess entity labels. Unknown remains unknown.",
    );
  });

  it("summarizes concentration limitations for progressive disclosure", () => {
    expect(concentrationLimitationsSummary()).toContain("largest token-account sample");
    expect(concentrationLimitationsSummary()).toContain("not verified real-world identities");
  });

  it("creates compact observable signal explanations", () => {
    const compact = compactSignalExplanation(
      "M4 separates token-account concentration from resolved-owner concentration.",
      "A Solana owner address can control multiple token accounts.",
    );

    expect(compact).toBe("This analysis separates token-account concentration from resolved-owner concentration.");
    expect(compact).not.toMatch(/\bM[1-5]\b/);
  });

});
