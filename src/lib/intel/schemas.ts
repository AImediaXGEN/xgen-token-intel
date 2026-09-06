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

export const authorityObservationSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["active", "revoked", "unknown"]),
  address: z.string().nullable(),
  permits: z.string(),
  source: z.string(),
});

export const token2022ExtensionAuthoritySchema = z.object({
  extension: z.string(),
  label: z.string(),
  status: z.enum(["detected", "not-parsed-m2"]),
  authorityFields: z.array(
    z.object({
      field: z.string(),
      value: z.string(),
    }),
  ),
  explanation: z.string(),
  source: z.string(),
});

export const authorityAnalysisSchema = z.object({
  scope: z.enum(["legacy-spl-token", "token-2022", "unsupported"]),
  summary: z.string(),
  standardAuthorities: z.array(authorityObservationSchema),
  token2022Extensions: z.array(token2022ExtensionAuthoritySchema),
  limitations: z.array(z.string()),
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
  version: z.literal("m2"),
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
  authorityAnalysis: authorityAnalysisSchema.nullable(),
  concentration: concentrationReportSchema,
  score: intelScoreSchema,
  riskSignals: z.array(observableSignalSchema),
  limitations: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AuthorityAnalysis = z.infer<typeof authorityAnalysisSchema>;
export type AuthorityObservation = z.infer<typeof authorityObservationSchema>;
export type ConcentrationReport = z.infer<typeof concentrationReportSchema>;
export type IntelScore = z.infer<typeof intelScoreSchema>;
export type MintInspection = z.infer<typeof mintInspectionSchema>;
export type ObservableSignal = z.infer<typeof observableSignalSchema>;
export type ScoreAdjustment = z.infer<typeof scoreAdjustmentSchema>;
export type Token2022ExtensionAuthority = z.infer<
  typeof token2022ExtensionAuthoritySchema
>;
