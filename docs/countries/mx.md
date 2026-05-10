# México (MX)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `MX_CURP` | personal | 18 | mod-10 over RENAPO alphabet | high |
| `MX_RFC_PF` | tax (natural) | 13 | mod-11 SAT homoclave | moderate |
| `MX_RFC_PM` | tax (jurídica) | 12 | mod-11 SAT homoclave (space-padded body) | moderate |
| `MX_CLAVE_ELECTOR` | personal | 18 | none (format-only + structural) | low |

## `MX_CURP` — Clave Única de Registro de Población

### Overview

Universal personal identifier issued by RENAPO (SEGOB). Encodes initials, birth date, sex, entidad federativa, and internal consonants. Required for taxes, social security, banking, and most government interactions.

- **Issuer**: RENAPO (SEGOB) — <https://www.gob.mx/curp>
- **Composition**: 4 letters (apellidos + nombre) + 6 digits (AAMMDD) + 1 letter (sexo H/M) + 2 letters (entidad federativa) + 3 consonants + 1 alphanumeric (homoclave) + 1 digit (DV)
- **Visual format**: `AAAA######HXXLLL##` — 18 contiguous chars, no separators

### Algorithm

mod-10 weighted sum over the first 17 chars, mapped through a 37-character alphabet `0..9 A..N Ñ O..Z` (indices 0..36).

```
alphabet = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"
sum     = sum(alphabet.indexOf(c[i]) * (18 - i)) for i in 0..16
expected_dv = (10 - (sum mod 10)) mod 10
valid iff expected_dv == int(c[17])
```

Additional structural checks: month must be 01-12, day 01-31, sex H or M, entidad federativa one of the 32 estados + `NE` (nacido en el extranjero).

### Sources

- RENAPO: <https://www.gob.mx/curp>
- Acuerdo SEGOB Diario Oficial de la Federación 18-OCT-2014 (publishes the formula).
- Cross-validated against `python-stdnum` `stdnum.mx.curp`.

### Synthetic test vectors

```
valid:
  - GOMC850315HDFRRR07
  - MARP800101MDFRTR03
  - LOPB920715HJCRRR05
  - GAVA751231MNERRR07
  - SANC000229HBCNNN06
  - XEXX010101HNEXXXA4   (RENAPO genérica extranjero — accepted)

invalid (format):
  - GOMC850315HDFRRR0    (17 chars — missing DV)
  - GOMC851315HDFRRR07   (mes 13)
  - GOMC850000HDFRRR07   (día 00)
  - GOMC850315HZZRRR07   (entidad federativa inválida)

invalid (checksum):
  - GOMC850315HDFRRR00
  - MARP800101MDFRTR09
  - LOPB920715HJCRRR01
```

### Recent reforms

- **2014-10-18** — Acuerdo SEGOB DOF formaliza el algoritmo de DV y la estructura. Sin cambios al formato desde entonces.

### Open questions

- ADR — `Ñ` policy. The standard normalizes `Ñ → X` at issuance, but the algorithm is defined for both. We currently accept both. Confirm whether downstream consumers prefer strict `X`-only.
- The CURP genérica extranjero `XEXX010101HNEXXXA4` validates by structure and checksum — no special-casing required. Document this as expected behavior for clients tempted to reject it.

---

## `MX_RFC_PF` — Registro Federal de Contribuyentes (Persona Física)

### Overview

Tax identifier for natural persons issued by SAT. Combines a 4-letter prefix derived from name + surnames, the 6-digit birth date, and a 3-character homoclave (assigned by SAT to disambiguate collisions; the last char is the DV).

- **Issuer**: SAT — <https://www.sat.gob.mx/>
- **Composition**: 4 letras (apellido paterno × 2 + apellido materno × 1 + nombre × 1) + 6 dígitos AAMMDD + 3 alfanuméricos (homoclave 2 + DV 1)
- **Visual format**: `AAAA######XXX` (13 contiguous chars)

### Algorithm

