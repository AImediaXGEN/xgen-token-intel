# Analysis Result Schema

M4 returns an `AnalysisResult` object.

```ts
type AnalysisResult = {
  version: "m4";
  generatedAt: string;
  input: string;
  mintAddress: string | null;
  status: "ok" | "invalid-address" | "not-found" | "unsupported-account" | "rpc-error";
  summary: string;
  mint: MintInspection | null;
  authorityAnalysis: AuthorityAnalysis | null;
  concentration: ConcentrationReport;
  score: IntelScore;
  analysisCoverage: AnalysisCoverage;
  riskSignals: ObservableSignal[];
  limitations: string[];
};
```

## IntelScore

```ts
type IntelScore = {
  label: "XGEN Intel Score";
  methodologyVersion: "1.0.0";
  value: number;
  max: 100;
  baseline: 100;
  totalDeductions: number;
  band:
    | "Few observed risk characteristics"
    | "Some observed risk characteristics"
    | "Elevated observed risk characteristics"
    | "High observed risk characteristics";
  methodology: string;
  deductions: ScoreDeduction[];
};
```

Every score deduction includes:

- a deterministic rule id;
- an observable condition;
- a numeric deduction;
- a plain-English explanation;
- the source field and value used as evidence.

## AnalysisCoverage

```ts
type AnalysisCoverage = {
  status: "complete" | "partial" | "limited";
  methodology: string;
  reasons: string[];
};
```

Coverage describes which intended M4 analysis surfaces were inspected. Missing or unsupported information affects coverage and must not be silently converted into a risk deduction.

## Concentration

Concentration keeps the M3 distinction between:

- token-account concentration, calculated directly from the largest token accounts returned by RPC;
- resolved-owner concentration, calculated only when sampled token-account owners are resolved with sufficient quality.

Only reliable resolved-owner concentration can affect the M4 score.
