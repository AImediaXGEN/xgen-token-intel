import type { AnalysisCoverage, ConcentrationReport, ScoreDeduction } from "@/lib/intel/schemas";

export function compactAddress(address: string | null | undefined, edge = 6): string {
  if (!address) return "Not available";
  if (address.length <= edge * 2 + 3) return address;
  return `${address.slice(0, edge)}...${address.slice(-edge)}`;
}

export function coverageDisplay(status: AnalysisCoverage["status"] | "pending") {
  switch (status) {
    case "complete":
      return {
        label: "COMPLETE",
        tone: "complete",
        description: "Core authority and concentration surfaces were analyzed.",
      };
    case "partial":
      return {
        label: "PARTIAL",
        tone: "partial",
        description: "This score reflects successfully analyzed surfaces. Unobserved risk may remain.",
      };
    case "limited":
      return {
        label: "LIMITED",
        tone: "limited",
        description: "This score reflects successfully analyzed surfaces. Unobserved risk may remain.",
      };
    default:
      return {
        label: "PENDING",
        tone: "pending",
        description: "Coverage will be shown after analysis.",
      };
  }
}

export function shouldProminentlyPairCoverage(scoreValue: number | null | undefined, coverageStatus: AnalysisCoverage["status"] | "pending"): boolean {
  return typeof scoreValue === "number" && scoreValue >= 85 && coverageStatus !== "complete";
}

export function deductionSummary(deductions: ScoreDeduction[]): string {
  if (deductions.length === 0) {
    return "No score deductions were triggered within successfully analyzed surfaces.";
  }

  return `${deductions.length} score deduction${deductions.length === 1 ? "" : "s"} triggered.`;
}

export function authorityStatusLabel(status: "active" | "revoked" | "unknown"): string {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "revoked":
      return "REVOKED";
    default:
      return "UNKNOWN";
  }
}

export function concentrationStateLabel(concentration: Pick<ConcentrationReport, "status">): string {
  switch (concentration.status) {
    case "available":
      return "AVAILABLE";
    case "partial":
      return "PARTIAL";
    case "zero-supply":
      return "ZERO SUPPLY";
    default:
      return "UNAVAILABLE";
  }
}

export function formatPercentForDisplay(value: string | null | undefined): string {
  if (!value) return "N/A";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return `${value}%`;
  return `${parsed.toFixed(2)}%`;
}

export function displayPercent(value: string | null | undefined): string {
  return formatPercentForDisplay(value);
}

export function uniqueCopyLabel(context: string): string {
  const normalized = context.trim().replace(/[-_]+/g, " ").replace(/\s+/g, " ").toLowerCase();
  if (!normalized) return "Copy value";
  if (normalized.includes("address")) return `Copy ${normalized}`;
  if (normalized.includes("authority")) return `Copy ${normalized} address`;
  if (normalized.includes("mint")) return `Copy ${normalized} address`;
  return `Copy ${normalized}`;
}

export function publicUiCopy(value: string): string {
  return value
    .replace(/\bCore M4 authority and concentration surfaces\b/g, "Core authority and concentration surfaces")
    .replace(/\bM4 separates\b/g, "This analysis separates")
    .replace(/\bM4 does not guess entity labels\b/g, "This analysis does not guess entity labels")
    .replace(/\bM[1-5]\b/g, "this methodology");
}

export function concentrationLimitationsSummary(): string {
  return "Concentration is calculated from the largest token-account sample. Resolved owners are blockchain addresses, not verified real-world identities.";
}

export function compactSignalExplanation(condition: string, whyItMatters: string): string {
  const sanitizedCondition = publicUiCopy(condition);
  if (sanitizedCondition.length <= 140) return sanitizedCondition;

  const sanitizedWhy = publicUiCopy(whyItMatters);
  if (sanitizedWhy.length <= 140) return sanitizedWhy;

  return `${sanitizedCondition.slice(0, 137).trim()}...`;
}
