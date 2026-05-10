# Guatemala (GT)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `GT_DPI` | personal | 13 | mod-11 weighted | moderate |
| `GT_NIT` | tax | 2-13 (1-12 base + verifier) | mod-11 weighted | moderate |

## `GT_DPI` — Documento Personal de Identificación / Código Único de Identificación

### Overview

National personal identity document issued by RENAP. The 9th digit is a mod-11 verifier; the trailing 4 digits encode departamento (01-22) + municipio. Persona natural may use the DPI/CUI in lieu of NIT for FEL invoicing post-2022.

- **Issuer**: RENAP — <https://www.renap.gob.gt/>
- **Composition**: 8 digits correlativo + 1 digit verifier + 2 digits departamento + 2 digits municipio
- **Visual format**: `0000 00000 0000`
- **Legal basis**: Decreto 90-2005, Ley del RENAP

### Algorithm

mod-11 weighted, weights `[2, 3, 4, 5, 6, 7, 8, 9]` LTR over the first 8 digits. The verifier (9th position) equals `sum mod 11`. RENAP does not issue DPIs whose computed verifier would be 10, so that result is treated as invalid.

```
weights = [2, 3, 4, 5, 6, 7, 8, 9]
sum     = sum(digit[i] * weights[i] for i in 0..7)
r       = sum mod 11
valid iff r != 10 AND r == digit[8]
```

### Sources

- RENAP portal: <https://www.renap.gob.gt/>
- Decreto 90-2005, Ley del Registro Nacional de las Personas
- Cross-validated against community DPI/CUI validators in the Guatemalan fintech ecosystem

### Synthetic test vectors

```
valid:
  - 1234 56789 0101
  - 9876 54322 0101
  - 1000 00002 0101
  - 0000 00019 0101
  - 5555 55550 0101
  - 1122 33449 0101
  - 2000 00004 0101

invalid (format):
  - "" (empty)
  - 1234 (too short)
  - 12345678901011 (too long)
  - ABCDEFGHIJKLM (non-digits)

invalid (checksum):
  - 1234567800101
  - 1234567810101
  - 9876543200101
```

### Open questions

- RENAP does not publish the verifier formula in a citable public document. The algorithm is consistent with DPIs issued in production. Confidence remains `moderate`.
- Departamento/municipio code validation (positions 10-13) is **not** enforced by this spec — only length and the mod-11 verifier. Add a follow-up if a canonical RENAP table becomes available.

---

## `GT_NIT` — Número de Identificación Tributaria

### Overview

Tax identifier issued by SAT for both persona natural and jurídica. The DV may be a digit `0`-`9` or `K`. Body length varies (typically 6-9 digits + verifier).

- **Issuer**: SAT — <https://portal.sat.gob.gt/portal/>
- **Composition**: 1-12 digits body + 1 verifier (`0`-`9` or `K`)
- **Visual format**: `0000000-D` (hyphen separates body from verifier)
- **Legal basis**: Reglamento de Factura Electrónica en Línea (FEL)

### Algorithm

mod-11 weighted with weights `2, 3, 4, ...` applied **right-to-left** over the body. The verifier is computed as:

```
sum = Σ (body_from_right[i] * (i + 2))   for i = 0..n-1
r   = (-sum) mod 11
dv  = "0123456789K"[r]
```

Equivalently: `dv = 11 - (sum mod 11)`; if the result is `11` use `'0'`; if `10` use `'K'`.

All-same-digit body sequences (e.g. `1111111-1`) are rejected as placeholder values.

### Sources

- SAT FEL technical addenda: <https://portal.sat.gob.gt/portal/>
- Cross-validated against `python-stdnum` `stdnum.gt.nit`

### Synthetic test vectors

```
valid:
  - 1234567-9
  - 9876543-4
  - 87654321-2
  - 12345678-9
  - 100-7
  - 12-4
  - 37-K            (DV computed as K)

invalid (format):
  - "" (empty)
  - X (single character)
  - ABCDEFGH (non-digits)
  - 12K34 (K outside the verifier slot)
  - 12345678901234 (too long, body > 12 digits)

invalid (checksum):
  - 1234567-0
  - 9876543-0
  - 37-1
```

### Recent reforms

- **2022 (FEL régimen)** — Persona natural may submit their CUI/DPI in the NIT field. Callers handling FEL submission should additionally validate as `GT_DPI` when the value matches a 13-digit pattern.

### Open questions

- SAT publishes the FEL XML schema but no numbered article spelling out the verifier formula. The algorithm matches `python-stdnum` and SAT-certified billing providers in production. Confidence remains `moderate`.

---

## `GT_PASAPORTE` — Pasaporte

### Overview

Travel document issued by the Instituto Guatemalteco de Migración (IGM), with
civil-registry inputs from RENAP. The IGM 2024 numbering update (per Copa Air
carrier notice) is documented but the exact regex was not extractable from
the published PDF.

- **Issuer**: IGM — <https://igm.gob.gt/requisitos-para-tramite-de-pasaporte-guatemalteco/>
- **Composition**: 8-9 alphanumeric (lenient)
- **Visual format**: contiguous chars

### Algorithm

None on the printed number. MRZ check digit lives in
`algorithms/icao-9303.ts`.

### Confidence

`low` — IGM has not published the 2024 numbering spec in machine-readable form.

### Sources

- IGM: <https://igm.gob.gt/requisitos-para-tramite-de-pasaporte-guatemalteco/>
- Copa Air notice (Jul 2024 PDF): <https://www.copaair.com/assets/Update-in-the-numbering-of-Guatemalan-passports.pdf>
