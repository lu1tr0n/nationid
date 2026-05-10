# Colombia (CO)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `CO_CC` | personal | 6-10 digits | none | low |
| `CO_CE` | personal | 6-8 digits | none | low |
| `CO_TI` | personal (menor) | 10-11 digits | none | low |
| `CO_PASAPORTE` | personal | 6-12 alphanumeric | none | unconfirmed |
| `CO_NIT` | tax | 9-10 base + 1 DV | mod-11 (DIAN) | high |
| `CO_PEP` | personal | 15 digits | none | low |
| `CO_PPT` | personal | 7-11 alphanumeric | none | low |

## `CO_CC` — Cédula de Ciudadanía

### Overview

Primary identity document for Colombian citizens 18+. Issued by the Registraduría Nacional del Estado Civil. A "cédula digital" rolled out from 2020 keeps the same number on a smart card with QR.

- **Issuer**: Registraduría Nacional del Estado Civil — <https://www.registraduria.gov.co/>
- **Composition**: 6-10 sequential digits (no embedded structure)
- **Visual format**: thousands separators on display only (`1.020.304.050`); storage form is digits-only

### Algorithm

None. The Registraduría has never published a check digit. Verification is done online against their database.

### Sources

- Registraduría: <https://www.registraduria.gov.co/>
- Decreto 1260/1970 (Estatuto Civil).

### Synthetic test vectors

```
valid:
  - 1020304050
  - 1.020.304.050
  - 12345678
  - 123456              (min length)
  - 9999999999          (max length)

invalid (format):
  - 12345               (too short)
  - 12345678901         (too long)
  - abcdef              (non-digits — strips to empty)
```

### Recent reforms

- **2020-12** — Cédula digital. Same number, smart card with chip and QR.

### Open questions

- No checksum. Backend services that need confidence in the number must call the Registraduría's webservice (Renovación electrónica).

---

## `CO_CE` — Cédula de Extranjería

### Overview

Identity document for foreign residents in Colombia.

- **Issuer**: Migración Colombia — <https://www.migracioncolombia.gov.co/>
- **Composition**: 6-8 sequential digits
- **Visual format**: contiguous digits, no separators

### Algorithm

None publicly documented.

### Sources

- Migración Colombia: <https://www.migracioncolombia.gov.co/>

### Synthetic test vectors

```
valid:
  - 123456
  - 1234567
  - 12345678
  - 234567

invalid (format):
  - 12345         (too short)
  - 123456789     (too long)
  - abcdefgh      (non-digits)
```

---

## `CO_TI` — Tarjeta de Identidad

### Overview

Identity document for minors (under 18). At majority age the holder is issued a `CO_CC` keeping the same base number.

- **Issuer**: Registraduría Nacional del Estado Civil — <https://www.registraduria.gov.co/>
- **Composition**: 10-11 sequential digits
- **Visual format**: contiguous digits

### Algorithm

None.

### Sources

- Registraduría: <https://www.registraduria.gov.co/>

### Synthetic test vectors

```
valid:
  - 1020304050
  - 10203040506
  - 1234567890
  - 12345678901

invalid (format):
  - 123456789       (9 digits)
  - 123456789012    (12 digits)
  - abcdefghij      (non-digits)
```

---

## `CO_PASAPORTE` — Pasaporte

### Overview

Travel document issued by the Cancillería. Multiple historic formats exist; the union is captured by an alphanumeric range.

- **Issuer**: Cancillería — Ministerio de Relaciones Exteriores — <https://www.cancilleria.gov.co/>
- **Composition**: 6-12 alphanumeric characters, uppercase
- **Visual format**: contiguous alphanumeric

### Algorithm

None on the printed number. Cryptographic validation lives on the MRZ data page (out of scope for this spec — see optional `mrz` peer integration).

### Sources

- Cancillería: <https://www.cancilleria.gov.co/>

### Synthetic test vectors

```
valid:
  - AB123456
  - PA1234567
  - 12345678
  - ABC123XYZ456

invalid (format):
  - AB12                 (too short)
  - AB12345678901234     (too long)
```

### Open questions

- The Cancillería has not published the active issuance format. Confidence is `unconfirmed` pending in-country verification.

---

## `CO_NIT` — Número de Identificación Tributaria

### Overview

Tax identifier issued by the DIAN. Applies to both natural persons (cédula + DV) and legal entities (assigned 9-digit base + DV).

- **Issuer**: DIAN — <https://www.dian.gov.co/>
- **Composition**: 9-10 digit body + 1 digit DV
- **Visual format**: `000000000-0`

### Algorithm

mod-11 with weights `[3, 7, 13, 17, 19, 23, 29, 37, 41, 43]` applied **right-to-left** over the body (truncated to body length).

