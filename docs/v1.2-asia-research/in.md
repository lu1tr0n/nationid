# India (IN) — research for nationid v1.2

> Target codes: `IN_AADHAAR`, `IN_PAN`, `IN_GSTIN`, `IN_EPIC`, `IN_VID`
> Author: research-agent · Date: 2026-05-23 · Library version: nationid@1.1.0 → planned 1.2.0
> Scope: India only. Driving licence and passport are deferred.

---

## Country overview

| Property                     | Value                                                              |
| ---------------------------- | ------------------------------------------------------------------ |
| ISO 3166 alpha-2 / alpha-3   | `IN` / `IND`                                                       |
| Currency                     | INR                                                                |
| Population (2024 est.)       | ~1.43 billion                                                      |
| Aadhaar enrolled (2024)      | ~1.39 billion                                                      |
| PAN issued (Mar 2019)        | ~445M (est. >600M by 2024)                                         |
| GST taxpayers (2024)         | ~14 million active GSTINs                                          |
| Voter rolls (2024)           | ~969 million registered electors                                   |
| VID                          | On-demand alias for each Aadhaar holder; one active VID at a time  |

### Issuer landscape

| Code         | Document                                  | Issuer                                                                          | Statute                                                  |
| ------------ | ----------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `IN_AADHAAR` | Aadhaar number (12-digit UID)             | Unique Identification Authority of India (UIDAI), Ministry of Electronics & IT  | Aadhaar (Targeted Delivery …) Act 2016                   |
| `IN_PAN`     | Permanent Account Number                  | Income Tax Department, Ministry of Finance                                      | Income-tax Act 1961, s. 139A; Rule 114                   |
| `IN_GSTIN`   | Goods and Services Tax Identification Nº  | Goods and Services Tax Network (GSTN), Central Board of Indirect Taxes (CBIC)   | CGST Act 2017; CGST Rules 2017, rule 10                  |
| `IN_EPIC`    | Elector's Photo Identity Card number      | Election Commission of India (ECI)                                              | Representation of the People Act 1950; ECI Order Aug 1993 |
| `IN_VID`     | Virtual ID (16-digit Aadhaar alias)       | UIDAI                                                                           | UIDAI Circular K-11020/205/2017 dated 10-Jan-2018         |

### GSTIN state codes (CBIC notification + python-stdnum cross-check)

`SS` = first two digits of every GSTIN.

| Code | Jurisdiction        | Code | Jurisdiction                          |
| ---- | ------------------- | ---- | ------------------------------------- |
| 01   | Jammu and Kashmir   | 20   | Jharkhand                             |
| 02   | Himachal Pradesh    | 21   | Odisha                                |
| 03   | Punjab              | 22   | Chhattisgarh                          |
| 04   | Chandigarh          | 23   | Madhya Pradesh                        |
| 05   | Uttarakhand         | 24   | Gujarat                               |
| 06   | Haryana             | 25   | Daman and Diu (pre-2020)              |
| 07   | Delhi               | 26   | Dadra & Nagar Haveli & Daman & Diu    |
| 08   | Rajasthan           | 27   | Maharashtra                           |
| 09   | Uttar Pradesh       | 28   | Andhra Pradesh (pre-bifurcation)      |
| 10   | Bihar               | 29   | Karnataka                             |
| 11   | Sikkim              | 30   | Goa                                   |
| 12   | Arunachal Pradesh   | 31   | Lakshadweep                           |
| 13   | Nagaland            | 32   | Kerala                                |
| 14   | Manipur             | 33   | Tamil Nadu                            |
| 15   | Mizoram             | 34   | Puducherry                            |
| 16   | Tripura             | 35   | Andaman and Nicobar Islands           |
| 17   | Meghalaya           | 36   | Telangana                             |
| 18   | Assam               | 37   | Andhra Pradesh (new, post-2014)       |
| 19   | West Bengal         | 38   | Ladakh (from 2020-01-01)              |
|      |                     | 96/97| Other Territory (UIN / OIDAR)         |
|      |                     | 99   | Centre Jurisdiction                   |

`38` (Ladakh) was added after 2020-01-01 — older python-stdnum versions omit it. `96`/`97`/`99` are non-state codes for UIN (embassies/UN agencies) and centre-jurisdiction; they are valid 1st-2nd characters and should be accepted.

---

## IN_AADHAAR

### Header

- **Issuer:** Unique Identification Authority of India (UIDAI), Ministry of Electronics & IT.
- **Year of introduction:** 2009 (first Aadhaar 2010-09-29).
- **Source URLs (primary):**
  - https://uidai.gov.in/en/my-aadhaar/about-your-aadhaar.html — "12-digit random number issued by UIDAI".
  - https://uidai.gov.in/en/my-aadhaar/about-your-aadhaar/features-of-aadhaar.html — describes random property.
  - UIDAI Working Paper "A UID Numbering Scheme" (Nov 2010), archived: https://web.archive.org/web/20140611025606/http://uidai.gov.in/UID_PDF/Working_Papers/A_UID_Numbering_Scheme.pdf — defines Verhoeff.
