# India (IN)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `IN_AADHAAR` | personal | 12 | Verhoeff (IS 4905:1968) | high |
| `IN_VID` | personal | 16 | Verhoeff (IS 4905:1968) | high |
| `IN_EPIC` | personal | 10 | none (format only) | low |
| `IN_PAN` | tax | 10 | none (CBDT does not publish the algorithm) | high |
| `IN_GSTIN` | tax | 15 | Luhn mod-36 + embedded PAN | high |

All five specs ship under the tree-shakable subpath `nationid/in`.

---

## `IN_AADHAAR` — Aadhaar number

### Overview

12-digit unique identity number issued to every resident of India. Largest
biometric ID programme in the world (~1.39 billion enrolled as of 2024).

- **Issuer**: Unique Identification Authority of India (UIDAI), Ministry of
  Electronics & Information Technology — <https://uidai.gov.in/>
- **Statute**: Aadhaar (Targeted Delivery of Financial and Other Subsidies,
  Benefits and Services) Act 2016
- **Composition**: 12 digits, first digit `2`–`9`. UIDAI reserves `0` for
  system use and `1xxx…` for the 16-digit VID range.
- **Visual format**: `NNNN NNNN NNNN`

### Algorithm

Verhoeff check digit (IS 4905:1968) over all 12 digits. Verhoeff catches
**all** single-digit substitutions and **all** adjacent-digit transpositions
— stronger than mod-10 or mod-11 schemes.

```
verhoeffValid(digits):
  c = 0
  for i in 0..n-1:
    c = D[c][P[(n-i) mod 8][digits[i]]]
  return c == 0
```

Implementation uses the canonical Verhoeff D₅ multiplication and
permutation tables verbatim from IS 4905:1968. The library exports the
primitive as `verhoeffValid` from `nationid/algorithms`.

In addition to the check-digit test, `IN_AADHAAR` **rejects palindromes**
per the UIDAI "A UID Numbering Scheme" working paper, which excludes them
from the issuance space.

### Sources

- UIDAI: <https://uidai.gov.in/en/my-aadhaar/about-your-aadhaar.html> ✓ live 2026-05-24
- UIDAI "A UID Numbering Scheme" working paper (Wayback snapshot):
  <https://web.archive.org/web/20140611025606/http://uidai.gov.in/UID_PDF/Working_Papers/A_UID_Numbering_Scheme.pdf> ✓
- IS 4905:1968 — Indian Standard "Rules for rounding off numerical values"
  (Verhoeff scheme reference)
- Cross-validated against `python-stdnum` (`stdnum.in_.aadhaar`)

### Synthetic test vectors

```
valid (synthetic, Verhoeff check passes, not a palindrome):
  - 234123412346
  - 999888777669
  - 219876123402
  - 345678901238
  - 789123456789

invalid (palindrome reject):
  - 222222222222

invalid (first digit 0/1):
  - 023412341234   (starts with 0, reserved by UIDAI)
  - 123412341234   (starts with 1, reserved for VID range)

invalid (checksum):
  - 234123412347   (shape ok, Verhoeff fails)
```

### Recent reforms

- No format change since rollout in 2010. Continuous enrolment.

### Open questions

- None. UIDAI publishes both the scheme and the algorithm in primary
  sources; v0.6+ ecosystem libraries agree byte-for-byte.

---

## `IN_VID` — Virtual ID

### Overview

16-digit revocable alias for an Aadhaar number. A holder may generate / cycle
their current VID via the UIDAI portal; each holder has exactly one active
VID at a time. VID was introduced to let authentication-only flows verify
identity without exposing the underlying Aadhaar.

- **Issuer**: UIDAI — <https://uidai.gov.in/en/my-aadhaar/about-your-aadhaar/virtual-id-vid.html>
- **Statute**: UIDAI Circular K-11020/205/2017 dated 10-Jan-2018
- **Composition**: 16 digits, first digit fixed at `1` (UIDAI reserves the
  `1xxx…` range for VID and `2-9` for Aadhaar)
- **Visual format**: `1NNN NNNN NNNN NNNN`

### Algorithm

Same Verhoeff scheme as `IN_AADHAAR`, applied over all 16 digits. Only the
length differs.

### Sources

- UIDAI VID FAQ: <https://uidai.gov.in/en/contact-support/have-any-question/284-faqs/aadhaar-online-services/virtual-id-vid> ✓ live 2026-05-24
- UIDAI Circular K-11020/205/2017 (10-Jan-2018) — legal authority

### Synthetic test vectors

```
valid (synthetic, starts with 1, Verhoeff passes):
  - 1000300031518704
  - 1234567890123455
  - 1987654321098760
  - 1500005000050007
  - 1111111111111113

invalid (does not start with 1):
  - 2234567890123455
```

