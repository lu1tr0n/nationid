# Finland (FI)

Reference for `nationid` consumers and contributors. Implemented since v0.6.

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `FI_HETU` | personal | 11 | mod-31 over 9-digit DOB+individual | high |
| `FI_YTUNNUS` | tax (entity) | 8 (`1234567-8`) | weighted mod-11 | high |
| `FI_VAT` | tax (VAT) | 10 (`FI` + 8 Y-tunnus) | Y-tunnus mod-11 | high |

## `FI_HETU` — Henkilötunnus

### Overview

The Henkilötunnus (HETU) is Finland's universal personal identity code. Eleven characters: `DDMMYY` + century separator + 3 individual digits + 1 check character.

- **Issuer**: DVV (Digi- ja väestötietovirasto / Digital and Population Data Services Agency). <https://dvv.fi/en/personal-identity-code>
- **Composition**: 6 DOB digits + 1 century separator + 3 individual digits (`NNN`, 002–899 in practice; 900–999 reserved for temporary identifiers; 3rd digit's parity encodes sex) + 1 check character.
- **Visual format**: printed on the personal ID card and embedded in tax records as `131052-308T`.

### Algorithm

**Century separator** (Decree 128/2010 §2, in force 2023-01-01):

- `+` → 1800–1899
- `-`, `Y`, `X`, `W`, `V`, `U` → 1900–1999
- `A`, `B`, `C`, `D`, `E`, `F` → 2000–2099

**Check character**: compute the 9-digit number formed by `DDMMYY` concatenated with `NNN`, then index `n mod 31` into the alphabet `"0123456789ABCDEFHJKLMNPRSTUVWXY"` (length 31, skipping `G`, `I`, `O`, `Q`, `Z`).

```
n = int(DDMMYY || NNN)
expected_check = ALPH[n mod 31]
```

DVV's canonical worked example: `131052-308T` — `n = 131052308`, `n mod 31 = 25`, `ALPH[25] = T` ✓.

### Sources

- DVV — Personal identity code (verified live via Internet Archive 2026-05-07): <https://dvv.fi/en/personal-identity-code>
- DVV — 2023 reform of the personal identity code: <https://dvv.fi/en/reform-of-personal-identity-code>
- Statute: **Laki väestötietojärjestelmästä 661/2009 §11** + **Decree 128/2010 §2** (2023 amendment): <https://www.finlex.fi/fi/laki/ajantasa/2009/20090661>
- Cross-validation: `python-stdnum/stdnum/fi/hetu.py` — same alphabet, regex, and century-code table.

### Synthetic test vectors

```
valid:
  - 010180-1232       (1980-01-01)
  - 311299-876F       (1999-12-31)
  - 200201A7897       (2002-01-20, post-2023 separator)
  - 050555+2340       (1855-05-05)
  - 010180G1232       (post-2023 alternate 1900s separator)

invalid (format):
  - 010180-12         (too short)
  - 010180-12345      (too long)
  - ABCDEFGHIJK       (non-digit DOB)

invalid (checksum):
  - 010180-1230       (wrong check character)
```

### Recent reforms

- **2023-01-01** (Decree 128/2010 §2 amendment) added 11 new century separators (`Y/X/W/V/U` for 1900s, `B/C/D/E/F` for 2000s) to address ID-space exhaustion.

### Open questions

- **Calendar validity not enforced**: `validate()` accepts impossible dates like Feb 31. python-stdnum delegates to `datetime.date(year, month, day)` and rejects them. Backlog item for v2.x.
- **Individual `000` / `001` accepted**: DVV says the issued range is 002–899; python-stdnum rejects 000/001 as `InvalidComponent`. Consider mirroring.
- **Temporary range 900–999 accepted as ordinary HETU**: python-stdnum gates this behind `allow_temporary=False`. Consider adding a strict-mode opt-in.

---

## `FI_YTUNNUS` — Y-tunnus (Business ID)

### Overview

The Y-tunnus is the unique business identifier assigned to every Finnish legal entity registered in the YTJ joint registry. Eight digits printed as `1234567-8`.

- **Issuer**: PRH (Patentti- ja rekisterihallitus) / Verohallinto via the YTJ joint registry. <https://www.ytj.fi/>
- **Composition**: 7 sequential body digits + dash + 1 check digit.
- **Visual format**: `1234567-8`.

### Algorithm

```
weights = [7, 9, 10, 5, 8, 4, 2]
sum     = Σ digits[i] * weights[i]   for i in 0..6
r       = sum mod 11
dv      = 11 - r   if r > 1
        = 0        if r == 0
        = invalid  if r == 1   (dv would be 10)
```

### Sources

- YTJ — Business ID lookup: <https://www.ytj.fi/>
- PRH — Y-tunnus information: <https://www.prh.fi/en/kaupparekisteri/yritystoiminta/y-tunnus.html>
- Cross-validation: `python-stdnum/stdnum/fi/ytunnus.py`.

### Synthetic test vectors

```
valid:
  - 1234567-1         (mod-11 check satisfied)
  - 4567890-7         (mod-11 check satisfied)
  - 0737546-2         (mod-11 check satisfied)
  - 12345671          (same number without dash)

invalid (checksum):
  - 1234567-0         (wrong check digit)
  - 9876543-1         (wrong check digit)

invalid (format):
  - 1234567           (missing dash + check)
  - 123456789         (length 9)
  - ABCDEFG-1         (non-digit body)
```

### Recent reforms

None.

### Open questions

None.

---

## `FI_VAT` — ALV-numero

### Overview

The Finnish VAT identifier is the country prefix `FI` followed by the 8-digit Y-tunnus body (no dash).

- **Issuer**: Verohallinto via YTJ registration.
- **Composition**: literal `FI` + 7 body digits + 1 check digit.
- **Visual format**: `FI12345671`.

### Algorithm

Strip the `FI` prefix, then apply the Y-tunnus mod-11 check.

### Sources

- Verohallinto — VAT information: <https://www.vero.fi/en/>
- VIES — VAT verification (member state FI): <https://ec.europa.eu/taxation_customs/vies/>

### Synthetic test vectors

```
valid:
  - FI12345671        (Y-tunnus body passes mod-11)

invalid (checksum):
  - FI12345670        (Y-tunnus body fails mod-11)

invalid (format):
  - 12345671          (missing FI prefix)
  - FI1234567         (body length 7)
  - FIABCDEFGH        (non-digit body)
```

### Recent reforms

None.

### Open questions

None.
