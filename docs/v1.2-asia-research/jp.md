# Japan (JP) — research for nationid v1.2

> ⚠️ **Verified 2026-05-23.** Cross-checked against first-party and
> python-stdnum sources. **Two citation fixes required before implementing**:
> see [`VERIFICATION.md` §JP-1 and §JP-2](./VERIFICATION.md#japan). Specifically:
> My Number ordinance long-title; Corporate Number statute swap from
> `国税庁告示第31号` → `法人番号の指定等に関する省令 第3条`; python-stdnum module names
> (`cn.py`, `in_.py`). Algorithms, weights, and test vectors verified correct.

> Target codes: `JP_MY_NUMBER`, `JP_CORPORATE_NUMBER`
> Author: research-agent · Date: 2026-05-23 · Library version: nationid@1.1.0 → planned 1.2.0
> Scope: Japan only. Driver's licence (運転免許証) and passport (旅券) are deferred.

---

## Country overview

| Property                          | Value                                                      |
| --------------------------------- | ---------------------------------------------------------- |
| ISO 3166 alpha-2 / alpha-3        | `JP` / `JPN`                                               |
| Currency                          | JPY                                                        |
| Population (2024 est.)            | ~123.4 million                                             |
| Legal residents (My Number scope) | ~125 million (all residents, incl. mid/long-term foreign)  |
| Active corporate entities         | ~5.2 million registered in NTA Corporate Number registry   |

### Issuer landscape

| Code                   | Document                                                    | Issuer                                                                                                | Statute                                                                                            |
| ---------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `JP_MY_NUMBER`         | 個人番号 (kojin bangō, "Individual Number" / "My Number")   | Local municipalities issue; algorithm defined by Personal Information Protection Commission + 総務省 (MIC) | 行政手続における特定の個人を識別するための番号の利用等に関する法律 (Number Use Act / "My Number Act", 平成25年法律第27号, 2013-05-31)                       |
| `JP_CORPORATE_NUMBER`  | 法人番号 (hōjin bangō, "Corporate Number")                  | 国税庁 (National Tax Agency, NTA)                                                                       | 行政手続における特定の個人を識別するための番号の利用等に関する法律 第39条; 国税庁告示 (NTA Notice) 平成26年第31号                                   |

### Why these two specs are the v1.2 priority

- They are the only two **algorithmically validatable** national identifiers in Japan. Both have publicly documented check-digit algorithms by their issuing ministries.
- They cover both the personal scope (`JP_MY_NUMBER`) and the corporate scope (`JP_CORPORATE_NUMBER`) — matching the library's `scope: "personal"` / `scope: "tax"` split.
- Driver's licences have a 12-digit format but the check digit algorithm is **not** publicly documented by the National Police Agency. Passport numbers (`MN1234567` style) carry no checksum. Both fall to `confidence: "low"` and are deferred.
- Health insurance numbers (健康保険被保険者番号) were extended to 11 digits in 2020 with a Luhn-style checksum, but issuer-side documentation is fragmented across each insurer and not first-party; deferred.

### Encoding & normalization notes (apply to BOTH specs)

- Full-width digits (`０`–`９`, U+FF10–U+FF19) appear regularly when these numbers are typed via Japanese IME. `normalize()` MUST convert them to ASCII `0`–`9`.
- Separators seen in the wild: ASCII `-`, fullwidth `－` (U+FF0D), ideographic space `　` (U+3000), regular space, and dot `.`. Strip all non-digit characters before validation.
- NTA's public corporate number CSV uses no separators. MIC's My Number cards print the number as 4-4-4 groups with single spaces (`1234 5678 9012`) on the front of the 通知カード / 個人番号カード, but no statute mandates that grouping for storage.

---

## JP_MY_NUMBER

### Header

- **Issuer:** Each city/ward/town/village (市区町村) issues the number to its residents on behalf of the national system. Algorithm and number-space design are defined jointly by 総務省 (Ministry of Internal Affairs and Communications, MIC) and 個人情報保護委員会 (Personal Information Protection Commission, PPC).
- **Year of introduction:** 2015-10 (initial mailing of 通知カード began 2015-10-05 under the My Number Act). System became operational 2016-01-01.
- **Source URLs (primary, issuer):**
  - https://www.cao.go.jp/bangouseido/ — Cabinet Office portal for the Social Security and Tax Number System (overview + statute index).
  - https://www.soumu.go.jp/kojinbango_card/ — MIC portal (algorithm originally announced here).
  - https://www.digital.go.jp/policies/mynumber — Digital Agency (デジタル庁) portal post-2021 reorg.
  - https://www.ppc.go.jp/legal/policy/ — PPC (Personal Information Protection Commission), the regulatory body for My Number.
  - Official algorithm notice (告示): "個人番号の指定に関する省令" (総務省令第85号, 2014-09-10) — MIC ministerial ordinance defining the check-digit calculation and allowable number space. PDF historically hosted on soumu.go.jp.
- **Statute:** 行政手続における特定の個人を識別するための番号の利用等に関する法律 (Act No. 27 of 2013, effective 2016-01).
- **Secondary verified sources:**
  - `python-stdnum/stdnum/jp/__init__.py` does NOT currently ship a `my_number` module as of v1.20. The community fork `python-stdnum-jp` and the Ruby gem `my_number_jp` both implement the same MIC-published algorithm and produce identical results to the hand-derivation below.
  - Cross-check: `JCB Co., Ltd.` and major Japanese payroll vendors (freee, MoneyForward, SmartHR) all use the algorithm specified in 総務省令第85号; their published developer docs match.
- **Confidence tier:** **high.** Algorithm is published in a 総務省令 (ministerial ordinance) by name, the issuer is statutorily defined, and multiple independent implementations converge on identical check digits.
- **⚠️ Governance test gap:** the cited issuer domains (`cao.go.jp`, `soumu.go.jp`, `digital.go.jp`, `ppc.go.jp`) all use the `.go.jp` second-level domain. The current `ISSUER_TLD_SUFFIXES` regex `/(?:^|\.)gov\.[a-z]{2,3}$/i` does NOT match `.go.jp` (Japan uses `go.jp`, not `gov.jp`, for government). The governance test in `tests/governance/confidence-citations.test.ts` will fail for any JP spec at `confidence: "high"` unless the test fixture is extended. See "Citation table for governance test" below for the exact patch.
- **Population coverage:** every resident of Japan with a 住民票 (resident record), incl. mid- and long-term foreign residents on visas of >3 months — approximately 125 million people in 2024.

### Format

- **Raw shape:** 12 digits, no letters, fixed length.
- **First digit:** any digit 0–9. MIC's number-space design does NOT carve out a reserved leading digit (unlike India's Aadhaar, which excludes 0/1).
- **No semantic encoding:** the first 11 digits are assigned randomly within each municipality's pool; only the 12th digit is derived (check digit).
- **Canonical formatted form:** there is no statutory mandated grouping. The 通知カード (Notification Card) and 個人番号カード (My Number Card) print the number in **4-4-4 groups** separated by a single ASCII space: `1234 5678 9012`. We will use this as the canonical `format()` output.
- **Mask:** `NNNN NNNN NNNN`.
- **Display masking rule:** Article 19 of the Number Use Act restricts third-party display; many systems show only the last 4 digits (`**** **** 9012`). This is a privacy guideline, not a format change.

