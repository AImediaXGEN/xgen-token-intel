# XGEN Token Intel Architecture

XGEN Token Intel is a standalone, read-only Solana token intelligence application.

Core philosophy: "Don't trust. Verify."

## Product Boundary

V1 is read-only by design. It does not connect wallets, request permissions, sign messages, sign transactions, submit transactions, ask for private keys, offer swaps, trading, custody, lending, token locking, or definitive scam/safe labels.

The app accepts a Solana token mint address and produces a human-readable report from observable RPC data.

## Recommended V1 Stack

- TypeScript
- Next.js App Router
- React
- Tailwind CSS
- `@solana/web3.js` for read-only Solana RPC access
- `zod` for runtime data validation
- Vitest for unit tests
- pnpm for package management

No paid APIs or third-party token-risk APIs are included in V1.

## Module Boundaries

- `src/lib/solana`: Solana RPC configuration, read-only client creation, token program IDs, and low-level account fetching.
- `src/lib/intel`: application data schemas, mint analysis, authority analysis, observable risk signals, and transparent scoring.
- `src/app/api`: server routes that expose analysis results to the UI without exposing RPC implementation details.
- `src/components`: presentation components only.
- `docs`: architecture, data model, authority model, scoring method, RPC limitations, and milestone plan.

## Provider Model

The analysis layer should accept provider-shaped inputs instead of hard-coding every source into UI components. M2 uses standard Solana RPC only. Future providers can add metadata, liquidity, governance, historical behavior, or binary Token-2022 extension decoding later, but each provider must preserve the read-only boundary and clearly identify its data source.

## M2 Scope

M2 implements:

- Factual standard mint authority and freeze authority explanations.
- Observable authority-related signals.
- Token-2022 classification.
- Token-2022 extension authority inventory.
- Parsed Token-2022 extension authority field reporting when standard RPC exposes those fields.
- Explicit Token-2022 limitations so revoked standard authorities are not treated as comprehensive low authority risk.

M2 does not implement holder concentration, market data, liquidity analysis, LP analysis, final scoring methodology, wallet connectivity, transaction signing, blockchain writes, or public GitHub release.
