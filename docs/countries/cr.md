# Costa Rica (CR)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `CR_CEDULA_FISICA` | both (personal + tax for naturales) | 9 | none (format only) | high |
| `CR_DIMEX` | personal | 11 or 12 | none | moderate |
| `CR_CEDULA_JURIDICA` | tax | 10 | none (format only) | high |

---

## `CR_CEDULA_FISICA` — Cédula de Identidad

### Overview

Personal identity document issued by the Tribunal Supremo de Elecciones (TSE) — Registro Civil. Doubles as the personal tax ID at Hacienda's DGT, where it is internally padded to 10 digits with a leading `0` for filings.

- **Issuer**: TSE — <https://www.tse.go.cr/>
- **Composition**: 1 provincia + 4 tomo + 4 asiento
- **Visual format**: `0-0000-0000`

### Algorithm

No check digit. The TSE does not publish a verifier algorithm and the 9-digit cédula carries no embedded checksum. Validation is structural (regex `^[1-9]\d{8}$`).

```
provincia in 1..9
tomo      = 4 digits
asiento   = 4 digits
```

### Sources

- TSE: <https://www.tse.go.cr/> (Código Electoral)
- nationid research tier-1 (`countries-comprehensive-tier1.md` § Costa Rica) — accessed 2026-05-08

### Synthetic test vectors

```
valid:
  - 1-1234-5678
  - 5-9876-5432
  - 7-0000-0001
  - 8-1111-2222
  - 9-9999-9999

invalid (format):
  - "" (empty)
  - 0-1234-5678 (provincia 0)
  - 1234 (too short)
  - 1234567890 (too long)
  - ABCDEFGHI

invalid (checksum):
  - n/a (no check digit)
```

### Recent reforms

None known in the last 24 months affecting format.

### Open questions

- Hacienda's DGT pads to 10 digits internally for filings; should the library expose a `formatForHacienda()` helper? Tracking as ADR candidate.

---

## `CR_DIMEX` — Documento de Identidad Migratorio para Extranjeros

### Overview

Identity document for foreign residents, issued by the Dirección General de Migración y Extranjería.

- **Issuer**: Dirección General de Migración y Extranjería — <https://www.migracion.go.cr/>
- **Composition**: 11 or 12 digits; first digit `1` for residentes, remaining digits encode tipo de residencia + correlativo (Migración has not published a stable composition formula)
- **Visual format**: no separators on the physical card

### Algorithm

No check digit publicly documented. Validation is length (11 or 12 digits) + numeric only.

### Sources

- Dirección General de Migración: <https://www.migracion.go.cr/>
- Ley General de Migración y Extranjería (Ley 8764, 2009)

### Synthetic test vectors

```
valid:
  - 12233445566 (11 digits)
  - 10000000001
  - 19999999999
  - 155667788990 (12 digits)
  - 100000000001

invalid (format):
  - "" (empty)
  - 1234567890 (10 digits)
  - 1234567890123 (13 digits)
  - ABCDEFGHIJK
```

### Recent reforms

None known in the last 24 months affecting format.

### Open questions

- Confidence remains `moderate` until a public-source composition or verifier is confirmed.

---

## `CR_CEDULA_JURIDICA` — Cédula Jurídica

### Overview

Tax identifier for legal entities, issued by the Registro Nacional (Registro de Personas Jurídicas) and used by Hacienda.

- **Issuer**: Registro Nacional / Hacienda — <https://www.registronacional.go.cr/> · <https://www.hacienda.go.cr/>
- **Composition**: prefix `3` (jurídicas) + 3 tipo entidad + 6 correlativo
- **Visual format**: `3-000-000000`

### Algorithm

No check digit. Validation is structural (regex `^3\d{9}$`).

```
prefix      = '3'
tipo        = 3 digits  (101 = SA, 102 = SRL, ...)
correlativo = 6 digits
```

### Sources

- Hacienda: <https://www.hacienda.go.cr/>
- Registro Nacional: <https://www.registronacional.go.cr/>
- nationid research tier-1 (`countries-comprehensive-tier1.md` § Costa Rica) — accessed 2026-05-08

### Synthetic test vectors

```
valid:
  - 3-101-123456
  - 3-102-987654
  - 3-110-000001
  - 3-002-000000
  - 3-999-999999

invalid (format):
  - "" (empty)
  - 2-101-123456 (prefix 2)
  - 5-101-123456 (prefix 5 — that's `CR_NITE`, separate type)
  - 0-101-123456 (prefix 0)
  - 31011234567 (too long)
```

### Recent reforms

None known affecting format.

### Open questions

- `CR_NITE` (entidades sin cédula jurídica, prefix `5`) is a separate document type used by Hacienda for sucesiones, condominios, fideicomisos, etc. It is **not** included in this initial release; track as future addition.
