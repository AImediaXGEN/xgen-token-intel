# Analysis Result Schema

M2 returns an `AnalysisResult` object.

```ts
type AnalysisResult = {
  version: "m2";
  generatedAt: string;
  input: string;
  mintAddress: string | null;
  status: "ok" | "invalid-address" | "not-found" | "unsupported-account" | "rpc-error";
  summary: string;
  mint: MintInspection | null;
  authorityAnalysis: AuthorityAnalysis | null;
  concentration: ConcentrationReport;
  score: IntelScore;
  riskSignals: ObservableSignal[];
  limitations: string[];
};
```

Every score adjustment must include:

- an observable condition;
- the numeric adjustment;
- a short explanation;
- the source data field used.

M2 does not add score adjustments. Authority observations are surfaced as factual signals, while the XGEN Intel Score remains the M1 baseline until M4.
