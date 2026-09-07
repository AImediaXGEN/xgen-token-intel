# Analysis Result Schema

M3 returns an `AnalysisResult` object.

```ts
type AnalysisResult = {
  version: "m3";
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

M3 concentration includes two separate views:

- token-account concentration, calculated directly from the largest token accounts returned by RPC;
- resolved-owner concentration, calculated only when sampled token-account owners are resolved with sufficient quality.

Every score adjustment must include:

- an observable condition;
- the numeric adjustment;
- a short explanation;
- the source data field used.

M3 does not add score adjustments. Concentration observations are surfaced as factual signals, while the XGEN Intel Score remains the M1 baseline until M4.
