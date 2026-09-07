"use client";

import { FormEvent, useState } from "react";
import type {
  AnalysisResult,
  AuthorityObservation,
  ConcentrationReport,
  ObservableSignal,
  Token2022ExtensionAuthority,
} from "@/lib/intel/schemas";

const sampleMint = "So11111111111111111111111111111111111111112";

function signalStyle(severity: ObservableSignal["severity"]): string {
  switch (severity) {
    case "positive":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "caution":
      return "border-amber-200 bg-amber-50 text-amber-950";
    case "risk":
      return "border-red-200 bg-red-50 text-red-950";
    default:
      return "border-slate-200 bg-slate-50 text-slate-950";
  }
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-200 py-3 last:border-b-0">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 break-words font-mono text-sm text-slate-950">{value}</dd>
    </div>
  );
}

function PercentMetric({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-slate-950">{value ? `${value}%` : "N/A"}</dd>
    </div>
  );
}

function AuthorityCard({ authority }: { authority: AuthorityObservation }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-slate-950">{authority.label}</h3>
        <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
          {authority.status}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{authority.permits}</p>
      <p className="mt-3 break-words font-mono text-xs text-slate-600">
        Address: {authority.address ?? "None observed"}
      </p>
      <p className="mt-1 break-words font-mono text-xs text-slate-500">Source: {authority.source}</p>
    </section>
  );
}

