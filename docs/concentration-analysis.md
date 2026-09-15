# Concentration Intelligence

Concentration intelligence is read-only Solana token analysis that avoids treating token accounts as unique people or verified owner identities.

## RPC Methodology

For supported parsed mints, the application calls:

- `getTokenLargestAccounts` for the largest token accounts for the mint.
- `getMultipleParsedAccounts` for those token accounts to resolve each token account owner when parsed RPC data is available and the parsed account mint matches the requested mint.

Both calls are read-only RPC calls.

## Token-Account Concentration

Token-account concentration uses the raw balances returned by `getTokenLargestAccounts` and the current mint supply as the denominator.

The application calculates:

- Top-5 token accounts
- Top-10 token accounts
- Top-20 token accounts

These metrics are labeled as token-account concentration. They are not a holder-identity ranking.

## Resolved-Owner Concentration

When token-account owners are reliably resolved, the application aggregates multiple token accounts belonging to the same owner address.

Resolved-owner concentration is calculated only when resolution quality is defensible under the XGEN Token Intel disclosure policy:

- complete owner resolution; or
- partial owner resolution where at least 80% of sampled accounts and 80% of sampled balance are resolved.

The 80% / 80% threshold is an application disclosure policy. It is not a Solana protocol standard and not a universal definition of reliable ownership analysis.

Resolved owner addresses are blockchain owners, not verified people or entities.

## Resolution Quality

The report includes:

- accounts inspected
- accounts resolved
- accounts unresolved
- sampled raw balance
- percent of current supply represented by the sampled accounts
- percent of sampled accounts resolved
- percent of sampled balance resolved

Quality values:

- `complete`: every sampled token account resolved to an owner address.
- `partial`: at least one sampled token account resolved, but not all.
- `unavailable`: no sampled token account owners were resolved.

## Zero Supply

When current raw mint supply is zero, the application returns `zero-supply` concentration status and does not calculate concentration percentages. Zero supply cannot produce meaningful supply-share percentages because the denominator is zero.

## Precision

All concentration calculations use raw integer token amounts and `BigInt`. UI amounts are displayed only as RPC-provided context and are not used for percentage math.

## Score Relationship

Resolved-owner concentration can affect the XGEN Intel Score only when resolution quality is sufficient. Token-account concentration and Top-20 concentration are displayed intelligence only in methodology `1.0.0`.

## Limitations

- `getTokenLargestAccounts` returns at most the largest token accounts, not every holder.
- Multiple token accounts may belong to one owner.
- A resolved owner address does not prove real-world identity.
- Program-controlled accounts may not represent individual users.
- Liquidity pools, treasuries, exchanges, custodians, burn accounts, vesting contracts/programs, bridges, and similar accounts may distort naive holder-concentration interpretations.
- The application does not identify or guess those entities.
- Unknown remains unknown.
