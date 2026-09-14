# Transparent XGEN Intel Score

The XGEN Intel Score is a deterministic summary of documented observable characteristics. It is not a verdict, assurance, endorsement, trading signal, or claim about intent.

## M4 Methodology

Methodology version: `1.0.0`

M4 starts every analyzable result at `100 / 100` and applies only explicit deductions. Every deduction is returned in the API response with a rule id, category, point value, condition, explanation, and evidence source.

Missing or unsupported data reduces `analysisCoverage`; it is not automatically deducted from the score.

A high XGEN Intel Score means few risk characteristics were observed within the successfully analyzed surfaces. It does not mean unobserved risk does not exist.

## Score Bands

- `95-100`: Few observed risk characteristics.
- `85-94`: Some observed risk characteristics.
- `60-84`: Elevated observed risk characteristics.
- `0-59`: High observed risk characteristics.

The band describes observed characteristics only. It must not be read as a safety label or scam classification.

## Authority Rules

| Rule | Condition | Deduction | Why it matters |
| --- | --- | ---: | --- |
| `AUTH_MINT_ACTIVE` | Standard mint authority is active | 20 | The standard mint authority can create additional token supply. |
| `AUTH_FREEZE_ACTIVE` | Standard freeze authority is active | 10 | The standard freeze authority can freeze token accounts under standard token program rules. |

Revoked standard authorities do not create positive score bonuses. M4 avoids reward points so the score remains a transparent deduction model.

## Concentration Rules

Concentration scoring uses resolved-owner concentration only when M3 owner-resolution quality is sufficient. Token-account concentration is displayed, but it is not scored because token accounts are not the same as unique owners or real-world entities.

Top-5 resolved-owner concentration bands:

| Top-5 resolved-owner supply share | Deduction |
| --- | ---: |
| Less than 20% | 0 |
| 20% to less than 40% | 5 |
| 40% to less than 60% | 10 |
| 60% to less than 80% | 15 |
| 80% or higher | 20 |

Additional broader concentration rule:

| Rule | Condition | Deduction |
| --- | --- | ---: |
| `CONC_RESOLVED_OWNER_TOP10_EXTREME` | Top-10 resolved owners represent at least 90% of supply and exceed top-5 concentration by at least 10 percentage points | 5 |

## Analysis Coverage

`analysisCoverage` is separate from `score`.

Coverage can be:

- `complete`: intended M4 authority and resolved-owner concentration surfaces were inspected with no coverage limitations.
- `partial`: core evidence is present, but at least one relevant limitation remains.
- `limited`: one or more intended analysis surfaces could not be inspected reliably.

Examples of coverage limitations:

- no supported mint data;
- authority analysis unavailable;
- resolved-owner concentration unavailable or below the M3 disclosure threshold;
- zero supply makes concentration percentages unavailable;
- Token-2022 extension authority analysis is not comprehensive.

## Token-2022 Handling

M4 identifies Token-2022 mints and scores only observed standard mint and freeze authority fields that are available through the current parsed RPC stack. Token-2022 extension authority surfaces are treated as coverage limitations unless they are explicitly parsed and documented.

M4 does not silently treat revoked standard mint and freeze authorities as comprehensive low authority risk for Token-2022 tokens.


## Methodology Versioning

Methodology `1.0.0` is frozen at the M4 checkpoint. Future scoring changes must use a new methodology version and must not silently alter the rules, thresholds, or deductions documented for `1.0.0`.

Top-20 concentration remains displayed intelligence only in methodology `1.0.0`; it is not score-bearing.