mod-11 over the first 12 chars, mapped through the 38-character SAT table:

```
table = { ' ': 0, '0'..'9': 1..10, 'A'..'N': 11..24, '&': 25, 'O'..'Z': 26..37 }
sum     = sum(table[c[i]] * (13 - i)) for i in 0..11
r       = sum mod 11
dv      = 11 - r
   if dv == 11 -> '0'
   if dv == 10 -> 'A'
   else        -> str(dv)
valid iff dv == c[12]
```

Additional checks:
- 4-letter prefix must not be in the SAT-published forbidden list (palabras altisonantes, ~80 entries — Anexo 1-A § 2). Forbidden prefixes have their 4th letter replaced with `X` at issuance.
- Birth date must be plausible (month 01-12, day 01-31).
- SAT genéricos `XAXX010101000` and `XEXX010101000` are accepted as valid (CFDI 4.0 placeholders).

### Sources

- SAT: <https://www.sat.gob.mx/>
- Código Fiscal de la Federación, Art. 27.
- Resolución Miscelánea Fiscal Anexo 1-A; Anexo 19 (transformación).
- Cross-validated against `python-stdnum` `stdnum.mx.rfc`.

### Synthetic test vectors

```
valid:
  - MELO850315H79
  - GAJA920101AB5
  - PEMA751231X15
  - RUDR000115AA1
  - TOPA800615X90
  - XAXX010101000   (SAT genérico operación con público en general)
  - XEXX010101000   (SAT genérico extranjero sin RFC)

invalid (format):
  - MELO850315H7    (12 chars — RFC PM length)
  - 1234850315H79   (numeric prefix)
  - PUTO850315ABC   (forbidden palabra altisonante)
  - MELO851315H79   (mes 13)

invalid (checksum):
  - MELO850315H70
  - GAJA920101AB0
  - PEMA751231X19
```

### Recent reforms

- **2022-01** — CFDI 4.0 entró en vigor; SAT exige RFC del receptor en facturación. El formato del RFC no cambió.

### Open questions

