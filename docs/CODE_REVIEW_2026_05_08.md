# Code Review — 9 New Country Implementations

**Date**: 2026-05-08
**Reviewer**: Senior code review pass (3rd-bug hunt)
**Scope**: `src/countries/{mx,co,pe,do,gt,hn,cr,es,us}/**`
**Reference**: `src/core/types.ts`, `docs/STYLE_GUIDE.md`,
`nationid-research/countries-comprehensive-tier{1,2}.md`,
`docs/CROSS_VALIDATION.md` (B1, B2 post-mortems)
**Reference impls**: `src/countries/{sv,br,cl,ar}/**`

This pass found **22 findings**: 1 BLOCKER, 4 BUG, 14 QUALITY, 3 NIT.

The most important new finding is **F-1 (BLOCKER)** — `CountryDocumentBundle`
contract violation in 4 country bundles (US, CO, GT, HN) where specs are
placed in arrays whose advertised scope does not match the spec's `scope`
field. This is a public type-contract issue, not just a data issue.

The most-likely-to-be-the-3rd-bug findings are F-2 / F-3 — algorithm
correctness concerns where a discrepancy with the published research file
or a published reference implementation is observable.

---

## 1. BLOCKERS

### F-1 [BLOCKER] — `CountryDocumentBundle` scope contract violations

`src/core/types.ts:153-163` defines:
```ts
/** All personal-scope specs for this country. */
readonly personal: ReadonlyArray<DocumentSpec>;
/** All tax-scope specs. */
readonly tax: ReadonlyArray<DocumentSpec>;
```

A spec with `scope: "personal"` belongs in `personal`. A `scope: "tax"`
spec belongs in `tax`. Only `scope: "both"` may live in both.

Violations found:

| File                    | Line | Bundle slot | Spec inserted     | Spec.scope   | Status   |
|-------------------------|------|-------------|-------------------|--------------|----------|
| `src/countries/us/index.ts` | 54   | `personal`  | `itinSpec`        | `"tax"`      | wrong    |
| `src/countries/co/index.ts` | 57   | `tax`       | `ccSpec`          | `"personal"` | wrong    |
| `src/countries/gt/index.ts` | 49   | `tax`       | `dpiSpec`         | `"personal"` | wrong    |
| `src/countries/hn/index.ts` | 48   | `tax`       | `dniSpec`         | `"personal"` | wrong    |

Reference impl `src/countries/sv/index.ts:47` does not violate, because
`duiSpec.scope === "both"` (sv/dui.ts:29). The convention is: if a spec is
used in both personal and tax context, mark its `scope: "both"`.

**Fix (one of)**:
- Promote each implicated spec to `scope: "both"`:
  - `us/itin.ts:32` → `scope: "both"` (ITIN is a tax ID for natural persons; `scope: "both"` matches DO_CEDULA precedent).
  - `co/cc.ts:28` → `scope: "both"` (cédula doubles as NIT for naturales — already documented in `co/nit.ts:11`).
  - `gt/dpi.ts:36` → `scope: "both"` (DPI/CUI used as NIT post-2022 per `gt/nit.ts:27-29`).
  - `hn/dni.ts:39` → `scope: "both"` (DNI is base of RTN for naturales per `hn/rtn.ts:9`).
- OR remove the cross-array insertion and rely on a separate convenience surface.

The first option is cleaner and matches the SV/DO precedent.

**Why this is a BLOCKER**: `CountryDocumentBundle` is a public type. Downstream
code that iterates `bundle.personal` and assumes each member identifies a
person currently sees a tax-only ITIN. That is a contract bug, not a doc
nit.

---

## 2. BUGS

### F-2 [BUG] — `do/rnc.ts` advertises a `formattedRegex` that `format()` never produces

`src/countries/do/rnc.ts:32`:
```ts
const FORMATTED_REGEX = /^\d-\d{2}-\d{5}-\d$/;  // 1-2-5-1 = 9 digits
```

`src/countries/do/rnc.ts:57-61`:
```ts
format(input: string): string {
  const digits = stripNonDigits(input);
  if (digits.length !== 9) return input;
  return digits;  // returns plain digits — never the dashed form
}
```

The type contract `format()` says: "Reverse of normalize, applies the
canonical mask." Either:
- (a) Drop `formattedRegex` (the canonical form is digits only — the
  docstring says "no canonical separator"), OR
