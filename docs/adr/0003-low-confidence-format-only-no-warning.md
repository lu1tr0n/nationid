# ADR-0003: Low-confidence specs validate format only; runtime warnings are rejected

- **Status**: Accepted
- **Date**: 2026-05-09
- **Deciders**: maintainers (initial v0.1 cohort)
- **Tags**: api, observability, confidence

## Context and Problem Statement

Not every supported document has a publicly verifiable check-digit algorithm.
PE_DNI's printed 8-digit form has no checksum on the card; HN_DNI's verifier
formula is not published by RNP; SV_NIT's algorithm was reverse-engineered
from community sources. The library models this through the `Confidence`
type (`src/core/types.ts:82-90`):

| Value | Meaning |
|-------|---------|
| `high` | Official source AND mature library agree. |
| `moderate` | One side agrees; the other is missing. |
| `low` | Only community / reverse-engineered source. Format-only validation. |
| `unconfirmed` | Format checked but no algorithm verified. Format-only validation. |

The original architecture seed (ARCHITECTURE.md §10 ADR-003) proposed that
`validate()` emit a once-per-process `console.warn` for `low`-confidence
specs so that downstream developers would know the validation was
format-only. The proposal was reconsidered during implementation.

The competing concern is observability hygiene. A `console.warn` emitted
once per process is:

- Noise in CI test output, indistinguishable from third-party warnings.
- Invisible in serverless / worker environments where stdout is captured by
  the platform, not the developer.
- Untargetable by consumers who want to route the signal somewhere specific
  (Sentry breadcrumb, structured logger, internal telemetry).
- Inconsistent with the "no side effects" expectation for a pure validator.

## Considered Options

1. **Warn once at runtime** — emit `console.warn` the first time a
   `low`/`unconfirmed` spec is invoked.
2. **Surface confidence as data** — expose the `confidence` field on every
   `DocumentSpec` and on every successful `ParseResult`, and let consumers
   decide whether to warn, log, or ignore.
3. **Refuse to ship low-confidence specs** — only register specs that pass a
   `moderate`-or-better bar.

## Decision Outcome

Chosen option: **Surface confidence as data**, because it composes with any
observability backend the consumer already runs and avoids the side-effect
trap. The `confidence` field is exposed on:

- `DocumentSpec.confidence` — readable via `getSpec(code).confidence`
  (`src/core/types.ts:137`).
- `ParseResult.confidence` on the success branch (`src/core/types.ts:99-104`).

Option 1 was rejected because warnings emitted from a library are routinely
ignored, suppressed, or buried, and they cannot be routed through the
consumer's existing telemetry without intercepting `console`. Option 3 was
rejected because format-only validation for documents like PE_DNI and HN_DNI
is *better than nothing* and ruling it out would push consumers to copy-paste
inline regexes that nobody reviews.

`validate()` performs format-only matching when `hasCheckDigit === false`
(see PE_DNI implementation at `src/countries/pe/dni.ts:44-47`). When
`hasCheckDigit === true`, it always runs the checksum regardless of the
confidence label — a `moderate` spec like SV_DUI runs its mod-10 check
(`src/countries/sv/dui.ts:79-88`) and the `confidence` flag is purely
metadata for the consumer.

### Consequences

- Consumers who never read `confidence` will trust low-confidence
  validation without knowing it is format-only. This is the main downside
  of Option 2 vs. Option 1.
- The downside is mitigated by per-spec JSDoc, the per-country pages under
  `docs/countries/`, and the README comparison table — but documentation
  reach is not 100%.
- UI authors get a clean integration: render a discreet "format only"
  badge when `spec.confidence === 'low' || 'unconfirmed'`.
- The `confidence` flag is observable from `parse()` results, so analytics
  pipelines can bucket validations by confidence level without any
  console-warning plumbing.
- The set of confidence labels is part of the public type contract.
  Tightening or relaxing the rubric in the future requires either a major
  bump or an additive new label (e.g. a separate `community` tier).

## More info

- Confidence type: `src/core/types.ts:82-90`
- Confidence on spec: `src/core/types.ts:137`
- Confidence on parse result: `src/core/types.ts:99-104`
- Format-only example: `src/countries/pe/dni.ts:38-47`
- Confidence rubric audit: `docs/CODE_REVIEW_2026_05_08.md` (F-6, F-8)
- Original ADR seed (rejected proposal): `nationid-research/ARCHITECTURE.md` §10 ADR-003
