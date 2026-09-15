# XGEN Intel Score Methodology

The XGEN Intel Score is a deterministic summary of documented observable characteristics. It is not a verdict, assurance, endorsement, trading signal, safety label, scam classification, or claim about intent.

Application version and scoring methodology version are independent.

- Application version: `0.1.0`
- Methodology version: `1.0.0`

Methodology `1.0.0` starts every analyzable result at `100 / 100` and applies only explicit deductions. Every deduction is returned in the API response with a rule id, category, point value, condition, explanation, and evidence source.

Missing or unsupported data reduces `analysisCoverage`; it is not automatically deducted from the score.

A high XGEN Intel Score means few risk characteristics were observed within the successfully analyzed surfaces. It does not mean unobserved risk does not exist.

## Score Bands

- `95-100`: Few observed risk characteristics.
- `85-94`: Some observed risk characteristics.
- `60-84`: Elevated observed risk characteristics.
- `0-59`: High observed risk characteristics.

## Authority Rules

| Rule | Condition | Deduction | Why it matters |
| --- | --- | ---: | --- |
| `AUTH_MINT_ACTIVE` | Standard mint authority is active | 20 | The standard mint authority can create additional token supply. |
| `AUTH_FREEZE_ACTIVE` | Standard freeze authority is active | 10 | The standard freeze authority can freeze token accounts under standard token program rules. |

Revoked standard authorities do not create positive score bonuses. Methodology `1.0.0` is a deduction model.

## Concentration Rules

Concentration scoring uses resolved-owner concentration only when owner-resolution quality is sufficient. Token-account concentration is displayed, but it is not scored because token accounts are not the same as unique owners or real-world entities.

Top-5 resolved-owner concentration bands:

| Top-5 resolved-owner supply share | Deduction |
| --- | ---: |
| `0 <= x < 20` | 0 |
| `20 <= x < 40` | 5 |
| `40 <= x < 60` | 10 |
| `60 <= x < 80` | 15 |
| `80 <= x` | 20 |

Additional broader concentration rule:

| Rule | Condition | Deduction |
| --- | --- | ---: |
| `CONC_RESOLVED_OWNER_TOP10_EXTREME` | Top-10 resolved owners represent at least 90% of supply and exceed Top-5 concentration by at least 10 percentage points | 5 |

Top-20 concentration remains displayed intelligence only in methodology `1.0.0`; it is not score-bearing.

## Analysis Coverage

`analysisCoverage` is separate from `score`.

Coverage can be:

- `complete`: core authority and concentration surfaces were analyzed.
- `partial`: useful intelligence is present, but at least one relevant limitation remains.
- `limited`: one or more intended analysis surfaces could not be inspected reliably.

Examples of coverage limitations:

- no supported mint data;
- authority analysis unavailable;
- resolved-owner concentration unavailable or below the disclosure threshold;
- zero supply makes concentration percentages unavailable;
- Token-2022 extension authority analysis is not comprehensive.

`100 + LIMITED` does not communicate the same analytical completeness as `100 + COMPLETE`.

## UNSCORED Results

`score: null` means no valid XGEN Intel Score was produced. It does not mean score `0`, safe, unsafe, positive evidence, or negative evidence.

## Token-2022 Handling

XGEN Token Intel identifies Token-2022 mints and scores only observed standard mint and freeze authority fields that are available through the current parsed RPC stack. Token-2022 extension authority surfaces are treated as coverage limitations unless they are explicitly parsed and documented.

Revoked standard mint and freeze authorities must not be interpreted as comprehensive low authority risk for Token-2022 tokens.

## Methodology Versioning

Methodology `1.0.0` is frozen for application release `0.1.0`. Future scoring changes must use a new methodology version and must not silently alter the rules, thresholds, or deductions documented for `1.0.0`.
