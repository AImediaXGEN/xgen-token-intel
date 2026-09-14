# V1 Data Model

## Token Program

`tokenProgram` identifies the Solana program that owns the mint account.

Supported values:

- `spl-token`: legacy SPL Token Program.
- `token-2022`: SPL Token-2022 Program.
- `unknown`: account owner is not a supported token program.

## Mint Inspection

The mint inspection result contains:

- `mintAddress`: canonical public key string.
- `accountExists`: whether RPC found an account at the mint address.
- `tokenProgram`: recognized token program or unknown.
- `decimals`: parsed token decimals, if available.
- `supply`: current supply from RPC, using raw integer amount and optional UI amount string.
- `mintAuthority`: observed mint authority address or null.
- `mintAuthorityRevoked`: true when parsed mint data reports no mint authority.
- `freezeAuthority`: observed freeze authority address or null.
- `freezeAuthorityRevoked`: true when parsed mint data reports no freeze authority.

## Authority Analysis

M2 adds `authorityAnalysis`:

- `scope`: `legacy-spl-token`, `token-2022`, or `unsupported`.
- `summary`: plain-English authority summary.
- `standardAuthorities`: mint authority and freeze authority observations.
- `token2022Extensions`: parsed Token-2022 extension authority observations when available.
- `limitations`: authority-specific limitations, especially for Token-2022.

## Concentration Metrics

M3 adds `concentration`:

- `tokenAccountConcentration`: top 5, top 10, and top 20 largest token-account concentration.
- `resolvedOwnerConcentration`: top 5, top 10, and top 20 resolved-owner concentration when owner resolution is sufficiently reliable.
- `resolution`: sampled account counts, unresolved counts, sampled-balance coverage, and owner-resolution quality.
- `limitations`: explicit methodology limitations.

The app must not label largest token accounts as largest unique people or verified owner identities. Owner resolution aggregates blockchain owner addresses; it does not identify real-world entities.

## Transparent Scoring

M4 adds `score`:

- `methodologyVersion`: currently `1.0.0`.
- `baseline`: always `100`.
- `deductions`: deterministic rule applications with evidence.
- `totalDeductions`: sum of applied deductions.
- `value`: `baseline - totalDeductions`, clamped to `0-100`.
- `band`: plain-language band describing observed risk characteristics.

M4 also adds `analysisCoverage`, which is separate from `score` and records missing, unsupported, or incomplete analysis surfaces.
