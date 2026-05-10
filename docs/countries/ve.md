# Venezuela (VE)

> Reference for `nationid` consumers and contributors.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `VE_CEDULA` | personal | 1 letter prefix + 7-8 digits | none | low |
| `VE_RIF` | tax (singular + jurídica + gobierno) | 1 letter prefix + 9 digits | mod-11 weighted with letter coefficient | moderate |

> The personal Cédula and the tax RIF use overlapping letter prefixes (`V`, `E` for naturales and extranjeros). The two documents are distinct: a person typically has both, and the RIF is derived from the cédula by appending a SENIAT-assigned correlative + DV.

---

## `VE_CEDULA` — Cédula de Identidad

### Overview

Personal identification document issued by SAIME (Servicio Administrativo de Identificación, Migración y Extranjería). Required for all civil interactions: voting, banking, employment, healthcare.

- **Issuer**: SAIME — <http://www.saime.gob.ve/>
- **Composition**: 1 letter prefix (`V` venezolano | `E` extranjero residente) + 7 to 8 correlative digits
- **Visual format**: `V-12345678`

### Algorithm

None. SAIME does not assign a verification digit. The library validates format only (prefix charset + digit length).

### Sources

- SAIME portal. Accessed 2026-05-10.

### Synthetic test vectors

```
valid (format-only):
  - V-12345678
  - V-1234567   (7-digit correlative — older issuance)
  - E-87654321
  - E-1234567

invalid (format):
  - ""
  - V-123       (too short)
  - V-123456789 (too long)
  - 12345678    (missing prefix)
  - X-12345678  (unsupported prefix)
  - J-12345678  (J is RIF-only, not Cédula)
```

### Open questions

- Future SAIME reforms may introduce a check digit; in that case promote confidence to moderate / high.

---

## `VE_RIF` — Registro de Información Fiscal

### Overview

Tax identifier issued by SENIAT (Servicio Nacional Integrado de Administración Aduanera y Tributaria). Required for any economic activity (employment income, invoicing, importing, etc.).

- **Issuer**: SENIAT — <http://www.seniat.gob.ve/>
- **Legal basis**: Providencia SNAT/2003/1697
- **Composition**: 1 letter prefix + 8 correlative digits + 1 dígito verificador
- **Visual format**: `J-12345678-9`

### Letter prefixes

| Letter | Holder type | Letter value (algorithm) |
|---|---|---|
| `V` | natural venezolano | 4 |
| `E` | extranjero residente | 8 |
| `J` | persona jurídica (empresa) | 12 |
| `P` | pasaporte (extranjero no residente con actividad económica) | 16 |
| `G` | organismo gubernamental | 20 |
| `C` | consejo comunal | 24 |

The library exposes a holder-type helper:

```ts
import { rifHolderType } from "nationid/ve";
rifHolderType("J-12345678-4"); // "juridica"
rifHolderType("V-12345678-1"); // "natural_venezolano"
```

### Algorithm

```
weights = [3, 2, 7, 6, 5, 4, 3, 2]            // applied LTR over the 8 correlative digits
letter_value = { V: 4, E: 8, J: 12, P: 16, G: 20, C: 24 }[prefix]
sum_d = sum(digit_i * weights_i for i in 0..7)
r = (sum_d + letter_value) mod 11
DV = 11 - r
if DV >= 10: DV = 0
```

### Sources

- SENIAT — Providencia SNAT/2003/1697.
- Community libraries `rif.js`, `validador-rif`. Algorithm parity confirmed against multiple independent implementations.

### Synthetic test vectors

Body `12345678` weight-sum is `138` for every prefix below.

```
valid:
  - V-12345678-1  (letter=4,  138+4=142,  r=10, DV=1)
  - E-12345678-8  (letter=8,  138+8=146,  r=3,  DV=8)
  - J-12345678-4  (letter=12, 138+12=150, r=7,  DV=4)
  - P-12345678-0  (letter=16, 138+16=154, r=0,  DV=11→0 wrap)
  - G-12345678-7  (letter=20, 138+20=158, r=4,  DV=7)
  - C-12345678-3  (letter=24, 138+24=162, r=8,  DV=3)
  - V-00000000-7  (letter=4,  0+4=4,      r=4,  DV=7)
  - J-00000000-0  (letter=12, 0+12=12,    r=1,  DV=10→0 wrap)
  - J-31415926-7  (letter=12, 124+12=136, r=4,  DV=7)

invalid (format):
  - ""
  - X-12345678-0   (unsupported prefix)
  - Z-12345678-0   (unsupported prefix)
  - 1-12345678-0   (digit prefix)
  - J-1234-5       (too short)
  - J-123456789-0  (too long)
  - J-ABCDEFGH-4   (letters in correlative)

invalid (checksum):
  - J-12345678-0
  - J-12345678-9
  - V-12345678-0
  - E-12345678-0
  - P-12345678-1
```

### Recent reforms

- No structural reforms in the last 24 months.

### Open questions

- SENIAT does not publish the algorithm in a machine-readable spec; confidence remains `moderate` until either an official reference or a SENIAT API endpoint can be cross-validated programmatically.

### Synthetic-vector note

The original research file cites `J-12345678-9` as a synthetic-valid example. That value does **not** satisfy the algorithm specified in the same research entry — the algorithmically correct DV for body `12345678` with prefix `J` is `4`, producing `J-12345678-4`. The library follows the algorithm; the synthetic vectors above replace the inconsistent example with algorithm-derived ones.

---

## `VE_PASAPORTE` — Pasaporte

### Overview

Travel document issued by SAIME (Servicio Administrativo de Identificación,
Migración y Extranjería). Legacy issues are 9-digit numeric; current
biometric series add no documented letter prefix.

- **Issuer**: SAIME — <http://www.saime.gob.ve/>
- **Composition**: 8-9 digits
- **Visual format**: contiguous chars

### Algorithm

None on the printed number. MRZ check digit lives in
`algorithms/icao-9303.ts`.

### Confidence

`low` — no first-party publication.

### Sources

- SAIME: <http://www.saime.gob.ve/>
