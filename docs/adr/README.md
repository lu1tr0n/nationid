# Architecture Decision Records

This directory captures the architectural decisions that shape `nationid`'s
public API and per-country algorithm choices. Each record is dated, numbered,
and immutable once accepted: the way a decision is changed is by writing a new
ADR that supersedes the old one, not by editing the old one.

## When to write an ADR

Open an ADR when a change meets any of these criteria:

- It alters the public API surface in `src/index.ts`, `src/core/types.ts`, or
  any country bundle export.
- It introduces or revisits a country-specific algorithm whose authoritative
  source is contested (multiple references disagree, or no first-party spec
  exists).
- It changes a default that downstream consumers will observe (return shape,
  thrown vs. returned errors, regex strictness).
- It records a deliberate divergence from a reference library that is not
  already covered by `docs/CROSS_VALIDATION.md`.

A decision that is purely internal refactoring or test plumbing does not need
an ADR.

## Format

ADRs follow the [MADR 4.0](https://adr.github.io/madr/) short template:
context, considered options, decision outcome with consequences, and links to
the source files that implement the decision.

## Status legend

| Status | Meaning |
|--------|---------|
| Proposed | Open for discussion. Not yet reflected in code. |
| Accepted | Decision is in effect and reflected in the current `main`. |
| Deprecated | No longer recommended; kept for historical context. |
| Superseded by ADR-NNNN | Replaced by a later record; cross-link. |

## Index

| ID | Title | Status | Tags |
|----|-------|--------|------|
| [ADR-0001](./0001-validate-accepts-formatted-input.md) | `validate()` accepts formatted and normalized input transparently | Accepted | api, ergonomics |
| [ADR-0002](./0002-parse-discriminated-union-no-exceptions.md) | `parse()` returns a discriminated union; the public API does not throw on input | Accepted | api, error-handling |
| [ADR-0003](./0003-low-confidence-format-only-no-warning.md) | Low-confidence specs validate format only; runtime warnings are rejected | Accepted | api, observability |
| [ADR-0004](./0004-br-cnpj-alphanumeric-transition.md) | BR_CNPJ alphanumeric transition policy (IN RFB 2.229/2024) | Accepted | country-br, breaking-change-policy |
| [ADR-0005](./0005-mx-curp-enie-policy.md) | MX_CURP `Ñ` handling: accept both `Ñ` and `X` substitutions | Accepted | country-mx, validation |
| [ADR-0006](./0006-mx-rfc-forbidden-prefix-policy.md) | MX_RFC palabras altisonantes: reject without auto-substitution | Accepted | country-mx, validation |

## Authoring a new ADR

1. Copy the template structure from any existing record.
2. Use the next available 4-digit number (zero-padded).
3. Set `Status: Proposed` and open a PR.
4. Once merged, flip the status to `Accepted` in a follow-up PR.
5. If the new ADR replaces an old one, change the old record's status to
   `Superseded by ADR-NNNN` and add a back-link.
