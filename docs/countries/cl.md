# Chile (CL)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `CL_RUT` | both (universal) | 1-8 base + 1 DV | mod-11 cyclic | high |

## `CL_RUT` — Rol Único Tributario / Rol Único Nacional

### Overview

Universal personal + tax identifier. Naturales receive a **RUN** from the Servicio de Registro Civil; jurídicas receive a **RUT** from the Servicio de Impuestos Internos. Both share the same number space and validation algorithm — `nationid` exposes them as a single document type.

- **Issuer**: Servicio de Impuestos Internos (jurídicas) and Registro Civil (naturales)
- **Source**: <https://www.sii.cl/>
- **Visual format**: `12.345.678-5` or `8.765.432-K` with thousands separators
- **Legal basis**: DFL 3/1969

### Algorithm

mod-11 with cyclic weights `2, 3, 4, 5, 6, 7` applied right-to-left.

```
weights = cycle [2, 3, 4, 5, 6, 7]  applied right-to-left over the base digits
sum     = sum(digit_i * weight_i)
r       = sum mod 11
dv      = 11 - r

if dv == 11: '0'
if dv == 10: 'K'
otherwise:    str(dv)
```

### Sources

- Servicio de Impuestos Internos: <https://www.sii.cl/>
- DFL 3/1969 (Registro Civil)
- Cross-validated against `rut.js` (npm) and `validator.js`

### Synthetic test vectors

```
valid:
  - 12345678-5
  - 8765432-K
  - 12.345.678-5
  - 8.765.432-K

invalid (format):
  - 1234 (no DV)
  - abcdefg (non-digits)

invalid (checksum):
  - 12345678-0
  - 8765432-9
```

### Notes

- The DV `K` is **case-insensitive** in input but normalized to uppercase `K` in output
- All-same-digit sequences pass the checksum but are accepted by SII without restriction (different from BR CPF convention)
