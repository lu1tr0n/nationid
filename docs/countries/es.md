# España (ES)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `ES_DNI` | both (personal + NIF for naturales españoles) | 9 (8 digits + 1 letter) | DNI letter table | high |
| `ES_NIE` | both (personal + NIF for extranjeros residentes) | 9 (1 letter + 7 digits + 1 letter) | DNI letter table after prefix substitution | high |
| `ES_NIF_PJ` | tax | 9 (1 letter + 7 digits + 1 char) | CIF mod-10 (Luhn-like) | high |

> **NIF unification (2008)**: per Real Decreto 1065/2007, persona singular's NIF is the DNI; extranjero's NIF is the NIE; jurídica's NIF retains the letter-prefix structure historically called CIF. The library exposes the legacy alias `CIF` as a synonym for `NIF_PJ`.

---

## `ES_DNI` — Documento Nacional de Identidad

### Overview

Personal identity document for Spanish citizens. Issued by the Dirección General de la Policía. Doubles as the NIF for naturales españoles.

- **Issuer**: Dirección General de la Policía — <https://www.dnielectronico.es/>
- **Composition**: 8 digits + 1 uppercase letter (control)
- **Visual format**: `00000000A` (no separator on the physical card)

### Algorithm

```
letras = "TRWAGMYFPDXBNJZSQVHLCKE"   // 23 letters; I, Ñ, O, U intentionally omitted
index = digits mod 23
expected_letter = letras[index]
valid iff expected_letter == provided_letter (case-insensitive on input)
```

### Sources

- Real Decreto 1553/2005, de 23 de diciembre — Annex (algorithm).
- AEAT NIF spec — <https://sede.agenciatributaria.gob.es/>
- `validator.js isTaxID('es-ES')` (cross-check). Accessed 2026-05-08.

### Synthetic test vectors

```
valid:
  - 12345678Z
  - 00000000T
  - 87654321X
  - 11111111H
  - 99999999R

invalid (format):
  - "" (empty)
  - 1234567Z (7 digits)
  - 123456789Z (9 digits)
  - X1234567L (NIE shape)

invalid (checksum):
  - 12345678A
  - 12345678B
  - 99999999X
  - 00000012I (forbidden letter; correct letter is N)
```

### Table coverage

The test suite iterates `i = 0..22` and asserts that body `pad(i, 8)` validates against `letras[i]` and rejects `letras[(i+1) mod 23]` — guaranteeing every row of the verifier table is exercised.

### Recent reforms

- DNI 4.0 (electronic chip refresh, 2021-2022) did not change the number/letter format.

### Open questions

None. Algorithm matches the official Annex of RD 1553/2005.

---

## `ES_NIE` — Número de Identidad de Extranjero

### Overview

Identity number for foreign residents. Issued by the Dirección General de la Policía. Doubles as the NIF for extranjeros.

- **Issuer**: Dirección General de la Policía — <https://sede.policia.gob.es/>
- **Composition**: 1 prefix letter (`X`, `Y`, or `Z`) + 7 digits + 1 control letter
- **Visual format**: `X0000000A`

### Algorithm

Substitute the prefix letter with a digit (`X→0, Y→1, Z→2`), then run the DNI letter algorithm on the resulting 8-digit number.

```
prefix_map = { X: 0, Y: 1, Z: 2 }
n = 10^7 * prefix_map[letter] + digits7
expected_letter = "TRWAGMYFPDXBNJZSQVHLCKE"[n mod 23]
```

### Sources

- Real Decreto 240/2007.
- Orden INT/2058/2008, de 14 de julio.
- AEAT NIF spec.

### Synthetic test vectors

```
valid:
  - X1234567L  (01234567 mod 23 = 19 -> 'L')
  - Y1234567X  (11234567 mod 23 = 10 -> 'X')
  - Z1234567R  (21234567 mod 23 = 1  -> 'R')
  - X0000000T
  - Z9999999H

invalid (format):
  - X123456L (6 digits)
  - X12345678L (8 digits)
  - A1234567L (bad prefix)
  - 12345678Z (DNI shape)

invalid (checksum):
  - X1234567A
  - Y1234567A
  - Z9999999A
```

