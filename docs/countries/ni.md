# Nicaragua (NI)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `NI_CEDULA` | personal | 14 | none (alphabetic DV not documented) | low |
| `NI_RUC` | tax | 14 | none | low |

## `NI_CEDULA` — Cédula de Identidad

### Overview

Personal identity document for Nicaraguan citizens. Issued by the Consejo Supremo Electoral (CSE).

- **Issuer**: CSE — <https://www.cse.gob.ni/>
- **Composition**: 3 digits municipio + 6 digits DDMMYY (fecha de nacimiento) + 4 digits correlativo + 1 letra DV
- **Visual format**: `001-130180-0008X`

### Algorithm

The CSE does not publish the DV algorithm. Community libraries do not converge on a single formula. We therefore validate **format only**, with a structural check on the embedded date field:

```
length == 14
charset == [digits 0-9] x 13 + [ABCDEFGHJKLMNPQRSTUVWXY] x 1
municipio != "000"
01 <= DD <= 31
01 <= MM <= 12
```

The trailing DV letter is accepted as A-Z **excluding `I`, `O` and `Z`** (CSE excludes those to avoid visual confusion with `1`, `0` and `2`). No checksum verification is performed.

### Sources

- CSE portal: <https://www.cse.gob.ni/> (institutional reference)
- Ley 152/93 — Ley de Identificación Ciudadana

### Synthetic test vectors

```
valid:
  - 0011301800008X
  - 001-130180-0008X
  - 1232812900099Y
  - 555-071285-0500K

invalid (format):
  - "" (empty)
  - 1234 (too short)
  - 0011301800008XYZ (too long)
  - 0011301800008Ñ (non-A-Z letter)
  - 0011301800008I (DV letter I excluded)
  - 0011301800008O (DV letter O excluded)
  - 0011301800008Z (DV letter Z excluded)
  - ABCDEFGHIJKLMN (all letters)

invalid (structure):
  - 0001301800008X (municipio = 000)
  - 0013201800008X (day = 32)
  - 0011513800008X (month = 13)
```

### Recent reforms

None known affecting the format. CSE issuance has been suspended at times due to political/administrative reasons; the format itself has not changed since the 1990s.

### Open questions

- The alphabetic DV algorithm is not publicly documented. Confidence will remain `low` until in-country verification surfaces a reproducible formula.
- The municipio catalog (codes 001-999, with sparse assignments) is not embedded; we accept any `001-999` to avoid coupling the validator to an outdated catalog.

---

## `NI_RUC` — Registro Único de Contribuyentes

### Overview

Tax identifier for naturales (cédula form) and jurídicas (14 digits). Issued by the DGI Nicaragua.

- **Issuer**: DGI — <https://www.dgi.gob.ni/>
- **Composition (natural)**: same as `NI_CEDULA`
- **Composition (jurídica)**: 14 digits (no public field breakdown)

### Algorithm

Format-only:

```
length == 14
form A: \d{13}[A-Z]   (natural)
form B: \d{14}        (jurídica)
```

### Sources

- DGI portal: <https://www.dgi.gob.ni/>
- Ley 562/05 — Código Tributario

### Synthetic test vectors

```
valid:
  - 0011301800008X (natural)
  - 12345678901234 (jurídica)
  - 1234-5678901-234

invalid:
  - "" (empty)
  - 12345678901234X (15 chars)
  - ABCDEFGHIJKLMN (no digits)
```

### Recent reforms

None known affecting the format.

### Open questions

- Field-level breakdown of the 14-digit jurídica RUC is not publicly documented.
- DGI may compute an internal verifier for jurídicas; if confirmed, this should be promoted from `low` to `moderate`.

---

## `NI_PASAPORTE` — Pasaporte

### Overview

Travel document issued by the Dirección General de Migración y Extranjería
(DGME NI). Format is typically 1 letter + 7 digits or 8 digits.

- **Issuer**: DGME NI — <https://www.migob.gob.ni/migracion/>
- **Composition**: optional 1 letter + 7-8 digits (lenient)
- **Visual format**: contiguous chars

### Algorithm

None on the printed number. MRZ check digit lives in
`algorithms/icao-9303.ts`.

### Confidence

`low` — no first-party publication.

### Sources

- DGME NI: <https://www.migob.gob.ni/migracion/>
