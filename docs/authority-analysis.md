# M2 Authority Analysis

M2 turns M1 authority observations into a factual authority intelligence layer.

## Legacy SPL Token

M2 inspects the standard mint authority and freeze authority exposed by parsed mint data.

- Active mint authority: this authority can create additional token supply.
- Revoked mint authority: additional supply cannot be minted through the standard mint authority.
- Active freeze authority: this authority can freeze token accounts under standard token program rules.
- Revoked freeze authority: token accounts cannot be frozen through the standard freeze authority.

These observations do not prove intent. They are observable control characteristics.

## Token-2022

Token-2022 is identified separately from the legacy SPL Token Program. Standard mint authority and freeze authority are still inspected, but they are not the full authority story.

Solana documentation describes Token-2022 as an extension model. Extensions can add specialized state to mint or token accounts, and that extension state must be deserialized separately from the base mint fields.

M2 inventories authority-bearing Token-2022 mint extension surfaces and reports parsed extension authority fields when standard RPC exposes them, otherwise marks the surface as not parsed by M2. M2 does not claim comprehensive Token-2022 authority coverage.

Authority-bearing or control-relevant extension surfaces tracked in M2:

- Transfer fee configuration
- Mint close authority
- Permanent delegate
- Transfer hook
- Metadata pointer
- Token metadata
- Group pointer
- Token group
- Group member pointer
- Token group member
- Interest-bearing configuration
- Scaled UI amount configuration
- Pausable configuration
- Permissioned burn configuration
- Confidential transfer mint
- Confidential mint/burn

If a Token-2022 mint has revoked standard mint and freeze authorities, M2 still displays an explicit limitation explaining that extensions may expose additional authority/control surfaces. Extension surfaces that are not parsed by M2 must be read as uninspected, not absent.

## Non-Goals

M2 does not implement concentration analysis, market data, liquidity analysis, LP analysis, metadata/social scoring, trading, wallet connectivity, transaction signing, or blockchain writes.
