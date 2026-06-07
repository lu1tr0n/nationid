# Sweden (SE)

Reference for `nationid` consumers and contributors. Implemented since v0.6.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `SE_PERSONNUMMER` | personal | 10 or 12 | Luhn over 10-digit form | high |
| `SE_ORGNR` | tax (entity) | 10 | Luhn | high |
| `SE_VAT` | tax (VAT) | 14 (`SE` + 10 orgnr + `01`) | orgnr Luhn | high |

## `SE_PERSONNUMMER` — Personnummer (incl. samordningsnummer)

### Overview

The Personnummer is the universal civil identifier issued by Skatteverket (Swedish Tax Agency) to every person registered in the Swedish population. The same shape is reused for samordningsnummer (coordination numbers) issued to non-residents who interact with Swedish authorities, with the day field offset by +60.

- **Issuer**: Skatteverket — Folkbokföringen. <https://www.skatteverket.se/>
- **Composition**: 6 or 8 DOB digits + 3 individual digits (3rd digit's parity encodes sex: odd = male, even = female) + 1 Luhn check digit.
- **Visual format**: `YYMMDD-NNNC` (10-digit) or `YYYYMMDD-NNNC` (12-digit); the separator becomes `+` from the calendar year the holder turns 100.

### Algorithm

Compute the standard **Luhn (ISO/IEC 7812-1)** check digit over the 10-digit form `YY MM DD I1 I2 I3 C`. For the 12-digit form, drop the century before computing.

```
position:    D1  D2  D3  D4  D5  D6  D7  D8  D9  D10(=C)
multiplier:   2   1   2   1   2   1   2   1   2   1

valid ⇔  Σ digitsum(Dᵢ · mᵢ) mod 10 == 0
where digitsum(x) = x if x < 10 else x − 9
```

**Samordningsnummer variant**: the day field has 60 added (`dd ∈ [61, 91]`). Same Luhn computation. Skatteverket's published worked example is `701063-2391` — a 1970-10-03 samordningsnummer with individnummer `239` and check digit `1`.

### Sources

- Skatteverket — Personnummer och samordningsnummer (verified live 2026-05-24): <https://www.skatteverket.se/privat/folkbokforing/personnummerochsamordningsnummer.4.3810a01c150939e893f18c29.html>
- Skatteverket — Samordningsnummer (verified live 2026-05-24, includes worked example): <https://www.skatteverket.se/privat/folkbokforing/samordningsnummer.4.5c281c7015abecc2e201130b.html>
- Statute: **Folkbokföringslag (1991:481), 18 §** (consolidated through SFS 2026:133): <https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/folkbokforingslag-1991481_sfs-1991-481/>
- Statute (samordningsnummer): **Lag (2022:1697) om samordningsnummer** (in force 2023-09-01).
- Cross-validation: `personnummer` (npm) and `python-stdnum/stdnum/se/personnummer.py`.

### Synthetic test vectors

```
valid:
  - 8112289874        (10-digit, 1981-12-28)
  - 811228-9874       (same, with separator)
  - 198112289874      (12-digit form)
  - 19811228-9874     (12-digit, with separator)
  - 701063-2391       (Skatteverket published samordningsnummer)

invalid (format):
  - 81122898          (length 8)
  - 19811228-987      (12-digit body missing check)
  - PERSONNUMMER      (non-digit)

invalid (checksum):
  - 8112289870        (Luhn fails)
```

### Recent reforms

- **2023-09-01**: Lag (2022:1697) replaced the older 2009:154 statute for samordningsnummer. Shape and algorithm unchanged.

### Open questions

- **Interim numbers (`interimspersonnummer`)** used by health-care systems before identity verification (replace first individnummer digit with `T R S U W X J K L M N`) are **not accepted** today. The npm `personnummer` package gates them behind `allowInterimNumber`. Consider a similar opt-in for v2.x.

---

## `SE_ORGNR` — Organisationsnummer

### Overview

The Organisationsnummer is the unique identifier assigned to every Swedish legal entity registered in Bolagsverket. Ten digits.

- **Issuer**: Bolagsverket. <https://bolagsverket.se/>
- **Composition**: 9 sequential body digits + 1 Luhn check digit. The third digit is `>= 2` (this disambiguates orgnr from personnummer, whose third digit is `0` or `1` because it is the second digit of the month).
- **Visual format**: `XXXXXX-XXXX`.

### Algorithm

Standard Luhn over all 10 digits, plus the third-digit `>= 2` disambiguation rule.

### Sources

- Bolagsverket — registry: <https://bolagsverket.se/>
- Cross-validation: `python-stdnum/stdnum/se/orgnr.py`.

### Synthetic test vectors

```
valid:
  - 5566778899        (legal entity, Luhn passes, third digit 6)
  - 8024677299        (legal entity, Luhn passes, third digit 2)

invalid (format):
  - 556677889         (length 9)
  - 55667788990       (length 11)
  - 5501010101        (third digit < 2 — looks like personnummer)

invalid (checksum):
  - 5566778890        (Luhn fails)
```

### Recent reforms

None.

### Open questions

None.

---

## `SE_VAT` — VAT (Moms)

### Overview

The Swedish VAT identifier is the country prefix `SE` followed by the 10-digit organisationsnummer and the literal suffix `01`.

- **Issuer**: Skatteverket via Bolagsverket registration.
- **Composition**: literal `SE` + 10 orgnr digits + literal `01` (14 characters total).
- **Visual format**: `SE556036079301`.

### Algorithm

Strip the `SE` prefix and `01` suffix, then apply the orgnr Luhn check plus the third-digit `>= 2` rule.

### Sources

- Skatteverket — VAT (Moms): <https://www.skatteverket.se/>
- VIES — VAT verification (member state SE): <https://ec.europa.eu/taxation_customs/vies/>

### Synthetic test vectors

```
valid:
  - SE556677889901    (orgnr body passes Luhn)
  - SE212000156101    (orgnr body passes Luhn)

invalid (checksum):
  - SE556677889001    (orgnr body fails Luhn)

invalid (format):
  - 556677889901      (missing SE prefix)
  - SE556677889902    (suffix not 01)
  - SE55667788990102  (length 16)
  - SE550101010101    (orgnr 3rd digit < 2)
```

### Recent reforms

None.

### Open questions

None.