### Recent reforms

None affecting format.

### Open questions

None.

---

## `ES_NIF_PJ` — NIF Persona Jurídica (legacy CIF)

### Overview

Tax identifier for legal entities. Issued by the AEAT. The historical "CIF" was unified with the NIF in 2008 (Real Decreto 1065/2007) but the 9-character letter+digits+control structure persists for jurídicas.

- **Issuer**: AEAT — <https://sede.agenciatributaria.gob.es/>
- **Composition**: 1 entity-type letter + 7 digits + 1 control char (digit OR letter)
- **Visual format**: `A12345678`

### Entity-type prefixes

| Letter | Type | DV form |
|--------|------|---------|
| A | Sociedad anónima | digit |
| B | Sociedad limitada | digit |
| E | Comunidad de bienes | digit |
| H | Comunidad de propietarios | digit |
| N | Extranjera | letter |
| P | Corporación local | letter |
| Q | Organismo público | letter |
| R | Entidad religiosa | letter |
| S | Órgano de la Administración | letter |
| W | Establecimiento permanente de entidad no residente | letter |
| C | Comanditaria | digit OR letter |
| D | (otros) | digit OR letter |
| F | Cooperativa | digit OR letter |
| G | Asociación | digit OR letter |
| J | Sociedad civil | digit OR letter |
| U | UTE | digit OR letter |
| V | Otros | digit OR letter |

### Algorithm

```
weights = [2, 1, 2, 1, 2, 1, 2]
for each digit d at position i:
    p = d * weights[i]
    sum += (p > 9) ? (p - 9) : p
r = (10 - (sum mod 10)) mod 10
expected_digit  = String(r)
expected_letter = "JABCDEFGHI"[r]
```

The check character must equal `expected_digit` for digit-DV prefixes,
`expected_letter` for letter-DV prefixes, or either for residual prefixes.

### Sources

- AEAT NIF spec — <https://sede.agenciatributaria.gob.es/>
- Real Decreto 1065/2007.
- Orden EHA/451/2008.
- `validator.js isTaxID('es-ES')` (cross-check).

### Synthetic test vectors

Body `1234567` → `r = 4` → digit `'4'`, letter `'JABCDEFGHI'[4] = 'D'`.
Body `0000000` → `r = 0` → digit `'0'`, letter `'J'`.

```
valid:
  - A12345674 (digit-DV, SA)
  - B12345674 (digit-DV, SL)
  - E12345674 (digit-DV, comunidad de bienes)
  - H12345674 (digit-DV, comunidad de propietarios)
  - A00000000 (digit-DV, r=0)
  - P1234567D (letter-DV, corporación local)
  - Q1234567D (letter-DV, organismo público)
  - R1234567D (letter-DV, religiosa)
  - S1234567D (letter-DV, órgano administración)
  - N1234567D (letter-DV, extranjera)
  - W1234567D (letter-DV, establecimiento permanente)
  - P0000000J (letter-DV, r=0 -> 'J')
  - C12345674 (either-DV, digit form)
  - C1234567D (either-DV, letter form)

invalid (format):
  - I12345674 (forbidden prefix)
  - K12345674 (forbidden prefix)
  - O12345674 (forbidden prefix)
  - T12345674 (forbidden prefix)

invalid (checksum):
  - A12345670
  - A12345678
  - P1234567A
  - A1234567D (digit-DV prefix with letter form)
  - P12345674 (letter-DV prefix with digit form)
```

### Recent reforms

- 2008 NIF unification — already applied.

### Open questions

- The historical letter `K` (menores españoles emigrantes) is sometimes seen on legacy documents but is not in the AEAT CIF prefix list; this library follows AEAT's `[ABCDEFGHJNPQRSUVW]` prefix regex and rejects K. If a consumer needs to accept legacy K-prefix identifiers, file an issue to discuss a separate `ES_NIF_K` type.
