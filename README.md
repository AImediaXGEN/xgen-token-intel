# XGEN Token Intel

Read-only Solana token intelligence for the XGENVERSE / XGEN "Decentralize Everything" mission.

Core philosophy: **Don't trust. Verify.**

## Current Scope

M2 provides a standalone Next.js foundation and read-only authority inspection:

- Validates Solana mint address syntax.
- Reads observable mint account data through Solana RPC.
- Identifies legacy SPL Token and Token-2022 mint accounts.
- Displays decimals, supply, mint authority, and freeze authority when parsed RPC data is available.
- Explains standard mint authority and freeze authority in factual language.
- Flags Token-2022 extension authority surfaces as a required limitation unless comprehensively inspected.
- Preserves clear product boundaries: no wallet connection, no signing, no transactions, no swaps, no custody, no safe/scam verdicts.

## Development

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
```

Optional RPC override:

```bash
cp .env.example .env.local
# edit SOLANA_RPC_URL if you want to use a read-only custom endpoint
```

## Documentation

- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Analysis result schema](docs/analysis-result-schema.md)
- [Authority analysis](docs/authority-analysis.md)
- [Scoring](docs/scoring.md)
- [RPC limitations](docs/rpc-limitations.md)
- [Milestones](docs/milestones.md)

## Security Boundary

Never enter seed phrases, private keys, or wallet credentials. This application does not need them.
