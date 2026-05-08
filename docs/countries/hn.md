# Honduras (HN)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `HN_DNI` | personal | 13 | none (structural validation) | low |
| `HN_RTN` | tax | 14 | none | unconfirmed |

## `HN_DNI` — Documento Nacional de Identificación

### Overview

National personal identity document issued by the Registro Nacional de las Personas (RNP). The number embeds the holder's municipio of registration and birth year, but the RNP does not publish a check-digit algorithm.

- **Issuer**: RNP — <https://www.rnp.hn/>
- **Composition**: 4 digits municipio (2 departamento + 2 municipio) + 4 digits año de nacimiento + 5 digits correlativo
- **Visual format**: `0000-0000-00000`
- **Legal basis**: Decreto 62-2004, Ley del RNP

### Algorithm

No check-digit algorithm is publicly documented. This spec validates **format and structure only**:

- 13 digits.
- Departamento (positions 1-2) must be in `01..18` — Honduras has 18 departamentos.
- Año de nacimiento (positions 5-8) must be in `1900..2099`.

```
valid iff
  digits.length == 13 AND
  01 <= int(digits[0:2]) <= 18 AND
  1900 <= int(digits[4:8]) <= 2099
```

### Sources

- RNP portal: <https://www.rnp.hn/>
- Decreto 62-2004 (Ley del Registro Nacional de las Personas)

### Synthetic test vectors

```
valid:
  - 0801-1990-12345
  - 0501-1985-00001
  - 1801-2000-99999
  - 1001-1955-01234
  - 0301-1945-00005
  - 0701-2010-99999

invalid (format):
  - "" (empty)
  - 1234 (too short)
  - 08011990123456 (too long)
  - ABCD-EFGH-IJKLM (non-digits)
  - 0001-1990-12345 (departamento 00)
  - 1901-1990-12345 (departamento 19, not assigned)
  - 0801-0000-12345 (año implausible)
  - 0801-1899-12345 (año implausible)
```

### Recent reforms

- **2021 (DNI redesign)** — RNP rolled out a new DNI card format. The numeric format and length were preserved.

### Open questions

- No public verifier algorithm. Callers needing canonical confirmation of a DNI must query the RNP API.
- Municipio codes (positions 3-4) are **not** validated by this spec — only departamento (1-2) and año (5-8). Add a per-departamento municipio table if/when one becomes publicly citable.

---

## `HN_RTN` — Registro Tributario Nacional

### Overview

Tax identifier issued by the Servicio de Administración de Rentas (SAR). For persona natural, the RTN is typically the 13-digit DNI plus 1 secuencial digit; for persona jurídica the RTN is a 14-digit correlativo.

- **Issuer**: SAR — <https://www.sar.gob.hn/>
- **Composition**: 14 digits with no canonical separator
- **Visual format**: `0000-0000-000000`
- **Legal basis**: Decreto 17-2010, Código Tributario

### Algorithm

No public check-digit algorithm. This spec validates **length only**, plus a standard all-same-digit placeholder rejection.

```
valid iff
  digits.length == 14 AND
  not allSameDigit(digits)
```

### Sources

- SAR portal: <https://www.sar.gob.hn/>
- Decreto 17-2010

### Synthetic test vectors

```
valid:
  - 0801-9990-123456
  - 1234-5678-901234
  - 9988-7766-554433
  - 0801-1990-000001
  - 0501-1985-123456

invalid (format):
  - "" (empty)
  - 1234 (too short)
  - 0801-9990-1234567 (too long)
  - ABCDEFGHIJKLMN (non-digits)
  - 00000000000000 (all-same-digit placeholder)
```

### Open questions

- The SAR does not publish a verifier algorithm and several commercial billing platforms implement private internal heuristics. Confidence remains `unconfirmed` until either SAR publishes documentation or in-country reverse-engineering converges.
- For persona natural, the RTN body matches the DNI; consumers can cross-validate the first 13 digits as `HN_DNI`. This spec keeps the documents independent for clarity.
