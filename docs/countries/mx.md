# México (MX)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `MX_CURP` | personal | 18 | mod-10 over RENAPO alphabet | high |
| `MX_RFC_PF` | tax (natural) | 13 | mod-11 SAT homoclave | moderate |
| `MX_RFC_PM` | tax (jurídica) | 12 | mod-11 SAT homoclave (space-padded body) | moderate |

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
