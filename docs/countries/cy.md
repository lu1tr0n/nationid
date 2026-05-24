# Cyprus (CY)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `CY_VAT` | tax | 11 (`CY` + 8 digits + 1 letter) | Positional translation + mod-26 letter | high |

Ships under the tree-shakable subpath `nationid/cy` and under the EU-wide
aggregator `nationid/vat`.

---

## `CY_VAT` — Αριθμός Εγγραφής ΦΠΑ (VAT Registration Number)

### Overview

Cypriot VAT registration number issued by the Tax Department
(Τμήμα Φορολογίας) of the Ministry of Finance. ΦΠΑ
(*Φόρος Προστιθέμενης Αξίας*) is the native Greek term for VAT.
The structure is unusual within the EU-VAT batch in two ways: the
check character is a **letter** (`A..Z`) rather than a digit, and the
first two body digits `12` are a **reserved prefix** that the
validator must reject as `invalid_format`.

- **Issuer**: Tax Department, Ministry of Finance —
  <https://mof.gov.cy/> ✓ live 2026-05-24 (pre-audit; HTTP 301 →
  <https://www.gov.cy/mof/>)
- **Statute**: `Ν. 95(I)/2000` — *Περί Φόρου Προστιθέμενης Αξίας
  Νόμος του 2000* (the Cyprus VAT Law), binding authority published
  in the official gazette.
- **Composition**: `CY` prefix + 8 digits + 1 uppercase letter
  (`A..Z`). First two digits MUST NOT be `12`.
- **Visual format**: `CY 10259033P` (single block: 8 digits + check
  letter after the country prefix).

### Algorithm

Positional translation of the 8 body digits, then a mod-26 lookup to
produce the check letter. Even-indexed digits (positions 0, 2, 4, 6 —
counting from 0) are translated through this fixed table; odd-indexed
digits (positions 1, 3, 5, 7) keep their raw value:

| Digit | `0` | `1` | `2` | `3` | `4` | `5` | `6` | `7` | `8` | `9` |
|-------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Translated (even-indexed only) | 1 | 0 | 5 | 7 | 9 | 13 | 15 | 17 | 19 | 21 |

```
total = sum(translate[d[i]] for i in [0,2,4,6])
      + sum(int(d[i])       for i in [1,3,5,7])
check_letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[total mod 26]
```

In addition, the validator rejects bodies whose **first two digits are
`12`** (reserved prefix, mapped from `python-stdnum`'s `InvalidComponent`
exception to the library's `invalid_format` reason kind). This is
enforced imperatively inside `validate()`, not via the raw regex —
keeping the regex simple while preserving the documented exclusion.

Confidence: **high**. The Tax Department publishes the algorithm in the
VAT manual; `python-stdnum` reproduces it; the canonical anchor
`CY10259033P` reproduces byte-for-byte from the prose above.

### Sources

- Ministry of Finance — Tax Department (issuer root, pre-audit anchor):
  <https://mof.gov.cy/> ✓ live 2026-05-24 (redirects to `gov.cy/mof`)
- Successor portal under the unified `gov.cy` umbrella:
  <https://www.gov.cy/mof/> ✓ live 2026-05-24
- Tax Department (English-language landing under unified portal):
  <https://www.gov.cy/mof/tax/en/> ✓ live 2026-05-24
- Statute (binding authority) on CyLaw — the standard Cypriot legal
  text repository — consolidated text of N. 95(I)/2000:
  <https://www.cylaw.org/nomoi/enop/non-ind/2000_1_95/full.html> ✓ live 2026-05-24
- VIES portal (cross-validation, EU-wide):
  <https://ec.europa.eu/taxation_customs/vies/> ✓ live 2026-05-24
- EU VAT Directive 2006/112/EC, art. 214:
  <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112> ✓ live 2026-05-24
- Cross-validated against `python-stdnum` (`stdnum.cy.vat`):
  <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/cy/vat.py> ✓ live 2026-05-24

### Synthetic test vectors

```
valid (positional translation + mod-26 letter):
  - CY10259033P   (canonical anchor — VERIFICATION §CY)
  - CY13059150S
  - CY90628765G
  - CY71251268B
  - CY04176022I
  - CY87402967T

invalid (reserved prefix 12):
  - CY12345678X   (first two digits `12` → reserved → `invalid_format`)

invalid (check letter wrong):
  - CY10259033A   (correct letter is P)
  - CY10259033Z   (used in test suite as dedicated invalid_checksum case)

invalid (format):
  - CY1025903P    (7 digits + letter — `too_short`)
  - CY10259033    (missing letter — `invalid_format`)
```

Worked example for the canonical anchor `CY10259033P`:

- body8 = `10259033`, check letter = `P`.
- Even-indexed digits (positions 0, 2, 4, 6) = `1, 2, 9, 3` →
  translated `0, 5, 21, 7`, sum `33`.
- Odd-indexed digits (positions 1, 3, 5, 7) = `0, 5, 0, 3` → raw sum `8`.
- Total = `33 + 8 = 41`.
- `41 mod 26 = 15`. Alphabet index 15 = `P`. ✓

The validator additionally rejects `CY12…` bodies on the imperative
prefix check: `cleaned.slice(2, 4) === "12"` short-circuits before the
mod-26 computation, yielding `invalid_format`.

### Recent reforms

- **2024** — Cypriot government portals consolidated under the unified
  `gov.cy` umbrella; `mof.gov.cy` and `taxnet.mof.gov.cy` redirect to
  `www.gov.cy/mof/`. Registration regime, VAT number format, and the
  `N. 95(I)/2000` statute reference are unchanged.
- **2004** — Cyprus's EU accession brings `CY` into VIES; the 8-digit
  + letter format pre-dates accession (introduced by N. 95(I)/2000)
  and is preserved as-is.
- **2010** — Council Regulation (EU) No 904/2010 reaffirms the CY
  VAT number as the VIES-exposed identifier for cross-border Cypriot
  invoicing.

### Open questions

- None on the algorithm. The reserved-prefix list is `{ "12" }` per
  current Tax Department guidance; if additional reserved prefixes are
  introduced, extend the imperative check inside `validate()` rather
  than the raw regex.

---

## Notes for consumers

- `CY_VAT` is **offline structural validation only**. For
  active-status verification, query VIES at
  <https://ec.europa.eu/taxation_customs/vies/> (prefix `CY`).
- The trailing check **letter** uses the full `A..Z` alphabet — note
  that this differs from Ireland's `IE_VAT`, which uses the
  permuted alphabet `WABCDEFGHIJKLMNOPQRSTUV` (W = 0). Do not borrow
  IE's alphabet for CY or vice versa.
- The reserved `12*` prefix maps to `invalid_format`, not
  `invalid_checksum`. UI flows that branch on the reason kind should
  surface "this number range is not issued" rather than "wrong check
  digit", matching the upstream `python-stdnum` `InvalidComponent`
  semantics.
- The library normalises a lowercase trailing letter to uppercase
  (`normalize("VAT", "cy10259033p")` → `"CY10259033P"`). Display
  should always use the uppercase form per official Tax Department
  practice.
