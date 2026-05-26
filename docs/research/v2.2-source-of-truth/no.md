# Norway (NO) — source-of-truth verification report
Verified: 2026-05-24

Methodology: every primary URL was live-fetched with `mcp__browser__browser_fetch impersonate=firefox133`
and HTTP-200-confirmed at the date above. Cross-references to `python-stdnum`
pinned at commit `5d4ad17cae8abeab21f446b5569f85d185566330` (HEAD of `master`,
authored 2026-05-03). The native FNR check loop is also walked here from
first principles.

## NO_FNR — Fødselsnummer

### Primary issuer
- **Skatteetaten — Folkeregisteret** (Norwegian Tax Administration, National
  Population Register). Issuance is governed by **Lov om folkeregistrering
  (folkeregisterloven), LOV-2016-12-09-88** §§ 4-1 to 4-3, anchored on
  Lovdata at `https://lovdata.no/dokument/NL/lov/2016-12-09-88` — HTTP 200.
- Canonical user-facing description:
  `https://www.skatteetaten.no/en/person/national-registry/birth-and-name-selection/children-born-in-norway/national-id-number/`
  — HTTP 200, contains: *"national identity number… consists of eleven digits,
  of which the first six digits indicate your date of birth… The next three
  digits are individual numbers, where the third digit refers to the holder’s
  gender: even numbers for women and odd numbers for men."*
- The mod-11 algorithm itself is not on the consumer-facing Skatteetaten page;
  it has been published since the 1970s in technical specifications from
  Skattedirektoratet and is reproduced verbatim in the Norwegian Wikipedia
  article and in `python-stdnum`'s docstring (both confirmed below).

### Algorithm (verified)
Eleven digits `D1 D2 D3 D4 D5 D6 I1 I2 I3 K1 K2` where `DDMMYY` is the
date of birth, `I1 I2 I3` is the individnummer (century + sex encoded), and
`K1 K2` are the check digits.

- **DV1** = `(11 − Σ(W1ᵢ · Dᵢ)) mod 11`, weights `W1 = [3,7,6,1,8,9,4,5,2]`
  applied to digits 1–9.
- **DV2** = `(11 − Σ(W2ᵢ · Dᵢ)) mod 11`, weights `W2 = [5,4,3,2,7,6,5,4,3,2]`
  applied to digits 1–10 (i.e. including K1).
- If either check digit comes out as **10** the entire FNR is INVALID (never
  assigned). The literal `0` result is allowed (it corresponds to a sum that
  is already a multiple of 11).

#### Worked example 1 — `15108695088` (stdnum docstring test vector)
DV1 over `151086950`: 1·3+5·7+1·6+0·1+8·8+6·9+9·4+5·5+0·2 = 3+35+6+0+64+54+36+25+0 = **223**.
223 mod 11 = 3 (since 11·20 = 220). 11 − 3 = **8**, taken mod 11 = **8 ✓**
(matches K1=8).
DV2 over `1510869508`: 1·5+5·4+1·3+0·2+8·7+6·6+9·5+5·4+0·3+8·2 = 5+20+3+0+56+36+45+20+0+16 = **201**.
201 mod 11 = 3 (11·18=198). 11 − 3 = **8 ✓** (matches K2=8). Valid.

#### Worked example 2 — `11077942775` (deliberately invalid)
DV1 over `110779427`: 1·3+1·7+0·6+7·1+7·8+9·9+4·4+2·5+7·2 = 3+7+0+7+56+81+16+10+14 = **194**.
194 mod 11 = 7 (11·17=187). 11 − 7 = **4**. Mismatch vs K1=7 → **INVALID**.
nationid would correctly reject at `checkFnrDigits` line `fnr.ts:119`.

#### Worked example 3 — DV computed to 10 (rejection path)
Construct a 9-digit prefix whose weighted sum mod 11 equals 1 → DV1 candidate = 10
→ MUST be rejected. Example: `000000001` — Σ = 1·2 = 2; mod 11 = 2; 11−2 = 9
(too easy). Use `000000009`: Σ = 9·2 = 18; mod 11 = 7; 11−7 = 4. To force 10
take `100000000`: Σ = 1·3 = 3; 11−3 = 8. Force 1 by `010000000`: Σ = 1·7 = 7;
11−7 = 4. Construct `000000005`: Σ = 5·2 = 10; mod 11 = 10; 11−10 = **1**;
because 1 is in `{0,1..9}` it is *not* the 10-case. Construct `000000010`:
Σ = 1·5 = 5; mod 11 = 5; 11−5 = **6**. Construct `200000000`: Σ = 2·3 = 6;
11−6 = **5**. The salient point: every prefix that produces `sum mod 11 == 1`
yields DV = 10 and must be rejected. The implementation at `fnr.ts:118` does
exactly `if (dv1 === 10) return false;` — verified.