---

## `IN_EPIC` — Elector's Photo Identity Card

### Overview

Voter ID card issued by the Election Commission of India (ECI). Historically
the second-most-common ID in India after Aadhaar; accepted for many KYC
flows but **not a primary identity proof** under the Aadhaar Act.

- **Issuer**: Election Commission of India — <https://eci.gov.in/>
- **Statute**: Representation of the People Act 1950; ECI order Aug 1993
  introducing the photo identity card
- **Composition**: 3 uppercase letters (Functional Constituency code, FC)
  + 7 digits. Legacy 9-digit forms exist in pre-2000 issuance.
- **Visual format**: `LLLNNNNNNN`

### Algorithm

**None published.** ECI does not release a check-digit algorithm for EPIC
numbers, and community libraries diverge on whether any local pattern
(Luhn on the last 7 digits, etc.) holds across states. `nationid`
deliberately implements **format-only validation** here.

### Confidence

`low` — format only. The issuer is first-party (ECI); the algorithm is
not. Consumers should treat `validate("IN_EPIC", x) === true` as a *shape*
check, not a *real-document* check.

### Sources

- Election Commission of India: <https://www.eci.gov.in/> ✓ live 2026-05-24
- ECI National Voter Service Portal: <https://voters.eci.gov.in/> ✓ live 2026-05-24

### Synthetic test vectors

```
valid (format only):
  - ABC1234567
  - XYZ7654321

invalid (10 digits, no letters):
  - 1234567890
```

### Open questions

- Whether to introduce per-state FC-code allowlists if ECI publishes one.

---

## `IN_PAN` — Permanent Account Number

### Overview

10-character alphanumeric tax identifier issued to every taxpayer (natural
and legal). Required to file income-tax returns, open most bank accounts,
register a company, transact >₹50 000 in property, and more. ~445M issued
as of 2019 — likely >600M today.

- **Issuer**: Income Tax Department, Ministry of Finance — <https://incometaxindia.gov.in/>
- **Statute**: Income-tax Act 1961, section 139A; Income-tax Rules 1962,
  Rule 114
- **Composition**: `LLLLLNNNNL` — 5 letters + 4 digits + 1 letter
- **Visual format**: 10 contiguous uppercase characters (no separators)

### Entity-type whitelist (4th character)

| Char | Entity type                          | Char | Entity type                |
|------|--------------------------------------|------|----------------------------|
| `A`  | Association of Persons (AOP)         | `J`  | Artificial Juridical Person|
| `B`  | Body of Individuals (BOI)            | `L`  | Local Authority            |
| `C`  | Company                              | `P`  | Individual                 |
| `F`  | Firm / LLP                           | `T`  | Trust                      |
| `G`  | Government                           |      |                            |
| `H`  | Hindu Undivided Family (HUF)         |      |                            |

Any other letter at position 4 is rejected.

### Algorithm

The 10th character is documented as a check character by CBDT, but the
algorithm is **not published**. `nationid` enforces:

1. Regex `^[A-Z]{5}[0-9]{4}[A-Z]$`.
2. 4th character in the whitelist above.
3. Serial digits at positions 6–9 cannot be `0000`.

There is no checksum recomputation. `hasCheckDigit: false`; confidence
stays `high` because the format itself is canonical and statute-defined.

### Sources

- Income Tax Department, CBDT portal (issuer root):
  <https://www.incometaxindia.gov.in/> ✓ live 2026-05-24
- Income Tax e-Filing portal (PAN services):
  <https://www.incometax.gov.in/> ✓ live 2026-05-24
- Statute (binding authority): Income-tax Act 1961 s. 139A;
  Income-tax Rules 1962, Rule 114
- Cross-validated against `python-stdnum` (`stdnum.in_.pan`)

### Synthetic test vectors

```
valid (entity-type whitelist + format):
  - AAPFU0939F   (F = Firm)
  - AAACH7409R   (C = Company)
  - AAACR5055K   (C = Company)
  - ABCPL1234E   (P = Individual)
  - BNZPM9876C   (P = Individual)

invalid (entity-type letter not in whitelist):
  - ABMXA3211G   (M = not assigned)

invalid (serial 0000):
  - ACUPA0000R
```

---

## `IN_GSTIN` — Goods and Services Tax Identification Number

### Overview

15-character GST registration number issued to every registered GST
taxpayer. ~14 million active GSTINs as of 2024.

- **Issuer**: Goods and Services Tax Network (GSTN), under the Central Board
  of Indirect Taxes and Customs (CBIC), Ministry of Finance —
  <https://www.gst.gov.in/>
- **Statute**: Central Goods and Services Tax Act 2017; CGST Rules 2017,
  Rule 10
