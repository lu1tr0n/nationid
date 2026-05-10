# Italy (IT)

Reference for `nationid` v0.6 IT document validators.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|------------|
| `IT_CF` | personal/tax | 16 | DM 23-DEC-1976 alphanumeric table | high |
| `IT_PIVA` | tax | 11 | Luhn | high |

## `IT_CF`

### Overview

Codice Fiscale. Personal tax ID for natural persons (16-char alphanumeric); the 11-digit form for legal entities is identical to the partita IVA and is validated under `IT_PIVA`.

- Issuer: Agenzia delle Entrate, https://www.agenziaentrate.gov.it/
- Legal basis: DM 23 dicembre 1976
- Visual format: `RSSMRA85T10A562S`

### Composition (16 chars)

| Pos | Field | Encoding |
|-----|-------|----------|
| 1-3 | Cognome | 3 consonants padded with vowels and `X` |
| 4-6 | Nome | 3 consonants per § 2 of DM |
| 7-8 | Anno | last two digits of birth year |
| 9 | Mese | letter `A`-`E, H, L, M, P, R, S, T` for Jan-Dec |
| 10-11 | Giorno | day of month; women: real day + 40 |
| 12-15 | Codice catastale | comune (1 letter + 3 digits) |
| 16 | Check char | letter A-Z |

### Algorithm

```
For each of the first 15 chars at 1-based position p:
  if p is odd:  use ODD_VALUES table (digit and letter values 0..25)
  if p is even: digits map to themselves; letters A..Z → 0..25
sum = total of the 15 lookups
check char = chr(ord('A') + sum mod 26)
```

The implementation tolerates the agenzia's "homocodia" letter substitutions in positions 7-8 and 10-11 (digit `0..9` mapped to letters `L,M,N,P,Q,R,S,T,U,V`).

### Sources

- DM 23-DEC-1976 / Agenzia delle Entrate
- `codice-fiscale-utils`, `@maranomynet/libcodicefiscale`, `python-stdnum.it.codicefiscale`

### Synthetic test vectors

```
valid:
  - RSSMRA85T10A562S   # Mario Rossi (canonical example)
  - BNCMRA70A41F205F   # F variant — donna born jan 1970, Milano
  - VRDLGI50C15F839S
  - NRARSS90E50H501L

invalid (checksum):
  - RSSMRA85T10A562A
  - AAAAAA00A00A000A

invalid (format):
  - RSSMRA85T10A562       # 15 chars
  - RSSMRA85F10A562Z      # bad month code F
  - RSSMRA85T00A562Z      # day 00
  - RSSMRA85T99A562Z      # day 99
```

## `IT_PIVA`

### Overview

Partita IVA (P.IVA). 11-digit identifier of an Italian legal entity (also coincides with the entity-form codice fiscale).

- Issuer: Agenzia delle Entrate
- Visual format: `12345678903` (no separators)
- VIES intra-EU form: `IT12345678903`

### Algorithm

Standard Luhn (ISO/IEC 7812-1) over all 11 digits.

### Sources

- Agenzia delle Entrate
- `validator.js isVAT('IT')`, `python-stdnum.it.iva`

### Synthetic test vectors

```
valid:
  - 12345678903
  - 00799960158
  - 00488410010
  - IT12345678903

invalid (checksum):
  - 12345678901
  - 12345678902

invalid (format):
  - 1234567       # too short
  - 123456789012  # too long
```

### Recent reforms

None affecting format/algorithm in the last 24 months.

### Open questions

- Add an optional `extractBirthDate(cf)` helper when v0.7 introduces per-country extractors.
