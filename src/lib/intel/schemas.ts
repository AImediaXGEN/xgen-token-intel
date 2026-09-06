import { z } from "zod";

export const tokenProgramSchema = z.enum(["spl-token", "token-2022", "unknown"]);

export const observableSignalSchema = z.object({
  id: z.string(),
  label: z.string(),
  severity: z.enum(["info", "positive", "caution", "risk"]),
  condition: z.string(),
  whyItMatters: z.string(),
  source: z.string(),
});

export const scoreAdjustmentSchema = z.object({
  id: z.string(),
  label: z.string(),
  delta: z.number().int(),
  condition: z.string(),
  explanation: z.string(),
  source: z.string(),
});

export const intelScoreSchema = z.object({
  label: z.literal("XGEN Intel Score"),
  value: z.number().int().min(0).max(100),
  max: z.literal(100),
  methodology: z.string(),
  adjustments: z.array(scoreAdjustmentSchema),
});

export const tokenSupplySchema = z.object({
  rawAmount: z.string(),
  decimals: z.number().int().min(0),
  uiAmountString: z.string().nullable(),
});

export const mintInspectionSchema = z.object({
  mintAddress: z.string(),
  accountExists: z.boolean(),
  tokenProgram: tokenProgramSchema,
  decimals: z.number().int().min(0).nullable(),
  supply: tokenSupplySchema.nullable(),
  mintAuthority: z.string().nullable(),
  mintAuthorityRevoked: z.boolean().nullable(),
  freezeAuthority: z.string().nullable(),
  freezeAuthorityRevoked: z.boolean().nullable(),
});

export const concentrationReportSchema = z.object({
  status: z.literal("not-implemented-m1"),
  largestTokenAccounts: z.array(z.never()),
  top5TokenAccountConcentration: z.null(),
  top10TokenAccountConcentration: z.null(),
  top20TokenAccountConcentration: z.null(),
  note: z.string(),
});

export const analysisResultSchema = z.object({
  version: z.literal("m1"),
  generatedAt: z.string(),
  input: z.string(),
  mintAddress: z.string().nullable(),
  status: z.enum([
    "ok",
    "invalid-address",
    "not-found",
    "unsupported-account",
    "rpc-error",
  ]),
  summary: z.string(),
  mint: mintInspectionSchema.nullable(),
  concentration: concentrationReportSchema,
  score: intelScoreSchema,
  riskSignals: z.array(observableSignalSchema),
  limitations: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type ConcentrationReport = z.infer<typeof concentrationReportSchema>;
export type IntelScore = z.infer<typeof intelScoreSchema>;
export type MintInspection = z.infer<typeof mintInspectionSchema>;
export type ObservableSignal = z.infer<typeof observableSignalSchema>;
export type ScoreAdjustment = z.infer<typeof scoreAdjustmentSchema>;
