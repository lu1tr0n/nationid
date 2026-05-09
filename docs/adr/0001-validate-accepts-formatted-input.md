# ADR-0001: `validate()` accepts formatted and normalized input transparently

- **Status**: Accepted
- **Date**: 2026-05-09
- **Deciders**: maintainers (initial v0.1 cohort)
- **Tags**: api, ergonomics, normalization

## Context and Problem Statement

National ID and tax document numbers are routinely written with separators:
`529.982.247-25` (BR_CPF), `04567890-3` (SV_DUI), `11.222.333/0001-81`
(BR_CNPJ). Users paste these strings from cards, PDFs, government portals, and
form fields. Downstream form code rarely strips separators correctly before
calling a validator, and validators that demand a single canonical input shape
push that responsibility back onto every caller.

The library must decide whether `validate(code, input)` requires the caller to
pre-normalize, or whether it normalizes internally. The decision affects both
the ergonomics of the most common call site (a form `onChange` handler) and
the contract of `normalize()` itself, which must be idempotent for the
internal call to be safe.

A related concern is performance. Calling `normalize()` inside every
`validate()` adds one regex pass per call. For the inputs we care about
(<= 18 characters), this is negligible.

## Considered Options

1. **Strict** — `validate()` accepts only the normalized form. Callers must
   call `normalize()` first.
2. **Transparent** — `validate()` calls `normalize()` internally. Either input
   shape is accepted.
3. **Two functions** — `validate(input)` strict and `validateLoose(input)`
   forgiving.

## Decision Outcome

Chosen option: **Transparent**, because the dominant use case is form
validation against user-pasted input. Forcing every caller to remember to
normalize first is a footgun that produces silent false negatives when the
caller forgets. The cost (one regex pass per call) is bounded; the
correctness benefit is unbounded.

`normalize()` is documented as idempotent in `core/types.ts:140-141`, and
property test P1 (see `docs/PROPERTY_TESTS.md`) asserts that
`normalize(normalize(x)) === normalize(x)` for every registered code. That
property is what makes the internal call safe.

### Consequences

- One uniform call: `validate('BR_CPF', '529.982.247-25')` and
  `validate('BR_CPF', '52998224725')` both return the same boolean.
- The contract for new specs is precise: `normalize()` must be idempotent and
  must not depend on `validate()`. The property suite enforces this.
- Marginal CPU cost per call (one regex pass over a short string). Measured
  bundle/runtime impact is below any meaningful threshold.
- Callers that *want* strict mode (reject pre-formatted input) cannot
  express it through the public API. They must compare
  `input === normalize(code, input)` themselves.
- A future v0.2+ may add an opt-in `strict: true` option to `validate()` if a
  documented use case appears. None has surfaced as of v0.1.

## More info

- Public contract: `src/core/types.ts:138-145`
- Root entry point: `src/index.ts:105-107`
- Reference implementation: `src/countries/sv/dui.ts:41-45`
- Idempotence property: `docs/PROPERTY_TESTS.md` (P1, 100 trials × 34 specs)
- Original ADR seed: `nationid-research/ARCHITECTURE.md` §10 ADR-002