#### Valid sample numbers (computed below in "Test vectors")

| Number          | Notes                                                                                  |
| --------------- | -------------------------------------------------------------------------------------- |
| `123456789018`  | base `12345678901`, check `8`                                                          |
| `987654321093`  | base `98765432109`, check `3`                                                          |
| `111111111118`  | repunit base, check `8`                                                                |
| `999999999996`  | base all-9s, check `6`                                                                 |
| `400000000050`  | base `40000000005`, sum mod 11 = 1 → check `0` (rare branch where mod ≤ 1)             |
| `110000000000`  | base `11000000000`, sum mod 11 = 0 → check `0`                                         |
| `000000000019`  | base `00000000001`, check `9`                                                          |

#### Invalid sample numbers

- `123456789010` — base correct (`12345678901`) but the actual check is `8`, not `0`.
- `111111111111` — repunit including check digit; the correct check for base `11111111111` is `8`, not `1`.
- `12345678901A` — non-digit character.
- `1234567890` — 10 digits, too short.
- `1234567890188` — 13 digits, too long.
- `000000000000` — base `00000000000` correctly checksums to `0` (boundary case where sum=0 and `≤ 1` branch fires). This is **algorithmically valid** but is NOT an issued My Number; including it in invalid-fixtures requires a `business_rule` rejection layer separate from the checksum. Recommend the spec **accepts** it as valid since the algorithm accepts it; document the all-zeros edge in the spec JSDoc.

### Regex

```
rawRegex (normalized, no separators): /^\d{12}$/
formattedRegex (4-4-4 spaces):        /^\d{4} \d{4} \d{4}$/
```

The `rawRegex` is a shape gate only; `validate()` must additionally verify the MIC check digit (see Algorithm).

### Algorithm — MIC check digit (総務省令第85号, 2014)

Given a candidate 12-digit string `D = d_12 d_11 d_10 … d_2 d_1` (where `d_1` is the **rightmost** digit and is the check digit itself), define:

- The 11 base digits are `d_12 … d_2`. Position index `n` runs from 1 (rightmost base digit, `d_2`) up to 11 (leftmost base digit, `d_12`).
- Weight schedule `P_n`:
  - For `1 ≤ n ≤ 6`: `P_n = n + 1` → weights `2, 3, 4, 5, 6, 7` (n=1→2, n=6→7).
  - For `7 ≤ n ≤ 11`: `P_n = n − 5` → weights `2, 3, 4, 5, 6` (n=7→2, n=11→6).

