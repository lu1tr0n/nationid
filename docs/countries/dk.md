# Denmark (DK)

Reference for `nationid` consumers and contributors. Implemented since v0.6.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `DK_CPR` | personal | 10 | format-only (mod-11 legacy, abandoned 2007) | moderate |
| `DK_CVR` | tax (entity) | 8 | weighted mod-11 | high |
| `DK_VAT` | tax (VAT) | 10 (`DK` + 8 CVR) | weighted mod-11 over CVR body | high |

## `DK_CPR` — CPR-nummer

### Overview

The CPR-nummer (Centrale Personregister) is the universal civil identifier for everyone registered in Denmark. Ten digits formatted as `DDMMYY-NNNN`.

- **Issuer**: CPR-administrationen / CPR-kontoret (Indenrigs- og Sundhedsministeriet). <https://cpr.dk/>
- **Composition**: 6 DOB digits (`DDMMYY`) + 4 løbenummer; the combination of digits 5–7 encodes the century and the last digit's parity encodes sex (odd = male, even = female).
- **Visual format**: printed with the dash (`DDMMYY-NNNN`) on the yellow health-card; stored without it in registry systems.

### Algorithm

Validation is **format-only** (length, regex, plausible calendar date). The legacy weighted-sum check applied **only to pre-2007 numbers**:

```
weights = [4, 3, 2, 7, 6, 5, 4, 3, 2, 1]
sum     = Σ digits[i] * weights[i]   for i in 0..9
valid   ⇔ sum mod 11 == 0
```

The CPR Office formally abandoned the modulus on **1 October 2007** because some birth-cohort year-day combinations could no longer satisfy it; modern numbers are issued without regard for it. The library policy is therefore:

- `validate()` does **not** enforce the mod-11 check.
- `cprMod11Legacy(input)` is exposed for callers that want to opportunistically discriminate pre-2007 numbers.
- `hasCheckDigit: false`, `confidence: "moderate"`.

### Sources

- CPR-kontoret — modulus 11 abandonment (verified live 2026-05-24): <https://www.cpr.dk/cpr-systemet/personnumre-uden-kontrolciffer-modulus-11-kontrol/>
- CPR-kontoret — CPR-nummer composition (verified live 2026-05-24): <https://www.cpr.dk/cpr-systemet/opbygning-af-cpr-nummeret>
- Statute: **LBK nr 646 af 02/06/2017** — Bekendtgørelse af lov om Det Centrale Personregister (CPR-Loven). <https://www.retsinformation.dk/eli/lta/2017/646>
- Cross-validation: `python-stdnum/stdnum/dk/cpr.py` — also format-only.

### Synthetic test vectors

```
valid:
  - 0101801233        (1980-01-01, legacy mod-11 satisfied)
  - 010180-1233       (same, with separator)
  - 1506704568        (1970-06-15, legacy mod-11 satisfied)
  - 0101010015        (2001-01-01, post-2007 sans mod-11)
  - 0101801234        (post-2007 form; format passes, mod-11 fails)

invalid (format):
  - 3201801233        (day 32)
  - 0113801233        (month 13)
  - ABCDEFGHIJ        (non-digit)
  - 010180123         (length 9)
```

### Recent reforms

None affecting the format or validation since the 2007 abandonment of the mod-11 enforcement.

### Open questions

- Whether to expose a `hasLegacyCheck(input)` predicate beyond `cprMod11Legacy` for consumers that want to flag pre-2007 numbers explicitly in UI. Deferred to v2.x.

---

## `DK_CVR` — CVR-nummer

### Overview

The CVR-nummer (Centralt Virksomhedsregister) is the unique identifier assigned to every legal entity registered in Denmark. Eight digits.

- **Issuer**: Erhvervsstyrelsen (Danish Business Authority). <https://datacvr.virk.dk/>
- **Composition**: 8 sequential digits; the last digit is the mod-11 check.
- **Visual format**: typically printed without separators (`12345678`).

### Algorithm

```
weights = [2, 7, 6, 5, 4, 3, 2, 1]
sum     = Σ digits[i] * weights[i]   for i in 0..7
valid   ⇔ sum mod 11 == 0
```

### Sources

- Erhvervsstyrelsen — CVR registry: <https://datacvr.virk.dk/>
- Cross-validation: `python-stdnum/stdnum/dk/cvr.py` — same algorithm, identical weights.

### Synthetic test vectors

```
valid:
  - 12345674          (mod-11 check satisfied)
  - 98765433          (mod-11 check satisfied)
  - 23456788          (mod-11 check satisfied)

invalid (checksum):
  - 12345670          (mod-11 fails)
  - 12345671          (mod-11 fails)

invalid (format):
  - 1234              (length 4)
  - 123456789         (length 9)
  - ABCDEFGH          (non-digit)
```

### Recent reforms

None.

### Open questions

None.

---

## `DK_VAT` — Moms

### Overview

The Danish VAT identifier is the country prefix `DK` followed by the 8-digit CVR body.

- **Issuer**: Skattestyrelsen (Tax Agency) via CVR registration.
- **Composition**: literal `DK` + 8-digit CVR.
- **Visual format**: `DK12345678` (no separator).

### Algorithm

Strip the `DK` prefix, then apply the CVR mod-11 check.

### Sources

- Skattestyrelsen — VAT (Moms): <https://skat.dk/>
- VIES — VAT verification (member state DK): <https://ec.europa.eu/taxation_customs/vies/>

### Synthetic test vectors

```
valid:
  - DK12345674        (CVR body passes mod-11)
  - DK98765433        (CVR body passes mod-11)

invalid (checksum):
  - DK12345670        (CVR body fails mod-11)

invalid (format):
  - 12345674          (missing DK prefix)
  - DK1234567         (body length 7)
  - DKABCDEFGH        (non-digit body)
```

### Recent reforms

None.

### Open questions

None.
