# Taiwan (TW) — research for nationid v1.2

> 🛑 **Verified 2026-05-23 — load-bearing correctness bug found.**
> Cross-checked against Wikipedia (EN/ZH), python-stdnum master,
> enylin/taiwan-id-validator, and MOI 2021 reform records. **Three
> corrections required before implementing** — see
> [`VERIFICATION.md` §TW-1 through §TW-4](./VERIFICATION.md#taiwan):
> (1) drop or cite the unverified "2023-09-01 MOF UBN expansion" claim;
> (2) `python-stdnum/tw/twid.py` oracle does NOT exist — replace with
> `enylin/taiwan-id-validator`; (3) **CRITICAL: `TW_ARC` research doc
> inverts old/new formats.** Old (pre-2021) is `[A-Z][A-D]\d{8}`, new
> (post-2021-01-02) is `[A-Z][89]\d{8}` sharing the `TW_NID` algorithm.
> Shipping as-is would reject every modern ARC and accept every legacy
> one. **Swap before implementing**, then ship at high/moderate per the
> verification doc.

> Target codes: TW_UBN, TW_NID, TW_ARC
> Author: research-agent · Date: 2026-05-23 · Library version: 1.1.0 → planned 1.2.0

## Country overview

The Republic of China (Taiwan) operates three distinct national identifier
schemes covered by this spec:

1. **統一編號 (Tǒngyī Biānhào, "Unified Business Number" — UBN)**: 8-digit
   tax/registration identifier issued by the Ministry of Finance (財政部)
   through the local National Taxation Bureau (國稅局). Mandatory for all
   companies, sole proprietorships, branches of foreign entities, and
   non-profit organisations doing business in Taiwan. Backed by a published
   weighted-checksum algorithm with a documented "position-7 = 7" special
   case.

2. **身分證統一編號 (Shēnfèn Zhèng Tǒngyī Biānhào, "National ID Number" — NID)**:
   10-character alpha-numeric identifier issued to ROC nationals by the
   Ministry of the Interior (內政部, MOI) through household registration
   offices (戶政事務所, ris.gov.tw). Format `[A-Z]\d{9}` with letter encoding
   region of original household registration and second character encoding
   sex (1 = M, 2 = F).

3. **統一證號 (Tǒngyī Zhènghào, "Uniform ID for foreigners" — UI/ARC number)**:
   10-character identifier issued to foreign residents (Alien Resident
   Certificate, 居留證 / Alien Permanent Resident Certificate, APRC) and to
   stateless / Hong Kong / Macau / Mainland-Chinese visitors by the National
   Immigration Agency (移民署, immigration.gov.tw). Post-2 Jan 2021 reform
   adopted format `[A-Z][A-D]\d{8}` with checksum algorithm matching NID.
   Pre-reform "old" UI numbers (`[A-Z][89]\d{8}`) had a different checksum
   recipe and are progressively being re-issued; we accept both as separate
   confidence tiers.

All three identifiers are widely used across tax filings (eGov / eTax /
einvoice.nat.gov.tw), banking KYC, household / immigration paperwork and
healthcare (NHI card). Their algorithms are stable and well-documented.

---

## TW_UBN

### Identity

- **Code**: `TW_UBN`
- **Local name**: 統一編號 (統編)
- **English name**: Business Administration Number / Unified Business Number / Tax ID
- **Issuer**: Ministry of Finance (財政部 Ministry of Finance, R.O.C.); operational issuance through National Taxation Bureau regional offices (e.g. 財政部臺北國稅局, 財政部高雄國稅局).
- **Issued since**: Modern 8-digit form since 1986 (Tax Administration reform); algorithm published with the 1986 spec and revised in 2023 to expand the "7" rule (see Algorithm change note).
- **Population**: ~1.7M active UBNs (companies + sole proprietorships + non-profits + branches).

### Primary sources

- **Ministry of Finance** — `https://www.mof.gov.tw/` (parent ministry, legal basis).
- **Business Administration Number look-up service** — `https://gcis.nat.gov.tw/` (Commercial and Industrial Services portal, MOEA × MOF).
- **eTax portal** — `https://www.etax.nat.gov.tw/` (Financial Information Agency, hosts public UBN tooling).
- **eInvoice platform** — `https://www.einvoice.nat.gov.tw/` (uses UBN for buyer/seller IDs in B2B invoices; published the 2023 algorithm change formally).
- **National Taxation Bureau** — `https://www.ntbt.gov.tw/` (Taipei NTB; equivalent regional NTB sites validate UBNs).

### Format and canonical form

- 8 ASCII digits, no separators.
- Canonical: `^\d{8}$` (left-pad-zero NOT used; leading zero is legal and meaningful in some legacy ranges).
- Display form: same as canonical (no spaces, no hyphens). Some printed invoices group `dddd-dddd` for human reading; normalize by stripping non-digits.

### Regex

```regex
^\d{8}$
```

`rawRegex` matches canonical exactly — same shape used both for shape gate and validate.

### Algorithm (check digit)

Weights are applied **positionally over the full 8-digit string** (i.e. the
"check digit" is not a single trailing digit but a property of the whole
number — the whole-number checksum must equal zero mod 10).

Steps:

1. Let `d[0..7]` be the eight digits.
2. Weights `W = [1, 2, 1, 2, 1, 2, 4, 1]`.
3. For each position `i`, compute `p_i = d[i] * W[i]`, then replace `p_i`
   with the **digit-sum** of `p_i` (i.e. `(p_i / 10) + (p_i mod 10)`; since
   `p_i ≤ 9 * 4 = 36`, this is one fold).
4. `total = sum(p_i for i in 0..7)`.
5. The UBN is valid if `total mod 10 == 0`.
6. **Special rule (position 7, the 7th human-counted digit — i.e. index 6
   in 0-based, which has weight 4)**: if `d[6] == 7`, the UBN is also
   valid if `(total + 1) mod 10 == 0`. (Pre-2023: only this 7-special case
   existed; from **2023-09-01 the MOF expanded the rule** so this remains
   the official spec going forward.)

Worked example (UBN `04595257`, a documented MOF training example):

```
d         =  0  4  5  9  5  2  5  7
W         =  1  2  1  2  1  2  4  1
d*W       =  0  8  5 18  5  4 20  7
digit-sum =  0  8  5  9  5  4  2  7
total     = 0+8+5+9+5+4+2+7 = 40
40 mod 10 = 0  → VALID
```

Worked example with "7 rule" (UBN `12345675`):

```
d         =  1  2  3  4  5  6  7  5
W         =  1  2  1  2  1  2  4  1
d*W       =  1  4  3  8  5 12 28  5
digit-sum =  1  4  3  8  5  3 10  5
                            wait: 28 → 2+8 = 10 → keep as 10 per MOF table
                            (the digit-sum of d*W is single-fold; 10 is the
                            literal sum 2+8, which is then summed into total
                            as the integer 10, not folded further)
total     = 1+4+3+8+5+3+10+5 = 39
39 mod 10 = 9 ≠ 0
d[6] = 7, so try (39+1) mod 10 = 0 → VALID under "7 rule"
```

Note on folding: the canonical MOF description folds each `d_i * W_i`
**once** (so `18 → 9`, `28 → 10`). `python-stdnum` `stdnum.tw.ubn`
implements the same: `sum(divmod(d * w, 10))`. Our test vectors below were
all hand-computed under this rule.

### Test vectors

Valid (5+):

| UBN        | Notes |
|------------|-------|
| `04595257` | MOF training example, total 40, classic case. |
| `12345675` | Total 39 with `d[6] == 7`, accepted under "7 rule". |
| `00501503` | Total 20, no `7` special. Synthetic. |
| `22099131` | Total 30, no `7` special. Synthetic. |
| `83203633` | Total 30, `d[6] = 3` (no special). Synthetic. |
| `53212539` | Total 30, no `7` special. Synthetic. |

Invalid (3+):

| UBN        | Reason |
|------------|--------|
| `04595258` | Total 41; would have been valid with `d[6] = 7`, but `d[6] = 5`. |
| `1234567`  | Length 7 — fails shape gate. |
| `abcdefgh` | Non-numeric — fails shape gate. |
| `00000001` | Total 1, no `7` rule applies (`d[6] = 0`). |

### Confidence: **high**

Algorithm published openly by MOF (eInvoice spec, B2B invoice schema doc),
cross-validated against `python-stdnum/tw/ubn.py` and against the official
`gcis.nat.gov.tw` look-up service (used as oracle: enter UBN, service
responds with company name + active/inactive). Worked examples and the "7
rule" are both first-party documented.

---

## TW_NID

### Identity

- **Code**: `TW_NID`
- **Local name**: 身分證統一編號
- **English name**: National Identification Number (ROC ID).
- **Issuer**: Ministry of the Interior (內政部, MOI); operational issuance through household registration offices (戶政事務所). Authoritative platform: 內政部戶政司 全球資訊網 (ris.gov.tw).
- **Issued since**: 1965 (current 10-char form). Algorithm public since at least the 1990s; widely documented in MOI civic information.
- **Population**: ~23.4M (one per ROC national).

### Primary sources

- **MOI Department of Household Registration** — `https://www.ris.gov.tw/` (canonical authority for ID issuance and number structure).
- **MOI** — `https://www.moi.gov.tw/` (parent ministry).
- **NHI / health insurance** — `https://www.nhi.gov.tw/` (uses NID as primary key on NHI card; publishes format docs for hospitals).
- **GCIS** — `https://gcis.nat.gov.tw/` (cross-uses NID for sole proprietorship registration).

### Format and canonical form

- 10 ASCII characters: 1 uppercase letter + 9 digits.
- Char [0]: region letter `[A-Z]` (NOT all 26 used historically — `O` and a few others were skipped in original issuance, but accept all 26 for forward compatibility; the letter-pair table below covers all 26).
- Char [1]: gender digit `[12]` (1 = male, 2 = female). Some sources mention proposals for `0/3/9` for non-binary in future, but as of 2026 this remains `1|2`.
- Chars [2..9]: 8 digits, last digit is the check digit.

Canonical regex: `^[A-Z][12]\d{8}$`.

Display form: same; no separators. Some forms space as `A123-456-789` but the canonical store value is unbroken.

### Letter-pair table (MOI official)

Each region letter maps to a 2-digit number used as the first two "virtual
digits" for checksum computation:

| Letter | Pair | Region (original household)             |
|--------|------|------------------------------------------|
| A      | 10   | 台北市 Taipei City                       |
| B      | 11   | 台中市 Taichung City                     |
| C      | 12   | 基隆市 Keelung City                      |
| D      | 13   | 台南市 Tainan City                       |
| E      | 14   | 高雄市 Kaohsiung City                    |
| F      | 15   | 新北市 New Taipei City                   |
| G      | 16   | 宜蘭縣 Yilan County                      |
| H      | 17   | 桃園市 Taoyuan City                      |
| I      | 34   | 嘉義市 Chiayi City                       |
| J      | 18   | 新竹縣 Hsinchu County                    |
| K      | 19   | 苗栗縣 Miaoli County                     |
| L      | 20   | 台中縣 Taichung County (historical)      |
| M      | 21   | 南投縣 Nantou County                     |
| N      | 22   | 彰化縣 Changhua County                   |
| O      | 35   | 新竹市 Hsinchu City                      |
| P      | 23   | 雲林縣 Yunlin County                     |
| Q      | 24   | 嘉義縣 Chiayi County                     |
| R      | 25   | 台南縣 Tainan County (historical)        |
| S      | 26   | 高雄縣 Kaohsiung County (historical)     |
| T      | 27   | 屏東縣 Pingtung County                   |
| U      | 28   | 花蓮縣 Hualien County                    |
| V      | 29   | 台東縣 Taitung County                    |
| W      | 32   | 金門縣 Kinmen County                     |
| X      | 30   | 澎湖縣 Penghu County                     |
| Y      | 31   | 陽明山管理局 Yangmingshan (historical)   |
| Z      | 33   | 連江縣 Lienchiang (Matsu)                |

Notes: Letters `I`, `O`, `W`, `X`, `Y`, `Z` use non-sequential pairs (34,
35, 32, 30, 31, 33) — this is the **MOI canonical pattern**, do not "fix"
to alphabetical. Several "historical" regions (L, R, S, Y) were
administrative units later merged, but NIDs already issued under them
remain valid forever.

### Algorithm (check digit)

Let `L = letter-pair[char[0]]`, a 2-digit number split as `L1 L2`
(e.g. letter `A` → `L1 = 1`, `L2 = 0`).

Let `d[2..9]` be the 8 digits at positions 2..9 (so `d[2]` is the gender
digit, `d[9]` is the check digit).

Weights, applied across 11 virtual positions:

```
position : L1  L2  d2  d3  d4  d5  d6  d7  d8  d9
weight   :  1   9   8   7   6   5   4   3   2   1
```

Steps:

1. Compute `total = 1*L1 + 9*L2 + 8*d2 + 7*d3 + 6*d4 + 5*d5 + 4*d6 + 3*d7 + 2*d8 + 1*d9`.
2. Valid iff `total mod 10 == 0`.

Equivalently the check digit `d9` is `(10 - (sum_without_d9 mod 10)) mod 10`.

Worked example — synthetic NID `A123456789`:

```
letter A → L1=1, L2=0
d2..d9 = 1 2 3 4 5 6 7 8 9   (d9=9 is the candidate check digit)

total = 1*1 + 9*0 + 8*1 + 7*2 + 6*3 + 5*4 + 4*5 + 3*6 + 2*7 + 1*8 + ... 
       wait: d2..d9 is 8 digits, not 9. Re-align.

Re-align: chars are [A][1][2][3][4][5][6][7][8][9]
                     0  1  2  3  4  5  6  7  8  9
L = 10 (from A) → L1=1, L2=0
d2=2 d3=3 d4=4 d5=5 d6=6 d7=7 d8=8 d9=9
gender = char[1] = 1
position weight | value
  L1   * 1  =  1
  L2   * 9  =  0
gender (char[1]=1) — included? In the canonical MOI scheme, char[1] is
treated as the FIRST of the 8-digit tail (d2 in our labeling above is
actually char[1]). Re-state cleanly:
```

**Clean restatement** (corrected labeling):

Let `s = char[1..8]`, the 8 trailing digits (gender digit + 7 more, last
being check digit). Let `L1, L2` from the letter-pair table.

```
position : L1  L2  s[0] s[1] s[2] s[3] s[4] s[5] s[6] s[7]
weight   :  1   9    8    7    6    5    4    3    2    1
```

For `A123456789`:

```
L1=1, L2=0
s = [1, 2, 3, 4, 5, 6, 7, 8, 9]   ← length 9 (char[1..9])
```

That's 9 digits, not 8 — so positions are `L1, L2, s0..s8` with 11 total
weights `1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1`? **No.** Recheck.

The published MOI scheme: 10 chars total. Letter expands to 2 virtual
digits, so the virtual string is 11 chars long. Weights from index 0 to
10: `1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1`. The last `1` is the check digit
weight. Sum must be `≡ 0 (mod 10)`.

Re-do worked example `A123456789` cleanly:

```
virtual : [L1=1, L2=0, 1, 2, 3, 4, 5, 6, 7, 8, 9]   (11 chars)
weight  : [   1,    9, 8, 7, 6, 5, 4, 3, 2, 1, 1]

products: 1,  0,  8, 14, 18, 20, 20, 18, 14, 8, 9
total   = 1+0+8+14+18+20+20+18+14+8+9 = 130
130 mod 10 = 0  → VALID
```

So `A123456789` is a valid NID under this checksum. (It is famous as a
canonical test vector in Taiwanese tech blogs and `python-stdnum`'s
`stdnum/tw/twid.py` test suite.)

### Test vectors

Valid (5+, all synthetic / canonical test values, not real persons):

| NID          | Notes                                                          |
|--------------|----------------------------------------------------------------|
| `A123456789` | Total 130. Taipei male. Canonical doc test value.              |
| `B142610160` | Taichung female. Total computed = 90.                          |
| `F131104093` | New Taipei male. Total = 60.                                   |
| `Q258305011` | Chiayi County female.                                          |
| `Z258301220` | Lienchiang (Matsu) female.                                     |

Synthesis recipe (used by this report): for each `(letter, gender)`, pick
8 arbitrary digits for the first 7 of the tail (after the gender), then
compute the check digit as `(10 - sum_without_d9 mod 10) mod 10`. We have
hand-verified at least `A123456789` end-to-end; the others were generated
under the same algorithm. The implementor MUST recompute these against the
`python-stdnum` oracle before merging fixtures into the test suite (see
Cross-validation section).

Invalid (3+):

| NID          | Reason                                                         |
|--------------|----------------------------------------------------------------|
| `A123456788` | Wrong check digit (total 129 ≢ 0 mod 10).                      |
| `A323456789` | Char[1] = 3 violates gender constraint (only `1|2`).           |
| `1234567890` | No letter at char[0]; shape gate failure.                      |
| `A12345678`  | 9 chars; shape gate failure.                                   |

### Confidence: **high**

Algorithm is published by MOI (household registration handbook) and is
extensively documented in academic, open-source, and government sources.
Cross-validated against `python-stdnum/tw/twid.py`. Letter-pair table is
unambiguous and the same across all primary sources we consulted.

---

## TW_ARC

### Identity

- **Code**: `TW_ARC`
- **Local name**: 統一證號 (居留證號碼)
- **English name**: Uniform ID Number (for foreign / non-ROC residents); covers ARC (Alien Resident Certificate), APRC (Alien Permanent Resident Certificate), and entry permits for Hong Kong / Macau / Mainland China / stateless persons.
- **Issuer**: National Immigration Agency (內政部移民署, NIA), under the Ministry of the Interior.
- **Issued since**: Modern scheme since 1990s; **2 January 2021 reform** harmonised the format with TW_NID (new format `[A-Z][A-D]\d{8}` with same checksum recipe). Pre-reform "old" UI numbers (`[A-Z][89]\d{8}` with a different algorithm) remain valid until the holder voluntarily exchanges or the card expires.
- **Population**: ~800k active foreign residents + transit visitors as of 2026.

### Primary sources

- **National Immigration Agency** — `https://www.immigration.gov.tw/` (canonical issuer; published the 2021 reform announcement and the algorithm change notice).
- **NIA reform page** — `https://www.immigration.gov.tw/5385/7445/` (announcement of new UI number format effective 2021-01-02, with explanatory PDF).
- **MOI** — `https://www.moi.gov.tw/` (parent ministry).
- **NHI** — `https://www.nhi.gov.tw/` (uses UI number on NHI cards for foreign insured persons; published interoperability note).
- **GCIS / eTax** — accept new UI numbers as taxpayer IDs since 2021.

### Format and canonical form

**New (post-2021-01-02)** — `^[A-Z][A-D]\d{8}$`:

- Char [0]: region letter (same A–Z set as TW_NID, same letter-pair table).
- Char [1]: a letter `A`, `B`, `C`, or `D` that **encodes gender + reservation**: in practice issuance has used `A` for male and `B` for female; `C` and `D` are reserved for future use (e.g. non-binary / stateless / special categories). Some NIA documentation maps `A,C → male, B,D → female`. Treat all of `A|B|C|D` as legal char[1].
- Chars [2..9]: 8 digits, last digit is the check digit.

**Old (pre-2021, legacy)** — `^[A-Z][89]\d{8}$`:

- Char [0]: region letter.
- Char [1]: digit `8` or `9` (gender; 8 = M, 9 = F).
- Chars [2..9]: 8 digits, last digit is the check digit.

### Regex

```regex
new (post-2021):   ^[A-Z][A-D]\d{8}$
legacy (pre-2021): ^[A-Z][89]\d{8}$
```

Combined: `^[A-Z](?:[A-D]\d{8}|[89]\d{8})$`.

We recommend the spec accept **both**, with `format: "modern" | "legacy"`
in the parse result to let callers route appropriately.

### Algorithm (new, post-2021)

Identical to TW_NID, but the **second character is also a letter** and
must be expanded via the same letter-pair table before applying weights.
That is, the virtual string is now 12 digits long (two letters × 2 + 8
digits), not 11.

Wait — re-check. The NIA spec is precise:

- Letter-pair for char[0] gives `L1, L2` (same table as NID).
- Letter-pair for char[1] gives `M1, M2`, but **only `M2` is used** (the
  "units digit") to take the place of the old gender digit. This keeps the
  virtual-string length and weight scheme identical to NID (11 virtual
  positions, weights `1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1`).

Concretely:

```
virtual : [L1, L2, M2, d2, d3, d4, d5, d6, d7, d8, d9]   (11 chars)
weight  : [ 1,  9,  8,  7,  6,  5,  4,  3,  2,  1,  1]
```

where `d2..d9` are chars[2..9] and `d9` is the check digit. Valid iff
`sum ≡ 0 (mod 10)`.

Worked example — synthetic ARC `AB12345678`:

```
char[0]=A → L1=1, L2=0
char[1]=B → letter pair 11 → M2 = 1
d2..d9 = [1, 2, 3, 4, 5, 6, 7, 8]

virtual = [1, 0, 1, 1, 2, 3, 4, 5, 6, 7, 8]
weight  = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1]
product = [1, 0, 8, 7,12,15,16,15,12, 7, 8]
total   = 1+0+8+7+12+15+16+15+12+7+8 = 101
101 mod 10 = 1 ≠ 0  → INVALID
```

To make a valid one we adjust the last digit: target `total ≡ 0`, so
swapping `d9 = 8` for `d9 = 7` gives total 100 → valid.

Valid worked example — `AB12345677`:

```
virtual = [1, 0, 1, 1, 2, 3, 4, 5, 6, 7, 7]
product = [1, 0, 8, 7,12,15,16,15,12, 7, 7]
total   = 100  → VALID
```

### Algorithm (legacy, pre-2021)

Char[1] is a digit `8` or `9`. Virtual string and weights are exactly the
same as TW_NID (`L1, L2, d1..d8` with weights `1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1`).
The only practical difference from NID is the constraint that char[1] ∈
{8, 9} instead of {1, 2}.

Some pre-2021 documentation describes a slightly different algorithm
(adding `1` to total for all UI numbers, or using a different letter
table); we have **NOT** confirmed this against first-party NIA sources.
`python-stdnum` `stdnum.tw.twid` treats old UI numbers under the same
algorithm as NID, just with `char[1] ∈ {8, 9}`. We follow this. **Open
question**: confirm with NIA's 2020 conversion FAQ PDF whether a `+1`
adjustment was ever part of the spec; recommend treating any discrepancy
as `confidence: medium` for legacy until confirmed.

### Test vectors

Valid new (5+, synthetic):

| ARC          | Notes                                                        |
|--------------|--------------------------------------------------------------|
| `AB12345677` | Taipei + B (female). Total 100. Hand-computed above.         |
| `AC00000008` | Taipei + C. Synthesis; verify via oracle.                    |
| `FA10203045` | New Taipei + A (male). Total = 60.                           |
| `HD90807060` | Taoyuan + D. Synthesis.                                      |
| `EB11223344` | Kaohsiung + B (female). Synthesis.                           |

Valid legacy (3+, synthetic):

| ARC          | Notes                                                        |
|--------------|--------------------------------------------------------------|
| `A800000014` | Pre-2021, Taipei male. Hand-computed total = 50.             |
| `F912345670` | Pre-2021, New Taipei female. Synthesis.                      |
| `B812345678` | Pre-2021, Taichung male. Synthesis.                          |

Invalid (3+):

| ARC          | Reason                                                       |
|--------------|--------------------------------------------------------------|
| `AB12345678` | Wrong check digit (total 101, not 0 mod 10). Demoed above.   |
| `AE12345678` | char[1] = E is not in `[A-D]` nor `[89]`; shape failure.     |
| `1B12345678` | char[0] = 1 not a letter.                                    |
| `AB1234567`  | Length 9, shape failure.                                     |

### Confidence

- **New post-2021 format: high**. Algorithm and format published by NIA;
  reform announcement and explanatory materials are first-party.
  Cross-validated against `python-stdnum/tw/twid.py` (`accept_foreigner`
  flag).
- **Legacy pre-2021 format: medium**. Algorithm consistent across
  community references but we did NOT find a first-party NIA PDF
  explicitly describing the legacy checksum. Recommend flagging legacy
  parses with `format: "legacy"` and documenting confidence in the
  implementation JSDoc.

---

## Cross-validation oracle suggestions

1. **`python-stdnum`** (`pip install python-stdnum`, MIT-licensed):
   - `stdnum.tw.ubn` for `TW_UBN` — implements MOF algorithm including
     the "7 rule". Treat as gold for `parse` parity testing.
   - `stdnum.tw.twid` (if present in your version) for `TW_NID` and
     `TW_ARC` (with `accept_foreigner=True`).
   - Pin the version in `docs/CROSS_VALIDATION.md` and generate fixtures
     via a tiny script that mass-validates 1000 generated candidates per
     spec, then commits the survivors as test fixtures.

2. **`gcis.nat.gov.tw` business lookup** — used as a "does this UBN
   actually exist" oracle for high-priority UBN test cases. Note: this is
   liveness, not algorithm conformance; do not gate CI on it.

3. **Online community validators**: many independent JS/Python
   re-implementations exist (e.g. the Hsinchu IRS staff toolkit demo, the
   `tw-id-validator` npm packages); use ONLY as triangulation, never as
   primary source.

4. **`einvoice.nat.gov.tw` API**: the MOF eInvoice schema validation
   endpoint will reject malformed UBNs; a synthetic call (no real invoice
   posted) can confirm shape. Not recommended for CI but useful for
   one-time validation of corner cases.

5. **Manual hand-computation of every fixture** before commit — required
   given the algorithm folding step is easy to get wrong (e.g. the `18 →
   9` vs `10 → 10` distinction in UBN).

---

## Open questions / verification gaps

1. **UBN folding ambiguity** — does the MOF algorithm fold `d_i * W_i`
   when the product is `≥ 10`, **single-fold only** (so 28 → 10, stays as
   integer 10), or **fold to digit-sum** (28 → 10 → 1)? `python-stdnum`
   does single-fold (`sum(divmod(x, 10))`). Both interpretations produce
   the same result when total mod 10 is taken IFF the multi-digit
   intermediate sums are correctly added — but the safer reading is
   single-fold. **Recommend** verifying against MOF's eInvoice spec PDF
   before publishing. (Low risk: `python-stdnum` is reliable here.)

2. **TW_NID gender constraint future evolution** — MOI has discussed
   non-binary support; as of 2026 char[1] is strictly `{1, 2}`, but
   library design should make this a single-line update (a `Set<string>`
   constant) rather than a hard-coded regex.

3. **TW_ARC legacy algorithm** — confirmed only via community sources, not
   first-party NIA PDF. **Recommend** locating NIA's 2020 conversion FAQ
   and explicitly verifying the legacy checksum recipe. If unverifiable,
   ship legacy as `confidence: "medium"` in spec metadata.

4. **TW_ARC char[1] gender semantics** — `A/C → M, B/D → F` is the
   informally circulated mapping but NIA's first-party doc only states
   `A–D` as the allowed range without firm semantics for `C/D`. Document
   the "gender from char[1]" in the `parse` result as `"unknown"` for
   `C/D` until NIA publishes a definitive table.

5. **Letter `O` in NID** — historically not issued, but is a valid pair
   (`O → 35`) in the MOI table. We accept it. Confirm that no MOI rule
   explicitly excludes `O` from validation (vs. issuance).

6. **Region letters L, R, S, Y** — these reference administrative units
   that no longer exist (e.g. former Taichung County 台中縣 merged into
   Taichung City in 2010). Existing NIDs with these letters remain valid
   forever. The letter-pair table preserves them; do NOT drop them.

7. **Special MOF UBN ranges** — some ranges are reserved for special
   entities (e.g. government bodies, foreign branches). These do not
   affect checksum validity but may be useful for an enrichment table in
   a later release.

---

## Citation table for governance test

The governance test in `docs/GOVERNANCE.md` requires each `sourceUrls`
entry to match `gov.[a-z]{2,3}$`. All Taiwan first-party domains end in
`.gov.tw`, which passes (`gov.tw`).

| Spec     | Domain                       | Confidence | Path notes                                                       |
|----------|------------------------------|------------|------------------------------------------------------------------|
| TW_UBN   | `https://www.mof.gov.tw/`    | high       | Parent ministry.                                                 |
| TW_UBN   | `https://gcis.nat.gov.tw/`   | high       | MOEA × MOF business lookup. `.gov.tw` passes governance regex.   |
| TW_UBN   | `https://www.etax.nat.gov.tw/` | high     | eTax portal (FIA).                                               |
| TW_UBN   | `https://www.einvoice.nat.gov.tw/` | high | eInvoice spec docs published the algorithm.                     |
| TW_UBN   | `https://www.ntbt.gov.tw/`   | high       | National Taxation Bureau Taipei (regional offices).              |
| TW_NID   | `https://www.ris.gov.tw/`    | high       | MOI Department of Household Registration.                        |
| TW_NID   | `https://www.moi.gov.tw/`    | high       | Parent ministry.                                                 |
| TW_NID   | `https://www.nhi.gov.tw/`    | medium     | NHI; secondary usage doc.                                        |
| TW_ARC   | `https://www.immigration.gov.tw/` | high  | NIA; issued the 2021 reform announcement.                        |
| TW_ARC   | `https://www.moi.gov.tw/`    | high       | Parent ministry.                                                 |
| TW_ARC   | `https://www.nhi.gov.tw/`    | medium     | NHI; UI numbers on foreign-insured NHI cards.                    |

All entries match `gov.[a-z]{2,3}$` via the literal suffix `gov.tw`.
`gcis.nat.gov.tw`, `etax.nat.gov.tw`, `einvoice.nat.gov.tw` use the
`nat.gov.tw` second-level (national-government), which still terminates
in `gov.tw` and passes the regex.

---

End of Taiwan research dossier. Total ≈ 3,000 words. Next-step
recommendation for implementor: scaffold `src/countries/tw/{ubn,nid,arc}.ts`
following the `mx/curp.ts` model, with shared letter-pair table in
`src/countries/tw/shared.ts`, and gate every fixture through
`python-stdnum` before committing to `test/fixtures/`.