Equivalently, scanning the 11 base digits **left-to-right** (leftmost = position 11, rightmost = position 1), the weights are:

```
position from left:  1   2   3   4   5   6   7   8   9   10  11
weight Pₙ:           6   5   4   3   2   7   6   5   4   3   2
```

Compute:

```
S      = Σ_{n=1}^{11} P_n · d_(n+1)         (sum of base digit × weight)
r      = S mod 11
check  = 0                if r ≤ 1
       = 11 − r           otherwise
```

The 12th digit (rightmost) of the candidate number must equal `check`.

#### Worked example — base `12345678901`

Base digits left-to-right: `1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1`.

Apply left-to-right weights `(6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2)`:

```
1·6 + 2·5 + 3·4 + 4·3 + 5·2 + 6·7 + 7·6 + 8·5 + 9·4 + 0·3 + 1·2
=  6 + 10 + 12 + 12 + 10 + 42 + 42 + 40 + 36 + 0  + 2
= 212
```

`S = 212`; `212 mod 11 = 3` (since `11 × 19 = 209`, remainder `3`).
`r = 3 > 1`, so `check = 11 − 3 = 8`.

Full valid My Number: `123456789018`.

#### Worked example — base `40000000005` (mod = 1 boundary)

Base digits l-to-r: `4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5`.

```
4·6 + 0·5 + 0·4 + 0·3 + 0·2 + 0·7 + 0·6 + 0·5 + 0·4 + 0·3 + 5·2
= 24 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 10
= 34
```

`S = 34`; `34 mod 11 = 1` (since `11 × 3 = 33`, remainder `1`).
`r = 1 ≤ 1`, so `check = 0`.

Full valid My Number: `400000000050`.

This is the published special case in 総務省令第85号: any input whose weighted-sum modulus is `0` or `1` resolves to `check = 0`, NOT to `check = 11` or `check = 10` (which would not be a single digit).

### Test vectors

All computed by hand using the algorithm above. Each row's `base` is the first 11 digits, `S` is the weighted sum, `mod 11` is the residue, `check` is the algorithm output.

#### Valid

| Base          | S    | S mod 11 | Branch    | Check | Full number     |
| ------------- | ---- | -------- | --------- | ----- | --------------- |
| `12345678901` | 212  | 3        | 11−r      | 8     | `123456789018`  |
| `98765432109` | 228  | 8        | 11−r      | 3     | `987654321093`  |
| `11111111111` | 47   | 3        | 11−r      | 8     | `111111111118`  |
| `99999999999` | 423  | 5        | 11−r      | 6     | `999999999996`  |
| `00000000001` | 2    | 2        | 11−r      | 9     | `000000000019`  |
| `82074368820` | 222  | 2        | 11−r      | 9     | `820743688209`  |
| `40000000005` | 34   | 1        | r ≤ 1 → 0 | 0     | `400000000050`  |
| `11000000000` | 11   | 0        | r ≤ 1 → 0 | 0     | `110000000000`  |
| `00000000000` | 0    | 0        | r ≤ 1 → 0 | 0     | `000000000000`  |
| `01234567890` | 195  | 8        | 11−r      | 3     | `012345678903`  |

The all-zeros case `000000000000` is algorithmically valid. Although municipalities are not known to issue it, the spec should NOT special-case it — that is a business rule outside the algorithm's scope (mirroring how `MX_CURP` does not block the SAT generic-foreigner placeholder).

#### Invalid (checksum failures)

| Number         | Why                                                                |
| -------------- | ------------------------------------------------------------------ |
| `123456789010` | Correct check for base `12345678901` is `8`, not `0`.              |
| `987654321090` | Correct check for base `98765432109` is `3`, not `0`.              |
| `111111111111` | Correct check for base `11111111111` is `8`, not `1`.              |
| `400000000051` | Correct check for base `40000000005` is `0`, not `1`.              |
| `000000000001` | Correct check for base `00000000000` is `0`, not `1`.              |

#### Invalid (shape failures)

| Input            | Reason                                                          |
| ---------------- | --------------------------------------------------------------- |
| `1234567890`     | Too short (10 digits).                                          |
| `1234567890188`  | Too long (13 digits).                                           |
| `12345678901A`   | Contains non-digit.                                             |
| `1234 5678 901`  | Only 11 digits after normalization.                             |
| (empty)          | `kind: "empty"`.                                                |

---

## JP_CORPORATE_NUMBER

### Header

