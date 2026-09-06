# RPC Limitations and Misleading Metrics

## Largest Token Accounts

`getTokenLargestAccounts` returns token accounts, not unique human holders. A single wallet can control multiple token accounts, and some token accounts may be owned by programs, exchanges, custodians, escrow contracts, or liquidity pools.

For that reason, M1 does not present top accounts as top holders.

## Owner Resolution

Reliable owner concentration requires fetching each token account and resolving its owner from parsed account data. Even then, the owner can be a program or custody account rather than a human wallet.

## Supply Metrics

Token supply is read from standard RPC. Supply can be affected by decimals and display formatting. Reports should keep both raw amount and UI amount where possible.

## Parsed Account Data

M1 relies on `getParsedAccountInfo` and `getTokenSupply`. RPC providers may differ in availability, rate limits, and error messages. The app should surface RPC errors without converting them into token-risk conclusions.

## Token Program Support

M1 recognizes the legacy SPL Token Program and Token-2022. Unknown account owners are reported as unsupported rather than forced into a token interpretation.
