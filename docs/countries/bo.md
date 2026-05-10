# Bolivia (BO)

## Specs

| Code | Type | Confidence | Length | Check digit |
|------|------|------------|--------|-------------|
| `BO_CI` | personal | moderate | 6-9 digits + optional 2-letter dept | none (format only) |
| `BO_NIT` | tax | low | 7-13 digits | none (format only) |

## `BO_CI` — Cédula de Identidad

- **Issuer**: SEGIP (Servicio General de Identificación Personal)
- **Source**: <https://www.segip.gob.bo/>
- **Legal basis**: Ley 145/2011 — Ley del Servicio General de Identificación Personal
- **Visual format**: `1234567 LP` (digits + 2-letter departamental complement)
- **Algorithm**: none publicly documented. Validation is length + charset only.

Departmental codes (the 9 departamentos):

| Code | Departamento  |
|------|---------------|
| `LP` | La Paz        |
| `CB` | Cochabamba    |
| `SC` | Santa Cruz    |
| `OR` | Oruro         |
| `PT` | Potosí        |
| `CH` | Chuquisaca    |
| `TJ` | Tarija        |
| `BE` | Beni          |
| `PA` | Pando         |

### Synthetic test fixtures

```
valid:
  - 1234567
  - 1234567 LP
  - 1234567-LP
  - 12345678
  - 1234567 SC

invalid:
  - 12345        (too short)
  - 1234567890   (too long)
  - 1234567 ZZ   (unknown dept)
```

### Notes

- Lowercase dept codes are accepted on input; output is normalized to uppercase.
- The library accepts both `space` and `hyphen` as the separator between the digit body and the dept code.

## `BO_NIT` — Número de Identificación Tributaria

- **Issuer**: SIN (Servicio de Impuestos Nacionales)
- **Source**: <https://www.impuestos.gob.bo/>
- **Legal basis**: RND 102100000011/2021 (NIT migration to 13 digits)
- **Visual format**: digits, no separator
- **Algorithm**: none publicly documented for legacy 7-11 digit NITs. The new 13-digit NIT (post-2021) corresponds to `CI + DV`, but SIN does not publish the DV formula. Validation is length + charset only.

### Synthetic test fixtures

```
valid:
  - 1234567        (legacy 7-digit)
  - 12345678       (legacy 8-digit)
  - 1234567890     (legacy 10-digit)
  - 1234567890123  (new 13-digit)

invalid:
  - 123456            (too short)
  - 12345678901234    (too long)
  - ABCDEFG           (non-digits)
```

### Notes

- Both legacy and post-2021 NIT formats coexist on the same identifier space.
- `confidence: "low"` because there is no enforced check digit.
