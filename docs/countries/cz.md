# Czechia (CZ)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `CZ_DIC` | tax | 10 (`CZ` + 8 digits) | weighted mod-11 with `0→1`, `1→0` substitution | high |

Ships under the tree-shakable subpath `nationid/cz` and under the EU-wide
aggregator `nationid/vat`.

> **Scope narrowing (v1.7).** The 8-digit *legal-entity* branch only.
> The 9-digit "special natural person" branch (first digit `6`) and the
> 10-digit *rodné číslo* (RČ) branch are **deferred to v1.8** alongside
> the dedicated personal-ID `CZ_RC` spec, which needs the Czech RČ date
> validator with `+50` (female) and `+20` (post-2004) month offsets.

---

## `CZ_DIC` — Daňové identifikační číslo (Tax ID number)

### Overview

Czech tax identification number (DIČ) issued by the Finanční správa
České republiky to every taxpayer. For legal entities the DIČ equals
the IČO (company registration number) prefixed by `CZ`; the 8-digit
form uses an embedded mod-11 check whose first digit must not be `9`
(reserved by the registrar).

- **Issuer**: Finanční správa České republiky —
  <https://www.financnisprava.cz/>
- **DIČ registry lookup**: <https://adisspr.mfcr.cz/> ✓ live 2026-05-24
- **Statute**: `Zákon č. 235/2004 Sb., o dani z přidané hodnoty, §94–95`
  (VAT Act, registration regime); the 8-digit IČO check digit is
  documented in legacy Finanční správa guidance.
- **Composition**: `CZ` prefix + 8 digits (7 body digits + 1 check digit).
- **Visual format**: `CZ 25123891` (space after `CZ`).

### Algorithm

Weighted mod-11 over the 7 body digits with weights `[8, 7, 6, 5, 4, 3, 2]`
plus a substitution rule for the boundary cases:

```
WEIGHTS = [8, 7, 6, 5, 4, 3, 2]

sum = Σ (body[i] * WEIGHTS[i]) for i in 0..6
r = sum mod 11
if r == 0: check = 1
elif r == 1: check = 0
else:        check = 11 - r
valid = (check == body[7])
```

Additionally, the **first body digit must not be `9`** (reserved by the
Czech registry; python-stdnum reports this as `InvalidComponent`).

Worked example for canonical anchor `CZ25123891` (body `2512389`,
check `1`):

- `sum = 8·2 + 7·5 + 6·1 + 5·2 + 4·3 + 3·8 + 2·9 = 16+35+6+10+12+24+18 = 121`
- `121 mod 11 = 0` → substitute `1` (per the `r == 0` rule)
- expected check = `1`. ✓

Confidence: **high** for the 8-digit legal-entity branch only.

### Sources

- Finanční správa České republiky (issuer root):
  <https://www.financnisprava.cz/> ✓ live 2026-05-24 (redirects to the
  modern `.gov.cz` infrastructure)
- DIČ registry lookup (ADIS) — <https://adisspr.mfcr.cz/> ✓ live 2026-05-24
- VIES portal (cross-validation, EU-wide):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- Statute (binding authority): Zákon č. 235/2004 Sb., §94–95
- Cross-validated against `python-stdnum` (`stdnum.cz.dic`)

### Synthetic test vectors

```
valid (legal-entity 8-digit branch, mod-11 check passes, first digit != 9):
  - CZ25123891    (canonical anchor — VERIFICATION §CZ)
  - CZ67028101
  - CZ34160001
  - CZ80013619
  - CZ03379469
  - CZ08969485

invalid (first body digit 9 — reserved):
  - CZ91234567

invalid (check digit wrong):
  - CZ25123890    (should be 1)
  - CZ25123892    (should be 1)

invalid (format):
  - CZ1234567     (too short — 7 digits)
  - CZ123456789   (too long for v1.7's legal-entity scope)
```

### Recent reforms

- **2004-05-01** — Czechia joined the EU; DIČ format harmonised with
  EU VIES under Zákon č. 235/2004 Sb. The `CZ` prefix dates from this
  reform; pre-accession numbers used `CZECH` / no prefix.
- **2014-01-01** — Recodification (new Civil Code) reaffirms the IČO
  format; check-digit algorithm unchanged.

### Open questions

- The 9-digit "special natural person" branch (first digit `6`) and the
  10-digit RČ branch ship in v1.8 alongside `CZ_RC`. The split lets
  v1.7 ship a high-confidence legal-entity validator without taking on
  the RČ date logic, which is closer in scope to the personal-ID
  batch.

---

## Notes for consumers

- `CZ_DIC` v1.7 is the **legal-entity branch only**. Czech sole-trader
  or individual VAT numbers may exist as 9- or 10-digit values and will
  fail this validator with `too_long`. Consumers handling sole-trader
  data should wait for v1.8 or branch on prefix length upstream.
- `CZ_DIC` is **offline structural validation only**. For active-status
  verification, query VIES at
  <https://ec.europa.eu/taxation_customs/vies/> (prefix `CZ`) or the
  Finanční správa ADIS lookup.
- The 8-digit DIČ body equals the IČO. Consumers that already validate
  the IČO upstream can pass the body through unchanged; the only
  additional check the VAT spec adds is the `CZ` prefix.
