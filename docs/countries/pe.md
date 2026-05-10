# Perú (PE)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `PE_DNI` | personal | 8 digits | none (printed); optional 9th letter (RENIEC internal) | low |
| `PE_CE` | personal | 9-12 digits | none documented | low |
| `PE_RUC` | tax | 11 digits | mod-11 SUNAT | high |

## `PE_DNI` — Documento Nacional de Identidad

### Overview

Primary identity document for Peruvian citizens. Issued by RENIEC. The DNI Electrónico (DNIe) keeps the same 8-digit number on a smart card with chip.

- **Issuer**: RENIEC — <https://www.reniec.gob.pe/>
- **Composition**: 8 sequential digits (no embedded structure)
- **Visual format**: contiguous digits, no separators

### Algorithm

None on the printed number. RENIEC internally maintains a 9th-character "dígito de verificación" (a letter) that is exposed by the consulta-DNI API. The algorithm is a Vigesimal Modular check derived from the 8 digits, but it is **not part of the canonical stored DNI** — most government systems accept and store the 8-digit form alone.

If a future caller needs to validate the optional 9th letter, the algorithm is:

```
weights = [3, 2, 7, 6, 5, 4, 3, 2]
sum     = sum(digit_i * weight_i) for i in 0..7
r       = sum mod 11
v       = (11 - r) mod 11
letter_table = "K0123456789"
expected_letter = letter_table[v]   # 0->K, 1->0, 2->1, ..., 10->9
```

This is **not** validated by `PE_DNI.validate()` because callers almost never receive it.

### Sources

- RENIEC: <https://www.reniec.gob.pe/>
- Ley 26.497 (Ley Orgánica del RENIEC).
- Optional 9th-character algorithm: RENIEC public API (consultas-dni) and reverse-engineered by community libraries.

### Synthetic test vectors

```
valid:
  - 12345678
  - 47852136
  - 00000001
  - 99999999

invalid (format):
  - 1234567        (7 digits)
  - 123456789      (9 digits — DV may be valid but spec accepts 8 only)
  - abcdefgh       (non-digits)
```

### Recent reforms

- DNIe rolled out 2013-onwards; same 8-digit number, additional cryptographic chip.

### Open questions

- ADR — should the optional 9th-letter form be a separate spec (e.g. `PE_DNI_VERIFIED`)? Currently the 8-digit form is canonical. If consumer demand grows, expose a `validateWithLetter()` helper.

---

## `PE_CE` — Carné de Extranjería

### Overview

Identity document for foreign residents in Peru.

- **Issuer**: Migraciones Perú (Superintendencia Nacional de Migraciones) — <https://www.migraciones.gob.pe/>
- **Composition**: 9-12 sequential digits
- **Visual format**: contiguous digits

### Algorithm

None publicly documented. Migraciones validates online.

### Sources

- Migraciones: <https://www.migraciones.gob.pe/>

### Synthetic test vectors

```
valid:
  - 123456789
  - 1234567890
  - 12345678901
  - 123456789012

invalid (format):
  - 12345678         (8 digits — too short)
  - 1234567890123    (13 digits — too long)
```

---

## `PE_RUC` — Registro Único de Contribuyentes

### Overview

Tax identifier issued by SUNAT. Identifies both individuals (with prefix `10`) and legal entities (with prefix `20`).

- **Issuer**: SUNAT — <https://www.sunat.gob.pe/>
- **Composition**: 2-digit prefix + 8-digit body + 1 digit DV
  - `10` — persona natural con negocio (DNI + 1 dígito + DV)
  - `15` — sucesión indivisa
  - `16` — no domiciliado especial
  - `17` — no domiciliado
  - `20` — persona jurídica
- **Visual format**: 11 contiguous digits, no separators

### Algorithm

mod-11 with weights `[5, 4, 3, 2, 7, 6, 5, 4, 3, 2]` over the first 10 digits.

```
weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
sum     = sum(digit_i * weight_i) for i in 0..9
r       = sum mod 11
dv      = 11 - r
   if dv == 11 -> 0
   if dv == 10 -> 1
   else        -> dv
valid iff dv == digit[10]
```

All-same-digit sequences (`11111111111`, `00000000000`) are rejected as placeholders.

### Sources

- SUNAT: <https://www.sunat.gob.pe/>
- Decreto Legislativo 943 (RUC Ley).
- Resoluciones de Superintendencia SUNAT (formato y prefijos).
- Cross-validated against `peru-ruc` (npm) and `python-stdnum` `stdnum.pe.ruc`.

### Synthetic test vectors

```
valid:
  - 20100070971    (prefix 20 jurídica)
  - 20123456786    (prefix 20)
  - 20998877661    (prefix 20)
  - 10123456780    (prefix 10 persona natural)
  - 15123456782    (prefix 15 sucesión indivisa)
  - 16010203043    (prefix 16 no domiciliado especial)
  - 17123456785    (prefix 17 no domiciliado)

invalid (format):
  - 2010007097     (10 digits — too short)
  - 201000709712   (12 digits — too long)
  - 30123456780    (prefix 30 — invalid)
  - 11123456789    (prefix 11 — invalid)
  - 11111111111    (all-same-digit placeholder)

invalid (checksum):
  - 20100070970
  - 20123456780
  - 10123456789
```

### Recent reforms

- No format changes since the published algorithm. Prefix `16` was added for "no domiciliados especiales" via Resolución de Superintendencia.

### Open questions

- None on the algorithm. Prefix list is derived from SUNAT's published Tabla de Tipos de Contribuyentes.

---

## `PE_PASAPORTE` — Pasaporte

### Overview

Travel document issued by the Superintendencia Nacional de Migraciones.
Most current sources report 1 uppercase letter + 8 digits (9 chars); legacy
9-digit numeric and 8-char alphanumeric variants also circulate.

- **Issuer**: Migraciones — <https://sel.migraciones.gob.pe/servmig-valreg/VerificarPAS>
- **Composition**: optional 1 letter + 8-9 digits (lenient union)
- **Visual format**: contiguous chars

### Algorithm

None on the printed number. MRZ check digit lives in
`algorithms/icao-9303.ts`.

### Confidence

`low` — sources contradict on the letter prefix.

### Sources

- Wikipedia, *Pasaporte peruano*: <https://es.wikipedia.org/wiki/Pasaporte_peruano>
- Migraciones (verificación): <https://sel.migraciones.gob.pe/servmig-valreg/VerificarPAS>
