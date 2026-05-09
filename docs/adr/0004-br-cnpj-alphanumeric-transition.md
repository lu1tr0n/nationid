# ADR-0004: BR_CNPJ alphanumeric transition policy (IN RFB 2.229/2024)

- **Status**: Accepted
- **Date**: 2026-05-09
- **Deciders**: maintainers (initial v0.1 cohort)
- **Tags**: country-br, breaking-change-policy, validation

## Context and Problem Statement

Receita Federal do Brasil's Instrução Normativa RFB nº 2.229/2024 (DOU
16-DEZ-2024) restructures the CNPJ format. Beginning **1 July 2026**, newly
issued CNPJs may include uppercase letters in positions 1-8 (the
identification root) and positions 9-12 (the branch / "ordem"). The two
check-digit positions (13-14) remain numeric. Legacy purely-numeric CNPJs
issued before the transition remain valid forever — no reissuance.

The check-digit algorithm published by RFB is unchanged in shape: weights
`[5,4,3,2,9,8,7,6,5,4,3,2]` for DV1 and `[6,5,4,3,2,9,8,7,6,5,4,3,2]` for
DV2, mod-11, with `r < 2 → DV = 0` else `DV = 11 − r`. The only adjustment
for alphanumeric inputs is the character → numeric value mapping: digits
keep their face value, letters use ASCII code minus 48 (so `'A' = 17`,
`'B' = 18`, …, `'Z' = 42`).

`nationid` v0.1 ships entering this transition window. Two questions arise:

1. Does v0.1 ship alphanumeric support up front, or defer it?
2. When alphanumeric ships, does it land as a breaking change or as a
   transparent additive feature?

The current implementation ships **legacy numeric only** — `RAW_REGEX` at
`src/countries/br/cnpj.ts:32` is `/^\d{14}$/` and the file carries an
explicit `TODO ADR-001 alfanumérico` (line 19) deferring the work.

## Considered Options

1. **Ship alphanumeric in v0.1** — implement the dual-format detector now,
   even though no real alphanumeric CNPJs exist before July 2026.
2. **Defer to a v0.x.y minor release before 2026-07-01** — keep v0.1 numeric
   only; add alphanumeric as an additive minor that does not change the
   numeric path.
3. **Wait for community demand** — defer until users report a real
   alphanumeric CNPJ.

## Decision Outcome

Chosen option: **Defer to a v0.x.y minor release before 2026-07-01**, with a
hard deadline tied to the RFB issuance start date.

Rationale:

- v0.1 ships ahead of the RFB issuance window. Implementing the
  alphanumeric path now means shipping code that is impossible to test
  against any real-world CNPJ until the RFB starts issuing them. We have
  the algorithm spec but not the issuer fixtures.
- The alphanumeric path is *additive*: legacy numeric CNPJs continue to
  validate under the existing code, and the new path triggers only when a
  letter appears in positions 0-11. Adding it as a minor release does not
  break any existing call site.
- Option 3 (wait for demand) is incompatible with the policy that
  `nationid` consumers should not have to bump major versions or add
  ad-hoc preprocessing to accept newly issued CNPJs.

When the alphanumeric path lands, the implementation will:

1. Detect alphanumeric inputs by the presence of any `[A-Z]` character in
   positions 0-11 of the normalized form.
2. For purely numeric inputs, run the existing
   `checkDigitsCNPJ` path (`src/countries/br/cnpj.ts:105-111`) unchanged.
3. For alphanumeric inputs, run a sibling DV computation that uses the
   same weight vectors but maps each character `c` to `c >= '0' && c <= '9'
   ? c - 48 : c - 48` (which folds to `c.charCodeAt(0) - 48` for both
   digits and uppercase letters per the RFB-published mapping).
4. Both paths feed into the same DV positions (13-14), which remain
   numeric.
5. Confidence stays at `high` because both algorithms are RFB-published.
6. Test fixtures: synthetic vectors generated from the RFB formula until
   real alphanumeric CNPJs are obtainable from a public Receita test set.

### Consequences

- v0.1 callers in BR who feed alphanumeric CNPJs (impossible before
  2026-07-01, possible after) will see them rejected as
  `invalid_format` — a hard failure, not a silent pass. This is the
  correct behavior given the v0.1 scope.
- Marcly and other early consumers must bump to the alphanumeric-aware
  minor release before 2026-07-01 if they want to accept new CNPJs.
  The release will be flagged as `breaking-change: false` because no
  existing valid input changes outcome.
- The `BR_CNPJ` confidence label remains `high`. Downgrading to
  `moderate` solely because of pending alphanumeric support would
  mislead consumers about the trustworthiness of the numeric path,
  which is fully RFB-verified.
- Maintenance of two DV paths means the test suite must guard against
  regressions in *both* — synthetic alphanumeric vectors must be
  cross-validated against `python-stdnum.stdnum.br.cnpj` (which already
  ships the RFB-published mapping) once that dependency is added.
- The `cpf-cnpj-validator` and `@brazilian-utils/brazilian-utils`
  reference libraries used in `docs/CROSS_VALIDATION.md` may lag the
  alphanumeric rollout; cross-validation for the alphanumeric path may
  rely on `python-stdnum` alone for an interim period.

## More info

- Current implementation (numeric only): `src/countries/br/cnpj.ts:32-91`
- Deferred-work marker: `src/countries/br/cnpj.ts:19-23`
- Cross-validation status: `docs/CROSS_VALIDATION.md` (BR_CNPJ row,
  numeric-only first-pass agreement)
- Original ADR seed: `nationid-research/ARCHITECTURE.md` §10 ADR-001
- IN RFB 2.229/2024: <https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj>
