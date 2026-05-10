# Paraguay (PY)

## Specs

| Code | Type | Confidence | Length | Check digit |
|------|------|------------|--------|-------------|
| `PY_CI` | personal | moderate | 6-9 digits | none (format only) |
| `PY_RUC` | tax | moderate | 6-9 base + 1 DV | mod-11 ascending weights |

## `PY_CI` — Cédula de Identidad

- **Issuer**: Departamento de Identificaciones — Policía Nacional del Paraguay
- **Source**: <https://www.policianacional.gov.py/>
- **Visual format**: digits, no separator
- **Algorithm**: none publicly documented. Validation is length + charset only.

### Synthetic test fixtures

```
valid:
  - 123456
  - 1234567
  - 12345678
  - 123456789

invalid:
  - 12345         (too short)
  - 1234567890    (too long)
```

### Notes

- The Policía Nacional does not publish a verifier algorithm; `confidence: "moderate"` reflects the well-documented length range alone.

## `PY_RUC` — Registro Único de Contribuyentes

- **Issuer**: SET (Subsecretaría de Estado de Tributación)
- **Source**: <https://www.set.gov.py/>
- **Legal basis**: Ley 125/91 (Sistema Tributario)
- **Visual format**: `12345678-9` (6-9 base digits + hyphen + DV)

### Algorithm

mod-11 with **ascending weights** `2, 3, 4, ..., N` applied **right-to-left** over the base digits (not including the DV).

```
weights are 2 from the rightmost base digit and grow leftward
sum = sum(digit_i * weight_i)
r   = sum mod 11
dv  = 0          if r <= 1
    = 11 - r     otherwise
```

### Synthetic test fixtures

```
valid:
  - 80000000-5    (8-digit base, sum=72, r=6, dv=5)
  - 12345678-9    (8-digit base, sum=156, r=2, dv=9)
  - 11111111-0    (8-digit base, sum=44, r=0, dv=0)
  - 9999999-4     (7-digit base, sum=315, r=7, dv=4)
  - 100000-4      (6-digit base, sum=7, r=7, dv=4)

invalid (checksum):
  - 80000000-4
  - 12345678-0
  - 11111111-1
```

### Sources

- SET RUC documentation: <https://www.set.gov.py/>
- Cross-validated against the `paraguay-ruc` npm package (algorithm replicated identically).

### Notes

- The DV branch `r <= 1 → 0` (vs `r > 1 → 11 - r`) avoids the `dv ∈ {10, 11}` collision typical of mod-11 schemes.
- `confidence: "moderate"` because SET does not publish a single canonical algorithm document; the formula is replicated across vendor tools and matches SET-aligned issuers.

---

## `PY_PASAPORTE` — Pasaporte

### Overview

Travel document issued by the Departamento de Identificaciones de la Policía
Nacional. Legacy issues are 6-8 digit numeric; biometric passports may use
letter + digits.

- **Issuer**: Policía Nacional — <https://www.policianacional.gov.py/>
- **Composition**: 6-9 alphanumeric (lenient)
- **Visual format**: contiguous chars

### Algorithm

None on the printed number. MRZ check digit lives in
`algorithms/icao-9303.ts`.

### Confidence

`low` — no first-party publication.

### Sources

- Policía Nacional: <https://www.policianacional.gov.py/>
