import type {
  AnalysisCoverage,
  AuthorityAnalysis,
  ConcentrationReport,
  IntelScore,
  MintInspection,
  ScoreDeduction,
} from "./schemas";

export const SCORE_METHODOLOGY_VERSION = "1.0.0";

type ScoreInput = {
  mint: MintInspection | null;
  authorityAnalysis: AuthorityAnalysis | null;
  concentration: ConcentrationReport;
};

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function numberPercent(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function authorityDeductions(input: ScoreInput): ScoreDeduction[] {
  const deductions: ScoreDeduction[] = [];
  const mintAuthority = input.authorityAnalysis?.standardAuthorities.find((authority) => authority.id === "mint-authority");
  const freezeAuthority = input.authorityAnalysis?.standardAuthorities.find((authority) => authority.id === "freeze-authority");

  if (mintAuthority?.status === "active") {
    deductions.push({
      ruleId: "AUTH_MINT_ACTIVE",
      category: "authority",
      points: 20,
      condition: "Standard mint authority is active.",
      explanation: "An active mint authority preserves the ability to create additional token supply through the standard mint authority.",
      evidence: { source: mintAuthority.source, value: mintAuthority.address ?? "active authority address unavailable" },
      confidence: "observed",
    });
  }

  if (freezeAuthority?.status === "active") {
    deductions.push({
      ruleId: "AUTH_FREEZE_ACTIVE",
      category: "authority",
      points: 10,
      condition: "Standard freeze authority is active.",
      explanation: "An active freeze authority can freeze token accounts under standard token program rules.",
      evidence: { source: freezeAuthority.source, value: freezeAuthority.address ?? "active authority address unavailable" },
      confidence: "observed",
    });
  }

  return deductions;
}

export function concentrationBandDeduction(top5ResolvedOwnerPercent: string | null | undefined): { points: number; label: string } {
  const percent = numberPercent(top5ResolvedOwnerPercent);
  if (percent === null || percent < 20) return { points: 0, label: "below 20%" };
  if (percent < 40) return { points: 5, label: "20% to below 40%" };
  if (percent < 60) return { points: 10, label: "40% to below 60%" };
  if (percent < 80) return { points: 15, label: "60% to below 80%" };
  return { points: 20, label: "80% or higher" };
}

function concentrationDeductions(input: ScoreInput): ScoreDeduction[] {
  const resolvedOwners = input.concentration.resolvedOwnerConcentration;
  if (!resolvedOwners?.metricsReliable) return [];

  const deductions: ScoreDeduction[] = [];
  const top5Band = concentrationBandDeduction(resolvedOwners.top5Percent);
  if (top5Band.points > 0) {
    deductions.push({
      ruleId: "CONC_RESOLVED_OWNER_TOP5",
      category: "concentration",
      points: top5Band.points,
      condition: `Top 5 resolved owners represent ${resolvedOwners.top5Percent}% of current supply.`,
      explanation: "Higher resolved-owner concentration means a smaller set of resolved owner addresses controls more of the current token supply. This is an observable concentration characteristic, not an identity claim.",
      evidence: { source: "concentration.resolvedOwnerConcentration.top5Percent", value: resolvedOwners.top5Percent ?? "unavailable" },
      confidence: resolvedOwners.quality === "complete" ? "observed" : "coverage-limited",
    });
  }

  const top10 = numberPercent(resolvedOwners.top10Percent);
  const top5 = numberPercent(resolvedOwners.top5Percent);
  if (top10 !== null && top5 !== null && top10 >= 90 && top10 - top5 >= 10) {
    deductions.push({
      ruleId: "CONC_RESOLVED_OWNER_TOP10_EXTREME",
      category: "concentration",
      points: 5,
      condition: `Top 10 resolved owners represent ${resolvedOwners.top10Percent}% of current supply.`,
      explanation: "This small additional deduction captures extreme broader resolved-owner concentration without heavily double-penalizing the same top-5 concentration characteristic.",
      evidence: { source: "concentration.resolvedOwnerConcentration.top10Percent", value: resolvedOwners.top10Percent ?? "unavailable" },
      confidence: resolvedOwners.quality === "complete" ? "observed" : "coverage-limited",
    });
  }

  return deductions;
}

function coverageReasons(input: ScoreInput): string[] {
  const reasons: string[] = [];
  if (!input.mint) reasons.push("No supported mint was available for full scoring.");
  if (!input.authorityAnalysis) reasons.push("Authority analysis was unavailable.");
  if (input.mint?.tokenProgram === "token-2022") {
    reasons.push("Token-2022 extension authority analysis is not comprehensive in methodology 1.0.0.");
  }

  const resolvedOwners = input.concentration.resolvedOwnerConcentration;
  if (!resolvedOwners?.metricsReliable) {
    reasons.push("Resolved-owner concentration was unavailable or below the M3 disclosure threshold.");
  } else if (resolvedOwners.quality === "partial") {
    reasons.push("Resolved-owner concentration met the M3 disclosure threshold, but owner resolution was still partial.");
  }

  if (input.concentration.status === "zero-supply") {
    reasons.push("Concentration percentages are unavailable because current mint supply is zero.");
  }

  return reasons;
}

export function calculateAnalysisCoverage(input: ScoreInput): AnalysisCoverage {
  const reasons = coverageReasons(input);
  const concentrationReliable = input.concentration.resolvedOwnerConcentration?.metricsReliable === true;
  const authorityAvailable = Boolean(input.authorityAnalysis);
  const status = reasons.length === 0 ? "complete" : authorityAvailable && concentrationReliable ? "partial" : "limited";

  return {
    status,
    methodology: "Coverage describes which intended analysis surfaces were inspected. Unknown data reduces coverage; it is not automatically scored as risk.",
    reasons,
  };
}

export function scoreBandForValue(value: number): IntelScore["band"] {
  return value >= 95 ? "Few observed risk characteristics" : value >= 85 ? "Some observed risk characteristics" : value >= 60 ? "Elevated observed risk characteristics" : "High observed risk characteristics";
}

export function calculateIntelScore(input: ScoreInput): IntelScore {
  const deductions = [...authorityDeductions(input), ...concentrationDeductions(input)];
  const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.points, 0);
  const value = clampScore(100 - totalDeductions);

  return {
    label: "XGEN Intel Score",
    methodologyVersion: SCORE_METHODOLOGY_VERSION,
    value,
    max: 100,
    baseline: 100,
    totalDeductions,
    band: scoreBandForValue(value),
    methodology: "Methodology 1.0.0 starts at 100 and deducts only for observed standard authority and resolved-owner concentration characteristics supported by M1-M3 evidence. The score is not an assurance, endorsement, market-action, or intent verdict.",
    deductions,
  };
}