- The mod-11 weight vector is consistent across mature open-source libraries (Python's `stdnum`, several JS implementations) but SAT does not publish it verbatim. Confidence is therefore `moderate`.

---

## `MX_RFC_PM` — Registro Federal de Contribuyentes (Persona Moral)

### Overview

Tax identifier for legal entities (sociedades, asociaciones, fideicomisos) issued by SAT.

- **Issuer**: SAT — <https://www.sat.gob.mx/>
- **Composition**: 3 letras (acrónimo razón social) + 6 dígitos AAMMDD (constitución) + 3 alfanuméricos (homoclave + DV)
- **Visual format**: `AAA######XXX` (12 contiguous chars)

### Algorithm

Same SAT homoclave algorithm as PF, with the 11-char body left-padded by a single space (which has table value 0) so the weighted sum aligns to 12 positions.

```
body12 = " " + rfc[0..10]
sum    = sum(table[body12[i]] * (13 - i)) for i in 0..11
... (same r/dv rules as PF)
valid iff dv == rfc[11]
```

Birth date plausibility: month 01-12, day 01-31.

### Sources

Same as `MX_RFC_PF`.

### Synthetic test vectors

```
valid:
  - ABC901231J45
  - XYZ850615PQ5
  - MEX120831RT7
  - GHI001215AB5
  - BBB991231X98

invalid (format):
  - ABC901231J4     (11 chars)
  - 1234901231J45   (numeric prefix)
  - ABCXXXXXXJ45    (chars 3-8 must be digits)
  - ABC901331J45    (mes 13)

invalid (checksum):
  - ABC901231J40
  - XYZ850615PQ0
  - MEX120831RT0
```

### Recent reforms

- **2022-01** — CFDI 4.0; sin cambios al formato del RFC PM.

### Open questions

- Same as PF — algorithm matches mature implementations but SAT does not publish the weight vector.

---

## `MX_CLAVE_ELECTOR` — Clave de Elector (credencial INE/IFE)

### Overview

18-character voter ID code printed on every credencial INE/IFE issued by the Instituto Nacional Electoral (INE). It is the most-presented physical ID in México daily life — fintech onboarding (Clip, Bitso, Stori, Nu MX), bank KYC (CNBV Disposiciones), telco SIM activation, and government services routinely request it.

- **Issuer**: INE (Instituto Nacional Electoral) — <https://www.ine.mx/credencial/>
- **Aliases**: `CLAVE_ELECTOR`, `INE`. Both resolve to this spec at the country-scoped API level.
- **Composition**: 6 letras (2 consonantes apellido paterno + 2 consonantes apellido materno + 2 consonantes nombre) + 2 dígitos YY (año) + 2 dígitos EE (entidad federativa numérica 01..32) + 2 dígitos MM + 2 dígitos DD + 1 letra sexo (H/M) + 3 dígitos correlativo
- **Visual format**: `LLLLLLYYEEMMDDS###` (18 contiguous chars, no separators)

### Algorithm

**None** — INE no publica un algoritmo de dígito verificador para la Clave de Elector. La validación de esta librería es format-only más reglas estructurales:

- Regex: `/^[A-Z]{6}\d{8}[HM]\d{3}$/`
- Entidad federativa numérica entre `01` y `32` (catálogo INE).
- Mes entre `01` y `12`.
- Día entre `01` y `31` (sin chequeo de mes-corto / bisiesto, alineado al estilo CURP).

`hasCheckDigit` es `false`. El campo `confidence` es `low`.

### Sources

- INE: <https://www.ine.mx/credencial/>
- INE Acuerdo CG58/2014 — "Estructura de la Clave de Elector".
- Ley General de Instituciones y Procedimientos Electorales (LGIPE).
- OECD TIN matrix MX (referencia cruzada).

### Synthetic test vectors

```
valid:
  - GMRPRZ85091015H123     (1985, ent 09 CDMX, 10/15, H)
  - LPZNVR92151225M407     (1992, ent 15 Edo. Méx., 12/25, M)
  - SNCHGL00140628H012     (2000, ent 14 Jalisco, 06/28, H)
  - GVRRRZ75320101M999     (1975, ent 32 Zacatecas — boundary, 01/01)
  - HRNNDZ05010715H088     (2005, ent 01 Aguascalientes — boundary, 07/15)
  - PRZGRR68071231H501     (1968, ent 07 Chiapas, 12/31 — day boundary)

invalid (format):
  - GMRPRZ85091015H12      (17 chars — short)
  - GMRPRZ85091015H1234    (19 chars — long)
  - GMR1RZ85091015H123     (digit en slot de letras)
  - GMRPRZ8509101AH123     (letra en slot de dígito)

invalid (structural):
  - GMRPRZ85331015H123     (entidad 33 fuera de rango)
  - GMRPRZ85091315H123     (mes 13)
  - GMRPRZ85091000H123     (día 00)
  - GMRPRZ85091015X123     (sexo X — sólo H/M)
```

### Notas de divergencia

- La entidad federativa en la Clave de Elector es **numérica** (`09` = CDMX, `15` = Edo. Méx., etc.), distinta del catálogo de **2 letras** que usa CURP (`DF`, `MC`). Por eso esta spec no reutiliza el `ENTIDADES` set de CURP — valida directamente el rango numérico 01..32.
- No existe librería pública JS/Python (`validator.js`, `python-stdnum`) que cubra la Clave de Elector. Esta implementación es greenfield.

### Open questions

- INE podría cambiar el rango numérico de entidad federativa en el futuro (e.g. división de un estado). Confirmar contra el catálogo INE vigente cada release.
- La regla de día actual acepta 01..31 sin validación cruzada con el mes (e.g. 31 de febrero pasa el regex). El estilo es consistente con la spec CURP del proyecto, donde la misma laxitud es deliberada.
- Confidence se mantiene en `low` hasta que INE publique un dígito verificador o aparezca una librería oficial cross-validable.
