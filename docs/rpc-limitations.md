# RPC Limitations and Misleading Metrics

## Largest Token Accounts

`getTokenLargestAccounts` returns token accounts, not unique people or verified owner identities. A single wallet can control multiple token accounts, and some token accounts may be owned by programs, exchanges, custodians, escrow contracts, or liquidity pools.

For that reason, M4 labels these metrics as token-account concentration.

## Owner Resolution

Reliable owner concentration requires fetching each token account and resolving its owner from parsed account data. Even then, the owner can be a program or custody account rather than a human wallet.

M4 resolves owner addresses from parsed token accounts when the parsed account type is `account`, the parsed mint matches the requested mint, and an owner address is present. Unresolved accounts remain visible.

## Supply Metrics

Token supply is read from standard RPC. Concentration percentages use raw integer balances and current raw mint supply as the denominator. Zero supply produces no concentration percentages.

## Parsed Account Data

M4 relies on `getParsedAccountInfo`, `getTokenSupply`, `getTokenLargestAccounts`, and `getMultipleParsedAccounts`. RPC providers may differ in parsed Token-2022 extension support, availability, rate limits, and error messages. The app should surface RPC errors without converting them into token-risk conclusions.

## Token Program Support

M4 recognizes the legacy SPL Token Program and Token-2022. Unknown account owners are reported as unsupported rather than forced into a token interpretation.

## Token-2022 Extensions

Token-2022 extensions store specialized state beyond base mint fields. M4 detects parsed extension names and selected parsed authority fields when RPC provides them. Extension surfaces not parsed by M4 are reported as uninspected rather than absent because M4 does not perform comprehensive binary TLV extension decoding. Revoked mint and freeze authorities must not be interpreted as comprehensive low authority risk for Token-2022 tokens.

## Entity Identification

M4 does not identify exchanges, liquidity pools, treasuries, bridges, burn accounts, vesting contracts, project wallets, or people. It resolves token-account owner addresses only. Unknown remains unknown.


## Dedicated RPC Configuration

Dedicated Solana RPC endpoints should be configured server-side with `SOLANA_RPC_URL`.

Do not expose credential-bearing RPC URLs through `NEXT_PUBLIC_*` variables. The browser should send only a mint address to `/api/analyze`; the server route performs read-only Solana RPC calls.

Secret-bearing files such as `.env`, `.env.local`, and `.env.*.local` are ignored by git. `.env.example` must contain placeholders only.

RPC failures reduce analysis coverage and are surfaced as limitations. They must not become zero concentration, positive evidence, or silent success. User-facing RPC errors are sanitized to avoid exposing credential-bearing endpoint URLs.

Owner account resolution is batched deterministically for provider portability. Batching preserves account order, preserves unresolved accounts, and treats partial batch responses or batch failures as analysis limitations rather than concentration data.