#### D-nummer variant
Same algorithm, but the first digit of `DDMMYY` is offset by +40 so the
day field is in `[41, 71]` instead of `[01, 31]`. Algorithm is shared via
the exported `checkFnrDigits` helper imported by `dnr.ts:20`.

### Cross-validation
- **python-stdnum `stdnum/no/fodselsnummer.py`** @ SHA `5d4ad17`
  (https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/no/fodselsnummer.py
  — HTTP 200). Weights, modulo, and 10-rejection are bit-identical. stdnum
  expresses 10-rejection implicitly: `calc_check_digit1` can return the
  string `'10'`, which can never equal a single stored digit, so
  `number[-2] != calc_check_digit1(number)` rejects the same set. The
  end-to-end behaviour matches nationid's explicit `dv === 10 → false`.
- **norwegian-national-id-number (npm)**: cited in `fnr.ts:23` and
  `docs/countries/no.md:38`. The package **does not exist on npm**
  (`https://unpkg.com/norwegian-national-id-number/index.js` returns 404,
  `https://www.npmjs.com/package/norwegian-national-id-number` is gated by
  Cloudflare but the unpkg lookup is authoritative). The intended reference
  is presumably `node-norwegian-national-id-number` or similar, but no live
  npm package with that exact name exists today. **Broken citation.**
- Wikipedia (no.wikipedia.org/wiki/Fødselsnummer) corroborates the same
  weights and the 10-rejection rule.

### Discrepancies with current code (`src/countries/no/fnr.ts`)

| Severity | Where | Issue |
|---|---|---|
| MODERATE | `fnr.ts:104-110` (`hasValidFnrDate`) | Accepts impossible Gregorian dates such as `300290` (Feb 30) or `310490` (Apr 31). stdnum delegates to `datetime.date(year, month, day)` which raises on these. Recommend reusing `core/date.ts`'s real-calendar validator. |
| MODERATE | `fnr.ts` (no individnummer-vs-century guard) | The spec accepts any 3-digit individnummer regardless of year. The Skatteetaten table that stdnum encodes is: `0–499 → 1900–1999`; `500–749` + `YY ≥ 54` → `1855–1899`; `500–999` + `YY < 40` → `2000–2039`; `900–999` + `YY ≥ 40` → `1940–1999`. Anything outside these ranges has no defined birth century and Skatteetaten will not have assigned it. nationid will validate impossible FNRs whose individnummer falls in the "no century defined" gap. |
| LOW | `fnr.ts` (no born-in-future check) | A 2099-dated FNR with valid checksums is accepted. stdnum rejects via `> datetime.date.today()`. Low impact for a generic validator but trivial to add. |
| LOW | `fnr.ts:23` and `docs/countries/no.md:38` | The cited reference package `norwegian-national-id-number` does not exist on npm (unpkg 404). Remove or replace with `fnrvalidator` (npm) or with a direct citation to python-stdnum. |
| LOW | `fnr.ts:9` doc comment | Says "third digit … encodes sex; the full 3-digit block also encodes century" — accurate but the implementation does not parse either out (no helpers exposed). Acceptable for v0.6 scope, but flag for v0.7 helper plan. |

### Confidence verdict
**High** for the dual mod-11 checksum (algorithm and 10-rejection are exactly
right and match stdnum, Wikipedia, and the worked example). **Medium** for
"is this a real FNR Skatteetaten could have assigned?" — the calendar bug
and the missing individnummer/century guard let through numbers that are
syntactically well-formed but were never issuable.

### Open questions
1. Should the spec accept H-numbers (month + 40, used by the health sector)?
   stdnum does. nationid would reject them today via `mm > 12`. Keeping them
   separate (`NO_HNR`?) is defensible.
2. Skatteetaten redesigned the FNR space in 2025 to relax the gender bit
   (planned new "future-proof" identification number). Per public roadmap
   the change has been postponed to ≥2032. No code change needed now.

---

## NO_DNR — D-nummer

### Primary issuer
- **Skatteetaten** for the algorithm and assignment, **Folkeregisteret** for
  the registry. Statute: same folkeregisterloven (LOV-2016-12-09-88) and
  the *forskrift om folkeregistrering* §2-2.
- Canonical page:
  `https://www.skatteetaten.no/en/person/foreign/norwegian-identification-number/d-number/`
  — HTTP 200. Confirms D-number purpose ("for those who do not meet the
  requirements for a national identity number") and lifecycle (active /
  inactive states).

### Algorithm (verified)
Identical to FNR. The only structural difference is the day-of-month field:
`dd' = dd + 40`, range `[41, 71]`. After subtracting 40 the canonical day
must still be in `[1, 31]`. Same DV1/DV2 mod-11 with the same weights.

