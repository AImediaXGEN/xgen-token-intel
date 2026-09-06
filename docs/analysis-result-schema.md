# Analysis Result Schema

M1 returns an `AnalysisResult` object.

```ts
type AnalysisResult = {
  version: "m1";
  generatedAt: string;
  input: string;
  mintAddress: string | null;
  status: "ok" | "invalid-address" | "not-found" | "unsupported-account" | "rpc-error";
  summary: string;
  mint: MintInspection | null;
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

M1 uses this schema even though holder concentration and full authority scoring are later milestones.