- **Composition**: `SS PPPPPPPPPP E Z C`
  - pos 1–2  state / UT code (`01`–`38` + `96`/`97`/`99` non-state)
  - pos 3–12 PAN of the registered taxpayer (full PAN validation re-applied)
  - pos 13   entity registration number `1`–`9` or `A`–`Z` (`0` invalid)
  - pos 14   literal `Z`
  - pos 15   Luhn mod-36 check digit
- **Visual format**: 15 contiguous uppercase characters (no separators)

### State / UT code table

| Code | Jurisdiction        | Code | Jurisdiction                          |
|------|---------------------|------|---------------------------------------|
| 01   | Jammu and Kashmir   | 20   | Jharkhand                             |
| 02   | Himachal Pradesh    | 21   | Odisha                                |
| 03   | Punjab              | 22   | Chhattisgarh                          |
| 04   | Chandigarh          | 23   | Madhya Pradesh                        |
| 05   | Uttarakhand         | 24   | Gujarat                               |
| 06   | Haryana             | 25   | Daman & Diu (pre-2020)                |
| 07   | Delhi               | 26   | Dadra & Nagar Haveli & Daman & Diu    |
| 08   | Rajasthan           | 27   | Maharashtra                           |
| 09   | Uttar Pradesh       | 28   | Andhra Pradesh (pre-bifurcation)      |
| 10   | Bihar               | 29   | Karnataka                             |
| 11   | Sikkim              | 30   | Goa                                   |
| 12   | Arunachal Pradesh   | 31   | Lakshadweep                           |
| 13   | Nagaland            | 32   | Kerala                                |
| 14   | Manipur             | 33   | Tamil Nadu                            |
| 15   | Mizoram             | 34   | Puducherry                            |
| 16   | Tripura             | 35   | Andaman & Nicobar                     |
| 17   | Meghalaya           | 36   | Telangana                             |
| 18   | Assam               | 37   | Andhra Pradesh (post-bifurcation)     |
| 19   | West Bengal         | 38   | Ladakh                                |
| 96   | Other Territory     | 97   | Other Country (SEZ)                   |
| 99   | Centre Jurisdiction |      |                                       |

Codes outside this set are rejected.

### Algorithm

Luhn check digit over the alphabet `"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"`
(base 36). For each character at position `i` (1-indexed from the **right**,
starting with the check character itself = position 1), compute `v(c)` =
its index in the alphabet, double when `i` is even, fold digit sums >35
modulo 36. The resulting checksum must be `0 mod 36`.

In addition:

- The state code (pos 1–2) must be in the table above.
- The PAN embedded at positions 3–12 must itself validate against
  `IN_PAN` (including entity-type whitelist + serial ≠ `0000`).
- Position 14 must be the literal letter `Z`.

### Sources

- CBIC GST (issuer root): <https://cbic-gst.gov.in/> ✓ live 2026-05-24
- GSTN taxpayer portal: <https://www.gst.gov.in/>
  (browser-accessible; rate-limits programmatic checks)
- Central Goods and Services Tax Rules 2017, Rule 10 (binding authority)
- Cross-validated against `python-stdnum` (`stdnum.in_.gstin`)

### Synthetic test vectors

```
valid (state code + PAN + Z + Luhn-36 check digit all pass):
  - 27AAPFU0939F1ZV
  - 07AAACH7409R1Z3
  - 09AAACI1681G1ZN
  - 33AAACR5055K1ZE
  - 29AAACW2702R1ZW
  - 24AAACR4849B1ZO
  - 19AAJCS6789L1Z9

invalid (check digit wrong):
  - 27AAPFU0939F1ZO
```

### Recent reforms

- **2017-07-01** — CGST Act takes effect; first GSTINs issued.
- **2020-01-26** — Daman & Diu UT merged with Dadra & Nagar Haveli (state
  codes `25` and `26` reorganised; legacy `25` GSTINs remain valid).
- **2024-01** — Telangana migration to state code `36` finalised
  (post-2014 bifurcation cleanup).

### Open questions

- None. CBIC publishes the structure; GSTN samples agree with python-stdnum
  byte-for-byte.

---

## Notes for consumers

- `IN_AADHAAR` and `IN_VID` are PII under the Aadhaar Act and the Digital
  Personal Data Protection Act 2023. The library exposes `mask` /
  `hash` / `lastN` under `nationid/pii` for safe display. See
  [`docs/PII_GUIDANCE.md`](../PII_GUIDANCE.md).
- The Verhoeff primitive is exported from `nationid/algorithms`. Use it for
  any consumer-side Aadhaar / VID input validation in custom flows.
- `IN_PAN` is embedded inside every `IN_GSTIN`. `validate("IN_GSTIN", x)`
  implicitly validates the PAN, so callers that already validate the GSTIN
  do not need to extract and re-validate the PAN.
