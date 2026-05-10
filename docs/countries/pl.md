# Poland (PL)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|------------|
| `PL_PESEL` | personal/tax | 11 | weighted mod-10 | high |
| `PL_NIP` | tax | 10 | weighted mod-11 (reject r=10) | high |
| `PL_REGON` | tax/business | 9 or 14 | weighted mod-11 (r=10 → 0) | high |

## `PL_PESEL`

### Overview

Powszechny Elektroniczny System Ewidencji Ludności — universal personal
identifier issued by MSWiA. Encodes date of birth and sex.

- Issuer: MSWiA — <https://www.gov.pl/web/gov/czym-jest-numer-pesel>
- Composition: 6 (yymmdd, century-shifted) + 4 (serial, 10th = sex) + 1 (DV)
- Visual format: 11 digits, no separator

### Algorithm

```
weights  = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
sum      = sum(weights[i] * digit[i])  for i in 0..9
expected = (10 - (sum mod 10)) mod 10
valid    = expected == digit[10]
```

Month encodes century: `+0` (1900-1999), `+20` (2000-2099),
`+40` (2100-2199), `+60` (2200-2299), `+80` (1800-1899). The parser
accepts any shift that produces a valid 1..12 month with day 1..31.

### Sources

- Primary: MSWiA — PESEL specification
- Secondary: `python-stdnum.pl.pesel`, `polish-pesel` (npm)

### Synthetic test vectors

```
valid:
  - 90051500017       (1990-05-15)
  - 10251500011       (2010-05-15, mm+20)
  - 85123112346       (1985-12-31)
  - 80080855501       (1980-08-08)

invalid (format):
  - 85133112340       (month 13 with no valid shift)
  - 85129912340       (day 99)

invalid (checksum):
  - 90051500010
```

### Recent reforms

None affecting the algorithm.

### Open questions

None.

---

## `PL_NIP`

### Overview

Numer Identyfikacji Podatkowej — tax ID for both natural and legal
persons.

- Issuer: KAS — <https://www.podatki.gov.pl/>
- Composition: 10 digits, body 9 + DV
- Visual format: `123-456-78-90`

### Algorithm

```
weights  = [6, 5, 7, 2, 3, 4, 5, 6, 7]
sum      = sum(weights[i] * digit[i])  for i in 0..8
r        = sum mod 11
if r == 10: reject (NIP would be reissued)
else:       dv = r
```

### Sources

- Primary: Ministerstwo Finansów — NIP specification
- Secondary: `python-stdnum.pl.nip`, `pl-nip` (npm), `validator.js`

### Synthetic test vectors

```
valid:
  - 5263124469
  - 7700000075
  - 1000000006

invalid (format):
  - 1234567890        (r=10 → reissued)
  - 12345              (too short)

invalid (checksum):
  - 5263124460
```

### Recent reforms

None.

### Open questions

None.

---

## `PL_REGON`

### Overview

Krajowy Rejestr Urzędowy Podmiotów Gospodarki Narodowej — statistical
registry number issued by GUS. 9-digit principal entity, with optional
14-digit form for local establishments.

- Issuer: GUS — <https://wyszukiwarkaregon.stat.gov.pl/>
- Composition (9): 8 base + 1 DV. Composition (14): 9-digit principal
  + 4-digit local-unit suffix + 1 final DV
- Visual format: 9 or 14 digits, no separator

### Algorithm

9-digit:
```
weights  = [8, 9, 2, 3, 4, 5, 6, 7]
sum      = sum(weights[i] * digit[i])  for i in 0..7
r        = sum mod 11
dv       = 0 if r == 10 else r
```

14-digit:
```
weights  = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8]
sum      = sum(weights[i] * digit[i])  for i in 0..12
r        = sum mod 11
dv       = 0 if r == 10 else r
# AND the 9-digit principal must independently pass mod-11.
```

### Sources

- Primary: GUS — REGON specification
- Secondary: `python-stdnum.pl.regon`, `polish-regon` (npm)

### Synthetic test vectors

```
valid:
  - 123456785             (9-digit)
  - 12345678512347        (14-digit, principal 123456785)

invalid (format):
  - 1234567891234         (13 digits)
  - 12345                 (too short)

invalid (checksum):
  - 123456789             (bad 9-digit DV)
  - 12345678512340        (bad 14-digit DV)
  - 12345678012347        (14-digit with invalid principal)
```

### Recent reforms

None.

### Open questions

None.