Worked example: stdnum docstring `get_birth_date` example for D-numbers
treats `day > 40` ⇒ `day -= 40`, then validates as a normal calendar date.

### Cross-validation
- **python-stdnum** unifies FNR/DNR in `fodselsnummer.py`. The D-number day
  path is `if day > 40: day -= 40`. nationid's check `dd >= 41 && dd <= 71`
  is equivalent and slightly stricter (rejects spurious `dd == 80` etc. which
  stdnum routes to the FH-number branch).

### Discrepancies with current code (`src/countries/no/dnr.ts`)

| Severity | Where | Issue |
|---|---|---|
| MODERATE | `dnr.ts:86-96` | Same Gregorian-date gap as FNR. After subtracting the +40 offset the code only checks `1 ≤ canonical ≤ 31`. A D-number whose canonical date is Feb 30 will be accepted. |
| LOW | `dnr.ts` (no individnummer/century guard) | Inherits the FNR gap. |

### Confidence verdict
**High** on algorithm, **medium** on calendar plausibility — both gaps mirror
the FNR ones. The DNR module is otherwise a thin wrapper around FNR's
`checkFnrDigits` and correctly reuses it.

### Open questions
None beyond the FNR ones (calendar + century table).

---

## NO_ORGNR — Organisasjonsnummer

### Primary issuer
- **Brønnøysundregistrene** (Brønnøysund Register Centre), administering
  **Enhetsregisteret**. Statute: **Lov om Enhetsregisteret,
  LOV-1994-06-03-15** §§ 5–8, on Lovdata.
- Algorithm verbatim from `https://www.brreg.no/om-oss/registrene-vare/om-enhetsregisteret/organisasjonsnummeret/`
  — HTTP 200. Quoted text (Bokmål):
  > "Organisasjonsnummeret består av 9 siffer hvor det siste sifferet er
  > et kontrollsiffer beregnet med egne vekter, modulus 11. Etter dette
  > blir vektene 3, 2, 7, 6, 5, 4, 3 og 2 regnet fra første siffer."

### Algorithm (verified)
Nine digits. The first eight are the body; the ninth is the check digit.
Weights `W = [3, 2, 7, 6, 5, 4, 3, 2]` over digits 1–8.
`r = Σ(Wᵢ · Dᵢ) mod 11; dv = 11 − r; if r == 0 → dv = 0; if dv == 10 → invalid`.

Worked example (stdnum docstring) — orgnr `988077917`:
9·3 + 8·2 + 8·7 + 0·6 + 7·5 + 7·4 + 9·3 + 1·2 = 27+16+56+0+35+28+27+2 = **191**.
191 mod 11 = 4 (11·17 = 187). 11 − 4 = **7 ✓** (matches the published K = 7).

### Cross-validation
- **python-stdnum `stdnum/no/orgnr.py`** @ SHA `5d4ad17`. Uses the algebraic
  equivalent: weights `(3,2,7,6,5,4,3,2,1)` over all 9 digits and asserts
  `sum % 11 == 0`. This is the standard mod-11 self-check rearrangement and
  is mathematically identical to nationid's "compute DV separately" form.
  Both accept and reject exactly the same 9-digit strings.
- Brønnøysund's page only states the algorithm and the published example
  graphic (referenced JPG). No separate test vector list is published.

### Discrepancies with current code (`src/countries/no/orgnr.ts`)
None. Algorithm, weights, modulo, 10-rejection, formatting (`XXX XXX XXX`)
all match the brreg.no specification literally.

