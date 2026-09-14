# XGEN Token Intel

Read-only Solana token intelligence for the XGENVERSE / XGEN "Decentralize Everything" mission.

Core philosophy: **Don't trust. Verify.**

## Current Scope

M4 provides a standalone Next.js foundation with read-only authority inspection, concentration inspection, transparent scoring, and analysis coverage:

- Validates Solana mint address syntax.
- Reads observable mint account data through Solana RPC.
- Identifies legacy SPL Token and Token-2022 mint accounts.
- Displays decimals, supply, mint authority, and freeze authority when parsed RPC data is available.
- Explains standard mint authority and freeze authority in factual language.
- Flags Token-2022 extension authority surfaces as a required limitation unless comprehensively inspected.
- Calculates token-account concentration from largest token accounts.
- Resolves token-account owner addresses when parsed RPC data supports it.
- Calculates resolved-owner concentration only when resolution quality is defensible.
- Applies deterministic XGEN Intel Score methodology `1.0.0` from documented M1-M3 evidence only.
- Separates score from analysis coverage so missing data is not automatically treated as risk.
- Preserves clear product boundaries: no wallet connection, no signing, no transactions, no swaps, no custody, no entity guessing, no safe/scam verdicts.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
```

Optional dedicated RPC override:

```bash
cp .env.example .env.local
# edit SOLANA_RPC_URL in .env.local with your read-only Solana RPC endpoint
```

Use a server-only variable such as `SOLANA_RPC_URL`. Do not use `NEXT_PUBLIC_SOLANA_RPC_URL` for credential-bearing endpoints.

## Documentation

- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Analysis result schema](docs/analysis-result-schema.md)
- [Authority analysis](docs/authority-analysis.md)
- [Concentration analysis](docs/concentration-analysis.md)
- [Scoring](docs/scoring.md)
- [RPC limitations](docs/rpc-limitations.md)
- [Milestones](docs/milestones.md)

## Security Boundary

Never enter seed phrases, private keys, or wallet credentials. This application does not need them.
