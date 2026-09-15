# Release Security Notes

This document records release-specific security review decisions for XGEN Token Intel application `v0.1.0`.

## Version Scope

- Application version: `0.1.0`
- XGEN Intel Score methodology version: `1.0.0`
- Direct Solana dependency reviewed: `@solana/web3.js@1.98.4`
- Relevant transitive JSON-RPC dependency reviewed: `jayson@4.3.0`

This acceptance applies only to the dependency graph and application execution paths reviewed for application `v0.1.0`. It does not apply automatically to future releases.

## Accepted Advisories

The following advisories are accepted for application `v0.1.0` based on application-specific reachability analysis. This does not claim the dependencies are generally safe.

| Advisory | Package | Severity at review | Dependency path | Reviewed version |
| --- | --- | --- | --- | --- |
| `GHSA-w5hq-g745-h8pq` | `uuid` | Moderate | `@solana/web3.js -> jayson -> uuid` | `uuid@8.3.2` |
| `GHSA-528h-pc64-c93x` | `stream-json` | Moderate | `@solana/web3.js -> jayson -> stream-json` | `stream-json@1.9.1` |

## Application-Specific Reachability Findings

### `uuid` Advisory

The reviewed advisory concerns missing buffer bounds checks in `uuid` v3/v5/v6 when a caller-provided buffer is used.

In the reviewed dependency graph, `jayson@4.3.0` uses `uuid.v4()` for JSON-RPC request ID generation. XGEN Token Intel does not call `uuid` directly and does not provide caller-controlled buffers to `uuid` v3/v5/v6 through the current execution path.

Application-specific classification for `v0.1.0`: not reached by the reviewed XGEN Token Intel execution path.

### `stream-json` Advisory

The reviewed advisory concerns algorithmic denial of service in `stream-json` pick/ignore/filter/replace filters on crafted nested JSON.

`@solana/web3.js@1.98.4` imports `jayson/lib/client/browser` for JSON-RPC client behavior. The reviewed client path uses ordinary JSON serialization/parsing and request ID generation. The `stream-json` dependency is present through `jayson`, but the reviewed XGEN Token Intel read-only Solana RPC path does not use `jayson` stream/server parsing utilities that import `stream-json`.

Application-specific classification for `v0.1.0`: not reached by the reviewed XGEN Token Intel execution path.

## Why Forced Overrides Were Rejected

Forced `pnpm` overrides were rejected for this release because patched versions are outside the parent dependency constraints declared by `jayson@4.3.0`:

- `jayson@4.3.0` declares `uuid: ^8.3.2`, while the advisory patched range is `>=11.1.1`.
- `jayson@4.3.0` declares `stream-json: ^1.9.1`, while the advisory patched range is `>=3.4.1`.

Overriding these transitive dependencies would force major-version combinations not declared by the parent package. That could introduce compatibility risk solely to produce a green audit, without evidence that the vulnerable functionality is reached by XGEN Token Intel `v0.1.0`.

## Reevaluation Triggers

This acceptance must be reevaluated if any of the following change:

- `@solana/web3.js` version
- `jayson` version
- `uuid` version
- `stream-json` version
- Solana RPC architecture or client implementation
- XGEN Token Intel begins using different JSON-RPC transports or server/stream parsing paths
- Any vulnerable functionality becomes reachable by application inputs or provider responses
- Advisory severity, affected range, patched range, or exploit details change
- Application version advances beyond `0.1.0`

If a future compatible upstream dependency update removes these advisories without changing application behavior or methodology, it should be evaluated during a separate release-readiness review.
