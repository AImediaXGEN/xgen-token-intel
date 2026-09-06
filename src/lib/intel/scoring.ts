import type { IntelScore, MintInspection, ScoreAdjustment } from "./schemas";

export function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function calculateM1Score(mint: MintInspection | null): IntelScore {
  void mint;

  const adjustments: ScoreAdjustment[] = [];
  const baseScore = 50;

  return {
    label: "XGEN Intel Score",
    value: clampScore(baseScore + adjustments.reduce((sum, item) => sum + item.delta, 0)),
    max: 100,
    methodology:
      "M1 establishes a transparent baseline only. Authority and concentration score adjustments are intentionally deferred until their milestones are implemented and tested.",
    adjustments,
  };
}
