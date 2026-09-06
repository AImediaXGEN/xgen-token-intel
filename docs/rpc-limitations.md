# RPC Limitations and Misleading Metrics

## Largest Token Accounts

`getTokenLargestAccounts` returns token accounts, not unique human holders. A single wallet can control multiple token accounts, and some token accounts may be owned by programs, exchanges, custodians, escrow contracts, or liquidity pools.

For that reason, M2 does not present top accounts as top holders.

## Owner Resolution

Reliable owner concentration requires fetching each token account and resolving its owner from parsed account data. Even then, the owner can be a program or custody account rather than a human wallet.

## Supply Metrics

Token supply is read from standard RPC. Supply can be affected by decimals and display formatting. Reports should keep both raw amount and UI amount where possible.

## Parsed Account Data

M2 relies on `getParsedAccountInfo` and `getTokenSupply`. RPC providers may differ in parsed Token-2022 extension support, availability, rate limits, and error messages. The app should surface RPC errors without converting them into token-risk conclusions.

## Token Program Support

M2 recognizes the legacy SPL Token Program and Token-2022. Unknown account owners are reported as unsupported rather than forced into a token interpretation.

## Token-2022 Extensions

Token-2022 extensions store specialized state beyond base mint fields. M2 detects parsed extension names and selected parsed authority fields when RPC provides them. Extension surfaces not parsed by M2 are reported as uninspected rather than absent because M2 does not perform comprehensive binary TLV extension decoding. Revoked mint and freeze authorities must not be interpreted as comprehensive low authority risk for Token-2022 tokens.
