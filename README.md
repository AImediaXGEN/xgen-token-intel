# XGEN Token Intel

[![CI](https://github.com/AImediaXGEN/xgen-token-intel/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/AImediaXGEN/xgen-token-intel/actions/workflows/ci.yml?query=branch%3Amain)

**DON'T TRUST. VERIFY.**

XGEN Token Intel is a read-only Solana token intelligence tool for the XGENVERSE / XGEN "Decentralize Everything" mission. It analyzes observable on-chain token characteristics using standard Solana RPC data and produces a transparent human-readable report.

No wallet connection is required.

## What It Does

XGEN Token Intel currently analyzes:

- Mint/account validation
- Legacy SPL Token vs Token-2022 identification
- Token decimals and current supply
- Standard mint authority
- Standard freeze authority
- Selected Token-2022 extension observations when parsed RPC data exposes them
- Largest token-account concentration
- Resolved-owner concentration when owner resolution quality is defensible
- XGEN Intel Score
- Analysis Coverage

All intelligence is derived from read-only Solana RPC responses. The application does not use paid token-risk APIs, proprietary entity labels, market data, liquidity analysis, or social scoring.

## What It Does Not Do

XGEN Token Intel does not:

- Determine whether a token is safe
- Determine whether a token is a scam
- Verify token legitimacy
- Provide investment advice
- Identify real-world token holders
- Comprehensively inspect every Token-2022 authority/control surface
- Connect wallets
- Request wallet permissions
- Sign messages or transactions
- Submit transactions
- Trade, swap, buy, or sell tokens
- Custody assets
- Modify blockchain state

## XGEN Intel Score

Application version and scoring methodology version are independent.

- Application version: `0.1.0`
- XGEN Intel Score methodology version: `1.0.0`

Methodology `1.0.0` starts analyzable results at `100` and applies only documented deductions for observed conditions. The score reflects observed characteristics within successfully analyzed surfaces. It is not a token-safety score, endorsement, scam detector, trading signal, or claim about intent.

### Frozen Deductions

Authority deductions:

| Observable condition | Deduction |
| --- | ---: |
| Active standard mint authority | -20 |
| Active standard freeze authority | -10 |

Resolved-owner Top-5 concentration deductions:

| Top-5 resolved-owner supply share | Deduction |
| --- | ---: |
| `0 <= x < 20` | 0 |
| `20 <= x < 40` | -5 |
| `40 <= x < 60` | -10 |
| `60 <= x < 80` | -15 |
| `80 <= x` | -20 |

Top-10 extreme concentration rule:

```text
top10 >= 90
AND
top10 - top5 >= 10
```

Additional deduction: `-5`

Top-20 concentration is displayed intelligence only and is not score-bearing in methodology `1.0.0`.

### Score Bands

| Score | Band |
| --- | --- |
| `95-100` | Few observed risk characteristics |
| `85-94` | Some observed risk characteristics |
| `60-84` | Elevated observed risk characteristics |
| `0-59` | High observed risk characteristics |

## Analysis Coverage

Analysis Coverage is independent of score.

- `COMPLETE`: core authority and concentration surfaces were analyzed.
- `PARTIAL`: the report includes useful intelligence, but at least one relevant surface remains incomplete or limited.
- `LIMITED`: one or more intended analysis surfaces could not be inspected reliably.

A result with `100 + LIMITED` does not communicate the same analytical completeness as `100 + COMPLETE`.

Unknown or missing information does not automatically add or subtract score. Missing information reduces coverage and is shown as a limitation.

## UNSCORED Results

`score: null` means no valid XGEN Intel Score was produced.

Examples include:

- Malformed mint address input
- Unsupported/non-mint target account
- Analysis unable to establish a valid scorable mint target

`UNSCORED` does not mean score `0`. It does not mean safe, unsafe, low risk, high risk, positive evidence, or negative evidence.

## Concentration Methodology

XGEN Token Intel uses the largest token-account sample available from standard Solana RPC.

It reports:

- Token-account concentration: supply share held by the largest token accounts returned by RPC.
- Resolved-owner concentration: supply share after aggregating token accounts by resolved blockchain owner address when resolution quality is sufficient.

Important limitations:

- Largest token accounts are not the same as unique human holders.
- Multiple token accounts may resolve to the same blockchain owner.
- Blockchain owner addresses are not verified real-world identities.
- Program-owned accounts, exchanges, treasuries, bridges, liquidity pools, custodians, and other structures may affect concentration interpretation.
- The tool does not guess exchanges, teams, treasuries, whales, developers, or real-world entities.
- RPC availability and parsing quality can limit concentration analysis.

## Token-2022 Limitations

Token-2022 uses extensions that can expose authority or control surfaces beyond ordinary mint authority and freeze authority.

Revoked standard mint and freeze authorities do not prove comprehensive Token-2022 authority safety.

XGEN Token Intel may report selected Token-2022 extension observations when standard parsed RPC data exposes them, but it does not yet comprehensively decode and inspect every Token-2022 authority/control surface. This limitation affects Analysis Coverage.

## Read-Only Security Model

Architecture:

```text
Browser
  -> XGEN Token Intel server endpoint (/api/analyze)
  -> user-configured Solana RPC
```

The browser sends only a mint address to the server endpoint. The server performs read-only Solana RPC calls.

Security boundaries:

- No wallet connection
- No transaction signing
- No transaction submission
- No blockchain writes
- No custody
- RPC credentials remain server-side

## Architecture

High-level directories:

- `src/app`: Next.js app routes and API route.
- `src/components`: React presentation components.
- `src/lib/solana`: Solana RPC configuration, program IDs, and read-only account fetching helpers.
- `src/lib/intel`: schemas, mint analysis, authority analysis, concentration analysis, scoring, and tests.
- `docs`: public technical documentation and milestone history.

## Requirements

Verified development environment:

- Node.js `24.x`
- pnpm `11.x`

Broader runtime compatibility has not been claimed or verified.

## Installation

```bash
git clone <repository-url>
cd xgen-token-intel
pnpm install --frozen-lockfile
```

Create local environment configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` locally and provide your own compatible Solana RPC endpoint:

```bash
SOLANA_RPC_URL=https://example-rpc-provider.invalid/?api-key=YOUR_KEY
```

Never commit real RPC credentials.

Run the development server:

```bash
pnpm dev
```

Run tests and checks:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

## Environment

`SOLANA_RPC_URL` is server-side only. It may contain a provider URL or credential-bearing endpoint in local/private environments.

Do not use `NEXT_PUBLIC_SOLANA_RPC_URL` for credential-bearing endpoints. `NEXT_PUBLIC_*` variables can enter the browser bundle.

`.env`, `.env.local`, and `.env.*.local` are ignored by git. `.env.example` is intentionally tracked and must contain placeholders only.

## Testing

Canonical release-readiness checks:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

## Limitations

- Standard Solana RPC parsing may vary by provider.
- Token-2022 extension authority coverage is not comprehensive.
- Largest-account sampling is not complete holder enumeration.
- Resolved owner addresses are blockchain addresses, not real-world identities.
- Market price, market cap, liquidity, LP analysis, social scoring, and third-party token-risk APIs are intentionally out of scope.
- RPC failures reduce coverage and are not treated as positive evidence.

## Methodology Versioning

Application releases and XGEN Intel Score methodology versions are versioned independently.

Changing UI, documentation, tests, or non-scoring features does not automatically change the scoring methodology. Any scoring-methodology change requires a new methodology version and updated public documentation.

## License

MIT. See [LICENSE](LICENSE).

## Philosophy / Disclaimer

XGEN Token Intel exists to make observable token characteristics easier to verify. It is informational software, not financial advice, legal advice, investment research, or a token endorsement.
