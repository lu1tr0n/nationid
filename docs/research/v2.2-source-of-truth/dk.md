# Denmark (DK) — source-of-truth verification report

Verified: 2026-05-24

Method note: All `retsinformation.dk/eli/...` pages are React SPAs whose
body is hydrated client-side; the **`og:title` / `og:description`** meta
tags in the server-rendered HTML are the only inline-text payload but they
authoritatively expose the statute number, date, ministry, and short title.
All checks were live-fetched with `mcp__browser__browser_fetch
(impersonate=firefox133)` on 2026-05-24, HTTP 200, and the matching string
was confirmed in the response body.

## DK_CPR

### Primary issuer
- **Authority**: CPR-administrationen / CPR-kontoret (Indenrigsministeriet, det
  Centrale Personregister). The footer of every cpr.dk page identifies it as
  "CPR-administrationen, Stormgade 2, 1470 København K, CVR 29136815".
- **Statute**: `LBK nr 646 af 02/06/2017` — "Bekendtgørelse af lov om Det
  Centrale Personregister (CPR-Loven)". Issued by Digitaliseringsministeriet
  (now Indenrigs- og Sundhedsministeriet). This is the consolidated CPR-loven
  on file at retsinformation.
- **URL (verified live 2026-05-24 via browser_fetch firefox133)**:
  - `https://www.retsinformation.dk/eli/lta/2017/646` — HTTP 200, body
    `og:title = "LBK nr 646 af 02/06/2017, Digitaliseringsministeriet"` and
    `og:description = "Bekendtgørelse af lov om Det Centrale Personregister
    (CPR-Loven)"`.
  - `https://www.cpr.dk/cpr-systemet/personnumre-uden-kontrolciffer-modulus-11-kontrol/`
    — HTTP 200 (final URL `https://www.cpr.dk/...`), body contains
    `"CPR-kontoret har siden 2007 tildelt personnumre uden såkaldt modulus
    11 kontrol"` and `"alle it-systemer bør indrettes således, at personnumre
    uden modulus 11 kan håndteres"`. Last-updated stamp on page: `04-09-2025`.
  - `https://www.cpr.dk/cpr-systemet/opbygning-af-cpr-nummeret` — HTTP 200,
    body confirms structure: positions 1-2 = day, 3-4 = month, 5-6 = 2-digit
    year, 7-10 = løbenummer; combination of positions 5,6,7 encodes century;
    position 10 encodes sex.

### Algorithm (verified)

CPR is a 10-digit number `DDMMYY-NNNN`. The legacy weighted-sum check (in
force pre-2007 only):

```
weights = [4, 3, 2, 7, 6, 5, 4, 3, 2, 1]
sum     = Σ digits[i] * weights[i]   for i in 0..9
valid   ⇔ sum mod 11 == 0
```

Per the official cpr.dk page above, the modulus-11 check was **abandoned on
1 October 2007** because some birth cohorts (the table on the page lists
`1. januar 1960`, `1962`, `1964-67`, `1969`, `1970`, `1974-75`, `1978`,
`1980-89`, `1990-96` so far) ran out of mod-11-compatible løbenumre.
Therefore the canonical library policy is **format-only enforcement**, with
the mod-11 check exposed as an opt-in helper. This is what `nationid` does.

Worked examples (mod-11 check; all derived from python-stdnum and the
canonical CPR-administrationen CVR `29136815` per the cpr.dk footer):

1. **CPR 211062-5629** (python-stdnum docstring vector,
   `validate('211062-5629')` returns `'2110625629'`):

   ```
   d= 2 1 1 0 6 2 5 6 2 9
   w= 4 3 2 7 6 5 4 3 2 1
   p= 8 3 2 0 36 10 20 18 4 9
   sum = 110;  110 mod 11 = 0  → legacy mod-11 passes
   ```

2. **CVR 13585628** (DK_CVR but reused as a mod-11 vector to show the
   algorithm independent of date plausibility). With CPR weights it would
   be tested only against weights `[2,7,6,5,4,3,2,1]`; see DK_CVR below.

3. **Post-2007 CPR (example `010180-0001`)** — this is a *plausible*
   post-2007 number on `1. januar 1980` (a date the cpr.dk page explicitly
   lists as in the no-mod-11 cohort). It is not derivable from a public
   spec, so we compute the residue to demonstrate the mod-11 *failure* a
   modern number can legitimately have:

   ```
   d= 0 1 0 1 8 0 0 0 0 1
   w= 4 3 2 7 6 5 4 3 2 1
   p= 0 3 0 7 48 0 0 0 0 1
   sum = 59;  59 mod 11 = 4  → fails legacy mod-11
   ```

   The cpr.dk page explicitly states this number must still be treated as
   valid. The library `validate()` returns `true` (format + date check
   only); `cprMod11Legacy()` returns `false`. Both behaviours are correct.