- (b) Implement `format()` to actually emit `${d[0]}-${d.slice(1,3)}-${d.slice(3,8)}-${d[8]}`.

**Recommendation**: option (a). Per `rnc.ts:8` and `tier1.md:335`, the
canonical visual form is digits-only; the dashed form is informal. Drop
the regex.

### F-3 [BUG] — `mx/curp.ts` `rawRegex` is too permissive vs the defined contract

`src/countries/mx/curp.ts:39`:
```ts
const RAW_REGEX = /^[A-ZÑ0-9]{18}$/;
```

Per the type contract (`core/types.ts:130`) the spec's `rawRegex` is the
regex matching the **normalized form**. `validate()` actually uses the
much stricter `STRUCTURAL_REGEX` (`curp.ts:53-54`). Consumers that read
`spec.rawRegex` directly to gate inputs (a documented use case — e.g.
form-level pre-filters) will accept strings that nationid's own `validate()`
rejects.

**Fix**: set `rawRegex: STRUCTURAL_REGEX` and remove the loose
`RAW_REGEX` constant. Update the docstring at `curp.ts:38` to drop the
"loose superset" rationale — the structural regex IS the normalized form.

### F-4 [BUG] — `es/shared.ts` CIF prefix categorization disagrees with the research file

`src/countries/es/shared.ts:70`:
```ts
export const CIF_PREFIX_LETTER_DV = new Set(["N","P","Q","R","S","W"]);
```

Per `nationid-research/countries-comprehensive-tier2.md:145`:
> for entity types `[A,B,E,H]` DV is the digit `r`; for `[K,P,Q,R,S,N,W]`
> DV is the letter `'JABCDEFGHI'[r]`; for others, both forms accepted.

The research prescribes `K,P,Q,R,S,N,W` for letter-DV. The current code
omits `K`. (`K` is also missing from `CIF_ALL_PREFIXES` and the
`rawRegex` in `nif-pj.ts:45`, so `K`-prefix inputs are filtered out at the
regex stage — they never reach the prefix table. End-state: K-prefix CIFs
are rejected as `invalid_format` rather than evaluated.)

`python-stdnum.stdnum.es.cif` 2.x (cross-validated 2026-05-08 inline) is
**maximally permissive**: it accepts either DV form for *any* of
`ABCDEFGHJNPQRSUVW` with the comment "there seems to be conflicting
information on which organisation types should have which type of check
digit (alphabetic or numeric) so we support either here." `validator.js`
13.15 enforces N/P/Q/R/S/W as letter-mandatory (matching the current
nationid code), but again misses K.

The disagreement between the research file (which the implementing agent
read) and the shipped table is the actual bug surface here. Two
acceptable resolutions:

1. **Add K to `CIF_ALL_PREFIXES` and `CIF_PREFIX_LETTER_DV`**, expand the
   `rawRegex` to `[ABCDEFGHJKNPQRSUVW]` (reference: research line 145).
   This is the "follow the research" path.
2. **Leave as-is, document the divergence** in `docs/CROSS_VALIDATION.md`
   alongside D6 (NIE prefix tolerance). State explicitly which canonical
   source is being followed (`validator.js` v13.15) and why K is omitted.

Without one of those, future cross-validation against `python-stdnum`
will surface this discrepancy and the `[high]` confidence label on
`ES_NIF_PJ` becomes hard to defend.

### F-5 [BUG] — `gt/dpi.ts` doc claims a `01-22` departamento constraint that the code does not enforce

`src/countries/gt/dpi.ts:12-13`:
> 2 digits: código departamento (01-22)
> 2 digits: código municipio

`checkDigitDPI` (line 85-92) only checks the verifier digit. The
departamento at positions 9-10 (0-indexed: digits[9..10]) is not validated.
The HN_DNI reference implementation enforces its analogous range
(`hn/dni.ts:88-90` rejects dept < 1 or > 18). GT_DPI should do the same.

This is a real false-acceptance: `0000000010 99 99` (dept 99, muni 99,
correctly checksummed) currently validates as `true`. RENAP would never
issue it.

