# United Kingdom (GB)

Reference for `nationid` v0.6 GB document validators.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|------------|
| `GB_NINO` | personal/tax | 9 | none (format-only) | moderate |
| `GB_UTR` | tax | 10 | mod-11 weighted | moderate |
| `GB_VAT` | tax | 9 or 12 | HMRC mod-97 | high |
| `GB_NHS` | personal | 10 | mod-11 | high |

## `GB_NINO`

### Overview

National Insurance Number issued by HMRC / DWP. Used as both a personal identifier in the welfare system and a de-facto tax ID for employees.

- Issuer: HMRC, https://www.gov.uk/national-insurance-number
- Composition: `AA-NNNNNN-A` — 2 letters + 6 digits + 1 suffix letter (A/B/C/D)
- Visual format: `AB 12 34 56 C`

### Algorithm

Format-only validation (HMRC publishes prefix exclusions but no checksum).

- First letter: `A-Z` excluding `D, F, I, Q, U, V`
- Second letter: `A-Z` excluding `D, F, I, O, Q, U, V`
- Excluded two-letter prefixes: `BG, GB, NK, KN, TN, NT, ZZ`
- Suffix: one of `A, B, C, D`

### Sources

- HMRC NIM39110 (2026-04 access) — https://www.gov.uk/hmrc-internal-manuals/national-insurance-manual/nim39110
- `validator.js isIdentityCard('en-GB')`

### Synthetic test vectors

```
valid:
  - AB123456C
  - JT123456A
  - ZB123456D
  - WP123456C

invalid (format):
  - BG123456C   # excluded prefix
  - DA123456C   # forbidden first letter
  - AO123456C   # forbidden second letter
  - AB123456E   # suffix outside A-D
```

## `GB_UTR`

### Overview

Unique Taxpayer Reference issued by HMRC for individuals registered with Self Assessment and for incorporated entities registered for Corporation Tax.

- Issuer: HMRC, https://www.gov.uk/find-utr-number
- Composition: position 1 is the check digit; positions 2-10 are the body
- Visual format: 10 contiguous digits (some HMRC notices append `K`)

### Algorithm

```
weights = [6, 7, 8, 9, 10, 5, 4, 3, 2]   # for body digits 2..10
sum = sum(d_i * w_i)
r   = sum mod 11
dv  = 11 - r
if dv == 11: dv = 0
if dv == 10: number is invalid (HMRC reissues)
expected check_digit at position 1 == dv
```

### Sources

- HMRC SDS / `python-stdnum.gb.utr`

### Synthetic test vectors

```
valid:
  - 1123456789
  - 9987654321
  - 0234567890
  - 9000000001

invalid (checksum):
  - 0123456789
  - 1234567890
  - 9123456789
```

## `GB_VAT`

### Overview

VAT registration number for businesses. Standard form is `GB` + 9 digits; branch traders append a 3-digit suffix (`GB123456789001`).

- Issuer: HMRC, https://www.gov.uk/check-uk-vat-number
- Reference: HMRC VAT Notice 700/1
- Visual format: `GB 123 4567 89` or `GB 123 4567 89 001`
- Government & health-authority registrations (`GBHA…`, `GBGD…`) are out of scope

### Algorithm

```
weights = [8, 7, 6, 5, 4, 3, 2]   # over digits 1..7 (left-to-right)
sum     = sum(d_i * w_i)
dv      = digits 8..9 as a 2-digit integer

Pre-2010:  (sum + dv) ≡ 0 (mod 97)
Post-2010: (sum + 55 + dv) ≡ 0 (mod 97)
```

We accept either variant. The 3-digit branch suffix (positions 10-12) does not enter the checksum.

### Sources

- HMRC VAT Notice 700/1, https://www.gov.uk/guidance/vat-trader-registration-numbers
- `validator.js isVAT('GB')`, `python-stdnum.gb.vat`

### Synthetic test vectors

```
valid:
  - GB123456782
  - GB 123 4567 82 001     # 12-digit branch form
  - 123456782              # bare form is normalized

invalid (checksum):
  - GB123456789
  - GB000000001

invalid (format):
  - GBABCDEFGHI
```

## `GB_NHS`

### Overview

NHS Number (England & Wales). 10-digit personal health identifier issued by NHS Digital. Scotland uses CHI numbers; Northern Ireland uses H&C numbers; both are out of scope.

- Issuer: NHS Digital, https://digital.nhs.uk/services/personal-demographics-service
- Visual format: `999 999 9999`

### Algorithm

```
weights = [10, 9, 8, 7, 6, 5, 4, 3, 2]
sum = sum(d_i * w_i)  for i in 0..8
r   = sum mod 11
dv  = 11 - r
if dv == 11: dv = 0
if dv == 10: number is invalid (NHS Digital reissues)
expected digit_10 == dv
```

### Sources

- NHS Digital PDS API
- `validator.js isIdentityCard('en-GB')`

### Synthetic test vectors

```
valid:
  - 9434765919   # canonical NHS test number
  - 1000000001

invalid (checksum):
  - 9434765910
  - 1234567890   # dv would be 10 → invalid
```

### Recent reforms

None affecting format/algorithm in the last 24 months.

### Open questions

- Confirm whether HMRC plans to publish an authoritative UTR algorithm spec; if so, promote `GB_UTR` to `confidence: high`.
- Scotland (CHI) and Northern Ireland (H&C) personal numbers are not yet covered.
