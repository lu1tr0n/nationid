# Hungary (HU)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `HU_VAT` | tax | 10 (`HU` + 8 digits) | weighted mod-10, weights `[9,7,3,1,9,7,3,1]` | high |

Ships under the tree-shakable subpath `nationid/hu` and under the EU-wide
aggregator `nationid/vat`.

Also registered under the aliases `HU_ANUM` (community VAT —
*közösségi adószám*) and `ADOSZAM` for i18n labelling.

> **Scope note (v1.7).** v1.7 ships the **8-digit community-VAT
> branch** only (the *közösségi adószám* used for VIES exchanges).
> The 11-digit Hungarian *adószám* (`XXXXXXXX-Y-ZZ`, with VAT-status
> flag and county code) is a separate document — `HU_ADOSZAM` — and is
> deferred to a future release.

---

## `HU_VAT` — Közösségi adószám (EU VAT number)

### Overview

Hungarian EU VAT identification number issued by the Nemzeti Adó- és
Vámhivatal (NAV) to every VAT-registered taxpayer. The 8-digit
*közösségi adószám* is the first 8 digits of the full Hungarian
*adószám*; the `HU` prefix is appended for VIES.

- **Issuer**: Nemzeti Adó- és Vámhivatal (NAV) — <https://nav.gov.hu/>
- **NAV VAT section**: <https://nav.gov.hu/ado/afa> ✓ live 2026-05-24
- **Real-time invoicing system**:
  <https://onlineszamla.nav.gov.hu/> ✓ live 2026-05-24
- **Statute**: `2007. évi CXXVII. törvény az általános forgalmi adóról,
  §178` (ÁFA Act — VAT Act, registration regime).
- **Composition**: `HU` prefix + 8 digits (7 body digits + 1 check digit).
- **Visual format**: `HU 12892312` (space after `HU`).

### Algorithm

Weighted mod-10 over **all 8 digits including the check** with weights
`[9, 7, 3, 1, 9, 7, 3, 1]`. The sum must be divisible by 10:

```
WEIGHTS = [9, 7, 3, 1, 9, 7, 3, 1]

sum = Σ (digits[i] * WEIGHTS[i]) for i in 0..7
valid = (sum mod 10 == 0)
```

Equivalently, given the 7-digit body the check digit is

```
check = (- (9·d0 + 7·d1 + 3·d2 + 1·d3 + 9·d4 + 7·d5 + 3·d6)) mod 10
```

Worked example for canonical anchor `HU12892312` (body `1289231`,
check `2`):

- `9·1 + 7·2 + 3·8 + 1·9 + 9·2 + 7·3 + 3·1 = 9+14+24+9+18+21+3 = 98`
- `(-98) mod 10 = 2`. ✓
- Full sum (including check): `98 + 1·2 = 100`. `100 mod 10 = 0`. ✓

Confidence: **high**. NAV publishes the algorithm in its taxpayer
guidance under the ÁFA Act; python-stdnum reproduces it byte-for-byte.

### Sources

- NAV — Nemzeti Adó- és Vámhivatal (issuer root):
  <https://nav.gov.hu/> ✓ live 2026-05-24
- NAV — VAT section:
  <https://nav.gov.hu/ado/afa> ✓ live 2026-05-24
- NAV — Online invoice system:
  <https://onlineszamla.nav.gov.hu/> ✓ live 2026-05-24
- VIES portal (cross-validation, EU-wide):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- Statute (binding authority): 2007. évi CXXVII. törvény, §178
- Cross-validated against `python-stdnum` (`stdnum.hu.anum`)

### Synthetic test vectors

```
valid (weighted mod-10 check passes):
  - HU12892312    (canonical anchor — VERIFICATION §HU)
  - HU81270060
  - HU37598118
  - HU95159926
  - HU78968415
  - HU27956825

invalid (check digit wrong):
  - HU12892311    (should be 2)
  - HU12892310    (should be 2)

invalid (format):
  - HU1234567     (too short — 7 digits)
  - HU1289231A    (non-digit at check position)
```

### Recent reforms

- **2004-05-01** — Hungary joined the EU; the 8-digit *közösségi
  adószám* introduced as the VAT identifier for VIES exchanges.
- **2018** — NAV launched the *Online Számla* real-time invoicing
  system; the 8-digit VAT number remains the canonical key for invoice
  recipients.
- No change to the check-digit algorithm since introduction.

### Open questions

- The 11-digit full *adószám* (`HU_ADOSZAM`) with county-code suffix
  and VAT-status flag is a separate document scheduled for a future
  release.

---

## Notes for consumers

- Hungary distinguishes the **11-digit *adószám*** (full taxpayer
  number, `XXXXXXXX-Y-ZZ` with VAT-status flag `Y` and county code
  `ZZ`) from the **8-digit *közösségi adószám*** (community VAT number
  for VIES). v1.7's `HU_VAT` validates only the 8-digit form. Consumer
  systems that hold the 11-digit number should slice the first 8
  characters before validating, or wait for `HU_ADOSZAM`.
- `HU_VAT` is **offline structural validation only**. For active-status
  verification, query VIES at
  <https://ec.europa.eu/taxation_customs/vies/> (prefix `HU`) or the
  NAV taxpayer lookup.
- The VAT-status flag in the 11-digit *adószám* (position 9) carries
  semantic information about the taxpayer (active VAT-registered,
  exempt, suspended). Validators cannot recover this from the 8-digit
  community-VAT form; consumers needing status must hit NAV or VIES
  directly.