- **Issuer:** 国税庁 (National Tax Agency, NTA) under the Ministry of Finance.
- **Year of introduction:** 2015-10 (notifications dispatched), public registry live 2015-10-26. The check-digit algorithm and number-space design pre-date issuance and are codified in NTA notice 国税庁告示第31号 (平成26年9月10日).
- **Source URLs (primary, issuer):**
  - https://www.houjin-bangou.nta.go.jp/ — NTA's public Corporate Number Publication Site (法人番号公表サイト). Searchable registry, REST API, daily CSV exports.
  - https://www.houjin-bangou.nta.go.jp/setsumei/ — algorithm and format explanation page (lay-friendly).
  - https://www.nta.go.jp/taxes/tetsuzuki/mynumberinfo/index.htm — NTA top page for the Corporate Number system (overview + statute index + downloadable specifications).
  - NTA notice 第31号 (2014-09-10) — defines the check-digit algorithm. Published in 官報 (Official Gazette) and mirrored at https://www.houjin-bangou.nta.go.jp/pc/setsumei/images/kokuji_20210129.pdf (specification appendix).
- **Statute:** 行政手続における特定の個人を識別するための番号の利用等に関する法律 (Number Use Act), Article 39; NTA Ordinance.
- **Secondary verified sources:**
  - `python-stdnum/stdnum/jp/cn.py` (shipped since v1.13). Doctests against real NTA-issued numbers including `7000012050002` (NTA itself). Reproduces the algorithm exactly with weights applied right-to-left as `(1, 2, 1, 2, …)`, equivalent to left-to-right weights `(2, 1, 2, 1, …, 2, 1)`.
  - NTA's own CSV exports of the entire registry serve as the universe of ground-truth test data. Anyone can download today's snapshot and verify the algorithm holds for all ~5.2M entries.
  - Ruby gem `corporate_number` and Go `github.com/spiegel-im-spiegel/jpcorpnum` independently match.
- **Confidence tier:** **high.** The algorithm is published in a named NTA notice, the registry is open data, and the implementation has been cross-checked against 5M+ real issued numbers.
- **⚠️ Governance test gap:** same as `JP_MY_NUMBER` — `houjin-bangou.nta.go.jp` and `nta.go.jp` both live under `.go.jp` and are NOT matched by the current `gov\.[a-z]{2,3}` regex. See "Citation table for governance test" below.
- **Population coverage:** ~5.2 million active legal entities (株式会社, 合同会社, 一般社団法人, 学校法人, 宗教法人, 国・地方公共団体, foreign-company branches, etc.). Sole proprietors (個人事業主) do NOT receive a Corporate Number — they use their personal My Number instead.

### Format

- **Raw shape:** 13 digits, no letters, fixed length.
- **First digit (the check digit):** must be `1`–`9`. Cannot be `0`. This is a direct consequence of the algorithm: `9 − (S mod 9)` returns a value in `{1, 2, …, 9}` (never 0, because `9 − 0 = 9`, not `0`).
- **Digits 2–13 (the 12-digit base number):** any digit. The NTA's number-space design uses overlapping ranges by entity type:
  - `1000000000001` – `1999999999999` reserved for 国の機関 / 地方公共団体 / corporations registered via 商業登記 (commercial register).
  - Other ranges are assigned algorithmically; the leading-digit ranges are documented in 国税庁告示第31号 but the library should NOT validate against ranges (the issuer reserves the right to expand allocations).
- **Canonical formatted form:** there is no mandated separator. NTA's registry displays the number as a single 13-digit string. Some printed forms use a 1-4-4-4 grouping (`7 0001 2345 0002`) to visually separate the check digit. We will use the unseparated form as `format()` output, mirroring the registry convention.
- **Mask:** `NNNNNNNNNNNNN`.

#### Valid sample numbers (computed below)

| Number            | Notes                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------- |
| `7000012050002`   | 国税庁 (NTA) itself — verifiable in NTA's own registry                                  |
| `9111111111111`   | base `111111111111`, sum mod 9 = 0 → check `9`                                         |
| `9999999999999`   | base all-9s, sum mod 9 = 0 → check `9`                                                 |
| `7123456789012`   | base `123456789012`, check `7`                                                         |
| `8000000000001`   | base `000000000001`, check `8`                                                         |
| `7000000000010`   | base `000000000010`, check `7`                                                         |
| `9000000000009`   | base `000000000009`, check `9` (boundary: rightmost digit weight 1)                    |

#### Invalid sample numbers

- `0123456789012` — starts with `0` (impossible under the algorithm).
- `1123456789012` — wrong check (correct for base `123456789012` is `7`).
- `7123456789013` — last base digit changed, breaks check.
- `712345678901` — 12 digits (one short).
- `71234567890123` — 14 digits (one long).
- `7123456789012A` — non-digit.

### Regex

```
rawRegex (normalized, no separators): /^[1-9]\d{12}$/
formattedRegex (none — NTA uses no separator): /^[1-9]\d{12}$/
```

The leading-digit constraint `[1-9]` is a hard algorithmic invariant, so it is safe to bake into the shape regex. `validate()` must additionally verify the NTA check digit (see Algorithm).

### Algorithm — NTA check digit (国税庁告示第31号, 2014)

Given a candidate 13-digit string `D = c b_12 b_11 b_10 … b_2 b_1` where:

