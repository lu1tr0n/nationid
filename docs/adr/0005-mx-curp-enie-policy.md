# ADR-0005: MX_CURP `Ñ` handling — accept both `Ñ` and `X` substitutions

- **Status**: Accepted
- **Date**: 2026-05-09
- **Deciders**: maintainers (initial v0.1 cohort)
- **Tags**: country-mx, validation, character-set

## Context and Problem Statement

Mexican surnames containing `Ñ` ("Núñez", "Peña", "Muñoz", "Ibáñez") have a
documented history of inconsistent handling inside CURPs. Two issuance
practices coexist in the wild:

1. **Modern RENAPO normalization** — `Ñ` in surnames is replaced with `X`
   *before* the 17-character body is hashed. The resulting CURP contains no
   `Ñ` and the DV is computed against the `X`-substituted body.
2. **Legacy literal `Ñ`** — pre-normalization CURPs that contain a literal
   `Ñ` in the consonant block, with the DV computed against the literal
   form.

Both forms are circulated in active databases. The RENAPO 37-character
alphabet (`0..9 A..N Ñ O..Z`, see `src/countries/mx/shared.ts:92`) assigns
`Ñ` index 24, so the same algorithm can compute a valid DV over either form
— provided the input the validator receives matches the form used at
issuance.

The decision is whether `nationid` should:

- Accept literal `Ñ` and not remap it (validation matches whichever form was
  issued).
- Silently substitute `Ñ → X` during normalization (always validate against
  the modern form).
- Add a strict mode that rejects literal `Ñ` outright.

## Considered Options

1. **Accept both** — `normalize()` does not remap `Ñ`. The validator
   succeeds on whichever form the issuer used.
2. **Always substitute `Ñ → X`** — `normalize()` rewrites `Ñ` to `X`. Legacy
   CURPs whose DV was computed against the literal `Ñ` will fail validation.
3. **Reject literal `Ñ`** — strict mode. Force callers to deal with legacy
   data themselves.

## Decision Outcome

Chosen option: **Accept both**, because it is the only option that
validates legitimate CURPs from both issuance eras without silently
falsifying historical records. The CURP_ALPHABET table (`src/countries/mx/shared.ts:84-92`)
already assigns `Ñ` a stable index, so the algorithm computes correctly
against either form. `normalize()` (`src/countries/mx/curp.ts:96-98`)
strips non-alphanumeric characters and uppercases — it does not remap `Ñ`.

This choice agrees with `python-stdnum.stdnum.mx.curp` v2.2 on 100% of
synthetic vectors (40 valid + 40 invalid; see `docs/CROSS_VALIDATION.md`,
"Second-pass agreement matrix" row `MX_CURP`).

The rejected options would create real-world false negatives. Option 2
would cause every legacy `Ñ`-bearing CURP whose DV was issued against `Ñ`
to fail. Option 3 would push the same problem to every consumer who has a
CURP corpus older than the modern normalization era.

### Consequences

- Both literal-`Ñ` and `X`-substituted CURPs validate, matching the
  algorithm's behavior on either input.
- A "strict modern issuance" downstream consumer cannot express
  `reject literal Ñ` through the public API. v0.1 does not expose a
  strictness option. A future v0.2+ may add `{ strictModernIssuance: true }`
  if a real use case appears.
- Locale-aware comparison code in downstream apps must continue to
  treat `Ñ` and `X` as distinct characters when the storage CURP is
  rendered — accepting both in *validation* does not normalize them in
  *storage*. The original character that was issued is the one that
  is persisted.
- The decision is a small API-surface bet against a future RENAPO
  policy that retires literal `Ñ` entirely. If RENAPO publishes such a
  policy and provides a migration path, a follow-up ADR will revisit
  this record.

## More info

- CURP alphabet table: `src/countries/mx/shared.ts:82-92`
- DV computation: `src/countries/mx/shared.ts:108-118`
- Spec normalization (preserves `Ñ`): `src/countries/mx/curp.ts:96-98`
- Spec validation: `src/countries/mx/curp.ts:115-123`
- JSDoc commentary: `src/countries/mx/curp.ts:27-32`
- Cross-validation outcome: `docs/CROSS_VALIDATION.md` (MX_CURP row, second-pass)
- RENAPO Acuerdo: SEGOB DOF 18-OCT-2014.
