# Ecuador (EC)

## Specs

| Code | Type | Confidence | Length | Check digit |
|------|------|------------|--------|-------------|
| `EC_CEDULA` | personal | high | 10 digits | Luhn-variant |
| `EC_RUC` | tax | high | 13 digits | mod-11 (3 branches) |

## `EC_CEDULA` — Cédula de Identidad

- **Issuer**: Dirección General de Registro Civil, Identificación y Cedulación
- **Source**: <https://www.registrocivil.gob.ec/>
- **Legal basis**: Ley Orgánica de Gestión de la Identidad y Datos Civiles
- **Visual format**: 10 digits, no separator

### Composition

| Position | Length | Field      |
|----------|--------|------------|
| 1-2      | 2      | provincia (01-24, or 30 = exterior) |
| 3        | 1      | indicador (must be `< 6` for personas naturales) |
| 4-9      | 6      | correlativo |
| 10       | 1      | DV (Luhn-variant) |

### Algorithm

Luhn-variant with weights `[2, 1, 2, 1, 2, 1, 2, 1, 2]` applied **left-to-right** over the first 9 digits.

```
for each i in 0..8:
  p = digit_i * weights_i
  if p > 9 then p = p - 9
  sum += p

r  = sum mod 10
dv = (10 - r) mod 10
```

### Synthetic test fixtures

```
valid:
  - 1710034065   (provincia 17, dv=5)
  - 0912345675   (provincia 09, dv=5)
  - 3012345678   (provincia 30 — exterior, dv=8)

invalid (checksum):
  - 1710034066
  - 0912345670

invalid (provincia):
  - 2510034065   (provincia 25 — out of range)

invalid (3rd digit):
  - 1770034065   (d3=7, only naturales accepted here)
```

### Sources

- Servicio de Rentas Internas (SRI), instructivo de validación
- Cross-validated against `cedula-ec`, `ec-validator`, `python-stdnum stdnum.ec.ci`

## `EC_RUC` — Registro Único de Contribuyentes

- **Issuer**: SRI (Servicio de Rentas Internas)
- **Source**: <https://www.sri.gob.ec/>
- **Legal basis**: Ley del RUC; SRI Resolución NAC-DGERCGC
- **Visual format**: 13 digits, no separator (e.g. `1710034065001`)

### Composition

| Position | Length | Field |
|----------|--------|-------|
| 1-2      | 2      | provincia (01-24 or 30) |
| 3        | 1      | tipo (`< 6` natural, `= 6` pública, `= 9` jurídica) |
| 4-...    | varies | correlativo + DV (depends on branch) |
| 11-13    | 3      | establecimiento (`001` matriz, `002+` sucursales) |

### Algorithm

Three branches based on the 3rd digit:

| Branch | 3rd digit | Algorithm | DV position (1-indexed) |
|--------|-----------|-----------|--------------------------|
| Natural | `< 6` | Luhn-variant on first 10 digits (same as cédula) | 10 |
| Pública | `= 6` | mod-11 with weights `[3,2,7,6,5,4,3,2]` over first 8 digits; pos 10 must be `0` | 9 |
| Jurídica privada | `= 9` | mod-11 with weights `[4,3,2,7,6,5,4,3,2]` over first 9 digits | 10 |

For both mod-11 branches:

```
r        = sum mod 11
dv       = 0           if r == 0
         = 11 - r      otherwise
(reject if dv == 11)
```

The 3-digit establecimiento is validated as `>= 001`. It is **not** part of the checksum body.

### Synthetic test fixtures

```
valid:
  - 1710034065001   (natural, matriz)
  - 0900000019001   (natural, provincia 09)
  - 1791000005001   (jurídica privada)
  - 1760000070001   (sociedad pública — pos 10 = 0)

invalid:
  - 1710034066001   (bad natural DV)
  - 1791000004001   (bad jurídica DV)
  - 1760000071001   (pública with pos 10 != 0)
  - 1710034065000   (establecimiento `000`)
  - 1770000000001   (3rd digit ∈ {7, 8} — no algorithm)
```

### Notes

- Naturales: their cédula is the first 10 digits of their RUC; the suffix `001` denotes the matriz.
- Sociedad pública RUCs always carry `0` at position 10 (1-indexed); position 9 carries the verifier.
- `confidence: "high"`: SRI publishes the algorithm in its instructive and the formula matches mature libraries (`cedula-ec`, `python-stdnum stdnum.ec.ruc`).

---

## `EC_PASAPORTE` — Pasaporte

### Overview

Travel document issued by the Ministerio de Relaciones Exteriores y Movilidad
Humana. Andean Community design. Numbers reported as 9 chars alphanumeric,
often with letter prefix `A` or numeric-only.

- **Issuer**: Ministerio de Relaciones Exteriores y Movilidad Humana
- **Composition**: 8-9 alphanumeric (lenient)
- **Visual format**: contiguous chars

### Algorithm

None on the printed number. MRZ check digit lives in
`algorithms/icao-9303.ts`.

### Confidence

`low`.

### Sources

- Wikipedia, *Ecuadorian passport*: <https://en.wikipedia.org/wiki/Ecuadorian_passport>