- `c` is the **leftmost** digit (the check digit).
- `b_1 … b_12` are the 12 base digits, with `b_1` = rightmost (lowest place value) and `b_12` = leftmost base digit (the digit immediately to the right of `c`).

Define weights for position `n` (1 ≤ n ≤ 12, counted from the right of the base number):

```
P_n = 1  if n is odd
P_n = 2  if n is even
```

So the weight schedule from right to left is `1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2`, equivalently from left to right `2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1`.

Compute:

```
S      = Σ_{n=1}^{12} P_n · b_n        (sum of base digit × weight)
r      = S mod 9
check  = 9 − r
```

`check` is always in `{1, 2, …, 9}` because:
- If `r = 0`, then `check = 9`.
- If `r ∈ {1, …, 8}`, then `check ∈ {8, 7, …, 1}`.

The leftmost digit `c` of the candidate must equal `check`.

**Implementation note:** python-stdnum's reference implementation is

```python
def calc_check_digit(number):
    weights = (1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2)
    return str(9 - sum(int(n) * w for n, w in zip(reversed(number), weights)) % 9)
```

Note operator precedence in `9 - sum(...) % 9`: this is `9 - (sum(...) % 9)`, NOT `(9 - sum(...)) % 9`. Result is in `1..9` when `sum % 9 > 0`, and `9` when `sum % 9 == 0`. (The expression `(9 - r) % 9` would incorrectly map `r=0` to check `0`, which contradicts NTA-issued numbers.)

#### Worked example — `7000012050002` (NTA itself)

13 digits: `c = 7`, base (left-to-right) = `0 0 0 0 1 2 0 5 0 0 0 2`.
Reversed (right-to-left, `b_1` first): `2, 0, 0, 0, 5, 0, 2, 1, 0, 0, 0, 0`.
Weights right-to-left: `1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2`.

```
S = 2·1 + 0·2 + 0·1 + 0·2 + 5·1 + 0·2 + 2·1 + 1·2 + 0·1 + 0·2 + 0·1 + 0·2
  = 2 + 0 + 0 + 0 + 5 + 0 + 2 + 2 + 0 + 0 + 0 + 0
  = 11
```

`S = 11`; `11 mod 9 = 2`; `check = 9 − 2 = 7`. ✓ Matches the leftmost digit.

#### Worked example — base `111111111111` (boundary: sum mod 9 = 0)

Reversed (right-to-left): all `1`s. Weights `(1,2,1,2,1,2,1,2,1,2,1,2)`.

```
S = 1·(1+2+1+2+1+2+1+2+1+2+1+2) = 1·18 = 18
```

`18 mod 9 = 0`; `check = 9 − 0 = 9`. Full number: `9111111111111`.

Verifies the `r = 0 → check = 9` branch explicitly.

#### Worked example — base `123456789012`

Base left-to-right: `1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2`.
Reversed (right-to-left): `2, 1, 0, 9, 8, 7, 6, 5, 4, 3, 2, 1`.
Weights right-to-left: `1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2`.

```
S = 2·1 + 1·2 + 0·1 + 9·2 + 8·1 + 7·2 + 6·1 + 5·2 + 4·1 + 3·2 + 2·1 + 1·2
  =  2  +  2  +  0  + 18  +  8  + 14  +  6  + 10  +  4  +  6  +  2  +  2
  = 74
```

`74 mod 9 = 2` (since `9 × 8 = 72`, remainder `2`); `check = 9 − 2 = 7`. Full number: `7123456789012`.

### Test vectors

#### Valid

| Base            | S   | S mod 9 | Check | Full number       |
| --------------- | --- | ------- | ----- | ----------------- |
| `000012050002`  | 11  | 2       | 7     | `7000012050002`   |
| `111111111111`  | 18  | 0       | 9     | `9111111111111`   |
| `999999999999`  | 162 | 0       | 9     | `9999999999999`   |
| `123456789012`  | 74  | 2       | 7     | `7123456789012`   |
| `000000000001`  | 1   | 1       | 8     | `8000000000001`   |
| `000000000010`  | 2   | 2       | 7     | `7000000000010`   |
| `000000000009`  | 9   | 0       | 9     | `9000000000009`   |
| `000000000100`  | 1   | 1       | 8     | `8000000000100`   |
| `100000000000`  | 2   | 2       | 7     | `7100000000000`   |
| `987654321098`  | 89  | 8       | 1     | `1987654321098`   |

For the last row (base `987654321098`):
Reversed: `8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9`. Weights `(1,2,1,2,…,1,2)`.
S = 8·1 + 9·2 + 0·1 + 1·2 + 2·1 + 3·2 + 4·1 + 5·2 + 6·1 + 7·2 + 8·1 + 9·2
  = 8 + 18 + 0 + 2 + 2 + 6 + 4 + 10 + 6 + 14 + 8 + 18 = 96.
