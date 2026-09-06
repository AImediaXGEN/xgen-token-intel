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

The V1 target model reserves room for concentration metrics, but M2 leaves them unimplemented.

When implemented, concentration metrics must distinguish:

- token accounts returned by RPC;
- wallet owners resolved from token accounts;
- program-owned accounts;
- liquidity or pool accounts;
- raw supply concentration.

The app must not label largest token accounts as largest unique human holders unless owner aggregation is implemented and verified.
