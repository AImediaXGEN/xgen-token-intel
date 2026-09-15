# Milestone History

This file records development milestones. It is historical project context, not the primary public product specification. Public behavior is documented in `README.md` and the current technical docs.

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
- Resolve owners for returned token accounts where parsed RPC data supports it.
- Distinguish token accounts from owner wallets and program-owned accounts.

## M4 - Transparent Scoring Engine

- Add documented scoring adjustments.
- Ensure every score delta maps to a visible condition.
- Freeze XGEN Intel Score methodology `1.0.0`.

## M5 - Polished XGEN UI

- Improve report layout, empty states, accessibility, and mobile behavior.

## M6 - Adversarial/Data-Accuracy Testing + Hardening

- Add fixtures for invalid addresses, unsupported accounts, unusual authority states, Token-2022 limitations, and concentration edge cases.
- Preserve `score: null` semantics for unscored results.
- Harden RPC error sanitization.

## M7 - Public Release Readiness

- Prepare public README and documentation.
- Audit secret history and local artifacts.
- Verify reproducible install/test/build from tracked artifacts only.
- Do not create/push GitHub repository until separate human authorization.
