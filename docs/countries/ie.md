# Ireland (IE)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `IE_VAT` | tax | 10 (old) or 11 (post-2013) | mod-23 letter, alphabet `WABCDEFGHIJKLMNOPQRSTUV` | high |

Ships under the tree-shakable subpath `nationid/ie` and under the EU-wide
aggregator `nationid/vat`.

---

## `IE_VAT` — Value-Added Tax registration number

### Overview

Irish VAT number issued by Revenue (Office of the Revenue Commissioners)
to every VAT-registered trader. Two forms co-exist in production data:

1. **Pre-2013 form** — `IE` + 7 digits + 1 check letter (10 chars total),
   e.g. `IE8473625E`.
2. **Post-2013 form** — `IE` + 7 digits + check letter + trailing letter
   `A` or `W` (11 chars total), e.g. `IE3628739UA`. The trailing letter
   was originally used to flag joint registrations for married couples
   (`W`) and is now also issued generically (`A`).

- **Issuer**: Office of the Revenue Commissioners — <https://www.revenue.ie/en/vat/index.aspx>
- **Statute**: Value-Added Tax Consolidation Act 2010, s. 65 (binding authority).
- **Composition**: `IE` prefix + 7 body digits + 1 check letter
  (+ optional trailing letter `A`/`W`).
- **Visual format**: 10 or 11 contiguous uppercase characters
  (no separators).

### Algorithm

Mod-23 letter check over the 7 body digits with weights
`[8, 7, 6, 5, 4, 3, 2]`. The check-letter alphabet is
`WABCDEFGHIJKLMNOPQRSTUV` (note: starts with `W` = index 0, ends with
`V` = index 22; this is equivalent to the character class `[A-W]`).

For the post-2013 9-char body (digits + check + trailing), the trailing
letter contributes `9 × CHECK_ALPHABET.indexOf(trailing)` to the sum.

```
WEIGHTS = [8, 7, 6, 5, 4, 3, 2]
CHECK_ALPHABET = "WABCDEFGHIJKLMNOPQRSTUV"

sum = 0
for i in 0..6:
    sum += int(digits[i]) * WEIGHTS[i]
if trailing_letter:
    sum += 9 * CHECK_ALPHABET.index(trailing_letter)
expected_check_letter = CHECK_ALPHABET[sum mod 23]
valid = (expected_check_letter == check_letter)
```

Confidence: **high**. Revenue publishes the algorithm in Tax and Duty
Manual TDM 02-09 (Value-Added Tax Identification Numbers); python-stdnum
reproduces it byte-for-byte.

### Sources

- Revenue Commissioners — VAT overview:
  <https://www.revenue.ie/en/vat/index.aspx> ✓ live 2026-05-24
- Revenue Commissioners — VAT registration:
  <https://www.revenue.ie/en/vat/registration-for-vat/index.aspx> ✓ live 2026-05-24
- VIES portal (cross-validation, EU-wide):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- Statute (binding authority): Value-Added Tax Consolidation Act 2010, s. 65
- Cross-validated against `python-stdnum` (`stdnum.ie.vat`)

### Synthetic test vectors

```
valid (mod-23 check passes, both old + new forms):
  - IE8473625E     (canonical anchor — VERIFICATION §IE)
  - IE3628739UA    (canonical anchor — post-2013 form)
  - IE8713052O
  - IE5643486L
  - IE1410926D
  - IE0460777L

invalid (check letter wrong):
  - IE8473625A     (should be E)
  - IE8473625Z     (Z not in WABCDEFGHIJKLMNOPQRSTUV alphabet)

invalid (format):
  - IE847362XX     (letter at body position 6 — must be digit)
  - IE12           (too short)
```

### Recent reforms

- **2013** — Revenue extended the legacy 8-char body to a 9-char body by
  appending a trailing `A` or `W` letter. Both forms remain valid and
  the library must accept either.
- Pre-1992 legacy forms (1 digit + `+`/`*` + 5 digits + check) still
  exist in production data for businesses that never re-registered. The
  v1.7 spec accepts only the post-1992 numeric body; legacy `+`/`*`
  numbers are out of scope (consumer must normalise upstream).

### Open questions

- Whether to accept legacy `+`/`*` forms in a future minor release.
  Revenue has not announced a sunset date.

---

## Notes for consumers

- `IE_VAT` is **offline structural validation only**. A number with a
  valid checksum may still be inactive, deregistered, or never issued.
  For "does this VAT number really exist right now?" call the EU **VIES**
  service at <https://ec.europa.eu/taxation_customs/vies/> (prefix `IE`).
  See `examples/vies-check.ts` for an integration recipe.
- The check-letter alphabet `WABCDEFGHIJKLMNOPQRSTUV` is equivalent to
  `[A-W]` as a character class but the **index → letter mapping** matters
  (W = 0, A = 1, …, V = 22). Do not "tighten" the regex to `[A-V]`.
- **Northern Ireland** (NI) post-Brexit traders carry an `XI` prefix
  under the Windsor Framework, not `IE`. NI VAT is a UK concern; `XI`
  validation lives alongside `GB_VAT` in a future release.