- **Statute:** Aadhaar Act 2016.
- **Secondary verified source:** `python-stdnum/stdnum/in_/aadhaar.py` — same Verhoeff scheme; doctest fixtures match.
- **Confidence tier:** **high.** Issuer publishes algorithm + statute defines issuer + FAQ confirms structure. Governance test accepts `uidai.gov.in` via `gov.in` suffix.
- **Population coverage:** ~1.39 billion enrolled residents (>99% of adults) — world's largest biometric ID programme.

### Format

- **Raw shape:** 12 digits, no letters. Length fixed at 12.
- **First digit:** must be `2`–`9`. UIDAI's numbering scheme excludes `0` (system use) and `1` (VID range).
- **Cannot be a palindrome** (per UIDAI working paper; python-stdnum enforces).
- **No encoded data** — the number is non-meaningful.
- **Canonical formatted form:** `NNNN NNNN NNNN` (groups of 4, U+0020). Aadhaar PVC cards and e-Aadhaar PDFs use this form.
- **MeitY masking guideline:** `XXXX XXXX NNNN` for display in third-party systems.

### Regex

```
rawRegex (normalized, no separators): /^[2-9][0-9]{11}$/
formattedRegex (with spaces):         /^[2-9][0-9]{3} [0-9]{4} [0-9]{4}$/
```

The `rawRegex` is a *shape gate only*; `validate()` must additionally:
1. Reject palindromes (`s === s.split("").reverse().join("")`).
2. Verify the Verhoeff check digit over all 12 digits.

### Algorithm — Verhoeff (IS 4905:1968)

Devised by J. Verhoeff (1969); standardised as Indian Standard IS 4905:1968. UIDAI applies it over all 12 digits (rightmost = check digit).

**Three lookup tables** (verbatim from the canonical published source — Verhoeff 1969 / Wikipedia / python-stdnum):

`d` (Dihedral D₅ multiplication table, indexed `[j][k]` for `j*k`):

```
       0 1 2 3 4 5 6 7 8 9
    0  0 1 2 3 4 5 6 7 8 9
    1  1 2 3 4 0 6 7 8 9 5
    2  2 3 4 0 1 7 8 9 5 6
    3  3 4 0 1 2 8 9 5 6 7
    4  4 0 1 2 3 9 5 6 7 8
    5  5 9 8 7 6 0 4 3 2 1
    6  6 5 9 8 7 1 0 4 3 2
    7  7 6 5 9 8 2 1 0 4 3
    8  8 7 6 5 9 3 2 1 0 4
    9  9 8 7 6 5 4 3 2 1 0
```

`p` (Permutation table indexed `[i mod 8][n]`):

```
    0  0 1 2 3 4 5 6 7 8 9
    1  1 5 7 6 2 8 3 0 9 4
    2  5 8 0 3 7 9 6 1 4 2
    3  8 9 1 6 0 4 3 5 2 7
    4  9 4 5 3 1 2 6 8 7 0
    5  4 2 8 6 5 7 3 9 0 1
    6  2 7 9 3 8 0 6 4 1 5
    7  7 0 4 6 9 1 3 2 5 8
```

`inv` (Multiplicative-inverse table, used only when *generating* a check digit, not when validating):

```
    inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9]
```

**Validation procedure** for a 12-digit number `n = n11 n10 ... n1 n0`:

```
c = 0
for i, digit in enumerate(reversed(n)):     # i = 0..11, rightmost first
    c = d[c][p[i % 8][int(digit)]]
valid := (c == 0)
```

**Check-digit generation** for an 11-digit prefix `pfx`:

```
c = checksum(pfx + "0")
check_digit = d[c].indexOf(0)           # equivalently inv[c]
```

### Worked example — `234123412346` (canonical python-stdnum doctest)

```
digits (rightmost first): 6, 4, 3, 2, 1, 4, 3, 2, 1, 4, 3, 2
i mod 8:                  0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3

c=0 → d[0][p[0][6]] = d[0][6] = 6
c=6 → d[6][p[1][4]] = d[6][2] = 9
c=9 → d[9][p[2][3]] = d[9][3] = 6
c=6 → d[6][p[3][2]] = d[6][1] = 5
c=5 → d[5][p[4][1]] = d[5][4] = 6
c=6 → d[6][p[5][4]] = d[6][5] = 1
c=1 → d[1][p[6][3]] = d[1][3] = 4
c=4 → d[4][p[7][2]] = d[4][4] = 3
c=3 → d[3][p[0][1]] = d[3][1] = 4
c=4 → d[4][p[1][4]] = d[4][2] = 1
c=1 → d[1][p[2][3]] = d[1][3] = 4
c=4 → d[4][p[3][2]] = d[4][1] = 0  ✓
```

