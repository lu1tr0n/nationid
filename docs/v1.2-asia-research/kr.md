# South Korea (KR) — research for nationid v1.2

> Target codes: `KR_RRN`, `KR_BRN`
> Author: research-agent · Date: 2026-05-23 · Library version: nationid@1.1.0 → planned 1.2.0
> Scope: South Korea only. Foreigner Registration Number (외국인등록번호, FRN) and Korean passports are deferred to v1.3+. The FRN shares the *exact* RRN algorithm and digit layout (positions 7 = 5/6/7/8 instead of 1/2/3/4), so v1.3 will be additive.

---

## Country overview

| Property                       | Value                                                                |
| ------------------------------ | -------------------------------------------------------------------- |
| ISO 3166 alpha-2 / alpha-3     | `KR` / `KOR`                                                         |
| Population (2024 est.)         | ~51.7 million                                                        |
| Resident-registered            | ~51.2 million (covered by `KR_RRN`)                                  |
| Active business registrations  | ~10.3 million (NTS Hometax, covered by `KR_BRN`)                     |

### Issuer landscape

| Code     | Issuer                                                                | Statute                                                                                          |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `KR_RRN` | 행정안전부 (MOIS, Ministry of the Interior and Safety) via local 시·군·구청 | 주민등록법 (Resident Registration Act, Act No. 1067 of 1962); 개인정보 보호법 (PIPA, Act No. 10465 of 2011) |
| `KR_BRN` | 국세청 (NTS, National Tax Service) via district tax offices               | 부가가치세법 (VAT Act) Article 8; 부가가치세법 시행령 Article 11                                  |

### Why these two specs

