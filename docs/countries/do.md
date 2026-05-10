# República Dominicana (DO)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `DO_CEDULA` | both (personal + tax for naturales) | 11 | Luhn (ISO/IEC 7812-1) | moderate |
| `DO_RNC` | tax | 9 | mod-11 weighted | moderate |

## `DO_CEDULA` — Cédula de Identidad y Electoral

### Overview

National personal identity document. Issued by the Junta Central Electoral (JCE). Persona física use the Cédula as their RNC for DGII tax purposes.

- **Issuer**: JCE — <https://www.jce.gob.do/>
- **Composition**: 3 digits municipio (oficina expedidora) + 7 digits correlativo + 1 digit Luhn verifier
- **Visual format**: `000-0000000-0`
- **Legal basis**: Ley 8/92 de la Cédula de Identidad y Electoral

### Algorithm

Standard Luhn (ISO/IEC 7812-1) over all 11 digits.

```
sum    = Luhn-weighted sum over digits 0..10
        (right-to-left: positions 1,3,5,7,9 doubled; if doubled > 9, subtract 9)
valid iff sum mod 10 == 0
```

### Sources

- JCE portal: <https://www.jce.gob.do/>
- DGII e-CF schema (where the 11-digit Cédula is accepted as the RNC field for naturales): <https://www.dgii.gov.do/>
- Cross-validated against `validator.js` `isIdentityCard('es-DO')`

### Synthetic test vectors

```
valid:
  - 001-1234567-3
  - 402-1234567-8
  - 223-5678901-0
  - 103-1020304-6
  - 001-9999991-3

invalid (format):
  - "" (empty)
  - 1234 (too short)
  - 001123456733 (too long)
  - ABCDEFGHIJK (non-digits)

invalid (checksum):
  - 00112345670
  - 00112345674
  - 22356789011
```

### Open questions

- The JCE does not publish the validation algorithm in a citable PDF. The Luhn convention is universally implemented in DR fintech but technically reverse-engineered. Confidence remains `moderate` until in-country verification confirms.

---

## `DO_RNC` — Registro Nacional del Contribuyente

### Overview

Tax identifier for jurídicas issued by the DGII. Persona física use their 11-digit Cédula as the RNC; this spec validates only the 9-digit jurídica RNC.

- **Issuer**: DGII — <https://www.dgii.gov.do/>
- **Composition**: 8 digits assigned correlative + 1 digit verifier
- **Visual format**: 9 digits, sometimes shown as `0-00-00000-0`
- **Legal basis**: Ley 53/70 (Código Tributario)

### Algorithm

mod-11 with weights `[7, 9, 8, 6, 5, 4, 3, 2]` LTR over the first 8 digits.

```
weights = [7, 9, 8, 6, 5, 4, 3, 2]
sum     = sum(digit[i] * weights[i] for i in 0..7)
r       = sum mod 11
expected_dv =
   2          if r == 0
   1          if r == 1
   11 - r     otherwise
valid iff expected_dv == digit[8]
```

All-same-digit sequences (e.g. `000000000`, `111111111`) are rejected as placeholder values.

### Sources

- DGII e-CF (comprobante fiscal electrónico) schema: <https://www.dgii.gov.do/>
- Cross-validated against community Dominican fintech RNC validators

### Synthetic test vectors

```
valid:
  - 131234569
  - 101000007
  - 001123458
  - 123456786
  - 987654325
  - 134123455
  - 137000009

invalid (format):
  - "" (empty)
  - 12345 (too short)
  - 1234567890 (too long)
  - ABCDEFGHI (non-digits)
  - 000000000 (all-same-digit placeholder)

invalid (checksum):
  - 131234560
  - 101000000
  - 123456780
```

### Open questions

- The DGII publishes the e-CF XML schema with the verifier rule but does not publish a numbered article spelling out the algorithm. Confidence stays `moderate` pending official documentation.

---

## `DO_PASAPORTE` — Pasaporte

### Overview

Travel document issued by the Dirección General de Pasaportes (DGP). Format
is a 2-letter office prefix + 7 digits (9 chars). The 2-letter prefix encodes
the issuing office: `SD` (Santo Domingo), `PP` (Puerto Plata), etc.

- **Issuer**: DGP
- **Composition**: 2 letters + 7 digits
- **Visual format**: 9 contiguous chars

### Algorithm

None on the printed number. MRZ check digit lives in
`algorithms/icao-9303.ts`.

### Confidence

`moderate` — consistent reports across PRADO catalog and community sources;
DGP has not published a format spec.

### Sources

- Council of the EU PRADO catalog: <https://www.consilium.europa.eu/prado/en/prado-documents/dom/a/docs-per-category.html>
- DR1 forum: <https://dr1.com/forums/threads/dominican-passport-numbers.396022/>
