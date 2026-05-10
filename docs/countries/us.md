# United States (US)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `US_SSN` | personal | 9 | none (structural rules) | high |
| `US_ITIN` | tax | 9 | none (structural rules) | high |
| `US_EIN` | tax | 9 | none (prefix membership) | high |

> SSN, ITIN, and EIN all share the 9-digit namespace. Disambiguate by the
> 3-digit area: `9xx` is always ITIN; everything else is SSN. EIN never
> uses the `AAA-GG-SSSS` mask — it uses `NN-NNNNNNN`.

---

## `US_SSN` — Social Security Number

### Overview

Personal identifier issued by the Social Security Administration (SSA). Originally encoded a state of issuance in the area number, but since 2011-06-25 the SSA uses **randomization** — the area no longer reflects geography.

- **Issuer**: SSA — <https://www.ssa.gov/>
- **Composition**: 3 area + 2 group + 4 serial
- **Visual format**: `AAA-GG-SSSS`

### Algorithm

No check digit. SSA structural rules:

```
area    not in {"000", "666"} and not 9xx
group   != "00"
serial  != "0000"
```

### Sources

- SSA Pub. No. 05-10002 — <https://www.ssa.gov/pubs/EN-05-10002.pdf>
- SSA SSN Randomization — <https://www.ssa.gov/employer/randomization.html>
- nationid research tier-2 (`countries-comprehensive-tier2.md` § US) — accessed 2026-05-08

### Synthetic test vectors

> All fixtures are synthetic. Since SSA uses randomized assignment, no 9-digit number can be conclusively identified as "issued"; the rules below check only that the number passes the published structural exclusions.

```
valid:
  - 123-45-6789
  - 001-01-0001
  - 555-12-3456
  - 100-50-9999
  - 699-67-8901

invalid (format):
  - "" (empty)
  - 000-12-3456 (area 000)
  - 666-12-3456 (area 666)
  - 900-12-3456 (area 9xx — ITIN namespace)
  - 950-12-3456
  - 999-12-3456
  - 123-00-1234 (group 00)
  - 123-45-0000 (serial 0000)
  - 12345678 (too short)
  - 1234567890 (too long)
```

### Recent reforms

- **2011-06-25** — SSA randomization deprecated geographic area encoding.

### Open questions

- The SSA also explicitly invalidates a handful of "advertisement" SSNs (e.g. 078-05-1120 from a 1938 wallet sample). This library does NOT enforce that ad-hoc list because (a) it is small, (b) it is not part of the structural rules, and (c) consumers who need that level of paranoia should consult SSA's full historical advisories. Tracking as ADR candidate if user demand surfaces.

---

## `US_ITIN` — Individual Taxpayer Identification Number

### Overview

Tax identifier issued by the IRS for non-residents and non-citizens who must file US taxes but are not eligible for an SSN.

- **Issuer**: IRS — <https://www.irs.gov/individuals/individual-taxpayer-identification-number>
- **Composition**: 3 area (always `9xx`) + 2 group (restricted ranges) + 4 serial
- **Visual format**: `9NN-GG-NNNN` (same separator pattern as SSN)

### Algorithm

```
area  starts with '9'
group in {50..65, 70..88, 90..92, 94..99}
```

Group 93 was never assigned. Groups outside the published ranges are invalid.

### Sources

- IRS ITIN — <https://www.irs.gov/individuals/individual-taxpayer-identification-number>
- IRS Publication 1915.

### Synthetic test vectors

```
valid:
  - 912-50-1234 (group 50, lowest valid)
  - 988-88-7777 (group 88, highest in 70-88)
  - 999-92-0001 (group 92, last in 90-92)
  - 901-65-4321 (group 65, last in 50-65)
  - 950-99-0000 (group 99, highest valid)

invalid (format):
  - "" (empty)
  - 812-50-1234 (non-9 area)
  - 912-00-1234 (group 00)
  - 912-49-1234 (group 49 — just below 50)
  - 912-66-1234 (group 66 — gap 66-69)
  - 912-89-1234 (group 89 — gap)
  - 912-93-1234 (group 93 — never assigned)
```

### Recent reforms

None affecting format in the last 24 months.

### Open questions

None.

---

## `US_EIN` — Employer Identification Number

### Overview

Tax identifier for businesses, issued by the IRS.

- **Issuer**: IRS — <https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes>
- **Composition**: 2-digit campus prefix + 7-digit serial
- **Visual format**: `NN-NNNNNNN`

### Algorithm

No check digit. Valid 2-digit prefixes (IRS-published):

```
01..06, 10..16, 20..27, 30..48, 50..77, 80..88, 90..99
```

Reserved/never-issued: `00`, `07-09`, `17-19`, `28-29`, `49`, `78-79`, `89`.

### Sources

- IRS valid EIN prefixes — <https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes> (accessed 2026-05-08).

### Synthetic test vectors

```
valid:
  - 12-3456789
  - 06-1234567 (prefix 06, edge of 01-06 range)
  - 99-9876543 (prefix 99, top of 90-99 range)
  - 80-1111111
  - 30-0000001

invalid (format):
  - "" (empty)
  - 00-1234567 (reserved 00)
  - 07-1234567 (unassigned)
  - 17-1234567 (unassigned)
  - 28-1234567 (unassigned)
  - 49-1234567 (unassigned)
  - 78-1234567 (unassigned)
  - 89-1234567 (unassigned)
  - 1234567 (too short)
  - 1234567890 (too long)
```

### Recent reforms

The IRS occasionally adds new valid prefixes when opening additional service centers (most recently in the 2010s, no changes in the last 24 months). This library will need a corresponding update when that happens.

### Open questions

- IRS publishes the prefix-to-campus mapping as well (e.g. `01,02,03,04,05,06 -> Andover`). The library does not currently expose campus information; track as future enhancement.

---

## `US_PASAPORTE` — Passport

### Overview

Travel document issued by the U.S. Department of State, Bureau of Consular
Affairs. Legacy passports use 9 digits; Next Generation Passport (NGP, since
2021) uses 1 letter + 8 digits. Both circulate concurrently.

- **Issuer**: Department of State
- **Composition**: legacy `[0-9]{9}` or NGP `[A-Z][0-9]{8}`
- **Visual format**: 9 contiguous chars

### Algorithm

None on the printed number. MRZ check digit lives in
`algorithms/icao-9303.ts`.

### Confidence

`moderate` — State Dept FAQ confirms the NGP letter prefix; no single
canonical regex published.

### Sources

- State Dept NGP page: <https://travel.state.gov/content/travel/en/passports/passport-help/next-generation-passport.html>
- Wikipedia, *United States passport*: <https://en.wikipedia.org/wiki/United_States_passport>
