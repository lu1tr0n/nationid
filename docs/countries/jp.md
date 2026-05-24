# Japan (JP)

## Documents

| Code | Scope | Length | Check digit | Confidence |
|------|-------|--------|-------------|-----------|
| `JP_MY_NUMBER` | personal | 12 | weighted mod-11 (MIC Ordinance 85/2014) | high |
| `JP_CORPORATE_NUMBER` | tax | 13 | weighted mod-9 (NTA, leftmost position) | high |

Both specs ship under the tree-shakable subpath `nationid/jp`.

---

## `JP_MY_NUMBER` — My Number / 個人番号

### Overview

12-digit Individual Number issued by each 市区町村 (city / ward / town /
village) to every resident of Japan. The national 個人番号 system is jointly
governed by 総務省 (MIC) and 個人情報保護委員会 (PPC). Required for tax,
social-security and disaster-response use cases.

- **Issuer**: Municipalities, on behalf of the national My Number system —
  <https://www.soumu.go.jp/kojinbango_card/>
- **Statute**: 行政手続における特定の個人を識別するための番号の利用等に関する法律
  (Number Use Act, 平成25年法律第27号)
- **Algorithm reference**: 平成26年総務省令第85号 第5条 — MIC Ministerial
  Ordinance defining the check-digit calculation
- **Composition**: 12 digits, no leading-digit restriction
- **Visual format**: `NNNN NNNN NNNN` (4-4-4, single ASCII space) — the
  convention used on the 通知カード and 個人番号カード

### Algorithm

Weighted mod-11 over the first 11 digits, with a published special case for
the boundary `r ≤ 1`:

```
weights (left-to-right):  6  5  4  3  2  7  6  5  4  3  2
S      = Σ digit · weight
r      = S mod 11
check  = 0          if r ≤ 1
       = 11 − r     otherwise
```

The 12th digit must equal `check`. The `r ≤ 1 → 0` branch is in the
ordinance itself (rather than producing `check = 10` or `11`, which would
not be single digits).

`python-stdnum/stdnum/jp/in_.py` ships the same algorithm and was used as
an upstream cross-validation oracle (10k-sample property test).

### Privacy

The Number Use Act (Article 19) restricts third-party display. Most systems
show only the last 4 digits (`**** **** 9012`). `nationid/pii` ships a
`mask` / `hash` / `lastN` set that honours this convention.

### Sources

- <https://www.cao.go.jp/bangouseido/>
- <https://www.soumu.go.jp/kojinbango_card/>
- <https://www.digital.go.jp/policies/mynumber>
- <https://www.ppc.go.jp/legal/policy/>

---

## `JP_CORPORATE_NUMBER` — Corporate Number / 法人番号

### Overview

13-digit identifier assigned by the National Tax Agency (NTA) to every
legal entity registered in Japan — corporations, national / local
government bodies, and other tax-relevant entities. Public registry exposes
each issued number with the corresponding entity name and address.

- **Issuer**: 国税庁 (National Tax Agency) — <https://www.houjin-bangou.nta.go.jp/>
- **Algorithm reference**: 法人番号の指定等に関する省令 第3条 — Ministerial
  Ordinance on the Designation of Corporate Numbers; the gazetted NTA spec
  PDF is at <https://www.houjin-bangou.nta.go.jp/pc/setsumei/images/kokuji_20210129.pdf>
- **Composition**: 13 digits; the LEFTMOST digit is the check digit and is
  always in `1..9` (the algorithm cannot produce `0`)
- **Visual format**: unbroken 13-digit string (NTA's registry convention)

### Algorithm

Weighted mod-9 over the 12 body digits, reading from right to left:

```
weights (right-to-left over body):  1  2  1  2  1  2  1  2  1  2  1  2
S      = Σ body_digit · weight
check  = 9 − (S mod 9)
```

The leftmost digit of the candidate must equal `check`. Note the operator
precedence: it is `9 − (S mod 9)`, NOT `(9 − S) mod 9` — the latter would
incorrectly map `S mod 9 == 0` to `check = 0`, but NTA-issued numbers
prove the correct value is `9`.

`python-stdnum/stdnum/jp/cn.py` (shipped since v1.13) implements this
algorithm and was used as an upstream cross-validation oracle (10k-sample
property test).

### Gold-standard test fixture

The corporate number `7000012050002` belongs to 国税庁 (the NTA itself) and
is verifiable in the public registry. Used as a canonical anchor in the
test suite.

### Sources

- <https://www.houjin-bangou.nta.go.jp/>
- <https://www.houjin-bangou.nta.go.jp/setsumei/>
- <https://www.nta.go.jp/taxes/tetsuzuki/mynumberinfo/index.htm>
- NTA gazetted spec PDF: <https://www.houjin-bangou.nta.go.jp/pc/setsumei/images/kokuji_20210129.pdf>

---

## Tree-shaking

```ts
// Full registry
import { validate } from "nationid";
validate("JP_MY_NUMBER", "1234 5678 9018"); // true

// Country-scoped subpath
import { validate } from "nationid/jp";
validate("MY_NUMBER", "1234 5678 9018"); // true
validate("CORPORATE_NUMBER", "7000012050002"); // true

// Direct spec import (smallest bundle)
import { myNumberSpec } from "nationid/jp";
myNumberSpec.validate("1234 5678 9018"); // true
```