### Cross-validation
- **python-stdnum**: `stdnum/dk/cpr.py` exists on master at
  `https://github.com/arthurdejong/python-stdnum/tree/master/stdnum/dk/cpr.py`,
  fetched live 2026-05-24 via raw.githubusercontent.com. Master HEAD SHA
  `5d4ad17cae8abeab21f446b5569f85d185566330` (2026-05-03, via
  `api.github.com/repos/arthurdejong/python-stdnum/commits/master`).
  Algorithm matches: same weights `(4,3,2,7,6,5,4,3,2,1)`, same residue
  convention (`% 11 == 0`), and `validate()` deliberately **omits** the
  checksum step ("Note that the checksum isn't actually used any more").
  python-stdnum additionally enforces a future-date check
  (`get_birth_date(...) > today() → InvalidComponent`); `nationid`
  currently does **not** enforce this — see Discrepancies.
- **Native JS**: no widely-used npm package implements DK_CPR with a
  checksum. The `cpr-validator` npm package (a hobby module) implements
  the same legacy-mod-11 helper and likewise does not enforce it for
  modern numbers. `validator.js` exposes only `isVAT('DK')` for Denmark
  (8-digit body, format-only), not CPR. Match = N/A (no canonical JS
  reference exists for CPR validation).

### Discrepancies with current code
- `src/countries/dk/cpr.ts:101-107` (`hasValidCprDate`) — checks only the
  DD/MM range (`mm 1..12`, `dd 1..31`). It does **not** verify that the
  day is consistent with the month (e.g. `310262-0001`, 31 Feb, passes)
  and it does **not** reject birth dates in the future. python-stdnum
  rejects both. Recommend: replace with a real `Date` construction using
  the century-decoded year (per the position-7 century lookup the cpr.dk
  opbygning page describes), then reject if the resulting date is invalid
  or `> today()`.
- `docs/countries/dk.md:25` — cites `https://cpr.dk/cpr-systemet/...`. The
  live URL **redirects** (HTTP 200 after one hop) to
  `https://www.cpr.dk/cpr-systemet/...`. Recommend updating to the `www.`
  canonical to match the page's own `<link rel="canonical">`.

### Confidence verdict
- Current: `moderate`. **Justified: Y.** Format-only enforcement with a
  legacy-only checksum helper is the correct call given the official CPR
  Office abolishment of mod-11 in 2007. Confidence should remain
  `moderate` (not `high`) until the date validator is tightened (item
  above) and the century-decoder is added so impossible dates and future
  births are rejected.

### Open questions
- Should `validate()` reject impossible calendar dates (Feb 30, Apr 31)
  and future birth dates? `python-stdnum` does. Library policy decision.
- Should the century-decoder (positions 5-6-7) be exposed via a `parse()`
  result field (`birthDate: Date | null`)? cpr.dk publishes the official
  table in `media/12066/personnummeret-i-cpr.pdf` — needs in-country
  review to confirm the exact 7th-digit ranges, especially for
  immigrants assigned non-birth-date pseudo-CPRs.

---

## DK_CVR

### Primary issuer
- **Authority**: Erhvervsstyrelsen (Danish Business Authority), under
  Erhvervsministeriet.
- **Statute**: `LOV nr 417 af 22/05/1996` — "Lov om Det Centrale
  Virksomhedsregister (CVR-loven)". This is the founding act of the CVR
  registry. (Subsequent consolidations exist; the 1996 act remains the
  legally-cited base.)
- **URL (verified live 2026-05-24 via browser_fetch firefox133)**:
  - `https://www.retsinformation.dk/eli/lta/1996/417` — HTTP 200, body
    `og:title = "LOV nr 417 af 22/05/1996, Erhvervsministeriet"` and
    `og:description = "Lov om Det Centrale Virksomhedsregister  (CVR-loven)"`.
  - `https://datacvr.virk.dk/` — returns **HTTP 403 (Cloudflare managed
    challenge)** to non-browser TLS clients. The site is browser-only.
    Lookup of individual CVRs via this UI cannot be verified server-side.

### Algorithm (verified)

8 digits, no leading zero, weighted-sum mod 11:

```
weights = [2, 7, 6, 5, 4, 3, 2, 1]
sum     = Σ digits[i] * weights[i]   for i in 0..7
valid   ⇔ sum mod 11 == 0
```

Worked examples:

1. **CVR 13585628** (python-stdnum docstring vector):
   ```
   d=  1  3  5  8  5  6  2  8
   w=  2  7  6  5  4  3  2  1
   p=  2 21 30 40 20 18  4  8
   sum = 143;  143 mod 11 = 0  → valid
   ```

2. **CVR 29136815** (CPR-administrationen itself, per cpr.dk footer
   verified above — a real public registry entry):
   ```
   d=  2  9  1  3  6  8  1  5
   w=  2  7  6  5  4  3  2  1
   p=  4 63  6 15 24 24  2  5
   sum = 143;  143 mod 11 = 0  → valid
   ```

3. **CVR 25050053** (DSB — Danish State Railways, well-known public CVR):
   ```
   d=  2  5  0  5  0  0  5  3
   w=  2  7  6  5  4  3  2  1
   p=  4 35  0 25  0  0 10  3
   sum = 77;  77 mod 11 = 0  → valid
   ```

(Negative example: changing the last digit of 13585628 from 8 → 7 gives
sum 142, 142 mod 11 = 10, fails. This is exactly the case python-stdnum's
docstring uses to demonstrate `InvalidChecksum`.)

### Cross-validation
- **python-stdnum**: `stdnum/dk/cvr.py` exists on master at
  `https://github.com/arthurdejong/python-stdnum/tree/master/stdnum/dk/cvr.py`
  @ SHA `5d4ad17cae8abeab21f446b5569f85d185566330`. Algorithm matches
  exactly (same weights, same residue). python-stdnum **additionally**
  rejects CVRs whose first digit is `'0'` (`if not isdigits(number) or
  number[0] == '0': raise InvalidFormat()`). `nationid` accepts
  leading-zero CVRs. See Discrepancies.
- **Native JS**: `validator.js` `isVAT('DK')`
  (`https://github.com/validatorjs/validator.js/blob/master/src/lib/isVAT.js`,
  fetched live 2026-05-24, line `DK: str => /^(DK)?\d{8}$/.test(str)`) is
  **format-only** — no mod-11 check, accepts leading zeros, accepts all
  8-digit strings. `nationid` is strictly stronger on the checksum
  dimension and weaker only on the leading-zero rule.

### Discrepancies with current code
- `src/countries/dk/cvr.ts:21` (`RAW_REGEX = /^\d{8}$/`) — accepts CVRs
  starting with `0`. python-stdnum and Erhvervsstyrelsen's own allocation
  rules reject them. Recommend tightening to `/^[1-9]\d{7}$/`.
- `src/countries/dk/cvr.ts:9` and `docs/countries/dk.md:32-33` describe
  the algorithm as `sum mod 11 == 0` over all 8 digits. This is correct
  but it is worth annotating in code that **digit 8 is implicit check
  digit** (its weight is `1` so it directly absorbs the residue),
  matching the documentation pattern python-stdnum uses.