**Fix**: in `checkDigitDPI`, add
```ts
const dept = parseInt(digits.slice(9, 11), 10);
if (dept < 1 || dept > 22) return false;
```
mirroring `hn/dni.ts:hasValidStructure`.

---

## 3. QUALITY

### F-6 [QUALITY] — `confidence: "high"` used on format-only specs

The type doc (`core/types.ts:84-90`) explicitly says `unconfirmed` is the
correct label for "format checked but no algorithm verified". Multiple
specs use `confidence: "high"` with a "(format only)" parenthetical, which
fights the rubric:

| File                                    | Line | Why "high"?              |
|-----------------------------------------|------|--------------------------|
| `src/countries/cr/cedula-fisica.ts`     | 41   | "format only"            |
| `src/countries/cr/cedula-juridica.ts`   | 36   | "format only"            |
| `src/countries/co/pasaporte.ts`         | -    | already `unconfirmed` ✓ |
| `src/countries/ar/dni.ts`               | 31   | "format only"            |
| `src/countries/cr/dimex.ts`             | 35   | "moderate", format only  |

Either:
- (a) Tighten the rubric in `core/types.ts:84-90` to allow "high (format
  only)" with a documented qualifier, OR
- (b) Downgrade these to `unconfirmed` (or `moderate` with a note).

This is across-codebase inconsistency, not a bug per se. Choose one
direction and apply uniformly.

### F-7 [QUALITY] — `do/cedula.ts` does not replicate the `python-stdnum` 578-entry whitelist

`python-stdnum.stdnum.do.cedula` ships a `whitelist` of 578 historically
issued cédulas that fail the Luhn check but are accepted as canonical
valid (legacy issuance pre-Luhn enforcement). nationid does not.

Two consequences:
- `validate("DO_CEDULA", x)` will reject some real-world cédulas that are
  in the JCE registry.
- Cross-validation agreement against python-stdnum is currently 100% only
  because the synthetic generator does not draw from the whitelist.

Decision needed: either ship a whitelist (LGPL data — verify license
compatibility), or document this divergence in
`docs/CROSS_VALIDATION.md`. Recommend documenting; the runtime cost of
shipping 578 strings (~7 KB gzipped) blows the per-country bundle budget.

### F-8 [QUALITY] — `cr/dimex.ts` `confidence: "moderate"` for format-only is also off-rubric

Same as F-6. `cr/dimex.ts:35` says `moderate` but only validates length +
all-digits. Per the rubric, `low` or `unconfirmed` is more honest.

### F-9 [QUALITY] — `mx/shared.ts` JSDoc table layout disagrees with `docs/CROSS_VALIDATION.md` § B2

`mx/shared.ts:25-28` correctly documents `space=37, Ñ=38` — matching the
implemented table at lines 79-80 and `python-stdnum.stdnum.mx.rfc._alphabet`
(verified inline against the installed module). However
`docs/CROSS_VALIDATION.md:298-301` says "Ñ=37, space=38" — this is a typo
in the post-mortem. The CODE is right; the post-mortem doc is wrong.

**Fix**: amend `docs/CROSS_VALIDATION.md:298-301` to read "space=37,
Ñ=38" matching the code and python-stdnum.

### F-10 [QUALITY] — `gt/nit.ts:19` docstring formula contradicts the implemented one

`gt/nit.ts:19`:
> Equivalently: `dv = 11 - (sum mod 11)`; if the result is 11 → '0', if 10 → 'K'.

This is **not equivalent** to the formula at lines 105-115. When
`sum mod 11 === 0`, the docstring says `dv = 11 → '0'`, but the
implementation computes `r = ((-sum) % 11 + 11) % 11 = 0 → '0'`. Both
give '0', so for `sum mod 11 === 0` they coincide. But for any non-zero
residue they diverge: the implementation gives `11 - r`, the docstring
formula gives `11 - r` then re-applies the 11→0 swap which the impl
doesn't need. The two formulas happen to agree on every input due to
careful definition, but the docstring's prose is a confusing distractor.

Drop the "Equivalently" line — keep only the `(-sum) mod 11` formulation
that matches the code.

### F-11 [QUALITY] — `mx/rfc-pf.ts:43` regex permits invalid DV characters

`const RAW_REGEX = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/`

