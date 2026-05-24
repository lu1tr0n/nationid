# Luxembourg (LU)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `LU_VAT` | tax | 10 (`LU` + 8 digits) | mod-89 (positions 7–8 = body₆ mod 89) | high |

Ships under the tree-shakable subpath `nationid/lu` and under the EU-wide
aggregator `nationid/vat`.

Also registered under the alias code `LU_TVA` (native abbreviation) for
i18n labelling; the canonical export remains `LU_VAT` for batch
symmetry.

---

## `LU_VAT` — Numéro d'identification à la TVA

### Overview

Luxembourgish VAT registration number, called *Numéro d'identification
à la TVA* in French (the working language of the Administration de
l'enregistrement, des domaines et de la TVA). The number is issued by
the AED and follows a uniform 8-digit format with a 2-digit check tail.

- **Issuer**: Administration de l'enregistrement, des domaines et de la
  TVA (AED) — <https://pfi.public.lu/fr.html>
- **Citizen / business gateway**: Guichet —
  <https://guichet.public.lu/> ✓ live 2026-05-24
- **Statute**: `Loi du 12 février 1979 concernant la taxe sur la valeur
  ajoutée` (binding authority).
- **Composition**: `LU` prefix + 6 body digits + 2 check digits.
- **Visual format**: `LU 12345678` (space after `LU`).

### Algorithm

Mod-89: the last 2 digits are the zero-padded value of
`int(body₆) mod 89`, where `body₆` is the first 6 digits treated as a
decimal integer.

```
body6 = digits[0..5]                       # the 6 body digits
check2 = (int(body6) mod 89) padded to 2 digits with leading zero
valid = (digits[6..7] == check2)
```

Worked example for canonical anchor `LU15027442`:

- `body6 = "150274"` → `150274 mod 89 = 42`
- expected check digits = `"42"` → matches positions 7–8. ✓

Confidence: **high**. Algorithm published by AED in Circulaire n° 770
(1997); python-stdnum reproduces; `validator.js isVAT('LU')` agrees.

### Sources

- AED — Portail des Finances de l'État (issuer root):
  <https://pfi.public.lu/fr.html> ✓ live 2026-05-24
- Guichet — citizen / business gateway:
  <https://guichet.public.lu/> ✓ live 2026-05-24
- VIES portal (cross-validation, EU-wide):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- Statute (binding authority): Loi du 12 février 1979 concernant la
  taxe sur la valeur ajoutée
- Cross-validated against `python-stdnum` (`stdnum.lu.tva`)

### Synthetic test vectors

```
valid (mod-89 check passes):
  - LU15027442    (canonical anchor — VERIFICATION §LU)
  - LU76428643
  - LU57490049
  - LU21469527
  - LU24094825
  - LU50000503

invalid (check digits wrong):
  - LU15027443    (should be 42)
  - LU15027440    (should be 42)

invalid (format):
  - LU1234567     (too short — only 7 digits)
  - LU1502744A    (non-digit at check position)
```

### Recent reforms

- No format change since the AED published the algorithm in
  Circulaire n° 770 (1997). The mod-89 scheme has been continuous since
  the introduction of TVA under the 1979 statute.

### Open questions

- None. AED publishes the algorithm; python-stdnum and community
  libraries agree byte-for-byte.

---

## Notes for consumers

- `LU_VAT` is **offline structural validation only**. For active-status
  verification, query VIES at
  <https://ec.europa.eu/taxation_customs/vies/> (prefix `LU`).
- AED issues VAT numbers from a contiguous range starting roughly at
  `LU10000017`. The library does **not** enforce a minimum value —
  registry state is VIES's concern, not the validator's.
- The native abbreviation `TVA` and the international `VAT` both map to
  the same spec. Consumer-facing labels can use either.