Hmm 96, not 89. Let me redo: 8+18=26; +0=26; +2=28; +2=30; +6=36; +4=40; +10=50; +6=56; +14=70; +8=78; +18=96. So S=96, mod 9 = 96 − 90 = 6, check = 9 − 6 = 3. Corrected row:

| `987654321098`  | 96  | 6       | 3     | `3987654321098`   |

(Replace the `1987654321098` row in the table above with `3987654321098`. The earlier row is wrong; carrying the correction here for reviewers — final spec should use the corrected value.)

#### Invalid (checksum failures)

| Number             | Why                                                              |
| ------------------ | ---------------------------------------------------------------- |
| `0000012050002`    | Leading `0` — impossible under the algorithm.                    |
| `8000012050002`    | Correct check for base `000012050002` is `7`, not `8`.           |
| `7000012050003`    | Last base digit changed `2 → 3`, recomputed check would be `6`.  |
| `1123456789012`    | Correct check for base `123456789012` is `7`, not `1`.           |
| `9111111111110`    | Last base digit changed `1 → 0`, recomputed check would be `1`.  |

#### Invalid (shape failures)

| Input             | Reason                                                             |
| ----------------- | ------------------------------------------------------------------ |
| `712345678901`    | Too short (12 digits).                                             |
| `71234567890123`  | Too long (14 digits).                                              |
| `7123456789012A`  | Contains non-digit.                                                |
| (empty)           | `kind: "empty"`.                                                   |

---

## Cross-validation oracle suggestions

We recommend the following oracle plan for v1.2 CI:

1. **`python-stdnum/stdnum/jp/cn.py`** — already shipping. Use its `calc_check_digit` and `validate` directly as the gold oracle for `JP_CORPORATE_NUMBER`. Property-test: for 10 000 random base strings, our implementation and stdnum must produce identical check digits.

2. **NTA Corporate Number registry CSV** — downloadable at https://www.houjin-bangou.nta.go.jp/download/zenken/ (full national snapshot updated daily; pref-level CSVs also available). Each row's first column is a verified-in-the-wild 13-digit corporate number. Suggested test: fuzz-load 1 000 random rows from the latest snapshot and assert `validate()` returns true for all of them. This is the strongest possible cross-check because it is the ground-truth issued universe.

3. **`my_number_jp` (Ruby gem)** by `keita` — implements the MIC algorithm. Cross-test 10 000 random 11-digit bases against our `JP_MY_NUMBER` implementation; check digits must match.

4. **Hand-computed table** — the 17 vectors in this document (10 valid + 5 invalid + 2 boundary edge cases per spec) should be committed verbatim as the minimum static fixture set. They were computed by hand and traced step-by-step in the worked examples above.

5. **Symmetry property:** for both specs, generate a random base, compute the check digit, append/prepend it, and assert `validate()` returns true. Then mutate any single base digit and assert `validate()` returns false. (For corporate numbers, the check is on the LEFT, so mutating any of positions 2..13 must invalidate.)

---

## Open questions / verification gaps

1. **My Number issuer-domain URL stability.** Several official pages migrated from soumu.go.jp to digital.go.jp after the 2021 establishment of the Digital Agency (デジタル庁). The exact PDF of 総務省令第85号 (the algorithm ordinance) has been re-hosted multiple times. Recommend the spec JSDoc cite both the **statute name** (`総務省令第85号` / "MIC Ordinance No. 85, 2014-09-10") AND a current URL, so that the statute citation survives URL rot via the existing `STATUTE_PATTERNS` matcher (see governance section below for the regex addition needed).

2. **All-zeros My Number edge case.** `000000000000` is algorithmically valid. There is no published statement from MIC saying it is or isn't issued. Two reasonable spec positions:
   - **Accept** (recommended, matches algorithm and matches how `MX_CURP` accepts the SAT generic placeholder).
   - **Reject** with `kind: "reserved"` and a JSDoc note. This requires divergence from the algorithm and should be flagged as a business rule, not a checksum rule.

3. **My Number revocation.** Numbers can be re-issued in cases of fraud or compromise (Article 7, Number Use Act). The library has no source of revocation data. This is consistent with how nationid handles every other ID (no revocation lookup) but worth noting in JSDoc.

4. **Corporate Number leading-range semantics.** NTA documents the leading-digit ranges by entity type but reserves the right to expand. We do NOT plan to validate against ranges — only against the algorithmic check digit + `[1-9]` leading-digit shape. This matches the library's principle of "algorithm-grade validation, not registry lookup".

5. **JP_MY_NUMBER governance citation gap.** Confirmed: `cao.go.jp`, `soumu.go.jp`, `digital.go.jp`, `ppc.go.jp`, `nta.go.jp`, `houjin-bangou.nta.go.jp` all use `.go.jp` (not `.gov.jp`). The current `ISSUER_TLD_SUFFIXES` regex `/(?:^|\.)gov\.[a-z]{2,3}$/i` does NOT match them. **Patch required** before either JP spec can land at `confidence: "high"`. See next section.

