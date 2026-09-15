# Data Model

## Token Program

`tokenProgram` identifies the Solana program that owns the mint account.

Supported values:

- `spl-token`: legacy SPL Token Program.
- `token-2022`: SPL Token-2022 Program.
- `unknown`: account owner is not a supported token program.

## Mint Inspection

The mint inspection result contains:

- `mintAddress`: canonical public key string.
- `accountExists`: whether RPC found an account at the address.
- `tokenProgram`: recognized token program or unknown.
- `decimals`: parsed token decimals, if available.
- `supply`: current supply from RPC, using raw integer amount and optional UI amount string.
- `mintAuthority`: observed standard mint authority address or null.
- `mintAuthorityRevoked`: true when parsed mint data reports no standard mint authority.
- `freezeAuthority`: observed standard freeze authority address or null.
- `freezeAuthorityRevoked`: true when parsed mint data reports no standard freeze authority.
- `extensions`: parsed Token-2022 extension observations when standard RPC exposes them.

## Authority Analysis

`authorityAnalysis` contains:

- `scope`: `legacy-spl-token`, `token-2022`, or `unsupported`.
- `summary`: factual plain-English authority summary.
- `standardAuthorities`: mint authority and freeze authority observations.
- `token2022Extensions`: parsed Token-2022 extension authority observations when available.
- `limitations`: authority-specific limitations, especially for Token-2022.

Authority observations do not prove intent.

## Concentration Metrics

`concentration` contains:

- `tokenAccountConcentration`: Top-5, Top-10, and Top-20 largest token-account concentration.
- `resolvedOwnerConcentration`: Top-5, Top-10, and Top-20 resolved-owner concentration when owner resolution is sufficiently reliable.
- `resolution`: sampled account counts, unresolved counts, sampled-balance coverage, and owner-resolution quality.
- `limitations`: explicit methodology limitations.

Largest token accounts are not labeled as unique people or verified holder identities. Owner resolution aggregates blockchain owner addresses; it does not identify real-world entities.

## Transparent Scoring

`score` is either an `IntelScore` object or `null`.

A null score means no valid XGEN Intel Score was produced. It does not mean score `0`, safe, unsafe, low risk, high risk, positive evidence, or negative evidence.

When present, `score` contains:

- `methodologyVersion`: currently `1.0.0`.
- `baseline`: always `100`.
- `deductions`: deterministic rule applications with evidence.
- `totalDeductions`: sum of applied deductions.
- `value`: `baseline - totalDeductions`, clamped to `0-100`.
- `band`: plain-language band describing observed risk characteristics.

## Analysis Coverage

`analysisCoverage` is separate from `score`. It records whether intended analysis surfaces were complete, partial, or limited.

Missing or unsupported information reduces coverage and must not be silently converted into a score deduction.
