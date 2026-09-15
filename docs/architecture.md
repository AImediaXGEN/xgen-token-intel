# Architecture

XGEN Token Intel is a standalone, read-only Solana token intelligence application.

Core philosophy: **Don't trust. Verify.**

## Product Boundary

The application accepts a Solana token mint address and returns a human-readable report from observable RPC data.

It does not connect wallets, request wallet permissions, sign messages, sign transactions, submit transactions, ask for private keys or seed phrases, offer swaps, trade, custody assets, lend, lock tokens, or classify tokens as safe or scams.

## Runtime Flow

```text
Browser
  -> Next.js server route: /api/analyze
  -> read-only Solana RPC endpoint
```

The browser does not need a provider API key. Credential-bearing RPC URLs must be configured server-side with `SOLANA_RPC_URL`.

## Stack

- TypeScript
- Next.js App Router
- React
- Tailwind CSS
- `@solana/web3.js` for read-only Solana RPC access
- `zod` for runtime data validation
- Vitest for unit tests
- pnpm for package management

No paid intelligence APIs or third-party token-risk APIs are included.

## Module Boundaries

- `src/app`: app entry points and the `/api/analyze` server route.
- `src/components`: presentation-only React components.
- `src/lib/solana`: Solana program IDs, RPC configuration, read-only connection creation, public-key parsing, token-account fetching, and parsed owner resolution.
- `src/lib/intel`: analysis schemas, mint analysis, authority analysis, concentration analysis, scoring, and deterministic tests.
- `docs`: public technical documentation and milestone history.

Blockchain/RPC access is kept separate from analysis logic, scoring logic, and presentation code so future read-only providers can be added without rewriting the core application.

## Analysis Scope

Current release scope includes:

- Mint/account validation
- Legacy SPL Token and Token-2022 identification
- Decimals and supply
- Standard mint authority and freeze authority
- Selected Token-2022 extension observations when parsed RPC exposes them
- Token-account concentration
- Resolved-owner concentration when resolution quality is defensible
- XGEN Intel Score methodology `1.0.0`
- Analysis Coverage
- UNSCORED results for invalid or unsupported targets

## Out of Scope

The application does not implement market data, market cap, liquidity analysis, LP analysis, metadata/social scoring, wallet connectivity, transaction signing, blockchain writes, public entity labels, or AI scoring.
