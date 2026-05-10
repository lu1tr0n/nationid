# Belgium (BE)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|------------|
| `BE_NRN` | personal/tax | 11 | mod-97 (with century branch) | high |
| `BE_BTW` | tax | 12 (`BE`+10d) | mod-97 (`97 - first8 mod 97`) | high |

## `BE_NRN`

### Overview

Numéro de Registre national / Rijksregisternummer — the personal
identifier issued by the Registre national des personnes physiques.

- Issuer: SPF Intérieur — <https://www.ibz.rrn.fgov.be/>
- Composition: 6 (yymmdd) + 3 (ord, odd=M, even=F) + 2 (DV)
- Visual format: `00.00.00-000.00`

### Algorithm

```
first9 = digits[0..8]
dv     = digits[9..10]

# Born before 2000:
expected = 97 - (int(first9) mod 97)

# Born on/after 2000:
expected = 97 - (int("2" + first9) mod 97)

valid    = dv == expected (in either branch)
```

Bis numbers (foreigners) shift the month by +20 or +40 — the parser
recovers the real month before validating dd/mm.

### Sources

- Primary: Registre national — algorithm published in IBZ's PDF
- Secondary: `python-stdnum.be.nn`, `validator.js isIdentityCard('be-BE')`

### Synthetic test vectors

```
valid:
  - 85041200194       (1985-04-12)
  - 10051500315       (2010-05-15, post-2000 branch)
  - 05010100113       (2005-01-01, post-2000 branch)

invalid (format):
  - 85991200194       (month 99)
  - 85049900194       (day 99)

invalid (checksum):
  - 85041200100
```

### Recent reforms

None.

### Open questions

None.

---

## `BE_BTW`

### Overview

VAT / company number issued by the Banque-Carrefour des Entreprises (BCE).
Since 2008 the format is unified at 10 digits with leading `0` or `1`;
pre-2008 numbers (9 digits) are padded with an implicit leading `0`.

- Issuer: SPF Finances / BCE — <https://kbopub.economie.fgov.be/>
- Composition: 8 base digits + 2 check digits
- Visual format: `BE 0123.456.789`

### Algorithm

```
body     = digits after "BE"            # 10 digits
first8   = body[0..7]
dv       = body[8..9]
expected = 97 - (int(first8) mod 97)
valid    = dv == expected
```

### Sources

- Primary: SPF Finances — VAT validation rules
- Secondary: `python-stdnum.be.vat`, `validator.js isVAT('BE')`

### Synthetic test vectors

```
valid:
  - BE0123456749
  - BE 0123.456.749    (formatted equivalent)

invalid (format):
  - BE9123456749       (leading must be 0 or 1)
  - FR0123456749

invalid (checksum):
  - BE0123456700
```

### Recent reforms

- 2008: leading-1 numbers introduced as the leading-0 space approached
  exhaustion. No algorithm change.

### Open questions

None.
