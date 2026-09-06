# Milestone Plan

## M1 - Project Foundation + Read-Only Mint Inspection

- Initialize standalone project.
- Add architecture and schema documentation.
- Add read-only Solana RPC boundary.
- Validate mint address input.
- Identify token program.
- Inspect decimals, supply, mint authority, and freeze authority when standard parsed RPC data is available.
- Add initial tests.

## M2 - Authority Analysis

- Convert observed mint and freeze authority fields into documented risk signals.
- Add tests for revoked and active authority cases.

## M3 - Token-Account Concentration Analysis

- Use `getTokenLargestAccounts` with careful labeling.
- Optionally resolve owners for returned token accounts.
- Distinguish token accounts from owner wallets and program-owned accounts.

## M4 - Transparent Scoring Engine

- Add documented scoring adjustments.
- Ensure every score delta maps to a visible condition.

## M5 - Polished XGEN UI

- Improve report layout, empty states, accessibility, and mobile behavior.

## M6 - Adversarial/Data-Accuracy Testing + Documentation

- Add fixtures for invalid addresses, unsupported accounts, unusual decimals, active authorities, revoked authorities, and concentration edge cases.
- Document interpretation limits.

## M7 - Public GitHub Release

- Prepare public README, license, contribution notes, and release checklist.
- Create/push GitHub repository only after human review.