function Token2022ExtensionCard({ extension }: { extension: Token2022ExtensionAuthority }) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold">{extension.label}</h3>
        <span className="text-xs font-semibold uppercase tracking-[0.14em]">{extension.status}</span>
      </div>
      <p className="mt-2 text-sm leading-6">{extension.explanation}</p>
      {extension.authorityFields.length > 0 ? (
        <dl className="mt-3 space-y-2">
          {extension.authorityFields.map((field) => (
            <div key={field.field}>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em]">{field.field}</dt>
              <dd className="break-words font-mono text-xs">{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-3 text-sm">No parsed authority field was available for this extension in the M2 response.</p>
      )}
      <p className="mt-3 break-words font-mono text-xs opacity-80">Source: {extension.source}</p>
    </section>
  );
}

function ConcentrationSection({ concentration }: { concentration: ConcentrationReport }) {
  const tokenAccounts = concentration.tokenAccountConcentration;
  const owners = concentration.resolvedOwnerConcentration;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-950">Concentration</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Solana tokens can be distributed across multiple token accounts controlled by the same owner. XGEN Token Intel separates raw token-account concentration from resolved-owner concentration.
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{concentration.methodology}</p>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <PercentMetric label="Token accounts top 5" value={tokenAccounts?.top5Percent} />
        <PercentMetric label="Token accounts top 10" value={tokenAccounts?.top10Percent} />
        <PercentMetric label="Token accounts top 20" value={tokenAccounts?.top20Percent} />
      </dl>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="font-semibold text-slate-950">Resolution</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {concentration.resolution.accountsResolved} / {concentration.resolution.accountsInspected} sampled token accounts resolved to owner addresses.
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Resolution quality" value={concentration.resolution.quality} />
          <Field label="Unresolved accounts" value={String(concentration.resolution.accountsUnresolved)} />
          <Field label="Sampled supply represented" value={concentration.resolution.sampledSupplyPercent ? `${concentration.resolution.sampledSupplyPercent}%` : "N/A"} />
          <Field label="Sampled balance resolved" value={`${concentration.resolution.sampledBalanceResolvedPercent}%`} />
        </dl>
      </div>

      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        <PercentMetric label="Resolved owners top 5" value={owners?.top5Percent} />
        <PercentMetric label="Resolved owners top 10" value={owners?.top10Percent} />
        <PercentMetric label="Resolved owners top 20" value={owners?.top20Percent} />
      </dl>

      {owners && !owners.metricsReliable ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          Resolved-owner concentration metrics are hidden because owner-resolution quality is not sufficient for a defensible aggregate.
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-950">
          Largest Token Accounts
        </div>
        <div className="divide-y divide-slate-200">
          {tokenAccounts?.accounts.slice(0, 20).map((account, index) => (
            <div key={account.tokenAccountAddress} className="grid gap-2 px-4 py-3 text-sm sm:grid-cols-[48px_minmax(0,1fr)_120px]">
              <span className="font-semibold text-slate-500">#{index + 1}</span>
              <div className="min-w-0">
                <p className="break-words font-mono text-slate-950">{account.tokenAccountAddress}</p>
                <p className="mt-1 break-words font-mono text-xs text-slate-600">
                  Owner: {account.ownerAddress ?? "Unresolved"}
                </p>
              </div>
              <span className="font-mono text-slate-700">{account.percentOfSupply ? `${account.percentOfSupply}%` : "N/A"}</span>
            </div>
          )) ?? <div className="px-4 py-3 text-sm text-slate-700">No token-account concentration data available.</div>}
        </div>
      </div>
    </article>
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

  const detectedToken2022Extensions =
    result?.authorityAnalysis?.token2022Extensions.filter(
      (extension) => extension.status === "detected",
    ) ?? [];

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              XGENVERSE / XGEN
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              XGEN Token Intel
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Paste a Solana token mint address and verify observable authority and concentration characteristics from read-only RPC data.
            </p>
          </div>
          <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row">
            <label className="sr-only" htmlFor="mint-address">
              Solana mint address
            </label>
            <input
              id="mint-address"
              value={mintAddress}
              onChange={(event) => setMintAddress(event.target.value)}
              placeholder={sampleMint}
              className="min-h-12 flex-1 rounded-md border border-slate-300 bg-white px-4 font-mono text-sm outline-none ring-emerald-500 transition focus:ring-2"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-12 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? "Analyzing" : "Analyze Mint"}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-10">
        <div className="space-y-6">
          {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-950">{error}</div> : null}

          {result ? (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">M3 report</p>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">{result.summary}</h2>
                </div>
                <span className="rounded-md border border-slate-200 px-3 py-1 text-sm font-medium text-slate-700">
                  {result.status}
                </span>
              </div>

              <dl className="mt-5 divide-y divide-slate-200">
                <Field label="Input" value={result.input} />
                <Field label="Canonical mint address" value={result.mintAddress ?? "Not available"} />
                <Field label="Token program" value={result.mint?.tokenProgram ?? "Not available"} />
                <Field label="Decimals" value={result.mint?.decimals?.toString() ?? "Not available"} />
                <Field label="Raw supply" value={result.mint?.supply?.rawAmount ?? "Not available"} />
                <Field label="UI supply" value={result.mint?.supply?.uiAmountString ?? "Not available"} />
              </dl>
            </article>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-slate-700">
              Enter a Solana token mint address to generate the read-only M3 concentration inspection report.
            </div>
          )}

          {result?.authorityAnalysis ? (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Authority Analysis</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">{result.authorityAnalysis.summary}</p>
              <div className="mt-4 grid gap-3">
                {result.authorityAnalysis.standardAuthorities.map((authority) => (
                  <AuthorityCard key={authority.id} authority={authority} />
                ))}
              </div>
              {result.authorityAnalysis.scope === "token-2022" ? (
                <div className="mt-5">
                  <h3 className="text-lg font-semibold text-slate-950">Token-2022 Extension Authority Surfaces</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    M3 does not treat absent or unparsed extension data as evidence of low authority risk.
                  </p>
                  <div className="mt-4 grid gap-3">
                    {detectedToken2022Extensions.length > 0 ? (
                      detectedToken2022Extensions.map((extension) => (
                        <Token2022ExtensionCard key={extension.extension} extension={extension} />
                      ))
                    ) : (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                        No Token-2022 authority-bearing extension fields were parsed by M3 from RPC in this response. This is not an absence or safety claim.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </article>
          ) : null}

          {result ? <ConcentrationSection concentration={result.concentration} /> : null}

          {result ? (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">Observable Signals</h2>
              <div className="mt-4 grid gap-3">
                {result.riskSignals.length > 0 ? (
                  result.riskSignals.map((signal) => (
                    <section key={signal.id} className={`rounded-lg border p-4 ${signalStyle(signal.severity)}`}>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="font-semibold">{signal.label}</h3>
                        <span className="text-xs font-semibold uppercase tracking-[0.14em]">{signal.severity}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6">{signal.condition}</p>
                      <p className="mt-2 text-sm leading-6">{signal.whyItMatters}</p>
                      <p className="mt-3 break-words font-mono text-xs opacity-80">Source: {signal.source}</p>
                    </section>
                  ))
                ) : (
                  <p className="text-slate-700">No M3 observable authority or concentration signals were produced for this response.</p>
                )}
              </div>
            </article>
          ) : null}
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">XGEN Intel Score</h2>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-semibold">{result?.score.value ?? 50}</span>
              <span className="pb-2 text-slate-500">/ 100</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">
              {result?.score.methodology ??
                "M3 keeps the M1 baseline score. M4 will add explicit observable adjustments."}
            </p>
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Score adjustments: {result?.score.adjustments.length ?? 0}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Resolution Quality</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {result
                ? `${result.concentration.resolution.accountsResolved} of ${result.concentration.resolution.accountsInspected} sampled token accounts resolved.`
                : "Owner resolution is shown after analysis."}
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Boundaries</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>No wallet connection.</li>
              <li>No signing or transactions.</li>
              <li>No swaps, trading, custody, or locking.</li>
              <li>No entity guessing.</li>
              <li>No safe/scam verdicts.</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