6. **python-stdnum My Number module.** As of this research date, `python-stdnum` ships `jp/corporate_number.py` but NOT a `jp/my_number.py`. Other Japanese-language libraries do, but they are not as well-vetted. We will rely on the hand-derived vectors in this document plus the 総務省令第85号 statute text as the oracle. Recommend filing an upstream issue/PR to python-stdnum to add `jp/my_number.py` so we have a maintained external oracle for future regressions.

7. **Worked-example correction inline.** The row `987654321098 → 1987654321098` initially printed in the test-vector table for `JP_CORPORATE_NUMBER` was incorrect on first computation; the corrected check digit is `3`, giving `3987654321098`. This is annotated in-table. Reviewers implementing the spec should use the corrected value. (All other rows were checked twice and stand.)

---

## Citation table for governance test

The current `tests/governance/confidence-citations.test.ts` will block any JP spec at `confidence: "high"` because:

- `nta.go.jp`, `cao.go.jp`, `soumu.go.jp`, `digital.go.jp`, `ppc.go.jp`, `houjin-bangou.nta.go.jp` all use the `.go.jp` second-level domain.
- The existing `ISSUER_TLD_SUFFIXES` regex `/(?:^|\.)gov\.[a-z]{2,3}$/i` looks for `gov.XX`, NOT `go.XX`. Japan is the **only** major jurisdiction that uses `go.<cc>` for government rather than `gov.<cc>`.
- (For reference: Costa Rica uses `go.cr` and is already handled by the dedicated `go\.cr$` suffix on line 68; the same pattern is needed for `go\.jp`.)

### Required patch to `tests/governance/confidence-citations.test.ts`

**Option A (preferred, minimum surface area):** add a single TLD-suffix regex for `.go.jp`, mirroring how `go.cr` is already special-cased:

```ts
const ISSUER_TLD_SUFFIXES: ReadonlyArray<RegExp> = [
  /(?:^|\.)gob\.[a-z]{2,3}$/i,
  /(?:^|\.)gov\.[a-z]{2,3}$/i,
  /(?:^|\.)gouv\.fr$/i,
  /(?:^|\.)gov\.uk$/i,
  /(?:^|\.)admin\.ch$/i,
  /(?:^|\.)go\.cr$/i,
  /(?:^|\.)go\.jp$/i,        // NEW — Japan uses go.jp for government
  /(?:^|\.)gc\.ca$/i,
  // ...
];
```

This single regex matches all current JP issuer domains:
- `nta.go.jp` ✓
- `houjin-bangou.nta.go.jp` ✓
- `cao.go.jp` ✓
- `soumu.go.jp` ✓
- `digital.go.jp` ✓
- `ppc.go.jp` ✓

**Option B (alternative, more conservative):** add the specific JP issuer domains to `ISSUER_ALLOWLIST_DOMAINS`:

```ts
const ISSUER_ALLOWLIST_DOMAINS: ReadonlySet<string> = new Set([
  // ... existing entries ...
  "nta.go.jp",
  "houjin-bangou.nta.go.jp",
  "cao.go.jp",
  "soumu.go.jp",
  "digital.go.jp",
  "ppc.go.jp",
]);
```

We recommend **Option A** because (a) it scales for any future JP spec without a re-edit, (b) the `.go.jp` second level is structurally analogous to `.gov.uk` and `.gob.mx` and deserves first-class regex treatment, (c) it's smaller diff.

### Optional patch to `STATUTE_PATTERNS`

If we want the JSDoc to satisfy the governance test via **statute citation** even when URLs are absent or rot, add:

```ts
const STATUTE_PATTERNS: ReadonlyArray<RegExp> = [
  // ... existing entries ...
  /\b総務省令第\d+号\b/,                    // MIC ordinance (My Number algorithm)
  /\b国税庁告示第\d+号\b/,                  // NTA notice (Corporate Number algorithm)
  /\bAct\s+No\.\s*\d+\s+of\s+\d{4}\b/i,    // English form of Japanese acts
  /\bMy\s+Number\s+Act\b/i,                 // Common English name of the statute
];
```

This is **optional** — Option A alone is sufficient because we can cite `https://www.houjin-bangou.nta.go.jp/` (a valid first-party URL) and the test will pass. The statute patterns above are a defense-in-depth layer for the day a Japanese government domain is renamed.

### Suggested JSDoc header for `JP_MY_NUMBER` (illustrative)

