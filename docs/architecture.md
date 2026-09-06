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
- `src/lib/intel`: application data schemas, mint analysis, observable risk signals, and transparent scoring.
- `src/app/api`: server routes that expose analysis results to the UI without exposing RPC implementation details.
- `src/components`: presentation components only.
- `docs`: architecture, data model, scoring method, RPC limitations, and milestone plan.

## Provider Model

The analysis layer should accept provider-shaped inputs instead of hard-coding every source into UI components. M1 uses standard Solana RPC only. Future providers can add metadata, liquidity, governance, or historical behavior later, but each provider must preserve the read-only boundary and clearly identify its data source.

## M1 Scope

M1 implements:

- Mint address syntax validation.
- Read-only RPC connection.
- Mint account lookup.
- Token program identification for SPL Token and Token-2022.
- Parsed mint inspection for decimals, supply, mint authority, and freeze authority when RPC returns parsed mint data.
- A transparent M1 report shape.
- A scoring engine scaffold that returns documented, observable adjustments only.

M1 does not implement holder concentration, authority risk scoring, UI polish beyond a usable foundation, or public GitHub release.