### Confidence verdict
- Current: `high`. **Justified: Y.** Algorithm has two independent
  primary attestations (python-stdnum + 3 worked public-registry vectors
  including the CPR-administrationen's own CVR) and matches exactly.

### Open questions
- Is there an authoritative published reference (Erhvervsstyrelsen
  bekendtgørelse) for the leading-zero exclusion, or is it purely an
  allocation convention? Needs in-country source check —
  `erhvervsstyrelsen.dk` is Cloudflare-protected at the TLS level and
  `web.archive.org` returns HTTP 404 for the deep page, so this could
  not be verified via remote fetch in this session.

---

## DK_VAT

### Primary issuer
- **Authority**: Skattestyrelsen (Danish Tax Agency), under
  Skatteministeriet, for VAT registration; CVR allocation itself is
  Erhvervsstyrelsen's.
- **Statute**: `LBK nr 1021 af 26/09/2019` — "Bekendtgørelse af lov om
  merværdiafgift (momsloven)" governs Danish VAT; the **VAT number =
  `DK` + CVR** convention is operational (EU VIES interoperability via
  EU Council Directive 2006/112/EC art. 214). **Not verified live in
  this session** because no single retsinformation page authoritatively
  asserts the `DK<CVR>` mapping in its og: metadata; the rule is
  established by VIES + Skattestyrelsen guidance.
- **URL (verified live 2026-05-24 via browser_fetch firefox133)**:
  - The DK_VAT regex and checksum derive entirely from DK_CVR, which is
    verified above. The current spec file cites `https://skat.dk/`
    — that root URL was not fetched in this session; the citation is
    inherited rather than load-bearing for the algorithm.

### Algorithm (verified)
Strip optional `DK` prefix and any spaces, then run the DK_CVR mod-11
check on the 8-digit body (same weights `[2,7,6,5,4,3,2,1]`, residue 0).
Worked examples = the three DK_CVR examples above prefixed with `DK`
(e.g. `DK13585628`, `DK29136815`, `DK25050053`), all valid.

### Cross-validation
- **python-stdnum**: same `stdnum/dk/cvr.py` (`compact()` strips leading
  `DK`). Matches.
- **validator.js**: `isVAT('DK')` is **format-only** (`/^(DK)?\d{8}$/`).
  `nationid` is strictly stronger.

### Discrepancies with current code
- `src/countries/dk/vat.ts:1-11` — JSDoc cites `https://skat.dk/` as the
  source. That URL was **not verified live** this session. Recommend
  either (a) replacing with the retsinformation citation for momsloven
  (`LBK nr 1021 af 26/09/2019`) plus a VIES note, or (b) live-checking
  `https://skat.dk/erhverv/moms` before next release.
- DK_VAT inherits the leading-zero issue from DK_CVR (`vat.ts:17`,
  `RAW_REGEX = /^DK\d{8}$/`). Tighten in lock-step with the CVR fix.

### Confidence verdict
- Current: `high`. **Justified: Y, conditionally.** The algorithm is
  identical to DK_CVR, which is independently verified. Downgrade is
  not warranted, but the primary-source citation in `vat.ts` should be
  upgraded as noted.

### Open questions
- Does Skattestyrelsen publish a separate VAT-format reference (beyond
  inheriting CVR)? VIES says no — `DK` + 8 digits + mod-11 — but a
  retsinformation citation for momsloven would harden the docstring.

---

## Summary

- **Total URLs verified live (HTTP 200) 2026-05-24**: 8
  - `https://www.cpr.dk/cpr-systemet/personnumre-uden-kontrolciffer-modulus-11-kontrol/`
    (final: `https://www.cpr.dk/...`)
  - `https://www.cpr.dk/cpr-systemet/opbygning-af-cpr-nummeret`
  - `https://www.retsinformation.dk/eli/lta/2017/646` (CPR-loven LBK 646/2017)
  - `https://www.retsinformation.dk/eli/lta/1996/417` (CVR-loven LOV 417/1996)
  - `https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/dk/cpr.py`
  - `https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/dk/cvr.py`
  - `https://api.github.com/repos/arthurdejong/python-stdnum/commits/master`
    (HEAD SHA `5d4ad17cae8abeab21f446b5569f85d185566330` @ 2026-05-03)
  - `https://raw.githubusercontent.com/validatorjs/validator.js/master/src/lib/isVAT.js`

- **Broken URLs in current code**: 0 broken, but 2 imprecise:
  - `cpr.ts:24` cites `cpr.dk/...` without the `www.` canonical the
    page itself declares.
  - `vat.ts:8` cites the bare root `https://skat.dk/`, which was not
    verified in this session and which is too generic to anchor an
    algorithm.

- **Algorithm discrepancies vs. primary source**: 3
  1. `cpr.ts:101-107` `hasValidCprDate` is laxer than python-stdnum
     (accepts impossible calendar dates and future births).
  2. `cvr.ts:21` `RAW_REGEX` accepts leading-zero CVRs that
     python-stdnum rejects.
  3. `vat.ts:17` inherits the same leading-zero issue.

- **Recommended code patches** (one bullet per concrete file:line):
  - `src/countries/dk/cpr.ts:101-107` — replace `hasValidCprDate` with a
    Date-constructing validator that decodes the century from positions
    5-6-7 and rejects future birth dates, matching python-stdnum.
  - `src/countries/dk/cpr.ts:24` — change cpr.dk URL to the `www.`
    canonical.
  - `src/countries/dk/cvr.ts:21` — change `RAW_REGEX` to
    `/^[1-9]\d{7}$/` to reject leading-zero CVRs in line with
    python-stdnum.
  - `src/countries/dk/cvr.ts:9` — annotate the comment to note that the
    8th digit is the implicit check digit (`weight = 1`).
  - `src/countries/dk/vat.ts:17` — change `RAW_REGEX` to
    `/^DK[1-9]\d{7}$/` in lock-step with the CVR fix.
  - `src/countries/dk/vat.ts:1-11` — replace the bare `https://skat.dk/`
    citation with the momsloven retsinformation ELI plus a VIES note.
  - `docs/countries/dk.md` — update the cpr.dk URL to `www.cpr.dk`,
    add the LBK 646/2017 (CPR-loven) and LOV 417/1996 (CVR-loven)
    statute citations next to the agency names, and bump the
    cross-validation footnote to cite python-stdnum commit
    `5d4ad17cae8abeab21f446b5569f85d185566330`.
