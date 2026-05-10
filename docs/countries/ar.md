# Argentina (AR)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `AR_DNI` | personal | 7-8 | none | high (format) |
| `AR_CUIL` | personal (labor) | 11 | mod-11 | high |
| `AR_CUIT` | tax | 11 | mod-11 | high |
| `AR_CDI` | tax (alterno) | 11 | mod-11 | high |

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

---

## `AR_CDI` — Clave de Identificación

### Overview

Identifier assigned by ARCA (ex-AFIP) to natural persons who do not hold CUIT or CUIL but must appear in tributary operations: extranjeros sin obligación tributaria, sucesiones indivisas, menores, herederos. Same algorithm and length as CUIT/CUIL; only the prefix is different.

- **Issuer**: ARCA (formerly AFIP) — <https://www.arca.gob.ar/>
- **Composition**: 2 prefix + 8 base + 1 verifier
  - Prefix: `50` (asignado por ARCA cuando no hay DNI)
- **Visual format**: `XX-DDDDDDDD-V`
- **Legal basis**: RG AFIP 3995/2017 (CDI assignment); RG AFIP 10/1997 § 4 (DV algorithm reused)

### Algorithm

Identical to `AR_CUIT` — mod-11 with weights `[5, 4, 3, 2, 7, 6, 5, 4, 3, 2]` over the first 10 digits. The library reuses `computeCuitDV` from `src/countries/ar/shared.ts`; the only difference vs CUIT/CUIL is the allowed prefix set (`{ "50" }`).

### Synthetic test vectors

```
valid:
  - 50-12345678-2
  - 50-11111111-9
  - 50-00000000-8
  - 50-98765432-2
  - 50-50000000-4

invalid (format):
  - "" (empty)
  - 5012345678   (10 digits)
  - 501234567823 (12 digits)
  - 20-12345678-6 (CUIT prefix; correct CUIT DV but rejected as CDI)
  - 30-70123456-8 (CUIT prefix; correct CUIT DV but rejected as CDI)

invalid (checksum):
  - 50-12345678-0
  - 50-11111111-0
  - 50-50000000-5
```

### Sources

- ARCA / AFIP normativa: <https://www.arca.gob.ar/>
- RG AFIP 3995/2017 (CDI assignment by ARCA when no CUIT/CUIL is available)
- RG AFIP 10/1997 § 4 (DV algorithm; reused by CDI)
- Cross-reference: `python-stdnum.ar.cuit` validates CUIT/CUIL/CDI identically (same algorithm). `validator.js isTaxID('es-AR')` only knows the CUIT prefixes and rejects CDI's `50` prefix; this is a documented divergence (`validator.js` covers the tax-id subset, not the CDI fallback).

### Open questions

None. The `50` prefix is the documented CDI assignment per RG AFIP 3995/2017; algorithm parity with CUIT is reaffirmed in the same regulation.

---

## `AR_PASAPORTE` — Pasaporte

### Overview

Travel document issued by RENAPER. Legacy issuances used a 9-digit numeric
sequential number; post-2012 passports use a pseudo-random alphanumeric of
similar length (8-9 chars).

- **Issuer**: RENAPER — <https://www.argentina.gob.ar/renaper>
- **Composition**: 8-9 alphanumeric
- **Visual format**: contiguous chars

### Algorithm

None on the printed number. MRZ check digit lives in
`algorithms/icao-9303.ts`.

### Confidence

`low` — RENAPER has not published the post-2012 alphanumeric format spec.

### Sources

- Wikipedia, *Argentine passport*: <https://en.wikipedia.org/wiki/Argentine_passport>