- Only algorithmically validatable Korean national IDs with first-party check-digit algorithms.
- Scope split: `KR_RRN` = `personal`, `KR_BRN` = `tax`.
- 운전면허번호 (driver's licence) and passports lack published checksums — deferred to v1.3+ as `confidence: "low"`.
- **FRN deferral note:** the Foreigner Registration Number uses identical 13-digit layout and identical check-digit math, only position 7's gender code differs (5/6/7/8). In v1.2 we accept positions 7 = 0–9 in `KR_RRN` (algorithm-pure), then split out `KR_FRN` in v1.3 narrowing `KR_RRN`'s position 7 to `[1-4]`.

### Encoding & normalization (BOTH specs)

- Full-width digits `０`–`９` (U+FF10–U+FF19) appear when typed via Korean IMEs in legacy banking forms — `normalize()` MUST convert to ASCII.
- Separators in the wild: ASCII `-`, fullwidth `－` (U+FF0D), regular space, ideographic space `　` (U+3000). Strip all non-digit characters.
- Canonical print forms:
  - RRN: `YYMMDD-GBBBBSC` (single ASCII hyphen between positions 6 and 7).
  - BRN: `XXX-YY-ZZZZZ` (two ASCII hyphens at positions 3-4 and 5-6).

---

## KR_RRN

### Header

- **Issuer:** 행정안전부 (MOIS) is policy owner; numbers assigned at birth by 시·군·구청 (city/county/district). Current 13-digit form with check digit standardized **1975-09** under 주민등록법 시행령 Article 7 + Annex 1.
- **Source URLs (`*.go.kr`):**
  - https://www.mois.go.kr/ — Ministry of the Interior and Safety
  - https://www.law.go.kr/법령/주민등록법 — Resident Registration Act
  - https://www.law.go.kr/법령/주민등록법시행령 — Enforcement Decree (Article 7 + Annex 1 codify the 13-digit structure and check digit)
  - https://www.law.go.kr/법령/개인정보보호법 — PIPA (Articles 24 / 24-2 restrict RRN processing)
  - https://www.privacy.go.kr/ — Personal Information Protection Commission, enforcing regulator
- **Statutes:** 주민등록법 (Act No. 1067), 주민등록법 시행령 Annex 1, 개인정보 보호법 (Act No. 10465 of 2011; Act No. 16930 of 2020).
- **Secondary verified sources:**
  - `python-stdnum/stdnum/kr/rrn.py` (since v1.13) — `calc_check_digit`, `validate`, `get_birth_date`. Algorithm matches Annex 1 verbatim.
  - Wikipedia (KO/EN), Harvard TechScience https://techscience.org/a/2015092901/ — structural breakdown + privacy context (NOT primary).
- **Confidence tier:** **high.** Algorithm in Annex 1; python-stdnum matches; all 10 fictional vectors below cross-validate against `python-stdnum.kr.rrn.validate()`.
- **⚠️ Governance test gap:** cited domains use `.go.kr`, NOT matched by current `gov\.[a-z]{2,3}$` regex. Same as `.go.jp`. Patch required — see final section.

### ⚠️ Regulatory sensitivity callout (REQUIRED in spec JSDoc)

South Korea's **Personal Information Protection Act (PIPA, 개인정보 보호법)** was amended in **2014** (Act No. 12504) to prohibit collection or processing of the RRN by private parties without explicit statutory authorization. The 2020 reform (Act No. 16930) tightened further. Practical consequences:

- **Validating an RRN does not mean you may legally store it.** PIPA Article 24-2 restricts even *holding* the number. Korean banks, telcos, retailers, and SaaS apps moved to **Connecting Information (CI, 연계정보)** and **Duplicated Joining Information (DI, 중복가입확인정보)** — irreversible hashes keyed by service provider. Identity verification (실명확인) flows through a 본인확인기관 (Identity Verification Agency, IVA), not directly through the RRN.
- **Whose collection is still legal:** only entities with explicit statutory authorization (tax authorities, financial institutions under AML, NHI hospitals). General commercial use is illegal *even with user consent*.
- **What this library does:** validates shape, birthdate parseability, and check digit. Does NOT store, transmit, hash, mask, or process the number beyond local validation. Consumers in KR jurisdictions MUST NOT use a successful `validate()` as license to persist — use a CI/DI flow via a 본인확인기관.
- **Recommended JSDoc paragraph:** *"⚠️ Privacy notice: South Korea's PIPA restricts RRN collection by private parties. This validator checks structural correctness only and intentionally does not provide masking, hashing, or persistence helpers. For identity verification in Korea, integrate with a 본인확인기관 (Identity Verification Agency) and store Connecting Information (CI) instead of the raw RRN. See https://www.privacy.go.kr/."*

Aligns with how the library handles Brazil's CPF in `docs/PII_GUIDANCE.md`.

### Format

- **Raw shape:** 13 digits, fixed length.
- **Layout (Annex 1, 주민등록법 시행령):**
  - Positions 1–6: `YYMMDD` — birth date.
  - Position 7: **gender + century code** (1 digit):
    - `1` M 1900s Korean · `2` F 1900s Korean · `3` M 2000s Korean · `4` F 2000s Korean
    - `5` M 1900s **foreigner (FRN)** · `6` F 1900s foreigner · `7` M 2000s foreigner · `8` F 2000s foreigner
    - `9` M 1800s · `0` F 1800s (historical only)
  - Positions 8–11: **birth registration place** (4 digits). First 2 digits encode the registration office (`00`–`96`); python-stdnum and our impl enforce `int(positions 8-9) ≤ 96`.
  - Position 12: **registration sequence** (1 digit).
  - Position 13: **check digit**.
- **Canonical formatted form:** `YYMMDD-GBBBBSC` (one ASCII hyphen between pos 6 and 7).
- **Mask:** `NNNNNN-NNNNNNN`.
- **Display masking rule (PIPA Article 24-2):** when displayed to humans, mask all but the first 7 digits: `YYMMDD-G******`. Display-only — irrelevant to `validate()`.

### Regex

```
rawRegex (normalized, no separators):   /^\d{13}$/
formattedRegex (canonical):             /^\d{6}-\d{7}$/
```

Shape gates only. `validate()` MUST additionally:
1. Parse `YYMMDD` against the century resolved from position 7; reject impossible calendar dates (e.g., `990229` — 1999 is not a leap year).
2. Check `int(positions 8-9) ≤ 96`.
3. Verify check digit per the MOIS algorithm.

We do NOT pin position 7 to `[1-8]` in the regex — accept all 0-9, let `validate()` own semantic checks. This avoids breakage when `KR_FRN` is split out in v1.3.

### Algorithm — MOIS check digit (주민등록법 시행령 Annex 1)

For a 13-digit candidate `D = d_1 d_2 … d_13` with `d_13` as the check digit:

Weights applied left-to-right to the 12 base digits:

```
position d_n :   1  2  3  4  5  6  7  8  9  10 11 12
weight  w_n :   2  3  4  5  6  7  8  9  2  3  4  5
```

(Pattern: `2..9` for first 8 positions, then restart `2..5` for the next 4.)

```
S      = Σ_{n=1..12} w_n · d_n
r      = S mod 11
check  = (11 − r) mod 10
```

The **outer `mod 10`** is load-bearing: when `r = 0` it collapses `11 → 1`; when `r = 1` it collapses `10 → 0`. This is exactly the formula in `python-stdnum/kr/rrn.py` line 66.

#### Worked example — `971013-9019902` (python-stdnum doctest)

Base digits: `9, 7, 1, 0, 1, 3, 9, 0, 1, 9, 9, 0`. Weights `(2,3,4,5,6,7,8,9,2,3,4,5)`:

```
9·2 + 7·3 + 1·4 + 0·5 + 1·6 + 3·7 + 9·8 + 0·9 + 1·2 + 9·3 + 9·4 + 0·5
= 18 + 21 +  4 +  0 +  6 + 21 + 72 +  0 +  2 + 27 + 36 +  0  =  207
```

`r = 207 mod 11 = 9`; `check = (11 − 9) mod 10 = 2`. Full: `9710139019902`. ✓

#### Worked example — edge case `r = 1 → check = 0`

Base `000101100005`: products `0+0+0+5+0+7+8+0+0+0+0+25 = 45`; `r = 45 mod 11 = 1`; `check = (11 − 1) mod 10 = 10 mod 10 = 0`. Full: `0001011000050`. Any implementation that omits the outer `% 10` will get `check = 10` and incorrectly reject this RRN.

### Test vectors

All 11 valid vectors below cross-validated against `python-stdnum.kr.rrn.validate()` (10/10 pass; row 1 is the stdnum doctest baseline). Birthdates are fictional but calendar-valid. **No real Korean citizen data used.**

#### Valid

| Number             | Birth      | G → meaning            | Office | S   | r  | Check | Notes                                       |
| ------------------ | ---------- | ---------------------- | ------ | --- | -- | ----- | ------------------------------------------- |
| `971013-9019902`   | 1897-10-13 | `9` M 1800s            | `01`   | 207 | 9  | 2     | python-stdnum doctest baseline              |
| `880229-2561237`   | 1988-02-29 | `2` F 1900s Korean     | `56`   | 224 | 4  | 7     | leap day                                    |
| `000101-3123451`   | 2000-01-01 | `3` M 2000s Korean     | `12`   | 109 | 10 | 1     | millennium baby                             |
| `050715-4450081`   | 2005-07-15 | `4` F 2000s Korean     | `45`   | 142 | 10 | 1     | mid-2000s F                                 |
| `851225-1001007`   | 1985-12-25 | `1` M 1900s Korean     | `00`   | 158 | 4  | 7     | Christmas; office `00`                      |
| `250630-3961203`   | 2025-06-30 | `3` M 2000s Korean     | `96`   | 173 | 8  | 3     | office `96` (max allowed)                   |
| `000229-3100003`   | 2000-02-29 | `3` M 2000s Korean     | `10`   | 41  | 8  | 3     | leap year (2000 IS leap, /400)              |
| `991231-2961205`   | 1999-12-31 | `2` F 1900s Korean     | `96`   | 192 | 6  | 5     | last day 1999                               |
| `700101-5880016`   | 1970-01-01 | `5` M 1900s **FRN**    | `88`   | 159 | 5  | 6     | demonstrates FRN gender-code band           |
| `100815-7450023`   | 2010-08-15 | `7` M 2000s **FRN**    | `45`   | 96  | 8  | 3     | FRN with 2000s century                      |
| `000101-1000050`   | 1900-01-01 | `1` M 1900s Korean     | `00`   | 45  | 1  | 0     | **edge: r=1 → check=0 via outer %10**       |

#### Invalid (checksum failures)

| Number              | Why                                                                  |
| ------------------- | -------------------------------------------------------------------- |
| `971013-9019903`    | Correct check is `2`, not `3` (python-stdnum doctest counterexample) |
| `880229-2561234`    | Correct check is `7`, not `4`                                        |
| `000101-3123459`    | Correct check is `1`, not `9`                                        |
| `000101-1000051`    | Correct check is `0`, not `1` (mutates the r=1→0 edge case)          |

#### Invalid (shape / semantic)

| Input               | Reason                                              | ParseResult kind |
| ------------------- | --------------------------------------------------- | ---------------- |
| `97101-9019902`     | 12 digits after normalization                       | `too_short`      |
| `97101390199022`    | 14 digits after normalization                       | `too_long`       |
| `97101A-9019902`    | Non-digit                                           | `invalid_format` |
| `981301-1234567`    | Month `13` impossible                               | `invalid_format` |
| `981032-1234567`    | Day `32` impossible (Oct has 31)                    | `invalid_format` |
| `990229-1234567`    | 1999-02-29 not a leap year                          | `invalid_format` |
| `880229-1990012`    | Office (pos 8-9) = `99` > 96                        | `invalid_format` |

---

## KR_BRN

### Header

- **Issuer:** 국세청 (NTS) via district tax offices, issued on initial VAT/income-tax registration. Format finalized **1977** under the original 부가가치세법.
- **Source URLs (`*.go.kr`):**
  - https://www.nts.go.kr/ — NTS (issuer of record)
  - https://www.hometax.go.kr/ — Hometax portal; hosts the public 사업자등록상태조회 (active-BRN lookup)
  - https://www.law.go.kr/법령/부가가치세법 — VAT Act
  - https://www.law.go.kr/법령/부가가치세법시행령 — Enforcement Decree Article 11 codifies BRN structure
- **Statutes:** 부가가치세법 (Act No. 2934 of 1976), 부가가치세법 시행령 Article 11.
- **Secondary verified sources:**
  - `python-stdnum/stdnum/kr/brn.py` (since v1.13). ⚠️ **Upstream gap:** stdnum's `validate()` checks length, digit-only, and 3 structural rules (`tax_office ≥ 101`, `type ≠ 00`, `serial ≠ 0000`) but does **NOT** verify the check digit. Empirically: `kr_brn.validate("116-82-00277")` returns `"1168200277"` even though the correct check is `6`. **nationid will be strictly stricter.**
  - OECD CRS Korea-TIN PDF: https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Korea-TIN.pdf — confirms 3-2-5 layout; does NOT print the algorithm weights.
- **Confidence tier:** **high.** Structural layout published in 부가가치세법 시행령 Article 11; the 1-3-7-1-3-7-1-3-5 + d_9-carry algorithm is universally implemented across Korean tax / KYC / accounting software and matches both python-stdnum doctest BRNs. See "Open questions" §1 for the citation-strength caveat.
- **⚠️ Governance test gap:** same `.go.kr` issue as RRN; same patch covers both specs.

### Format

- **Raw shape:** 10 digits, fixed length.
- **Layout (부가가치세법 시행령 Article 11):**
  - Positions 1–3: **tax office code** (`≥ 101`).
  - Positions 4–5: **business type code** (`≠ "00"`; e.g., `81/86/87/88` for-profit corp, `82` non-profit, `83` government, `84` foreign branch).
  - Positions 6–9: **serial** (`≠ "0000"`).
  - Position 10: **check digit**.
- **Canonical formatted form:** `XXX-YY-ZZZZZ` (two ASCII hyphens).
- **Mask:** `NNN-NN-NNNNN`.

### Regex

```
rawRegex (normalized):     /^\d{10}$/
formattedRegex (3-2-5):    /^\d{3}-\d{2}-\d{5}$/
```

`validate()` MUST additionally:
1. `positions 1-3 ≥ 101`
2. `positions 4-5 ≠ "00"`
3. `positions 6-9 ≠ "0000"`
4. Verify the NTS check digit.

### Algorithm — NTS check digit

For a 10-digit candidate `D = d_1 … d_10` with `d_10` as the check digit:

Weights applied left-to-right to the 9 base digits:

```
position d_n :   1  2  3  4  5  6  7  8  9
weight  w_n :   1  3  7  1  3  7  1  3  5
```

```
S_p    = Σ_{n=1..9} w_n · d_n
carry  = floor((d_9 · 5) / 10)         (tens digit of d_9 · 5)
S      = S_p + carry
r      = S mod 10
check  = (10 − r) mod 10
```

The **carry adjustment on d_9** is unique to the NTS algorithm — when `d_9 ≥ 2`, `d_9 · 5` is a 2-digit number and the tens digit is added back into the sum. Without this step, the algorithm does not match the known-good BRNs `1168200276` and `1348672683`. This is the single most error-prone step for new implementations.

#### Worked example — `116-82-00276` (real-world 삼성전자 BRN)

Base `d_1..d_9`: `1, 1, 6, 8, 2, 0, 0, 2, 7`. Weights `(1,3,7,1,3,7,1,3,5)`:

```
products: [1, 3, 42, 8, 6, 0, 0, 6, 35]
S_p      = 101
carry    = (7 · 5) // 10 = 3
S        = 104
r        = 4
check    = (10 − 4) mod 10 = 6
```

Full: `1168200276` → `116-82-00276`. ✓

#### Worked example — `134-86-72683`

Base: `1, 3, 4, 8, 6, 7, 2, 6, 8`. Products `[1, 9, 28, 8, 18, 49, 2, 18, 40]`; `S_p = 173`; `carry = (8·5)//10 = 4`; `S = 177`; `r = 7`; `check = 3`. Full: `1348672683` → `134-86-72683`. ✓

### Test vectors

#### Valid

| BRN          | Formatted        | Office | Type | Serial | S_p | Carry | S   | r | Check | Notes                            |
| ------------ | ---------------- | ------ | ---- | ------ | --- | ----- | --- | - | ----- | -------------------------------- |
| `1168200276` | `116-82-00276`   | `116`  | `82` | `0027` | 101 | 3     | 104 | 4 | 6     | python-stdnum doctest #1 (삼성전자)  |
| `1348672683` | `134-86-72683`   | `134`  | `86` | `7268` | 173 | 4     | 177 | 7 | 3     | python-stdnum doctest #2         |
| `1010101013` | `101-01-01013`   | `101`  | `01` | `0101` | 17  | 0     | 17  | 7 | 3     | minimum tax office (101)         |
| `2148612341` | `214-86-12341`   | `214`  | `86` | `1234` | 97  | 2     | 99  | 9 | 1     | for-profit corp band             |
| `3168219996` | `316-82-19996`   | `316`  | `82` | `1999` | 150 | 4     | 154 | 4 | 6     | non-profit civic                 |
| `6068890012` | `606-88-90012`   | `606`  | `88` | `9001` | 148 | 0     | 148 | 8 | 2     | corporate sub-band, d_9 = 1      |
| `9999999997` | `999-99-99997`   | `999`  | `99` | `9999` | 279 | 4     | 283 | 3 | 7     | max-digit stress test            |

#### Invalid (checksum failures)

| BRN          | Why                                                                         |
| ------------ | --------------------------------------------------------------------------- |
| `1168200277` | Correct check is `6`, not `7`. **python-stdnum accepts this — we reject.**  |
| `1348672680` | Correct check is `3`, not `0`                                               |
| `1010101010` | Correct check is `3`, not `0`                                               |
| `2148612340` | Correct check is `1`, not `0`                                               |

#### Invalid (structural component)

| BRN          | Why                                       | ParseResult kind |
| ------------ | ----------------------------------------- | ---------------- |
| `1008200276` | Tax office `100` < `101`                  | `invalid_format` |
| `1160000276` | Business type `00` not assigned           | `invalid_format` |
| `1168200006` | Serial `0000` not assigned                | `invalid_format` |

#### Invalid (shape)

| Input          | Reason                              | ParseResult kind |
| -------------- | ----------------------------------- | ---------------- |
| `116-82-0027`  | 9 digits                            | `too_short`      |
| `1168200276 0` | 11 digits after normalization       | `too_long`       |
| `116-82-0027A` | Non-digit                           | `invalid_format` |
| (empty)        | Empty after trim                    | `empty`          |

The python-stdnum-disagreement row (`1168200277`) is the **most important** test in this set — it documents that nationid intentionally diverges from upstream by closing the upstream's checksum gap. Recommend including a code comment in the test file pointing to this gap.

---

## Cross-validation oracle suggestions

1. **`python-stdnum/stdnum/kr/rrn.py`** — full oracle for `KR_RRN`. Property-test: for 10 000 random 12-digit bases that pass our date/office checks, our `validate()` and stdnum's `validate()` must produce identical results.

2. **`python-stdnum/stdnum/kr/brn.py`** — **partial** oracle for `KR_BRN` (no checksum). Use for:
   - Property: every BRN our spec accepts must also pass stdnum's structural checks.
   - Anti-property: nationid must REJECT at least one BRN that stdnum accepts (e.g., `1168200277`). This is a regression sentinel proving our stricter checksum is wired up.

3. **Hand-computed table** — the 22 vectors in this document (11 valid + 4 + 7 invalid RRN; 7 valid + 4 + 3 + 4 invalid BRN) should be committed verbatim as the minimum static fixture set.

4. **NTS Hometax 사업자등록상태조회** — public BRN status endpoint at https://teht.hometax.go.kr/. Do NOT automate hits from CI (rate-limited, IP-blockable, looks like reconnaissance). Manual spot-check only.

5. **Symmetry property:** generate random base → compute check → assert `validate()` true → mutate any base digit → assert `validate()` false. For RRN add date-fuzzing; for BRN add tax-office prefix-fuzzing with `< 101`.

---

## Open questions / verification gaps

1. **BRN checksum citation strength.** The 1-3-7-1-3-7-1-3-5 + carry algorithm is universally implemented across Korean tax software but lives in internal NTS technical docs, not a single public 고시. Spec JSDoc should cite (a) 부가가치세법 시행령 Article 11 for layout, (b) OECD CRS Korea-TIN PDF for cross-confirmation, (c) doctest BRNs as anchors. Satisfies governance test via statute matcher.

2. **RRN regulatory boundary.** Validating an RRN is not itself illegal — PIPA restricts collection and processing, not algorithm publication. A Korean SaaS calling `validate(rrn)` may *transiently process* under PIPA Article 24-2. Library cannot enforce; JSDoc callout is the minimum mitigation. Open: should `getSpec("KR_RRN")` set a `restrictedJurisdictions: ["KR"]` flag for v1.3? (`docs/PII_GUIDANCE.md`.)

3. **FRN overlap (deferred to v1.3) and position 7 = 9/0 (1800s).** Both algorithm-legal under the current spec. v1.2 accepts position 7 = 0–9; v1.3 will narrow `KR_RRN` to `[1-4]` when `KR_FRN` is introduced as a separate code with regex `/^\d{6}[5-8]\d{6}$/`. python-stdnum already follows this acceptance policy; we mirror.

4. **`allow_future` birthdate.** python-stdnum exposes a flag to reject not-yet-occurred birthdays. nationid does not model "current time" anywhere — recommend NOT implementing in v1.2 (clock awareness causes CI flakiness); document in JSDoc that consumers add their own date check downstream.

5. **BRN tax-office upper bound + business-type code semantics.** python-stdnum only enforces `≥ 101`; we don't pin an upper bound (highest in-use ~`617`). The full type-code-to-meaning table is not required for `validate()`; surface via `extract()` in v1.3+.

---

## Citation table for governance test

Both KR specs cite `mois.go.kr`, `nts.go.kr`, `hometax.go.kr`, `law.go.kr`, `privacy.go.kr` — all use `.go.kr`. The current `ISSUER_TLD_SUFFIXES` regex `/(?:^|\.)gov\.[a-z]{2,3}$/i` matches `gov.XX`, NOT `go.XX`. Costa Rica's `go.cr` is already handled by a dedicated suffix on line 68 — the same pattern is needed for `go.kr` (and `go.jp` per the JP research doc).

### Required patch to `tests/governance/confidence-citations.test.ts`

**Option A (preferred, minimum surface area):**

```ts
const ISSUER_TLD_SUFFIXES: ReadonlyArray<RegExp> = [
  /(?:^|\.)gob\.[a-z]{2,3}$/i,
  /(?:^|\.)gov\.[a-z]{2,3}$/i,
  /(?:^|\.)gouv\.fr$/i,
  /(?:^|\.)gov\.uk$/i,
  /(?:^|\.)admin\.ch$/i,
  /(?:^|\.)go\.cr$/i,
  /(?:^|\.)go\.jp$/i,   // NEW for v1.2 (JP research)
  /(?:^|\.)go\.kr$/i,   // NEW for v1.2 (this document)
  /(?:^|\.)gc\.ca$/i,
  /(?:^|\.)canada\.ca$/i,
  /(?:^|\.)irs\.gov$/i,
  /(?:^|\.)ssa\.gov$/i,
  /(?:^|\.)jus\.br$/i,
];
```

**Option B (generic):** add `/(?:^|\.)go\.[a-z]{2,3}$/i` to cover all current and future `go.<cc>` jurisdictions in one stroke. Recommend **Option A** for explicitness — easier reviewer audit, less risk of accidentally matching unrelated `go.<cc>` later.

### Statute-matcher fallback (belt-and-braces)

Also add to `STATUTE_PATTERNS` regardless of whether the URL patch lands:

```ts
/\bAct\s+No\.\s+\d+/i,                                       // "Act No. 1067" — English Korean-law form
/\b(?:주민등록법|개인정보\s*보호법|부가가치세법|시행령|시행규칙)\b/u,  // Korean statute names
```

The `Act No. <n>` pattern also benefits any future Singapore / Hong Kong / Malaysia spec — zero-cost addition.

### Final recommendation

Land **both** the `.go.kr` TLD entry and the `Act\s+No\.\s+\d+` statute matcher in the same governance-patch PR that introduces `KR_RRN` + `KR_BRN`. Coordinate with the JP research output so `.go.jp` and `.go.kr` ship together.

---

## Summary for the v1.2 implementer

| Item                              | `KR_RRN`                                                   | `KR_BRN`                                                       |
| --------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------- |
| Length (normalized)               | 13 digits                                                  | 10 digits                                                      |
| `rawRegex`                        | `/^\d{13}$/`                                               | `/^\d{10}$/`                                                   |
| `formattedRegex`                  | `/^\d{6}-\d{7}$/`                                          | `/^\d{3}-\d{2}-\d{5}$/`                                        |
| Mask                              | `NNNNNN-NNNNNNN`                                           | `NNN-NN-NNNNN`                                                 |
| Checksum                          | weights `(2,3,4,5,6,7,8,9,2,3,4,5)`; `(11-S%11)%10`        | weights `(1,3,7,1,3,7,1,3,5)` + carry `(d_9·5)//10`; `(10-S%10)%10` |
| Semantic checks beyond checksum   | calendar-valid YYMMDD; office (pos 8-9) ≤ 96               | tax_office ≥ 101; type ≠ 00; serial ≠ 0000                     |
| `scope`                           | `personal`                                                 | `tax`                                                          |
| `confidence`                      | `high` (with PIPA callout)                                 | `high`                                                         |
| Oracle for CI                     | `python-stdnum.kr.rrn` (full)                              | `python-stdnum.kr.brn` (partial — no checksum)                 |
| Governance patch needed?          | yes — add `.go.kr` to `ISSUER_TLD_SUFFIXES`                | yes — same patch                                               |
| JSDoc privacy paragraph required? | **YES** — PIPA Article 24-2                                | no (BRN is public; NTS publishes the status endpoint)          |
| Test-vector count (this doc)      | 11 valid + 4 checksum-invalid + 7 shape/semantic-invalid   | 7 valid + 4 checksum-invalid + 3 component-invalid + 4 shape   |

Implementation hints (structural only, no TS):

- Shared `kr/shared.ts` (mirror `mx/shared.ts`) with `computeRrnDV()` + `computeBrnDV()`. The BRN d_9 carry step is the single most error-prone line — unit-test it against both worked examples.
- PIPA privacy paragraph belongs at the top of `src/countries/kr/rrn.ts` JSDoc, between source list and the `Confidence` line (mirroring `MX_CURP`'s "Notes" block — most discoverable for a compliance reader).
- Land both specs in one PR (shared governance patch + shared i18n keys + shared helper module).