Position 12 (the DV) per SAT can only be `0-9` or `A`. The regex permits
`B`-`Z`, which then must be caught by `computeRfcDV` later. Functionally
correct (validate still returns false) but the `parse()` path returns
`invalid_checksum` instead of `invalid_format` for clearly-invalid DV
characters like `K`. Tighten:
```ts
const RAW_REGEX = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{2}[0-9A]$/;
```
Same comment applies to `mx/rfc-pm.ts:36`.

### F-12 [QUALITY] — Missing `invalid_format` discrimination in `parse()` for several specs

Per the F1 rubric (parse covers all `ParseError.kind` variants where
applicable), several specs collapse format errors into either
`too_short`/`too_long` or `invalid_checksum`:

- `sv/dui.ts:53-75` — never returns `invalid_format` (length 9 implicitly
  defines format because input is digits-only). This is the original
  reference pattern, but it means consumers can never distinguish "bad
  shape" from "bad checksum" at length 9. SV reference impl, but the
  pattern propagates: `pe/dni.ts`, `co/cc.ts`, `co/ce.ts`, `co/ti.ts`,
  `pe/ce.ts`, `pe/dni.ts`, `cr/dimex.ts`, `hn/dni.ts`, `hn/rtn.ts` all
  inherit it.
- `do/cedula.ts:55-77` — input "abcdefghi" (9 letters) maps to digits=""
  → returns `too_short` (length 0 < 11). Consumers see "too short" for
  what is really "no digits supplied". Acceptable but documented as a
  convention, not a bug.

Recommend documenting the convention in `docs/STYLE_GUIDE.md` rather
than retrofitting every parse(). The current behavior is internally
consistent.

### F-13 [QUALITY] — `co/nit.ts:32` regex is `/^\d{10,11}$/` but the file's docstring says "9-10 base digits + 1 DV" — the body length range is 9-10, total 10-11

The regex range matches the doc at line 8 (totals 10-11). However the
mask at line 42 says `mask: "000000000-0"` which is 9-digit body. The
mask should reflect both lengths, e.g. `"0000000000-0"` (max length) with
a UI note. Minor consistency nit.

### F-14 [QUALITY] — `co/cc.ts` `mask: "0000000000"` advertises a fixed 10-digit mask but accepts 6-10 digits

Variable-length, mask is a hint. Documented at line 32-33. Acceptable.
Same pattern in `co/ti.ts`, `co/ce.ts`, `pe/ce.ts`, `cr/dimex.ts`.

The `mask` field's semantics under variable length is unspecified in
`STYLE_GUIDE.md` — recommend codifying.

### F-15 [QUALITY] — `co/index.ts:57` puts `ccSpec` (scope=personal) into the `tax` array

This is the same bug surface as F-1 from a different angle. Calling out
specifically here so the orchestrator can group the fix.

### F-16 [QUALITY] — `hn/dni.ts` magic-number `2099` for max year

`hn/dni.ts:95` uses `2099` literal. The named constant `MIN_YEAR` is
defined; mirror with `MAX_YEAR = 2099` for symmetry and explainability.

### F-17 [QUALITY] — `gt/nit.ts:114` returns `"?"` from `computeNitDV` on bad-digit path

`gt/nit.ts:110`:
```ts
if (d < 0 || d > 9) return "?";
```

The function is private but the `?` sentinel is opaque. Either return
`null` (matches `computeRfcDV`/`computeCuitDV` pattern) and have callers
handle `null`, or document the sentinel inline. The current callers
compare DV strings, so `"?"` will never collide with a valid DV — but
the sentinel-via-`?` is a footgun for future refactors.

### F-18 [QUALITY] — `cl/rut.ts:95` uses the same `?` sentinel pattern

Same as F-17, in the reference Chile impl. Existing code, not new — but
worth flagging because the pattern propagated to GT_NIT.

### F-19 [QUALITY] — `do/rnc.ts` `format()` ignores its own `formattedRegex`

See F-2. Listed separately so the orchestrator can fix the field
consistency in one pass.

---

## 4. NITS

### F-20 [NIT] — Empty-body all-same-digit edge in `gt/nit.ts`

For body `"0"` (single zero), `computeNitDV` produces `"0"`, so `"00"`
passes the verifier check. `allSameDigit("0")` returns `false` (regex
requires 2+ chars). Net: `"00"` is currently a "valid" NIT.