Minor stylistic note: `orgnr.ts:5` and `mva.ts:33` advertise the formatted
mask `XXX XXX XXX` / `NO000000000MVA`. The MVA mask omits the spaces that
brreg.no and stdnum use in the human-readable form (`NO 995 525 828 MVA`).
This is by design (the library's normalisation is "strip spaces") and not a
bug, but the public mask could optionally render with spaces in `format()`
to align with the Norwegian convention.

### Confidence verdict
**High**. Direct match against the issuer's published algorithm.

### Open questions
1. Brønnøysund does not allocate orgnrs starting with `0`. Should the spec
   add a leading-digit guard? Today's code accepts `0XXXXXXX?` if it has a
   valid checksum. Low impact — no allocation has ever produced one in the
   wild — but a tightening worth a v0.7 task.

---

## NO_MVA — Merverdiavgift VAT number

### Primary issuer
- **Skatteetaten** owns MVA registration; **Brønnøysundregistrene** owns
  the underlying orgnr. Statute: **merverdiavgiftsloven LOV-2009-06-19-58**
  and **bokføringsforskriften (FOR-2004-12-01-1558) § 5-1-1**, which
  mandates that VAT-registered enterprises append `MVA` to their orgnr on
  sales documents.
- Algorithm is implicit: prefix `NO` + 9-digit orgnr + suffix `MVA`. The
  orgnr part must validate per the Brønnøysund mod-11 above. No additional
  MVA-specific check digit exists.

### Algorithm (verified)
- Format: `NO` + 9 digits + `MVA` (14 chars after normalisation).
- Validity: orgnr part validates per `checkOrgnr`.
- Common written forms: `NO 995 525 828 MVA` (human), `NO995525828MVA` (compact).

### Cross-validation
- **python-stdnum `stdnum/no/mva.py`** @ SHA `5d4ad17`. Strips spaces,
  uppercases, removes `NO` prefix, requires `MVA` suffix, delegates to
  `orgnr.validate(number[:-3])`. Bit-identical semantics with nationid.
- **Difference (minor):** stdnum makes the `NO` prefix optional (it strips
  it if present). nationid's `RAW_REGEX = /^NO\d{9}MVA$/` makes `NO`
  mandatory. For a SOURCE-OF-TRUTH library this is arguably stricter and
  correct (the EU VIES form for Norway is `NO123456789MVA`) — but it does
  mean a user pasting a 12-char `123456789MVA` will be rejected. Document
  the choice.

### Discrepancies with current code (`src/countries/no/mva.ts`)

| Severity | Where | Issue |
|---|---|---|
| LOW | `mva.ts:19,20` | `NO` prefix is mandatory; stdnum makes it optional. Document the choice or relax. |
| LOW | `mva.ts:9` | Example written form lists `NO 123 456 789 MVA`; the `format()` output drops the spaces (`NO123456789MVA`). Either align the docstring or have `format()` emit the spaced form to match Brønnøysund/EU VIES presentation. |

### Confidence verdict
**High**. The MVA layer is a thin (and correct) wrapper around `checkOrgnr`.

### Open questions
None.

---

## Summary

- **Total URLs verified (HTTP 200):** 6
  1. `https://www.skatteetaten.no/en/person/national-registry/birth-and-name-selection/children-born-in-norway/national-id-number/`
  2. `https://www.skatteetaten.no/en/person/foreign/norwegian-identification-number/d-number/`
  3. `https://www.brreg.no/om-oss/registrene-vare/om-enhetsregisteret/organisasjonsnummeret/`
  4. `https://lovdata.no/dokument/NL/lov/2016-12-09-88` (folkeregisterloven)
  5. `https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/no/{fodselsnummer,orgnr,mva}.py` (SHA `5d4ad17`)
  6. `https://en.wikipedia.org/wiki/National_identification_number`

- **Broken URLs found in current code / docs:** 1
  - `norwegian-national-id-number` (npm package) — cited at `src/countries/no/fnr.ts:23` and `docs/countries/no.md:38`. Returns 404 on unpkg; no such package exists on npm.

- **Algorithm discrepancies:** 0 for the checksum math itself (FNR, DNR, ORGNR, MVA all match the issuers' algorithms exactly). 4 structural-validation gaps:
  1. FNR/DNR accept impossible Gregorian dates (Feb 30, Apr 31, etc.).
  2. FNR/DNR do not enforce the individnummer/century table → accept individnummer values that Skatteetaten has never assigned.
  3. FNR/DNR do not reject birth dates in the future.
  4. MVA prefix-handling is stricter than stdnum (minor; arguably correct).

- **Recommended code patches:**
  - `src/countries/no/fnr.ts:104-110` — replace `hasValidFnrDate` with a real
    Gregorian-calendar check (delegate to `core/date.ts`).
  - `src/countries/no/dnr.ts:86-96` — after subtracting the +40 offset,
    validate the canonical date against the real Gregorian calendar.
  - `src/countries/no/fnr.ts` — add an `individnummerCenturyValid(year, ind)`
    helper applying Skatteetaten's table (0–499/1900s, 500–749/1855–1899 when
    YY≥54, 500–999/2000s when YY<40, 900–999/1940–1999 when YY≥40); call it
    from `validate` / `parse`.
  - `src/countries/no/fnr.ts:23` and `docs/countries/no.md:38` — remove the
    broken `norwegian-national-id-number` reference; cite `python-stdnum`
    `stdnum.no.fodselsnummer` (SHA `5d4ad17`) instead.
  - `src/countries/no/mva.ts:9` and `format()` (line 46) — either emit the
    spaced human form (`NO 995 525 828 MVA`) to match Brønnøysund/VIES, or
    update the docstring to match the compact form the code actually returns.
  - Optional (v0.7 helpers): expose `getGender(fnr)` and `getBirthDate(fnr)`
    so consumers don't have to re-derive the individnummer rules client-side.