```
weights_rtl = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43]
sum     = sum(digit_i * weight_i) summed from the rightmost body digit
r       = sum mod 11
dv      = r        if r < 2
          11 - r   otherwise
valid iff dv == int(last digit)
```

All-same-digit bodies (`000000000-3` etc.) are rejected as administrative placeholders even though some may pass the checksum.

### Sources

- DIAN: <https://www.dian.gov.co/>
- DIAN Concepto 015766 — algoritmo del DV publicado.
- Estatuto Tributario, Art. 555-1.
- Cross-validated against `validator.js` `isTaxID('es-CO')` and `python-stdnum` `stdnum.co.nit`.

### Synthetic test vectors

```
valid:
  - 9001234568         (900123456-8)
  - 8001001239         (800100123-9)
  - 8300154253         (830015425-3)
  - 10203040508        (1020304050-8 — 10-digit body)
  - 9876543217         (987654321-7)
  - 1002003006         (100200300-6)

invalid (format):
  - 1234               (too short)
  - 123456789012       (too long)
  - 0000000000         (all-same-digit placeholder)
  - 1111111111         (all-same-digit placeholder)

invalid (checksum):
  - 9001234560
  - 8001001230
  - 8300154259
```

### Recent reforms

- No format changes since the DIAN publication of the algorithm.

### Open questions

- None. DIAN documents the algorithm, multiple mature libraries implement it identically.

---

## `CO_PEP` — Permiso Especial de Permanencia

### Overview

Documento migratorio emitido por Migración Colombia para nacionales venezolanos (creado por Resolución 5797/2017). Reemplazado progresivamente por el PPT (`CO_PPT`) desde 2021, pero los PEP vigentes siguen presentándose en KYC bancario (Bancolombia, Davivienda, Nequi, Daviplata).

- **Issuer**: Migración Colombia — <https://www.migracioncolombia.gov.co/>
- **Composition**: 15 dígitos secuenciales, sin separadores
- **Visual format**: 15 dígitos contiguos

### Algorithm

**Ninguno**. Migración Colombia no publica un algoritmo de verificación. La verificación se hace en línea contra su servicio de consulta.

### Sources

- Migración Colombia: <https://www.migracioncolombia.gov.co/>
- Resolución 5797/2017 (Ministerio de Relaciones Exteriores).
- Banco de la República — Circular SEDPE (mandato KYC).

### Synthetic test vectors

```
valid:
  - 100200300400500
  - 999888777666555
  - 000111222333444    (leading zero permitido)
  - 123456789012345

invalid (format):
  - 12345678901234     (14 dígitos — corto)
  - 1234567890123456   (16 dígitos — largo)
  - ABCDEFGHIJKLMNO    (no dígitos)
```

### Open questions

- Migración Colombia no publica el rango de prefijos asignados por lote. Si se documenta en futuras circulares, se podría refinar la spec (ver `nationid-research/document-gaps-2026-05-09.md` § "CO_PEP / CO_PPT").

---

## `CO_PPT` — Permiso por Protección Temporal

### Overview

Documento migratorio creado por el Decreto 216/2021 dentro del Estatuto Temporal de Protección para Migrantes Venezolanos (ETPV); reemplaza progresivamente al PEP. Mandatorio para KYC bancario en CO desde la Circular SEDPE del Banco de la República.

- **Issuer**: Migración Colombia — <https://www.migracioncolombia.gov.co/visas-permisos/permiso-por-proteccion-temporal-ppt>
- **Composition**: 7-11 caracteres alfanuméricos en mayúsculas. Migración Colombia ha emitido lotes con formatos numéricos puros y lotes con prefijo alfanumérico, sin publicar el catálogo completo.
- **Visual format**: caracteres contiguos, sin separadores

### Algorithm

**Ninguno**. Migración Colombia no publica un algoritmo de verificación.

### Sources

- Migración Colombia: <https://www.migracioncolombia.gov.co/visas-permisos/permiso-por-proteccion-temporal-ppt>
- Decreto 216/2021 (Estatuto Temporal de Protección para Migrantes Venezolanos).
- Banco de la República — Circular SEDPE.

### Synthetic test vectors

```
valid:
  - 12345678            (8 dígitos — lote numérico común)
  - PPT123456           (lote con prefijo alfanumérico)
  - 1234567890          (10 dígitos)
  - 12345678901         (11 chars — boundary superior)
  - 1234567             (7 chars — boundary inferior)
  - ABC1234XY           (mezcla alfanumérica)

invalid (format):
  - 123456              (6 chars — corto)
  - 123456789012        (12 chars — largo)
  - AB$%                (chars especiales se eliminan, residual corto)
```

### Open questions

- El catálogo completo de formatos por lote no se publica. La spec valida el superset 7-11 alfanuméricos hasta que Migración Colombia documente reglas más estrictas.
- Confidence se mantiene en `low` hasta que aparezca un algoritmo o validador oficial.
