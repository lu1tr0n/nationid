# El Salvador (SV)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `SV_DUI` | both (personal + tax for naturales post-2021) | 9 | mod-10 weighted | moderate |
| `SV_NIT` | tax | 14 | mod-11 weighted | moderate |

## `SV_DUI` — Documento Único de Identidad

### Overview

Personal identity document for Salvadoran citizens. Issued by the Registro Nacional de las Personas Naturales (RNPN). Since Decree 763 (July 2021), the DUI doubles as the NIT for natural persons in DTE invoicing (CAT-022 `tipoDocumento` value `13`).

- **Issuer**: RNPN — <https://www.rnpn.gob.sv/>
- **Composition**: 8 sequential digits + 1 check digit
- **Visual format**: `XXXXXXXX-X`

### Algorithm

mod-10 weighted with descending weights from 9 to 2 over the first 8 digits.

```
weights = [9, 8, 7, 6, 5, 4, 3, 2]
sum     = sum(digit[i] * weights[i] for i in 0..7)
expected_dv = (10 - (sum mod 10)) mod 10
valid iff expected_dv == digit[8]
```

### Sources

- RNPN portal: <https://www.rnpn.gob.sv/> (July 2021 Decreto 763 reform)
- Algorithm reverse-engineered from established Salvadoran fintech repositories and DGII-DTE schema validators (the issuer does not publish the formula publicly)

### Synthetic test vectors

```
valid:
  - 045678903
  - 04567890-3
  - 123456784
  - 12345678-4
  - 000000000

invalid (format):
  - "" (empty)
  - 1234 (too short)
  - 1234567890 (too long)
  - abcdefghi (non-digits)

invalid (checksum):
  - 045678900
  - 123456780
  - 987654321
```

### Recent reforms

- **2021-07** — Decreto 763 makes DUI valid as NIT for natural persons in DTE / CFE schemes.

### Open questions

- The RNPN does not publish the mod-10 weight formula publicly. Confidence remains `moderate` until in-country verification confirms.

---

## `SV_NIT` — Número de Identificación Tributaria

### Overview

Tax identifier for businesses (and historically for natural persons before the DUI=NIT reform). Issued by the Ministerio de Hacienda — Dirección General de Impuestos Internos (DGII).

- **Issuer**: Ministerio de Hacienda — <https://www.mh.gob.sv/>
- **Composition**: 4 digits municipio + 6 digits ddmmyy (date of birth or constitution) + 3 digits correlative + 1 check digit
- **Visual format**: `AAAA-DDMMYY-NNN-D`

### Algorithm

mod-11 weighted with descending weights from 14 to 2 over the first 13 digits.

```
weights = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2]
sum     = sum(digit[i] * weights[i] for i in 0..12)
mod     = sum mod 11
expected_dv =
   0          if mod == 0
   1          if mod == 1
   11 - mod   otherwise
valid iff expected_dv == digit[13]
```

### Sources

- DGII DTE schema (FE v1, CCF v3) and CAT-022 `tipoDocumento` catalog: <https://www.mh.gob.sv/>
- Algorithm verified against DGII validators used by ERPs implementing DTE submission

### Synthetic test vectors

```
valid:
  - 06141505851015
  - 0614-150585-101-5

invalid (format):
  - 1234 (too short)
  - 061415058510155 (too long)
  - ABCDEFGHIJKLMN (non-digits)

invalid (checksum):
  - 06141505851010
  - 06141505851014
```

### Recent reforms

- **2021-07** — DUI may be used in lieu of NIT for natural persons (Decreto 763).
- DTE schema migrations (FE v1 → CCF v3) preserved the NIT format unchanged.

### Open questions

- Hacienda does not publish the mod-11 weight vector publicly. Algorithm matches DGII validators in production use; confidence remains `moderate`.
