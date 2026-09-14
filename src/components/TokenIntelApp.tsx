"use client";

import { FormEvent, useMemo, useState } from "react";
import type {
  AnalysisCoverage,
  AnalysisResult,
  AuthorityObservation,
  ConcentrationReport,
  ObservableSignal,
  ScoreDeduction,
  Token2022ExtensionAuthority,
} from "@/lib/intel/schemas";
import {
  authorityStatusLabel,
  compactAddress,
  concentrationStateLabel,
  coverageDisplay,
  deductionSummary,
  compactSignalExplanation,
  concentrationLimitationsSummary,
  displayPercent,
  publicUiCopy,
  shouldProminentlyPairCoverage,
  uniqueCopyLabel,
} from "./tokenIntelPresentation";

const sampleMint = "So11111111111111111111111111111111111111112";

function panelClass(extra = ""): string {
  return `rounded-lg border border-cyan-400/15 bg-slate-950/72 shadow-[0_0_0_1px_rgba(15,23,42,0.8),0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur ${extra}`;
}

function toneClass(tone: string): string {
  switch (tone) {
    case "complete":
      return "border-cyan-300/35 bg-cyan-300/10 text-cyan-100";
    case "partial":
      return "border-amber-300/35 bg-amber-300/10 text-amber-100";
    case "limited":
      return "border-orange-300/35 bg-orange-300/10 text-orange-100";
    default:
      return "border-slate-500/35 bg-slate-500/10 text-slate-200";
  }
}

function signalStyle(severity: ObservableSignal["severity"]): string {
  switch (severity) {
    case "positive":
      return "border-cyan-300/30 bg-cyan-300/10 text-cyan-50";
    case "caution":
      return "border-amber-300/30 bg-amber-300/10 text-amber-50";
    case "risk":
      return "border-rose-300/30 bg-rose-300/10 text-rose-50";
    default:
      return "border-slate-500/30 bg-slate-500/10 text-slate-100";
  }
}

function CopyButton({
  value,
  ariaLabel,
  label = "Copy",
}: {
  value: string | null | undefined;
  ariaLabel: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const disabled = !value;

  async function copy() {
    if (!value || !navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={copy}
      aria-label={ariaLabel}
      className="min-h-9 shrink-0 rounded-md border border-cyan-300/20 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function SectionHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/70">{eyebrow}</p> : null}
        <h2 className="mt-1 text-xl font-semibold text-slate-50">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value, caption }: { label: string; value: string; caption?: string }) {
  const isPercent = value.endsWith("%");
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="mt-2 min-w-0 font-mono text-lg font-semibold text-slate-50">
        <span className={isPercent ? "whitespace-nowrap" : "overflow-wrap-anywhere"}>{value}</span>
      </dd>
      {caption ? <p className="mt-2 text-xs leading-5 text-slate-400">{caption}</p> : null}
    </div>
  );
}

function AddressMetric({ label, value, copyLabel }: { label: string; value: string | null | undefined; copyLabel: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm text-slate-50" title={value ?? undefined}>
          {compactAddress(value)}
        </span>
        <CopyButton value={value} ariaLabel={copyLabel} />
      </dd>
    </div>
  );
}

function AuthorityCard({ authority }: { authority: AuthorityObservation }) {
  const status = authorityStatusLabel(authority.status);
  const active = authority.status === "active";
  return (
    <section className="min-w-0 rounded-lg border border-white/10 bg-white/[0.045] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-50">{authority.label}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{authority.permits}</p>
        </div>
        <span className={`w-fit rounded-md border px-3 py-1 text-xs font-semibold tracking-[0.16em] ${active ? "border-amber-300/40 bg-amber-300/10 text-amber-100" : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"}`}>
          {status}
        </span>
      </div>
      {active ? (
        <div className="mt-4 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border border-amber-300/15 bg-amber-300/5 p-3">
          <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-amber-50" title={authority.address ?? undefined}>
            {compactAddress(authority.address)}
          </span>
          <CopyButton value={authority.address} ariaLabel={uniqueCopyLabel(authority.label)} />
        </div>
      ) : null}
      <p className="mt-3 overflow-wrap-anywhere font-mono text-xs text-slate-500">Source: {authority.source}</p>
    </section>
  );
}