In practice no one issues a 2-char NIT of all zeros, but the placeholder
guard could be tightened to also reject `body === "0"`. Negligible.

### F-21 [NIT] — `do/cedula.ts` does not reject all-same-digit cedulas

Unlike `co/nit.ts`, `pe/ruc.ts`, `br/cpf.ts`, etc., `do/cedula.ts` does
not call `allSameDigit`. `12345678901`-style placeholders that pass Luhn
(none do — Luhn 0-...-0 fails) are not a real risk; the explicit
all-same check is a convention, not a correctness gate.

### F-22 [NIT] — `mx/curp.ts:32` says "Ñ value = 24 in the RENAPO table" but the table at `shared.ts:92` puts Ñ at index 24

Cross-checked: CURP_ALPHABET = `"0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"`.
Counting: 10 digits + 14 letters A-N + Ñ = position 24. ✓ matches
docstring. No issue, just confirming. (This is the one I expected to be
the next bug after the RFC table was fixed; it isn't.)

---

## 5. Clean files (zero findings)

The following implementations were read line-by-line and produced no
findings beyond the cross-cutting bundle/scope and confidence-rubric
items above:

- `src/countries/sv/dui.ts` (reference)
- `src/countries/sv/nit.ts` (reference)
- `src/countries/cl/rut.ts` (reference)
- `src/countries/br/cpf.ts` (reference)
- `src/countries/ar/cuit.ts` (reference)
- `src/countries/ar/cuil.ts` (reference)
- `src/countries/mx/rfc-pm.ts` — algorithm verified against
  `python-stdnum.stdnum.mx.rfc` doctest examples (`MAB9307148T4` etc.)
- `src/countries/pe/ruc.ts` — algorithm matches SUNAT D9 mapping
  documented in `CROSS_VALIDATION.md`
- `src/countries/co/nit.ts` — DIAN algorithm verified by hand
- `src/countries/do/rnc.ts` — DGII algorithm matches python-stdnum
  (different formula, same result for r ∈ 0..10)
- `src/countries/gt/nit.ts` — SAT GT algorithm matches
  `python-stdnum.stdnum.gt.nit` for hand-traced inputs
- `src/countries/es/dni.ts` — straightforward `digits mod 23` letter table
- `src/countries/es/nie.ts` — prefix-substitution + DNI table
- `src/countries/us/ssn.ts` — SSA structural rules complete
- `src/countries/us/itin.ts` — IRS Pub 1915 group ranges correct
- `src/countries/us/ein.ts` — IRS prefix list correct (post-B1 fix)
- `src/algorithms/luhn.ts` — standard Luhn, no issues
- `src/algorithms/mod11.ts` — primitive correct (throws are caught at
  call sites by length pre-checks)
- All country `index.ts` files — bundle layout is correct *except* for
  the F-1 scope mismatches.

---

## 6. v0.1.0 release blockers

If v0.1.0 ships today:

1. **F-1 must fix**. The bundle/scope contract violation will surface as
   soon as a downstream consumer enumerates `bundle.personal` and finds
   a tax-only ITIN (or `bundle.tax` and finds a personal-only DPI).
   Easy fix — change four `scope` fields, or change four bundle
   compositions.

2. **F-5 should fix**. False acceptance of GT_DPI with out-of-range
   departamento codes is a real issue but high-volume code is unlikely
   to encounter "RENAP-impossible" inputs in production. Demote to
   "should fix" if release pressure is high; promote to "must fix" if
   GT customers will run automated KYC.

3. **F-2, F-3, F-4** are correctness/contract issues but **none of them
   produces wrong-validate-result on real-world inputs** in current
   production usage. They are pre-emptive fixes.

Everything else is documentation, naming, or convention work.

---

## 7. Methodology notes

- All algorithms cross-checked by hand and/or by shelling out to
  `python-stdnum 2.x` for spot validation (the reviewer's host has it
  installed; nationid CI also uses it).
- `python-stdnum` was used as a second oracle inline during this review,
  not introduced as a new test dependency.
- `validator.js` 13.15 behavior verified by reading
  `tests/cross-validation/validator-js.test.ts` and inferring from the
  divergence catalog in `docs/CROSS_VALIDATION.md`.
- No source files were modified. Only this report was written.