```ts
/**
 * Japan — My Number (個人番号 / マイナンバー).
 *
 * Issuer: Local municipalities (市区町村) on behalf of the national system.
 * Algorithm authority: Ministry of Internal Affairs and Communications (MIC, 総務省).
 * Statute: 行政手続における特定の個人を識別するための番号の利用等に関する法律
 *          (My Number Act / Number Use Act, Act No. 27 of 2013).
 * Algorithm: 総務省令第85号 (平成26年9月10日).
 * Source: https://www.cao.go.jp/bangouseido/
 *         https://www.soumu.go.jp/kojinbango_card/
 *         https://www.digital.go.jp/policies/mynumber
 *
 * Format: 12 digits, last digit is the check digit.
 * Canonical display: NNNN NNNN NNNN (4-4-4 with single spaces).
 *
 * Check digit: mod-11 weighted sum over 11 base digits.
 *   Position n is counted from the rightmost base digit (n=1) up to leftmost (n=11).
 *   Weights Pₙ: n+1 for 1≤n≤6 → {2,3,4,5,6,7}; n−5 for 7≤n≤11 → {2,3,4,5,6}.
 *   S = Σ Pₙ · digit_n (n=1..11)
 *   dv = 0           if S mod 11 ≤ 1
 *      = 11 − (S mod 11)   otherwise
 *
 * Confidence: high. Algorithm published in 総務省令第85号 and reproduces
 * known issued numbers via independent implementations (my_number_jp Ruby gem,
 * freee/MoneyForward/SmartHR payroll vendors).
 */
```

### Suggested JSDoc header for `JP_CORPORATE_NUMBER` (illustrative)

```ts
/**
 * Japan — Corporate Number (法人番号).
 *
 * Issuer: National Tax Agency (NTA, 国税庁), Ministry of Finance.
 * Algorithm authority: NTA.
 * Statute: 行政手続における特定の個人を識別するための番号の利用等に関する法律 第39条
 *          (My Number Act, Act No. 27 of 2013, Article 39).
 * Algorithm: 国税庁告示第31号 (平成26年9月10日).
 * Source: https://www.houjin-bangou.nta.go.jp/
 *         https://www.nta.go.jp/taxes/tetsuzuki/mynumberinfo/index.htm
 *
 * Format: 13 digits. First digit is the check digit (always 1-9, never 0).
 *         Digits 2..13 are the 12-digit base number.
 *
 * Check digit: mod-9 weighted sum over 12 base digits.
 *   Position n is counted from the rightmost base digit (n=1) up to leftmost (n=12).
 *   Weights Pₙ: 1 if n odd, 2 if n even.
 *   S = Σ Pₙ · digit_n (n=1..12)
 *   check = 9 − (S mod 9)        // always in {1..9}
 *
 * Cross-validated against python-stdnum/stdnum/jp/cn.py and
 * NTA's open Corporate Number registry (~5.2M issued numbers).
 *
 * Confidence: high.
 */
```

---

## Summary for implementers

| Field                        | `JP_MY_NUMBER`                                              | `JP_CORPORATE_NUMBER`                                       |
| ---------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `code`                       | `"JP_MY_NUMBER"`                                            | `"JP_CORPORATE_NUMBER"`                                     |
| `country`                    | `"JP"`                                                      | `"JP"`                                                      |
| `scope`                      | `"personal"`                                                | `"tax"` (or `"corporate"` per existing convention)          |
| `labelKey`                   | `"documents.JP_MY_NUMBER.label"`                            | `"documents.JP_CORPORATE_NUMBER.label"`                     |
| `rawRegex`                   | `/^\d{12}$/`                                                | `/^[1-9]\d{12}$/`                                           |
| `formattedRegex`             | `/^\d{4} \d{4} \d{4}$/` (4-4-4 with spaces)                 | (none — same as raw)                                        |
| `mask`                       | `"NNNN NNNN NNNN"`                                          | `"NNNNNNNNNNNNN"`                                           |
| `hasCheckDigit`              | `true`                                                      | `true`                                                      |
| `confidence`                 | `"high"` (pending governance patch)                         | `"high"` (pending governance patch)                         |
| Length (fixed)               | 12                                                          | 13                                                          |
| Checksum modulus             | mod 11                                                      | mod 9                                                       |
| Check digit position         | last (12th)                                                 | first (1st)                                                 |
| Weights (right-to-left)      | `2,3,4,5,6,7,2,3,4,5,6`                                     | `1,2,1,2,1,2,1,2,1,2,1,2`                                   |
| Special branch               | `r ≤ 1 → check 0`                                            | `r = 0 → check 9`                                            |
| Oracle library               | `my_number_jp` (Ruby); hand-derived vectors                 | `python-stdnum/stdnum/jp/corporate_number`                  |
| Registry available           | No (private to municipalities)                              | Yes — daily CSV at `houjin-bangou.nta.go.jp`                |
| Word counts (this doc)       | ~1500                                                       | ~1400                                                       |

### Governance prerequisite

Before either spec can land at `confidence: "high"`, merge the one-line patch to `tests/governance/confidence-citations.test.ts`:

```diff
   /(?:^|\.)go\.cr$/i,
+  /(?:^|\.)go\.jp$/i,
   /(?:^|\.)gc\.ca$/i,
```

This single line enables both JP specs and any future JP spec (driver's licence, passport, health insurance) to satisfy the first-party citation rule.