function Token2022ExtensionCard({ extension }: { extension: Token2022ExtensionAuthority }) {
  return (
    <section className="min-w-0 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-amber-50">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h3 className="font-semibold">{extension.label}</h3>
        <span className="text-xs font-semibold uppercase tracking-[0.16em]">{extension.status}</span>
      </div>
      <p className="mt-2 text-sm leading-6">{extension.explanation}</p>
      {extension.authorityFields.length > 0 ? (
        <dl className="mt-3 grid gap-3">
          {extension.authorityFields.map((field) => (
            <div key={field.field} className="min-w-0 rounded-md border border-amber-200/20 bg-black/15 p-3">
              <dt className="text-xs font-semibold uppercase tracking-[0.16em]">{field.field}</dt>
              <dd className="mt-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span className="min-w-0 overflow-wrap-anywhere font-mono text-xs">{field.value}</span>
                <CopyButton value={field.value} ariaLabel={uniqueCopyLabel(`${extension.label} ${field.field}`)} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function ScorePanel({ result }: { result: AnalysisResult | null }) {
  const coverage = coverageDisplay(result?.analysisCoverage.status ?? "pending");
  const scoreValue = result?.score?.value;
  const hasScore = typeof scoreValue === "number";
  const prominent = shouldProminentlyPairCoverage(scoreValue, result?.analysisCoverage.status ?? "pending");

  return (
    <section className={panelClass("min-w-0 overflow-hidden")}>
      <div className="border-b border-cyan-300/10 bg-cyan-300/[0.035] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/75">XGEN Intel Score</p>
        <div className="mt-4 flex items-end gap-3">
          <span className={`${hasScore ? "text-6xl" : "text-4xl"} font-mono font-semibold leading-none text-slate-50`}>
            {hasScore ? scoreValue : result ? "UNSCORED" : "--"}
          </span>
          {hasScore ? <span className="pb-2 font-mono text-lg text-slate-400">/ 100</span> : null}
        </div>
        <p className="mt-3 text-base font-semibold text-slate-200">{result?.score?.band ?? (result ? "No score produced" : "Awaiting analysis")}</p>
      </div>
      <div className="space-y-4 p-5">
        <div className={`rounded-lg border p-4 ${toneClass(coverage.tone)} ${prominent ? "shadow-[0_0_30px_rgba(251,191,36,0.12)]" : ""}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Analysis Coverage</p>
            <span className="font-mono text-sm font-semibold">{coverage.label}</span>
          </div>
          <p className="mt-3 text-sm leading-6">{publicUiCopy(coverage.description)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Methodology" value={result?.score?.methodologyVersion ? `v${result.score.methodologyVersion}` : result ? "N/A" : "v1.0.0"} />
          <Metric label="Points Deducted" value={result?.score ? String(result.score.totalDeductions) : result ? "N/A" : "0"} />
        </div>
      </div>
    </section>
  );
}

function DeductionBreakdown({ deductions }: { deductions: ScoreDeduction[] }) {
  return (
    <section className={panelClass("p-5")}>
      <SectionHeader eyebrow="why this score" title="Deduction Breakdown" />
      <p className="mt-3 text-sm leading-6 text-slate-400">{deductionSummary(deductions)}</p>
      <div className="mt-4 grid gap-3">
        {deductions.length > 0 ? (
          deductions.map((deduction) => (
            <section key={deduction.ruleId} className="min-w-0 rounded-lg border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-50">{deduction.condition}</h3>
                  <p className="mt-1 overflow-wrap-anywhere text-xs uppercase tracking-[0.16em] text-slate-500">{deduction.ruleId}</p>
                </div>
                <span className="shrink-0 font-mono text-lg font-semibold text-amber-100">-{deduction.points}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{deduction.explanation}</p>
              <p className="mt-3 overflow-wrap-anywhere font-mono text-xs text-slate-500">
                {deduction.evidence.source}: {deduction.evidence.value}
              </p>
            </section>
          ))
        ) : (
          <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/5 p-4 text-sm text-cyan-50">
            No score deductions were triggered within successfully analyzed surfaces.
          </div>
        )}
      </div>
    </section>
  );
}

function ConcentrationSection({ concentration }: { concentration: ConcentrationReport }) {
  const tokenAccounts = concentration.tokenAccountConcentration;
  const owners = concentration.resolvedOwnerConcentration;
  const state = concentrationStateLabel(concentration);

  return (
    <section className={panelClass("p-5")}>
      <SectionHeader eyebrow="distribution intelligence" title="Concentration Analysis">
        <span className="w-fit rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 font-mono text-xs font-semibold text-cyan-100">{state}</span>
      </SectionHeader>
      <p className="mt-3 text-sm leading-6 text-slate-400">
        Multiple Solana token accounts may resolve to the same blockchain owner. Resolved owners are addresses, not verified real-world identities.
      </p>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Token Account Concentration</h3>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="Top 5" value={displayPercent(tokenAccounts?.top5Percent)} />
            <Metric label="Top 10" value={displayPercent(tokenAccounts?.top10Percent)} />
            <Metric label="Top 20" value={displayPercent(tokenAccounts?.top20Percent)} />
          </dl>
        </div>
        <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.035] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Resolved Owner Concentration</h3>
          <dl className="mt-4 grid grid-cols-3 gap-3">
            <Metric label="Top 5" value={displayPercent(owners?.top5Percent)} />
            <Metric label="Top 10" value={displayPercent(owners?.top10Percent)} />
            <Metric label="Top 20" value={displayPercent(owners?.top20Percent)} />
          </dl>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Metric label="Resolution" value={concentration.resolution.quality.toUpperCase()} />
        <Metric label="Accounts" value={`${concentration.resolution.accountsResolved}/${concentration.resolution.accountsInspected}`} />
        <Metric label="Sampled Supply" value={displayPercent(concentration.resolution.sampledSupplyPercent)} />
        <Metric label="Balance Resolved" value={displayPercent(concentration.resolution.sampledBalanceResolvedPercent)} />
      </div>
      {concentration.limitations.length > 0 ? (
        <details className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.14em] text-amber-100">
            View Concentration Limitations
          </summary>
          <p className="mt-3 text-sm leading-6 text-amber-50/90">{concentrationLimitationsSummary()}</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-50/80">
            {concentration.limitations.map((limitation) => (
              <li key={limitation}>{publicUiCopy(limitation)}</li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}

function RawVerification({ result }: { result: AnalysisResult }) {
  return (
    <details className={panelClass("p-5")}>
      <summary className="cursor-pointer text-lg font-semibold text-slate-50">Raw Verification</summary>
      <div className="mt-4 grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <AddressMetric label="Mint address" value={result.mintAddress} copyLabel="Copy mint address" />
          <Metric label="Token program" value={result.mint?.tokenProgram ?? "Not available"} />
          <Metric label="Raw supply" value={result.mint?.supply?.rawAmount ?? "Not available"} />
          <Metric label="Generated" value={result.generatedAt} />
        </div>
        <pre className="max-h-96 max-w-full overflow-auto rounded-lg border border-white/10 bg-black/40 p-4 text-xs leading-5 text-slate-300">
{JSON.stringify(
  {
    version: result.version,
    status: result.status,
    score: result.score,
    analysisCoverage: result.analysisCoverage,
    mint: result.mint,
    concentrationResolution: result.concentration.resolution,
    limitations: result.limitations,
  },
  null,
  2,
)}
        </pre>
      </div>
    </details>
  );
}

function AuthoritySection({ result }: { result: AnalysisResult }) {
  const authorityAnalysis = result.authorityAnalysis;
  const detectedToken2022Extensions =
    authorityAnalysis?.token2022Extensions.filter((extension) => extension.status === "detected") ?? [];

  return (
    <section className={panelClass("p-5")}>
      <SectionHeader eyebrow="control surfaces" title="Authority Analysis" />
      {authorityAnalysis ? (
        <>
          <p className="mt-3 text-sm leading-6 text-slate-400">{publicUiCopy(authorityAnalysis.summary)}</p>
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">Standard Authorities</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {authorityAnalysis.standardAuthorities.map((authority) => (
              <AuthorityCard key={authority.id} authority={authority} />
            ))}
          </div>
          {authorityAnalysis.scope === "token-2022" ? (
            <div className="mt-5 min-w-0 rounded-lg border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-100/75">Token-2022 Extension Observations</p>
                  <h3 className="mt-1 font-semibold text-amber-50">Extension Authority Surfaces</h3>
                </div>
                <span className="w-fit rounded-md border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-50">
                  Partial
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-50/90">
                Additional Token-2022 extension authority surfaces are not yet comprehensively inspected.
              </p>
              <div className="mt-4 grid gap-3">
                {detectedToken2022Extensions.length > 0 ? (
                  detectedToken2022Extensions.map((extension) => (
                    <Token2022ExtensionCard key={extension.extension} extension={extension} />
                  ))
                ) : (
                  <p className="text-sm text-amber-50/90">No parsed extension authority fields were available in this response.</p>
                )}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Authority analysis will appear after a supported mint is inspected.</p>
      )}
    </section>
  );
}

function ObservableSignals({ signals }: { signals: ObservableSignal[] }) {
  return (
    <section className={panelClass("p-5")}>
      <SectionHeader eyebrow="observable signals" title="Observable Signals" />
      <div className="mt-4 grid gap-2">
        {signals.length > 0 ? (
          signals.map((signal) => (
            <section key={signal.id} className={`rounded-lg border px-4 py-3 ${signalStyle(signal.severity)}`}>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <h3 className="font-semibold">{signal.label}</h3>
                  <p className="mt-1 text-sm leading-6 opacity-90">
                    {compactSignalExplanation(signal.condition, signal.whyItMatters)}
                  </p>
                </div>
                <span className="w-fit rounded-md border border-current/25 px-2 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                  {signal.severity}
                </span>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] opacity-75">
                  Source
                </summary>
                <p className="mt-2 text-sm leading-6 opacity-85">{publicUiCopy(signal.whyItMatters)}</p>
                <p className="mt-2 overflow-wrap-anywhere font-mono text-xs opacity-60">Source: {signal.source}</p>
              </details>
            </section>
          ))
        ) : (
          <p className="text-sm text-slate-400">No observable authority or concentration signals were produced for this response.</p>
        )}
      </div>
    </section>
  );
}

function TokenIdentity({ result }: { result: AnalysisResult }) {
  return (
    <section className={panelClass("p-5")}>
      <SectionHeader eyebrow="token identity" title="Mint Inspection">
        <span className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
          {result.status}
        </span>
      </SectionHeader>
      <p className="mt-3 text-sm leading-6 text-slate-400">{publicUiCopy(result.summary)}</p>
      <dl className="mt-5 grid gap-3 md:grid-cols-2">
        <AddressMetric label="Input" value={result.input} copyLabel="Copy input mint address" />
        <AddressMetric label="Canonical mint" value={result.mintAddress} copyLabel="Copy canonical mint address" />
        <Metric label="Program" value={result.mint?.tokenProgram ?? "Not available"} />
        <Metric label="Decimals" value={result.mint?.decimals?.toString() ?? "Not available"} />
        <Metric label="Raw supply" value={result.mint?.supply?.rawAmount ?? "Not available"} />
        <Metric label="UI supply" value={result.mint?.supply?.uiAmountString ?? "Not available"} />
      </dl>
    </section>
  );
}

export function TokenIntelApp() {
  const [mintAddress, setMintAddress] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mintAddress }),
      });

      if (!response.ok) {
        throw new Error("Analysis request failed.");
      }

      setResult((await response.json()) as AnalysisResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }

  const coverageStatus: AnalysisCoverage["status"] | "pending" = result?.analysisCoverage.status ?? "pending";
  const coverage = useMemo(() => coverageDisplay(coverageStatus), [coverageStatus]);

  return (
    <main className="min-h-screen text-slate-100">
      <section className="border-b border-cyan-300/10 bg-[linear-gradient(110deg,rgba(20,184,166,0.08),transparent_38%,rgba(99,102,241,0.07))]">
        <div className="mx-auto grid w-full max-w-7xl items-start gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,760px)_minmax(320px,420px)] lg:justify-between lg:px-10 lg:py-12">
          <div className="flex min-w-0 flex-col justify-between gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/75">XGENVERSE / XGEN</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-50 sm:text-6xl">XGEN Token Intel</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                Paste a Solana token mint. Inspect observable on-chain risk characteristics. No wallet connection required.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold uppercase tracking-[0.2em]">
                <p className="text-cyan-100">DON&apos;T TRUST. VERIFY.</p>
                <p className="text-slate-500">DECENTRALIZE EVERYTHING.</p>
              </div>
            </div>
            <form onSubmit={onSubmit} className="grid w-full min-w-0 max-w-4xl gap-3 rounded-lg border border-cyan-300/15 bg-slate-950/80 p-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="sr-only" htmlFor="mint-address">Solana mint address</label>
              <input
                id="mint-address"
                value={mintAddress}
                onChange={(event) => setMintAddress(event.target.value)}
                placeholder={sampleMint}
                className="min-h-12 min-w-0 rounded-md border border-white/10 bg-black/30 px-4 font-mono text-sm text-slate-50 outline-none placeholder:text-slate-600 focus:border-cyan-200"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="min-h-12 rounded-md bg-cyan-200 px-5 text-sm font-semibold uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-900"
              >
                {isLoading ? "Analyzing" : "Analyze"}
              </button>
            </form>
            {error ? <div role="alert" className="rounded-lg border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-50">{error}</div> : null}
          </div>
          <ScorePanel result={result} />
        </div>
      </section>

      {result ? (
        <section className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,390px)] lg:px-10">
          <div className="min-w-0 space-y-6">
            <TokenIdentity result={result} />
            <AuthoritySection result={result} />
            <ConcentrationSection concentration={result.concentration} />
            <ObservableSignals signals={result.riskSignals} />
            <RawVerification result={result} />
          </div>

          <aside className="min-w-0 space-y-6">
            <section className={panelClass("p-5")}>
              <SectionHeader eyebrow="coverage" title="Analysis Coverage" />
              <div className={`mt-4 rounded-lg border p-4 ${toneClass(coverage.tone)}`}>
                <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="font-mono text-lg font-semibold">{coverage.label}</p>
                  <span className="w-fit rounded-md border border-current/30 px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
                    Coverage state
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6">{publicUiCopy(coverage.description)}</p>
              </div>
              {result.analysisCoverage.reasons.length > 0 ? (
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                  {result.analysisCoverage.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            <DeductionBreakdown deductions={result.score?.deductions ?? []} />

            <section className={panelClass("p-5")}>
              <SectionHeader eyebrow="boundaries" title="Read-only Product Boundary" />
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-300">
                <li>No wallet connection.</li>
                <li>No signing or transactions.</li>
                <li>No swaps, trading, custody, lending, or locking.</li>
                <li>No entity guessing.</li>
                <li>No scam/safety verdicts.</li>
              </ul>
            </section>
          </aside>
        </section>
      ) : (
        <section className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
          <div className={panelClass("p-5")}>
            <SectionHeader eyebrow="ready" title="Read-only Solana token intelligence" />
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">No wallet</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">No connection, signing, custody, or permissions.</p>
              </div>
              <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Verify</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Authority, supply, and concentration from observable RPC data.</p>
              </div>
              <div className="rounded-lg border border-cyan-300/15 bg-cyan-300/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">Boundary</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">No trading, swaps, entity guessing, or scam/safety verdicts.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
