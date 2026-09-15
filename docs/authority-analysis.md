# Authority Analysis

Authority analysis turns parsed mint authority observations into factual, human-readable intelligence.

## Legacy SPL Token

For legacy SPL Token mints, the tool inspects the standard mint authority and freeze authority exposed by parsed mint data.

- Active mint authority: this authority can create additional token supply.
- Revoked mint authority: additional supply cannot be minted through the standard mint authority.
- Active freeze authority: this authority can freeze token accounts under standard token program rules.
- Revoked freeze authority: token accounts cannot be frozen through the standard freeze authority.

These observations do not prove intent.

## Token-2022

Token-2022 is identified separately from the legacy SPL Token Program. Standard mint authority and freeze authority are still inspected, but they are not the full authority story.

Token-2022 extensions can add specialized state to mint or token accounts. Some extensions can introduce additional authority or control surfaces that are not represented by ordinary mint authority and freeze authority fields.

XGEN Token Intel reports parsed Token-2022 extension authority fields when standard RPC exposes them. Extension surfaces that are not parsed must be read as uninspected, not absent.

Authority-bearing or control-relevant Token-2022 extension surfaces tracked for observation include:

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

If a Token-2022 mint has revoked standard mint and freeze authorities, the report still displays an explicit limitation explaining that extensions may expose additional authority/control surfaces.

## Non-Goals

Authority analysis does not implement concentration analysis, market data, liquidity analysis, LP analysis, metadata/social scoring, trading, wallet connectivity, transaction signing, blockchain writes, or scam/safety verdicts.
