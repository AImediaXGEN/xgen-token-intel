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

export const scoreDeductionSchema = z.object({
  ruleId: z.string(),
  category: z.enum(["authority", "concentration"]),
  points: z.number().int().min(0),
  condition: z.string(),
  explanation: z.string(),
  evidence: z.object({
    source: z.string(),
    value: z.string(),
  }),
  confidence: z.enum(["observed", "coverage-limited"]),
});

export const intelScoreSchema = z.object({
  label: z.literal("XGEN Intel Score"),
  methodologyVersion: z.literal("1.0.0"),
  value: z.number().int().min(0).max(100),
  max: z.literal(100),
  baseline: z.literal(100),
  totalDeductions: z.number().int().min(0),
  band: z.enum([
    "Few observed risk characteristics",
    "Some observed risk characteristics",
    "Elevated observed risk characteristics",
    "High observed risk characteristics",
  ]),
  methodology: z.string(),
  deductions: z.array(scoreDeductionSchema),
});

export const analysisCoverageSchema = z.object({
  status: z.enum(["complete", "partial", "limited"]),
  methodology: z.string(),
  reasons: z.array(z.string()),
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

export const concentrationTokenAccountSchema = z.object({
  tokenAccountAddress: z.string(),
  rawAmount: z.string(),
  uiAmountString: z.string().nullable(),
  decimals: z.number().int().min(0),
  percentOfSupply: z.string().nullable(),
  ownerAddress: z.string().nullable().optional(),
  resolutionStatus: z.enum(["resolved", "unresolved"]),
});

export const concentrationOwnerSchema = z.object({
  ownerAddress: z.string(),
  rawAmount: z.string(),
  tokenAccountCount: z.number().int().min(1),
  percentOfSupply: z.string().nullable(),
});

export const concentrationReportSchema = z.object({
  status: z.enum(["available", "partial", "unavailable", "zero-supply"]),
  methodology: z.string(),
  tokenAccountConcentration: z
    .object({
      top5Percent: z.string().nullable(),
      top10Percent: z.string().nullable(),
      top20Percent: z.string().nullable(),
      accounts: z.array(concentrationTokenAccountSchema),
    })
    .nullable(),
  resolvedOwnerConcentration: z
    .object({
      quality: z.enum(["complete", "partial", "unavailable"]),
      metricsReliable: z.boolean(),
      top5Percent: z.string().nullable(),
      top10Percent: z.string().nullable(),
      top20Percent: z.string().nullable(),
      owners: z.array(concentrationOwnerSchema),
    })
    .nullable(),
  resolution: z.object({
    quality: z.enum(["complete", "partial", "unavailable"]),
    accountsInspected: z.number().int().min(0),
    accountsResolved: z.number().int().min(0),
    accountsUnresolved: z.number().int().min(0),
    sampledRawBalance: z.string(),
    sampledSupplyPercent: z.string().nullable(),
    resolvedAccountPercent: z.string(),
    sampledBalanceResolvedPercent: z.string(),
  }),
  limitations: z.array(z.string()),
});

export const analysisResultSchema = z.object({
  version: z.literal("m4"),
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
  analysisCoverage: analysisCoverageSchema,
  riskSignals: z.array(observableSignalSchema),
  limitations: z.array(z.string()),
});

export type AnalysisCoverage = z.infer<typeof analysisCoverageSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AuthorityAnalysis = z.infer<typeof authorityAnalysisSchema>;
export type AuthorityObservation = z.infer<typeof authorityObservationSchema>;
export type ConcentrationReport = z.infer<typeof concentrationReportSchema>;
export type ConcentrationTokenAccount = z.infer<typeof concentrationTokenAccountSchema>;
export type ConcentrationOwner = z.infer<typeof concentrationOwnerSchema>;
export type IntelScore = z.infer<typeof intelScoreSchema>;
export type MintInspection = z.infer<typeof mintInspectionSchema>;
export type ObservableSignal = z.infer<typeof observableSignalSchema>;
export type ScoreDeduction = z.infer<typeof scoreDeductionSchema>;
export type Token2022ExtensionAuthority = z.infer<
  typeof token2022ExtensionAuthoritySchema
>;
