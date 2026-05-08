# Argentina (AR)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `AR_DNI` | personal | 7-8 | none | high (format) |
| `AR_CUIL` | personal (labor) | 11 | mod-11 | high |
| `AR_CUIT` | tax | 11 | mod-11 | high |

## `AR_DNI` — Documento Nacional de Identidad

### Overview

Personal identity document issued by RENAPER. Has no check digit on its own; validation is length + digits only.

- **Issuer**: RENAPER — <https://www.argentina.gob.ar/dni>
- **Visual format**: `00.000.000` (7-8 digits with thousands separators)
- **Legal basis**: Ley 17.671

### Sources

- RENAPER portal: <https://www.argentina.gob.ar/dni>

---

## `AR_CUIL` — Clave Única de Identificación Laboral

Same algorithm and length as CUIT, but issued by ANSES for labor purposes. Validates with the same mod-11.

- **Issuer**: ANSES — <https://www.anses.gob.ar/>
- **Visual format**: `XX-DDDDDDDD-V`

### Algorithm

See CUIT below — identical.

---

## `AR_CUIT` — Clave Única de Identificación Tributaria

### Overview

Tax identifier. Issued by AFIP (renamed **ARCA** — Agencia de Recaudación y Control Aduanero — per Decreto 953/2024). Despite the rebrand, format and algorithm are unchanged.

- **Issuer**: ARCA (formerly AFIP) — <https://www.arca.gob.ar/>
- **Composition**: 2 prefix + 8 base + 1 verifier
  - Prefixes: `20`, `23`, `24`, `25`, `26`, `27` for personas físicas; `30`, `33`, `34` for personas jurídicas
- **Visual format**: `XX-DDDDDDDD-V`
- **Legal basis**: RG AFIP 10/1997

### Algorithm

mod-11 with weights `[5, 4, 3, 2, 7, 6, 5, 4, 3, 2]` over the first 10 digits.

```
sum = sum(digit[i] * weights[i] for i in 0..9)
r   = sum mod 11
dv  = 11 - r

if dv == 11: dv = 0
if dv == 10: number is invalid by convention.
             AFIP issues prefix 23 or 24 instead of 20/27 for these persons
             (RG AFIP 10/97 § 4) and recomputes.
```

### Sources

- ARCA / AFIP normativa: <https://www.arca.gob.ar/>
- RG AFIP 10/1997 § 4 (special handling for `dv == 10`)
- Cross-validated against `validator.js` and Argentine fintech libraries

### Recent reforms

- **2024** — Decreto 953/2024 renames AFIP to ARCA. Format and algorithm unchanged. Old `afip.gob.ar` URLs continue to work.
