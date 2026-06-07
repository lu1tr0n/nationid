# Norway (NO)

Reference for `nationid` consumers and contributors. Implemented since v0.6.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `NO_FNR` | personal | 11 | dual weighted mod-11 | high |
| `NO_DNR` | personal (foreign residents) | 11 | same as FNR (day + 40) | high |
| `NO_ORGNR` | tax (entity) | 9 | weighted mod-11 | high |
| `NO_MVA` | tax (VAT) | 14 (`NO` + 9 orgnr + `MVA`) | orgnr mod-11 | high |

## `NO_FNR` — Fødselsnummer

### Overview

The Fødselsnummer is the universal personal identification number for residents of Norway. Eleven digits encoding the date of birth, individnummer (century + sex), and a dual mod-11 checksum.

- **Issuer**: Skatteetaten — Folkeregisteret (Norwegian Tax Administration, National Population Register). <https://www.skatteetaten.no/>
- **Composition**: `D1 D2 D3 D4 D5 D6 I1 I2 I3 K1 K2` where `DDMMYY` is the date of birth, `I1 I2 I3` is the individnummer (3rd digit's parity encodes sex: odd = male, even = female), `K1 K2` are the check digits.
- **Visual format**: printed without separators (`01018012371`).

### Algorithm

```
DV1 = (11 − Σ(W1ᵢ · Dᵢ)) mod 11   weights W1 = [3, 7, 6, 1, 8, 9, 4, 5, 2]  over digits 1..9
DV2 = (11 − Σ(W2ᵢ · Dᵢ)) mod 11   weights W2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]  over digits 1..10
```

If either check digit comes out as **10** the entire FNR is **invalid** (never assigned). A result of `0` is allowed (it corresponds to a sum that is already a multiple of 11).

Worked example `15108695088` (python-stdnum canonical):

- DV1 over `151086950`: `1·3+5·7+1·6+0·1+8·8+6·9+9·4+5·5+0·2 = 223`. `223 mod 11 = 3`. `11 − 3 = 8` ✓ (matches K1).
- DV2 over `1510869508`: `1·5+5·4+1·3+0·2+8·7+6·6+9·5+5·4+0·3+8·2 = 201`. `201 mod 11 = 3`. `11 − 3 = 8` ✓ (matches K2).

### Sources

- Skatteetaten — National identity number (verified live 2026-05-24): <https://www.skatteetaten.no/en/person/national-registry/birth-and-name-selection/children-born-in-norway/national-id-number/>
- Statute: **Folkeregisterloven LOV-2016-12-09-88 §§ 4-1 to 4-3**: <https://lovdata.no/dokument/NL/lov/2016-12-09-88>
- Cross-validation: `python-stdnum/stdnum/no/fodselsnummer.py` — bit-identical weights, modulo, and 10-rejection.

### Synthetic test vectors

```
valid:
  - 01018012371       (1980-01-01, dual mod-11 passes)
  - 15067045618       (1970-06-15)
  - 01018012370       (1980-01-01, alternate valid pair)
  - 15108695088       (stdnum canonical worked example)

invalid (format):
  - 0101801237        (length 10)
  - 010180123710      (length 12)
  - ABCDEFGHIJK       (non-digit)

invalid (checksum):
  - 01018012372       (K2 mismatch)
  - 11077942775       (DV1 mismatch)
```

### Recent reforms

- **Postponed to ≥2032**: Skatteetaten's planned redesign relaxing the gender bit and extending the number space. No code change needed today.

### Open questions

- **Calendar validity not enforced**: `validate()` accepts impossible Gregorian dates (Feb 30, Apr 31). python-stdnum delegates to `datetime.date(...)` and rejects them.
- **Individnummer-vs-century guard not implemented**: the Skatteetaten table reserves specific individnummer ranges per birth-year window (e.g. `0–499` → 1900s; `500–749` + `YY ≥ 54` → 1855–1899). Syntactically well-formed FNRs that fall outside the assigned ranges are currently accepted.
- **Born-in-future not rejected**: a 2099-dated FNR with valid checksums is accepted; python-stdnum rejects via `> datetime.date.today()`.
- **H-numbers (month + 40, health sector)**: currently rejected via `mm > 12`. Keeping them as a separate spec (`NO_HNR`) is defensible; defer.

---

## `NO_DNR` — D-nummer

### Overview

The D-nummer is the identification number assigned to foreign nationals who interact with Norwegian authorities (taxation, banking, employment) without being permanent residents. Same shape and algorithm as FNR, with the day field offset by +40.

- **Issuer**: Skatteetaten — Folkeregisteret.
- **Composition**: same as FNR, but the first digit of `DDMMYY` is shifted so the day range is `[41, 71]` instead of `[01, 31]`.
- **Visual format**: `41018012365`.

### Algorithm

Subtract 40 from the day, then apply the FNR dual mod-11 check unchanged.

### Sources

- Skatteetaten — D number: <https://www.skatteetaten.no/en/person/foreign/norwegian-identification-number/d-number/>
- Cross-validation: same `python-stdnum/stdnum/no/fodselsnummer.py` module covers DNR.

### Synthetic test vectors

```
valid:
  - 41018012365       (day 01 + 40)
  - 55067045601       (day 15 + 40)

invalid (format):
  - 31018012365       (day field looks like FNR not DNR)
  - 81018012365       (day 81 = 41 normalized, out of range)
```

### Recent reforms

None.

### Open questions

Same open questions as FNR (calendar validity, individnummer guard, born-in-future).

---

## `NO_ORGNR` — Organisasjonsnummer

### Overview

The Organisasjonsnummer is the unique identifier assigned to every legal entity registered in Brønnøysundregistrene (the Central Coordinating Register for Legal Entities). Nine digits.

- **Issuer**: Brønnøysundregistrene. <https://www.brreg.no/>
- **Composition**: 8 sequential body digits + 1 check digit.
- **Visual format**: typically grouped as `XXX XXX XXX`.

### Algorithm

```
weights = [3, 2, 7, 6, 5, 4, 3, 2]
sum     = Σ digits[i] * weights[i]   for i in 0..7
r       = sum mod 11
dv      = 11 - r   if r > 1
        = 0        if r == 0
        = invalid  if r == 1   (dv would be 10)
```

### Sources

- Brønnøysundregistrene — registry search: <https://www.brreg.no/>
- Cross-validation: `python-stdnum/stdnum/no/orgnr.py`.

### Synthetic test vectors

```
valid:
  - 976012348         (mod-11 check satisfied)
  - 999888771         (mod-11 check satisfied)
  - 987654325         (mod-11 check satisfied)

invalid (checksum):
  - 976012340         (wrong check digit)
  - 987654320         (wrong check digit)

invalid (format):
  - 12345             (length 5)
  - 1234567890        (length 10)
  - ABCDEFGHI         (non-digit)
```

### Recent reforms

None.

### Open questions

None.

---

## `NO_MVA` — VAT (Merverdiavgift)

### Overview

The Norwegian VAT identifier is the country prefix `NO` followed by the 9-digit organisasjonsnummer and the literal suffix `MVA`.

- **Issuer**: Skatteetaten via Brønnøysundregistrene registration.
- **Composition**: literal `NO` + 9 orgnr digits + literal `MVA` (14 characters total).
- **Visual format**: `NO974760673MVA`.

### Algorithm

Strip the `NO` prefix and the `MVA` suffix, then apply the orgnr mod-11 check.

### Sources

- Skatteetaten — VAT (Merverdiavgift): <https://www.skatteetaten.no/en/business-and-organisation/vat-and-duties/vat/>

### Synthetic test vectors

```
valid:
  - NO976012348MVA    (orgnr body passes mod-11)
  - NO999888771MVA    (orgnr body passes mod-11)

invalid (checksum):
  - NO976012340MVA    (orgnr body fails mod-11)

invalid (format):
  - 976012348MVA      (missing NO)
  - NO976012348       (missing MVA)
  - NO97601234MVA     (body length 8)
```

### Recent reforms

None.

### Open questions

None.
