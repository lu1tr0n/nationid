# Uruguay (UY)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `UY_CI` | personal | 8 | mod-10 weighted | high |
| `UY_RUT` | tax | 12 | mod-11 weighted (right-to-left) | moderate |

## `UY_CI` — Cédula de Identidad

### Overview

Personal identity document for Uruguayan citizens and residents. Issued by the Dirección Nacional de Identificación Civil (DNIC).

- **Issuer**: DNIC — <https://www.gub.uy/ministerio-interior/>
- **Composition**: 7 digits correlativo + 1 dígito verificador
- **Visual format**: `0.000.000-0`

### Algorithm

mod-10 weighted with weights `[2, 9, 8, 7, 6, 3, 4]` applied left-to-right over the first 7 digits.

```
weights = [2, 9, 8, 7, 6, 3, 4]
sum     = sum(digit[i] * weights[i] for i in 0..6)
r       = sum mod 10
expected_dv = (10 - r) mod 10
valid iff expected_dv == digit[7]
```

### Sources

- DNIC: <https://www.gub.uy/ministerio-interior/>
- Ley 19.515 (legal basis)
- Algorithm widely documented and matches `validador-cedula-uruguay`, `cedula-uruguay`, and other established Uruguayan civic-tech repos.

### Synthetic test vectors

```
valid:
  - 12345672 / 1.234.567-2
  - 40985731 / 4.098.573-1
  - 45678905
  - 10000008
  - 35009005
  - 98765438

invalid (format):
  - "" (empty)
  - 1234 (too short)
  - 123456789 (too long)
  - abcdefgh (non-digits)

invalid (checksum):
  - 12345670
  - 40985730
  - 98765430
```

### Recent reforms

- Ley 19.515 (2017) consolidated the legal framework; the algorithm and 8-digit length predate this and remain unchanged.

### Open questions

- 7-digit cédulas issued before the DV was added still circulate in legacy systems. We do not currently accept the bare 7-digit form; if needed, a dedicated `UY_CI_LEGACY` could be introduced later.

---

## `UY_RUT` — Registro Único Tributario

### Overview

Tax identifier issued by the DGI (Dirección General Impositiva).

- **Issuer**: DGI — <https://www.dgi.gub.uy/>
- **Composition**: 2 prefijo + 6 base + 3 sucursal (`000` for casa matriz) + 1 DV
- **Visual format**: `00-000000-000-0`

### Algorithm

mod-11 with weights `[4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]` applied **right-to-left** over the 11-digit body (the rightmost body digit pairs with weight 4).

```
weights = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]   # applied to body[-1], body[-2], ...
sum     = sum(body[-(i+1)] * weights[i] for i in 0..10)
r       = sum mod 11
expected_dv =
    0           if r == 0
    1           if r == 1
    11 - r      otherwise
valid iff expected_dv == digit[11]
```

### Sources

- DGI: <https://www.dgi.gub.uy/>
- Decreto 597/988
- Algorithm matches established Uruguayan community libraries.

### Synthetic test vectors

```
valid:
  - 211234567001 / 21-123456-700-1
  - 210000010006
  - 219876543004
  - 120000000003
  - 135000000002

invalid (format):
  - "" (empty)
  - 12345678901 (11 digits)
  - 1234567890123 (13 digits)

invalid (checksum):
  - 211234567000
  - 211234567002
```

### Recent reforms

None known affecting format or algorithm.

### Open questions

- DGI does not publish the formula in a normative text; the algorithm is documented administratively. Confidence remains `moderate` until the formula is reconfirmed against an authoritative DGI publication.