Final `c == 0` ⇒ valid Aadhaar.

### Test vectors

All "valid" numbers below were generated with the verified Verhoeff implementation (and confirmed against python-stdnum's `verhoeff.calc_check_digit`).

| # | Number          | First-digit OK | Palindrome | Verhoeff c=0 | Valid |
| - | --------------- | -------------- | ---------- | ------------ | ----- |
| 1 | `234123412346`  | yes (2)        | no         | yes          | ✓ |
| 2 | `999888777669`  | yes (9)        | no         | yes          | ✓ |
| 3 | `219876123402`  | yes (2)        | no         | yes          | ✓ |
| 4 | `345678901238`  | yes (3)        | no         | yes          | ✓ |
| 5 | `789123456789`  | yes (7)        | no         | yes          | ✓ |
| 6 | `567812345678`  | yes (5)        | no         | yes          | ✓ |

Invalid samples:

| # | Number              | Reason                          | Expected `reason.kind` |
| - | ------------------- | ------------------------------- | ---------------------- |
| 1 | `234123412347`      | last digit flipped → bad check  | `invalid_checksum`     |
| 2 | `123412341234`      | starts with `1`                 | `invalid_format`       |
| 3 | `222222222222`      | palindrome (also passes shape)  | `invalid_format`       |
| 4 | `64334312`          | length 8                        | `too_short`            |
| 5 | `1234567890123`     | length 13                       | `too_long`             |
| 6 | `ABCD23412346`      | contains letters                | `invalid_format`       |

### PII guidance

Highly sensitive (UIDAI advises against public posting). PII tier `high`; mask via MeitY guideline `XXXX XXXX NNNN` consistent with `python-stdnum.mask()`.

---

## IN_PAN

### Header

- **Issuer:** Income Tax Department (via Protean e-Gov / UTIITSL).
- **Year of introduction:** 1972 (series); current 10-char alphanumeric form since 1995.
- **Source URLs (primary):**
  - https://incometaxindia.gov.in/Pages/i-am/about-pan.aspx — IT Dept canonical PAN explainer.
  - https://incometaxindia.gov.in/tutorials/1.permanent%20account%20number%20(pan).pdf — official PAN tutorial PDF (15p, via Wayback 2024).
  - https://eportal.incometax.gov.in/iec/foservices/#/pre-login/instant-e-pan — Instant e-PAN.
- **Statute:** Income-tax Act 1961, s. 139A; Income-tax Rules 1962, Rule 114.
- **Secondary verified source:** `python-stdnum/stdnum/in_/pan.py` — same regex + entity-type lookup + `0000` rejection.
- **Confidence tier:** **high.** IT Dept publishes regex + entity-type table. **No public check-digit algorithm** — the 10th char is described as a check digit but CBDT does not publish the formula. Library uses `hasCheckDigit: false`; the high tier rests on the published format.
- **Population coverage:** ~445M PANs (Mar 2019); est. >600M by 2024 due to Aadhaar–PAN linking.

### Format

- **Raw shape:** 10 characters, fixed.
- **Pattern:** `LLLLLNNNNL` — 5 uppercase letters, 4 digits, 1 uppercase letter.
- **Positional semantics:**

| Position | Char | Meaning                                                                                                                            |
| -------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1        | A-Z  | Block/series                                                                                                                       |
| 2        | A-Z  | Block/series                                                                                                                       |
| 3        | A-Z  | Block/series                                                                                                                       |
| **4**    | A-Z  | **Entity type** (see table below). MUST be one of `A B C F G H J L P T` — any other value is an `invalid_component`.               |
| 5        | A-Z  | First letter of surname (for individuals) / first letter of entity name (for non-individuals).                                     |
| 6-9      | 0-9  | Sequential serial number `0001` … `9999`. **`0000` is rejected as `invalid_component`** (python-stdnum + CBDT format convention).  |
| 10       | A-Z  | Check digit (algorithm not published).                                                                                             |

- **Entity-type table** (4th character):

| Code | Entity type                                                          |
| ---- | -------------------------------------------------------------------- |
| `A`  | Association of Persons (AOP)                                         |
| `B`  | Body of Individuals (BOI)                                            |
| `C`  | Company                                                              |
| `F`  | Firm / Limited Liability Partnership (LLP)                           |
| `G`  | Government Agency                                                    |
| `H`  | Hindu Undivided Family (HUF)                                         |
| `J`  | Artificial Juridical Person                                          |
| `L`  | Local Authority                                                      |
| `P`  | Person (Individual)                                                  |
| `T`  | Trust (Association of Persons – Trust)                               |

**Discontinued / disputed codes:**
- `K` — python-stdnum lists `K` as "Krish (Trust Krish)" with a comment that it is not listed on the Income Tax Department website. Wikipedia's PAN article omits `K` from its 4th-character list. **Decision: do not accept `K`.** This matches the official Income Tax Dept tutorial PDF.
- `E`, `S` and other letters have historically appeared in non-individual PAN allocations under specific CBDT circulars; no current Income Tax Dept reference lists them. Reject by default; document as a known issue for future investigation.

- **Canonical formatted form:** `AAAAA9999A` — no separators. PAN cards print the number without spaces. The library should normalize by stripping whitespace and uppercasing.

### Regex

```
rawRegex (normalized, uppercase): /^[A-Z]{5}[0-9]{4}[A-Z]$/
formattedRegex:                   (same — no canonical separator form)
```

`validate()` must additionally:
1. Verify `n[3]` is in the entity-type set `{A,B,C,F,G,H,J,L,P,T}`.
2. Reject `n[5..8] == "0000"`.

### Algorithm

**No public check-digit algorithm.** Income Tax Dept documents only the structure; the 10th character is described as a check digit but the computation is unpublished. Several third-party reverse-engineering attempts exist online but none are issuer-authoritative.

**Library decision:** `hasCheckDigit: false`. Validation = regex shape + entity-type whitelist + `0000` serial rejection. JSDoc must note the unimplemented opaque check digit. Matches python-stdnum.

### Worked example

PAN `AAPFU0939F` (python-stdnum doctest, also appears as the embedded PAN in GSTIN `27AAPFU0939F1ZV`):

```
Positions: A A P F U 0 9 3 9 F
              1 2 3 4 5 6 7 8 9 10
n[3] = 'F' → Firm/LLP                  ✓
n[5..8] = "0939" ≠ "0000"              ✓
matches /^[A-Z]{5}[0-9]{4}[A-Z]$/      ✓
→ valid
```

### Test vectors

Valid samples:

| # | PAN          | Entity type        | Notes                               |
| - | ------------ | ------------------ | ----------------------------------- |
| 1 | `AAPFU0939F` | Firm/LLP           | python-stdnum doctest               |
| 2 | `AAACH7409R` | Company            | Also valid inside GSTIN `07…1Z3`    |
| 3 | `AAACR5055K` | Company            | Reliance-style example              |
| 4 | `ABCDP1234E` | Individual (P)     | Synthetic                           |
| 5 | `XYZTA0001B` | Trust (T)          | Synthetic, minimum non-zero serial  |
| 6 | `BNZPM9876C` | Individual (P)     | Synthetic                           |

Invalid samples:

| # | PAN           | Reason                                          | Expected `reason.kind` |
| - | ------------- | ----------------------------------------------- | ---------------------- |
| 1 | `ACUPA7085RR` | length 11                                       | `too_long`             |
| 2 | `ABMPA32111`  | 10th char is a digit (regex fail)               | `invalid_format`       |
| 3 | `ABMXA3211G`  | 4th char `X` not in entity-type table           | `invalid_component`    |
| 4 | `ACUPA0000R`  | serial `0000`                                   | `invalid_component`    |
| 5 | `aapfu0939f`  | passes after `.toUpperCase()` in `normalize`    | — (valid post-normal)  |
| 6 | `AAPFU093F`   | length 9                                        | `too_short`            |
| 7 | `12345A6789B` | doesn't match shape                             | `invalid_format`       |

(Sample 5 is included to exercise the normalisation path, not as an invalid case.)

### PII guidance

PII tier `high` (binds to ITR + KYC). CBDT masking standard: `AAAAAXXXXA` (keep first 5 + last 1, mask the 4 digits). Match python-stdnum.

---

## IN_GSTIN

### Header

- **Issuer:** Goods and Services Tax Network (GSTN), under CBIC, Ministry of Finance.
- **Year of introduction:** 2017 (GST rollout 1-Jul-2017).
- **Source URLs (primary):**
  - https://www.gst.gov.in/ — GSTN portal.
  - https://tutorial.gst.gov.in/ — official user-guide (RoboHelp; via Wayback).
  - https://cbic-gst.gov.in/ — CBIC notifications portal.
- **Statute:** CGST Act 2017; CGST Rules 2017, Rule 10.
- **Secondary verified source:** `python-stdnum/stdnum/in_/gstin.py` — same regex, same state-code table, same Luhn-mod-36, same `Z` constant. Cross-validated below.
- **Confidence tier:** **high.** GSTN publishes structure; CGST Rules define issuer; Luhn-mod-36 widely documented in CBIC training. Governance test accepts `gst.gov.in` + `cbic-gst.gov.in` via `gov.in`.
- **Population coverage:** ~14M active GSTINs (Jan 2024).

### Format

- **Raw shape:** 15 alphanumeric characters, fixed.
- **Pattern:** `SS PPPPPPPPPP E Z C` (no spaces in the actual number) where:

| Pos    | Type      | Length | Meaning                                                                                                            |
| ------ | --------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| 1–2    | `[0-9]`   | 2      | State / UT code (see table above). MUST be in `_STATE_CODES`.                                                      |
| 3–12   | PAN       | 10     | The 10-character PAN of the registered taxpayer. **Must pass full PAN validation** including 4th-char entity type. |
| 13     | `[1-9A-Z]`| 1      | Entity number — number of registrations for the same PAN in the same state. `1` for the first registration. `0` is **explicitly invalid** per python-stdnum and CGST registration mechanics. |
| 14     | `Z`       | 1      | Literal `Z` placeholder (reserved by GSTN). Anything else is `invalid_component`.                                  |
| 15     | `[0-9A-Z]`| 1      | Check digit, Luhn mod-36.                                                                                          |

- **Canonical formatted form:** `SSPPPPPPPPPPEZC` — no separators. GST invoices and registration certificates print the GSTIN without spaces.

### Regex

```
rawRegex (normalized, uppercase): /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/
formattedRegex:                   (same — no canonical separator form)
```

Note that the regex above is slightly **tighter** than python-stdnum's, which allows `[0-9A-Z]{3}` at the end. The tighter form encodes the `Z` constant at position 14 directly. Both forms work; either is acceptable.

`validate()` must additionally:
1. Verify state code is in `STATE_CODES`.
2. Validate the embedded PAN at positions 3..12 (full PAN check incl. entity type + non-`0000` serial).
3. Verify position 13 is not `0`.
4. Verify position 14 is exactly `Z`.
5. Verify the Luhn mod-36 check digit over all 15 characters.

### Algorithm — Luhn mod-36

**Alphabet:** `"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"` (length N = 36). The character index is its position in this string.

**Validation procedure** for a 15-character GSTIN:

```
values = [alphabet.indexOf(c) for c in reversed(gstin)]   # rightmost first
sum_odd  = sum(values[0::2])                              # rightmost, 3rd-from-right, …
sum_even = sum( (v*2 // 36) + (v*2 % 36)  for v in values[1::2] )
total    = (sum_odd + sum_even) % 36
valid   := (total == 0)
```

Equivalently: starting from the right, every other character is doubled (with `divmod 36` digit-sum) just as in classical Luhn, only in base 36 instead of base 10.

**Check-digit generation** for a 14-character prefix:

```
ck = checksum(prefix + "0") % 36       # using the alphabet's first char as placeholder
check_digit = alphabet[(36 - ck) % 36]
```

### Worked example — `27AAPFU0939F1ZV`

```
Left→right indices in alphabet: 2 7 10 10 25 15 30 0 9 3 9 15 1 35 31
Reverse → values:               31 35 1 15 9 3 9 0 30 15 25 10 10 7 2

odd positions (0,2,4,..,14): 31+1+9+9+30+25+10+2 = 117
even positions (1,3,..,13)   doubled with divmod 36:
  35→35, 15→30, 3→6, 0→0, 15→30, 10→20, 7→14   sum_even = 135

total = (117 + 135) mod 36 = 252 mod 36 = 0   ✓
```

### Test vectors

Valid samples — every line below has been computed and validated.

| # | GSTIN              | State              | PAN          | Entity reg.# | Check |
| - | ------------------ | ------------------ | ------------ | ------------ | ----- |
| 1 | `27AAPFU0939F1ZV`  | Maharashtra        | `AAPFU0939F` | `1`          | `V`   |
| 2 | `07AAACH7409R1Z3`  | Delhi              | `AAACH7409R` | `1`          | `3`   |
| 3 | `09AAACI1681G1ZN`  | Uttar Pradesh      | `AAACI1681G` | `1`          | `N`   |
| 4 | `33AAACR5055K1ZE`  | Tamil Nadu         | `AAACR5055K` | `1`          | `E`   |
| 5 | `29AAACW2702R1ZW`  | Karnataka          | `AAACW2702R` | `1`          | `W`   |
| 6 | `24AAACR4849B1ZO`  | Gujarat            | `AAACR4849B` | `1`          | `O`   |
| 7 | `19AAJCS6789L1Z9`  | West Bengal        | `AAJCS6789L` | `1`          | `9`   |

Invalid samples:

| # | GSTIN              | Reason                                          | Expected `reason.kind` |
| - | ------------------ | ----------------------------------------------- | ---------------------- |
| 1 | `27AAPFU0939F1Z`   | length 14                                       | `too_short`            |
| 2 | `369296450896540`  | all digits — no letters in PAN positions        | `invalid_format`       |
| 3 | `27AAPFU0939F1AA`  | position 14 is `A` not `Z`                      | `invalid_component`    |
| 4 | `27AAPFU0939F1ZO`  | check digit wrong (correct is `V`)              | `invalid_checksum`     |
| 5 | `99AAPFU0939F1ZV`  | state code `99` (centre jurisdiction) — accept *only if* `99/96/97` are in `STATE_CODES`. Otherwise `invalid_component`. **Document the decision.** |
| 6 | `27ABMXA3211G1Z?`  | embedded PAN has invalid 4th char `X`           | `invalid_component`    |
| 7 | `27AAPFU0000F1ZV`  | embedded PAN has `0000` serial                  | `invalid_component`    |
| 8 | `27AAPFU0939F0ZV`  | position 13 is `0`                              | `invalid_component`    |

### PII guidance

GSTIN itself is **public** (on every tax invoice; verifiable via "Search Taxpayer"). But it embeds a PAN, which is `high` PII. `IN_GSTIN.extract()` should return both as separately-classified items.

---

## IN_EPIC

### Header

- **Issuer:** Election Commission of India (ECI).
- **Year of introduction:** 1993 (under CEC T. N. Seshan).
- **Source URLs (primary):**
  - https://eci.gov.in/ — ECI portal.
  - https://voters.eci.gov.in/ — Voter Services Portal.
  - https://ceodelhi.gov.in/.../PVC_TENDER.pdf — CEO Delhi PVC EPIC tender (state `.gov.in`).
- **Statute:** Representation of the People Act 1950; ECI orders Aug-1993. No statute publishes a numbering algorithm.
- **Secondary verified source:** `python-stdnum/stdnum/in_/epic.py` — claims a Luhn check digit over the last 7 chars but cites a non-government source. **NOT confirmed by ECI.**
- **Confidence tier:** **low.** ECI does not publish: (1) a normative EPIC regex, (2) a check-digit algorithm, (3) a complete FUSN list. Real-world EPICs include legacy variants (9-char `^[A-Z]{3}[0-9]{6}$`, slash-formatted `^[A-Z]{2}/[0-9]{2}/[0-9]{3}/[0-9]{6}$`). Decision: **format-only validator, no check digit.**
- **Population coverage:** ~969 million registered electors (2024 rolls).

### Format

- **Most common shape (post-2000):** 3 uppercase letters (FUSN) + 7 digits = 10 chars.
- **Legacy variants** in the wild but **not enforced**: `^[A-Z]{3}[0-9]{6}$` (9-char), slash-formatted, state-specific FUSN with numerics.
- **Canonical formatted form:** none — EPIC cards print without separators.

### Regex

```
rawRegex (normalized, uppercase): /^[A-Z]{3}[0-9]{7}$/
```

This is the format python-stdnum enforces and the one that ECI's voter portal accepts as the "EPIC number" input.

### Algorithm

**Library decision: no check digit.**

- Set `hasCheckDigit: false`.
- Do **not** implement python-stdnum's Luhn-over-positions-4..10 algorithm. It is unsourced from ECI and reportedly produces false negatives on real EPIC cards (see Open Questions below).
- Validation is purely structural: regex shape + uppercase normalisation.

### Test vectors

Valid samples (shape-only; we cannot independently verify these are *issued* EPICs — they merely match the regex):

| # | EPIC          | Notes                                          |
| - | ------------- | ---------------------------------------------- |
| 1 | `WKH1186253`  | python-stdnum doctest                          |
| 2 | `ABC1234567`  | Generic shape sample                           |
| 3 | `XYZ0000001`  | Edge: low serial                               |
| 4 | `DLW9999999`  | Edge: high serial                              |
| 5 | `MHB5432109`  | Maharashtra-style FUSN                         |

Invalid samples:

| # | EPIC          | Reason                                            | Expected `reason.kind` |
| - | ------------- | ------------------------------------------------- | ---------------------- |
| 1 | `WKH118624`   | length 9 (post-2000 form requires 10)             | `too_short`            |
| 2 | `1231186253`  | first 3 chars are digits                          | `invalid_format`       |
| 3 | `WKHX186253`  | 4th char is a letter                              | `invalid_format`       |
| 4 | `wkh1186253`  | lowercase — but **valid after normalize**         | — (valid post-normal)  |
| 5 | `WKH11862535` | length 11                                         | `too_long`             |

### PII guidance

PII tier `moderate` (appears on the electoral roll but Indian privacy doctrine treats it as restricted). Mask as `XXX****NNN` (keep FUSN + last 3 digits).

---

## IN_VID

### Header

- **Issuer:** UIDAI.
- **Year of introduction:** 2018 (UIDAI Circular K-11020/205/2017 dated 10-Jan-2018).
- **Source URLs (primary):**
  - https://uidai.gov.in/en/contact-support/have-any-question/284-faqs/aadhaar-online-services/virtual-id-vid.html — UIDAI FAQ: "16-digit random number mapped with the Aadhaar number."
  - https://myaadhaar.uidai.gov.in/genericGenerateOrRetriveVID/en — VID generator.
  - https://uidai.gov.in/images/resource/UIDAI_Circular_11012018.pdf — VID circular (image-only PDF).
- **Statute:** Aadhaar Act 2016 + UIDAI Circular Jan-2018.
- **Secondary verified source:** No dedicated python-stdnum module. UIDAI's verifier `myaadhaar.uidai.gov.in/verifyAadhaar` accepts both 12-digit Aadhaar and 16-digit VID, applying Verhoeff to both.
- **Confidence tier:** **high.** UIDAI publishes 16-digit structure; Verhoeff verified by UIDAI's own verifier. Governance accepts `uidai.gov.in`.
- **Population coverage:** Any of ~1.39B Aadhaar holders may generate a VID; one active VID per Aadhaar at a time.

### Format

- **Raw shape:** 16 digits.
- **First-digit constraint:** the canonical UIDAI numbering reserves `0` and `1` as Aadhaar-distinct first digits for VID. Per the UIDAI Numbering Scheme working paper, **VID starts with `2`–`9`** to keep it within the same anti-confusion range as Aadhaar. *(Some implementations relax this; the conservative choice for nationid is to enforce `^[2-9]`.)*
- **Anti-pattern constraints:** UIDAI does not explicitly document a palindrome rule for VID (unlike Aadhaar), but the same generator code-path is used. **Decision: do not enforce non-palindrome on VID** unless cross-validation against UIDAI test fixtures shows otherwise.
- **Canonical formatted form:** `NNNN NNNN NNNN NNNN` (groups of 4, space-separated). UIDAI's e-Aadhaar PDF and SMS responses use this form.

### Regex

```
rawRegex (normalized, no separators): /^[2-9][0-9]{15}$/
formattedRegex (with spaces):         /^[2-9][0-9]{3} [0-9]{4} [0-9]{4} [0-9]{4}$/
```

`validate()` must additionally verify the Verhoeff check digit over all 16 digits.

### Algorithm — Verhoeff (same tables as Aadhaar)

Identical algorithm to `IN_AADHAAR`, applied to the full 16-digit number. Reuse the same `d`, `p`, `inv` tables. Validation:

```
c = 0
for i, digit in enumerate(reversed(vid)):     # i = 0..15
    c = d[c][p[i % 8][int(digit)]]
valid := (c == 0)
```

Check-digit generation for a 15-digit prefix:

```
c = checksum(pfx + "0")
check_digit = d[c].indexOf(0)
```

### Test vectors

Generated with the verified Verhoeff implementation:

| # | VID                  | Prefix (15)        | DV |
| - | -------------------- | ------------------ | -- |
| 1 | `9123456789012346`   | `912345678901234`  | 6  |
| 2 | `2345678901234565`   | `234567890123456`  | 5  |
| 3 | `8765432109876541`   | `876543210987654`  | 1  |
| 4 | `9998887776665551`   | `999888777666555`  | 1  |
| 5 | `3456789012345673`   | `345678901234567`  | 3  |
| 6 | `5678901234567896`   | `567890123456789`  | 6  |

Invalid samples:

| # | VID                  | Reason                              | Expected `reason.kind` |
| - | -------------------- | ----------------------------------- | ---------------------- |
| 1 | `9123456789012347`   | last digit flipped → bad Verhoeff   | `invalid_checksum`     |
| 2 | `1123456789012346`   | starts with `1`                     | `invalid_format`       |
| 3 | `912345678901234`    | length 15                           | `too_short`            |
| 4 | `91234567890123466`  | length 17                           | `too_long`             |
| 5 | `91234567A9012346`   | contains a letter                   | `invalid_format`       |

### PII guidance

PII tier `high` (maps to an Aadhaar). Mask as `XXXX XXXX XXXX NNNN` consistent with Aadhaar masking.

---

## Cross-validation oracle suggestions

Per `docs/CROSS_VALIDATION.md`, pull these python-stdnum modules and run our `validate()` against their corpora:

| nationid code | python-stdnum module  | Notes                                                                    |
| ------------- | --------------------- | ------------------------------------------------------------------------ |
| `IN_AADHAAR`  | `stdnum.in_.aadhaar`  | Full validate/format/mask doctests.                                      |
| `IN_PAN`      | `stdnum.in_.pan`      | Full validate/info/mask doctests.                                        |
| `IN_GSTIN`    | `stdnum.in_.gstin`    | Full validate/to_pan/info doctests.                                      |
| `IN_EPIC`     | `stdnum.in_.epic`     | **Shape only.** Do NOT cross-validate the Luhn checksum. Mark as `expected_divergence`. |
| `IN_VID`      | (none)                | Use UIDAI `myaadhaar.uidai.gov.in/verifyAadhaar` as manual oracle; build private fixture file. |

Also cross-validate Verhoeff against the canonical IS 4905:1968 test vector set (every valid Aadhaar in python-stdnum doctests must have `checksum == 0`).

---

## Open questions / verification gaps

| # | Question | Severity | Action |
| - | -------- | -------- | ------ |
| 1 | UIDAI Verhoeff source only accessible via Wayback? | med | Cite Wayback URL + Aadhaar Act 2016 statute. |
| 2 | Does palindrome rule apply to VID? | low | Default: **no**. Document. |
| 3 | Is PAN entity-type `K` discontinued? | low | Reject `K`; matches Wikipedia + IT Dept tutorial. |
| 4 | Which GSTIN state codes beyond 01-37 to accept? | **high** | **Recommendation:** include `38` (Ladakh), `96`/`99` (UIN/Centre); exclude `97`. Document each. |
| 5 | Does python-stdnum's EPIC Luhn match any ECI spec? | **high** | **No.** Cited source is a tax-advisory blog. Do not adopt. Format-only. |
| 6 | Are legacy EPIC formats common enough to accept? | med | Reject by default; future `lenientEpic` mode if demand emerges. |
| 7 | Does UIDAI verifier accept VIDs starting with 0/1? | med | Empirical: no. Conservative regex `^[2-9]` matches; QA against live API. |
| 8 | PAN 5th-char constraints for non-individuals? | low | None documented. Allow `A-Z`. |
| 9 | Hidden CBDT PAN check-digit algorithm? | **high** | None public. e-PAN performs the check server-side. Not implementable for OSS. |

---

## Citation table for governance test

(Used by `tests/governance/confidence-citations.test.ts`. Every "high" entry needs at least one URL on an issuer TLD or one statute reference; the test passes any `gov.in` suffix automatically.)

| Code         | Confidence | Source (issuer domain)                                                                                                          | Statute reference                                       |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `IN_AADHAAR` | high       | `https://uidai.gov.in/en/my-aadhaar/about-your-aadhaar.html`                                                                    | Aadhaar Act 2016                                        |
| `IN_PAN`     | high       | `https://incometaxindia.gov.in/Pages/i-am/about-pan.aspx`<br>`https://incometaxindia.gov.in/tutorials/1.permanent%20account%20number%20(pan).pdf` | Income-tax Act 1961, s. 139A; Rule 114                  |
| `IN_GSTIN`   | high       | `https://www.gst.gov.in/`<br>`https://cbic-gst.gov.in/`                                                                         | CGST Act 2017; CGST Rules 2017, rule 10                 |
| `IN_EPIC`    | **low**    | `https://eci.gov.in/`<br>`https://voters.eci.gov.in/`                                                                           | Representation of the People Act 1950; ECI Order Aug 1993; no algorithm published |
| `IN_VID`     | high       | `https://uidai.gov.in/en/contact-support/have-any-question/284-faqs/aadhaar-online-services/virtual-id-vid.html`                | Aadhaar Act 2016; UIDAI Circular 11-Jan-2018            |

**Note for the governance test:** `incometaxindia.gov.in`, `uidai.gov.in`, `gst.gov.in`, `cbic-gst.gov.in`, `eci.gov.in`, and `voters.eci.gov.in` all match the existing `gov\.[a-z]{2,3}$` regex (the `gov.in` suffix). No allowlist additions are needed. The library's existing `ISSUER_TLD_SUFFIXES` already covers India out of the box.

---

## Implementation hints

1. **Shared module** `src/countries/in/shared.ts`: `VERHOEFF_D/P/INV` tables, `verhoeffValid()`, `LUHN_MOD36_ALPHABET`, `luhnMod36Valid()`, `PAN_ENTITY_TYPES`, `GSTIN_STATE_CODES`.
2. **Normalize:** strip whitespace + `-`, uppercase. Aadhaar/VID also strip non-digit chars.
3. **PII tier:** `high` for Aadhaar/PAN/VID, `moderate` for EPIC, `low` for GSTIN (but the embedded PAN remains `high`).
4. **Cross-reference:** `IN_GSTIN.validate()` should call `IN_PAN.validate()` on `gstin.slice(2, 12)` — don't duplicate entity-type logic.
5. **i18n:** add `documents.IN_{AADHAAR,PAN,GSTIN,EPIC,VID}.label` to all locales (es/en/pt).
6. **JSDoc header** for governance test must include at least one `*.gov.in` URL + statute reference.

---

## Summary

Five Indian specs ready for implementation:

- **`IN_AADHAAR`** (high): 12-digit, Verhoeff, first digit 2-9, no palindrome. Cross-validated.
- **`IN_PAN`** (high): 10-char `^[A-Z]{5}[0-9]{4}[A-Z]$` + entity-type whitelist + non-`0000` serial. **No check digit** (not published).
- **`IN_GSTIN`** (high): 15-char alphanumeric with embedded PAN, state code + `Z` placeholder + Luhn-mod-36 check digit. Fully algorithm-validated.
- **`IN_EPIC`** (low): 10-char `^[A-Z]{3}[0-9]{7}$`, **format only**. Reject python-stdnum's unsourced Luhn claim.
- **`IN_VID`** (high): 16-digit Verhoeff, first digit 2-9. Reuses Aadhaar's algorithm.

Open decisions for the implementer:
1. Which GSTIN state codes to accept beyond the 1-37 range (`38` Ladakh, `96`/`97`/`99` UIN/Centre).
2. Whether to enforce first-digit `2-9` on VID (recommended yes).
3. Whether to expose a `mask()` helper on all five specs (recommended yes, matching python-stdnum).
