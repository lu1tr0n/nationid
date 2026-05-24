# Slovakia (SK)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `SK_VAT` | tax | 10 | none (whole body divisible by 11) | high |

The spec ships under the tree-shakable subpath `nationid/sk`. `SK_VAT`
and `DPH` are accepted as aliases.

---

## `SK_VAT` — Identifikačné číslo pre daň z pridanej hodnoty (IČ DPH)

### Overview

10-digit VAT identification number issued by the Slovak Financial
Administration to every entity registered for value-added tax. Unlike
the Czech DIČ, the Slovak IČ DPH ships as a **single, strict 10-digit
form** — `nationid` rejects python-stdnum's permissive "RČ-might-also-be-VAT"
fallback in v1.7 per VERIFICATION §SK. The Slovak rodné číslo (RČ)
ships separately as `SK_RC` in the v1.8 personal-ID batch.

- **Issuer**: Finančné riaditeľstvo Slovenskej republiky / Finančná
  správa — <https://www.financnasprava.sk/> ✓ live 2026-05-24
- **Statute**: Zákon č. 222/2004 Z. z. o dani z pridanej hodnoty, §4
  (registrácia platiteľa).
- **Composition**: `SK` + 10 digits.
  - position 0: `[1-9]` (first digit must be non-zero)
  - position 2: `{2, 3, 4, 7, 8, 9}` (structural constraint published
    by Finančná správa's metodický pokyn k registrácii)
  - positions 1, 3-9: `[0-9]`
- **Visual format**: `SK NNNNNNNNNN` (single space after `SK`)

### Algorithm

No separate check digit — the 10-digit body itself must be **divisible
by 11**. This is unusual in the EU-VAT batch (most countries weight a
subset of digits and append a check) but published by Finančná správa
and reproduced verbatim by `python-stdnum.sk.dph`.

```
body10 = digits[0..9]
check_ok = (parseInt(body10, 10) mod 11) == 0
```

The 10-digit decimal value fits comfortably inside JavaScript's
`Number.MAX_SAFE_INTEGER` (2^53 - 1 = 9 007 199 254 740 991), so the
implementation uses `Number.parseInt(body10, 10) % 11 === 0` without
needing `BigInt`.

Worked re-derivation of the canonical anchor `SK1020000003`:

```
body10        = 1020000003
1020000003 / 11 = 92727273      (no remainder)
1020000003 mod 11 = 0           ✓ valid
```

Structural-constraint check against the same anchor:

```
position 0 = '1'   →  in [1-9]                ✓
position 2 = '2'   →  in {2,3,4,7,8,9}        ✓
```

### Sources

- Finančná správa (issuer root):
  <https://www.financnasprava.sk/> ✓ live 2026-05-24
- Statute — Zákon č. 222/2004 Z. z., full text on Slov-lex:
  <https://www.slov-lex.sk/ezbierky/pravne-predpisy/SK/ZZ/2004/222/>
  ✓ live 2026-05-24
- VIES portal (EU cross-validation):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- VAT Directive 2006/112/EC, art. 214:
  <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112>
  ✓ live 2026-05-24
- Cross-validated against `python-stdnum.sk.dph`:
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/sk/dph.py>
  ✓ live 2026-05-24

(URL replacement made for this file: the Slov-lex canonical URL
redirected from `slov-lex.sk/pravne-predpisy/...` to
`slov-lex.sk/ezbierky/pravne-predpisy/...` in early 2025. The newer
form is cited directly; both currently 200 because of the redirect.)

### Synthetic test vectors

```
valid (canonical anchor + arithmetically re-derived bodies, shipped in
tests/countries/sk.test.ts):
  - SK1020000003       (canonical anchor — VERIFICATION §SK)
  - SK8948301362
  - SK2843665264
  - SK5479495835
  - SK8039959147
  - SK5698525778

invalid (third digit not in {2,3,4,7,8,9}):
  - SK1010000001       (pos 2 = '1' — Reason: invalid_format)
  - SK1050000001       (pos 2 = '5' — Reason: invalid_format)

invalid (10-digit body not divisible by 11):
  - SK1020000004       (1020000004 mod 11 = 1 — Reason: invalid_checksum)

invalid (checksum recomputed for parse() error mapping):
  - SK1020000005       (Reason: invalid_checksum)
```

### Recent reforms

- **2004-04-01** — Zákon č. 222/2004 Z. z. enters force, simultaneous
  with Slovakia's EU accession. `SK` becomes a VIES member-state prefix
  on day one. Numbering and divisibility-by-11 algorithm are defined in
  the statute's metodický pokyn.
- **2009-01-01** — Slovakia adopts the euro; format unchanged.
- **No format changes since 2004.**

### Open questions

- **RČ-as-VAT fallback (rejected in v1.7)**. python-stdnum's `is_valid`
  accepts any input that validates as a Slovak rodné číslo (RČ) as a
  VAT number too — historically because some sole traders used their
  personal RČ as their VAT registration prior to 2009. v1.7 rejects this
  per VERIFICATION §SK because:
  1. The structural constraint at position 2 (`{2,3,4,7,8,9}`) is part
     of the modern published spec; pre-2009 RČs do not satisfy it.
  2. Mixing a personal-ID branch into a VAT validator confuses scope.
  3. `SK_RC` ships separately in v1.8 with its own date-component
     validator.

  Real production VAT numbers issued since 2009 satisfy the strict
  form. Callers that need to validate legacy RČ-as-VAT should use
  `SK_RC` (v1.8) and accept both codes side-by-side.

---

## Notes for consumers

- `nationid` performs **offline** checksum validation only. Confirming
  that an `SK_VAT` is currently active requires a VIES live call (or
  the Finančná správa "Index daňových subjektov" service for domestic
  checks). See `examples/vies-check.ts` in the repository root.
- Property-based testing against the Slovak spec is unusually permissive
  because the divisibility-by-11 check yields ~9% positive rate on
  random 10-digit bodies (vs. ~10% for digit-driven Luhn). Seeding
  fuzz inputs from valid prefixes (positions 0 + 2 satisfying the
  structural constraints) and computing the matching check is more
  efficient than naïve rejection sampling.
- The 10-digit IČ DPH is **not** the same as Slovakia's IČO (8-digit
  company registration number). The IČO has its own mod-11 check
  algorithm and will ship in a future personal/business-ID batch — it
  is **not** in v1.7's scope.
