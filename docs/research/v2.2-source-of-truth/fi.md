# Finland (FI) — source-of-truth verification report
Verified: 2026-05-24

Live-fetch tool: `mcp__browser__browser_fetch` with `impersonate=firefox133`.
DVV pages sit behind Cloudflare interactive challenges, so DVV body content was
read from the Internet Archive snapshot indicated below. All other URLs were
fetched live and returned HTTP 200.

## FI_HETU

### Primary issuer
- **DVV (Digi- ja väestötietovirasto / Digital and Population Data Services
  Agency)** — issues HETU and runs the Population Information System.
- Statute: **Laki väestötietojärjestelmästä ja Digi- ja väestötietoviraston
  varmennepalveluista (661/2009)**, §11 ("Henkilötunnus ja sen antaminen") and
  §12 (correction). Section §11 was last consolidated 2026-04 in Finlex
  (`x-nextjs-cache: HIT`, `age: 382378s`).
  - Live: <https://www.finlex.fi/fi/laki/ajantasa/2009/20090661> → 200 OK
    (HTML shell; the body is rendered client-side from the Finlex Next.js
    bundle — table-of-contents confirms §11 heading
    `chp_2__sec_11 — Personbeteckningen och hur den tilldelas`).
- Decree (the spec for the separator character set itself):
  **Valtioneuvoston asetus väestötietojärjestelmästä 128/2010**, §2, amended
  with effect **1 January 2023** to add five extra century separators per
  century. Cited by DVV's own reform page.
- DVV reference (cited via Internet Archive because Cloudflare blocks
  programmatic fetch):
  - <https://web.archive.org/web/20260507085337/https://dvv.fi/en/personal-identity-code>
    (DVV "Personal identity code", snapshot 2026-05-07, the most recent
    available capture).
  - <https://web.archive.org/web/20260207171446/https://dvv.fi/en/reform-of-personal-identity-code>
    (DVV "Reform of the personal identity code", snapshot 2026-02-07).

### Algorithm (verified)

11 characters: `DDMMYY` + century separator + 3 individual digits (`NNN`) + 1
check character.

**Century separator** (Decree 128/2010 §2, in force 2023-01-01):
- `+` → 1800–1899.
- `-`, `Y`, `X`, `W`, `V`, `U` → 1900–1999.
- `A`, `B`, `C`, `D`, `E`, `F` → 2000–2099.

**Individual number `NNN`** (DVV verbatim):
> "In practice, all individual numbers issued are between 002 and 899."
- 900–999 → reserved temporary identifiers, not in the Population Information
  System (Wikipedia citing DVV / Statistics Finland).
- Sex from 3rd digit: odd = male, even = female.

**Check character** (DVV verbatim):
> "It is established by dividing the nine-digit number consisting of a person's
> date of birth and individual number by 31. … Remainder = control character
> 0=0, 1=1, …, 9=9, 10=A, 11=B, 12=C, 13=D, 14=E, 15=F, 16=H, 17=J, 18=K,
> 19=L, 20=M, 21=N, 22=P, 23=R, 24=S, 25=T, 26=U, 27=V, 28=W, 29=X, 30=Y."

Alphabet: `"0123456789ABCDEFHJKLMNPRSTUVWXY"` (length 31, skipping `G`, `I`,
`O`, `Q`, `Z`).

#### Worked examples

1. **`131052-308T`** — Anna Suomalainen, the canonical DVV example.
   - `n = 131052308`, `n mod 31 = 131052308 − 31·4227493 = 25`.
   - `ALPH[25] = T` ✓.

2. **`010180-1232`** (test fixture, 1980-01-01, indiv 123).
   - `n = 10180123`, `n mod 31 = 2`, `ALPH[2] = "2"` ✓.

3. **`200201A7897`** (test fixture, 2002-01-20, indiv 789).
   - `n = 200201789`, `n mod 31 = 7`, `ALPH[7] = "7"` ✓.

All six test fixtures plus the DVV anchor were recomputed in Python and match
the expected check character (script run during verification).

### Cross-validation

- **python-stdnum `stdnum/fi/hetu.py`** — master HEAD
  `5d4ad17cae8abeab21f446b5569f85d185566330` (2026-05-03, file content
  unchanged by that commit; commit only updates LGPL boilerplate).
  - <https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/fi/hetu.py>
    → 200 OK.
  - Identical alphabet `"0123456789ABCDEFHJKLMNPRSTUVWXY"`.
  - Identical regex (modulo Python flavour):
    `^[0-3]\d[01]\d\d\d[-+ABCDEFYXWVU]\d{3}[0-9ABCDEFHJKLMNPRSTUVWXY]$`.
  - Same `_century_codes` table (`+` → 1800; `-,Y,X,W,V,U` → 1900;
    `A,B,C,D,E,F` → 2000).
  - **Extra rules** beyond what nationid enforces:
    1. Calendar validity via `datetime.date(year, month, day)` → rejects
       `31-02`, `29-02-1900`, etc.
    2. `if individual < 2 → InvalidComponent` (rejects 000, 001).
    3. `if 900 ≤ individual ≤ 999 and not allow_temporary → InvalidComponent`
       (rejects temporary range by default; opt-in flag).
- **Native JS lib** — `vkomulai/finnish-personal-identity-code` no longer
  exists at the documented GitHub path (repo 404 on
  `https://api.github.com/repos/vkomulai/finnish-personal-identity-code`).
  Closest current alternative is
  `svenheden/finnish-personal-identity-code-validator` (TS, 2 stars, last
  push 2023-06-19). Not authoritative.
- **Wikipedia "National identification number" → Finland** confirms the same
  separator set and the same `131052-308T` worked example
  (<https://en.wikipedia.org/wiki/National_identification_number> → 200 OK).

### Discrepancies with current code

`src/countries/fi/hetu.ts`:

1. **MEDIUM — calendar validity not enforced.** `hasValidHetuDate` at
   `hetu.ts:104-110` only checks `1 ≤ mm ≤ 12 && 1 ≤ dd ≤ 31`. It accepts
   impossible dates like Feb 31 or Apr 31, which python-stdnum rejects with
   `InvalidComponent`. Fix: use `Date(year, month-1, day)` and verify the
   round-trip components match. Requires picking the century from the
   separator (already parsed elsewhere).

2. **LOW — individual `000` / `001` accepted.** No rule against
   `010180-0000` etc., yet python-stdnum rejects them as `InvalidComponent`
   ("for historical reasons individual IDs start from 002"). DVV says the
   issued range is 002–899.

3. **LOW — temporary range 900–999 accepted as ordinary HETU.** python-stdnum
   gates this behind `allow_temporary=False` (default). nationid silently
   accepts e.g. `010180-9007` if the check char matches. Recommendation: add
   an opt-in `allowTemporary` config, default false.

4. **NIT — doc URL `dvv.fi/en/personal-identity-code` is live but blocked to
   bots.** Annotate the JSDoc with the Wayback fallback so future maintainers
   don't think the page is dead.

### Confidence verdict
**High** for the core check-character algorithm and separator set (matches DVV,
matches python-stdnum, matches Wikipedia, matches recomputed test fixtures).
**Medium** for completeness (missing calendar-validity and individual-range
rules — see discrepancies). The 2023 reform CENTURY_MAP **is correctly
implemented** — all five new 1900s and all six 2000s letters are accepted.

### Open questions
- The DVV reform page links an Excel of synthetic 2023-reform HETUs that
  could replace nationid's hand-rolled fixtures. URL is paywalled behind
  Cloudflare; verify in a follow-up.
- For accents (`Ä`, `Ö` etc. never appear in HETU but appear in HETU+name
  fields), confirm we never strip past `0-9A-Z+-` in normalization.

---

## FI_YTUNNUS

### Primary issuer
- **PRH (Patentti- ja rekisterihallitus, Finnish Patent and Registration
  Office)** and **Verohallinto (Tax Administration)** jointly via the **YTJ
  (Yritys- ja yhteisötietojärjestelmä)** registry.
- Statute: **Yritys- ja yhteisötietolaki (244/2001)**.
- Live: <https://www.ytj.fi/en/index/businessid.html> → 200 OK (verified
  Last-Modified `Wed, 24 Sep 2025 08:35:19 GMT`).
  - Verbatim: "It consists of seven digits, a dash and a control mark, for
    example 1234567-8."

The official Y-tunnus check-digit algorithm has never been published on a
PRH/YTJ HTML page in a verifiable form (the YTJ English page shows only the
display format). The algorithm specification is universally cited from
**Tieke** (Finnish IT trade body) and from Vero/PRH internal docs; it is
implemented identically in every cross-validation source below.

### Algorithm (verified)

8 digits, displayed as `XXXXXXX-C` (7 body digits + dash + 1 check digit).

Weights `W = [7, 9, 10, 5, 8, 4, 2]` over body digits `d₁…d₇`,
left-aligned (d₁ × 7, d₂ × 9, …, d₇ × 2):

```
sum = Σ dᵢ × Wᵢ
r   = sum mod 11
if r == 0  → check = 0
if r == 1  → number is INVALID (would-be check digit = 10, not allowed)
otherwise  → check = 11 − r
```

#### Worked examples

1. **`2077474-0`** — python-stdnum's canonical example, **and live-verified
   against VIES** as `FI20774740` → "Stereoscape Oy, Hämeentie 135 A, 00560
   Helsinki" (POST <https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number>
   returned `valid: true` on 2026-05-25).
   - `2·7 + 0·9 + 7·10 + 7·5 + 4·8 + 7·4 + 4·2 = 14 + 0 + 70 + 35 + 32 + 28 + 8 = 187`.
   - `187 mod 11 = 0` → check = `0` ✓.

2. **`1234567-1`** (test fixture).
   - `1·7 + 2·9 + 3·10 + 4·5 + 5·8 + 6·4 + 7·2 = 7 + 18 + 30 + 20 + 40 + 24 + 14 = 153`.
   - `153 mod 11 = 10` → check = `11 − 10 = 1` ✓.

3. **`9876543-0`** (test fixture).
   - `9·7 + 8·9 + 7·10 + 6·5 + 5·8 + 4·4 + 3·2 = 63 + 72 + 70 + 30 + 40 + 16 + 6 = 297`.
   - `297 mod 11 = 0` → check = `0` ✓.

All six Y-tunnus fixtures plus the VIES-verified `20774740` were recomputed in
Python and match.

### Cross-validation

- **python-stdnum `stdnum/fi/ytunnus.py`** — master HEAD
  `5d4ad17cae8abeab21f446b5569f85d185566330` (2026-05-03). Delegates entirely
  to `stdnum/fi/alv.py`.
  - <https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/fi/ytunnus.py>
    → 200 OK.
- **python-stdnum `stdnum/fi/alv.py`** uses the algebraically equivalent
  formulation `weights = (7, 9, 10, 5, 8, 4, 2, 1)` over all 8 digits (body
  + check), verifying `sum mod 11 == 0`. Same outcome as nationid's
  `11 − (sum mod 11)` formulation — proven equivalent because including the
  check digit `c` with weight 1 forces `sum_full = sum_body + c`, so
  `sum_full ≡ 0 (mod 11) ⇔ c ≡ −sum_body (mod 11) ⇔ c = (11 − r)` when
  `r = sum_body mod 11 ∈ {2..10}` (and `c = 0` when `r = 0`, and no valid
  `c ∈ {0..9}` exists when `r = 1`).
- **`vkomulai/finnish-business-ids` (npm)** — TS, master file
  `src/finnish-business-ids.ts` SHA `512775c00d0989aae2befaffdb3cf4d1cf0ca3da`.
  - <https://raw.githubusercontent.com/vkomulai/finnish-business-ids/master/src/finnish-business-ids.ts>
    → 200 OK.
  - **Identical** to nationid: `MULTIPLIERS = [7, 9, 10, 5, 8, 4, 2]`,
    `remainder === 1 → invalid`, `remainder > 1 → 11 - remainder`, same VAT
    pattern `/^FI[\d]{8}$/`.
- **VIES live API** — `FI20774740` is currently valid (proves the algorithm
  produces real-world VAT numbers).

### Discrepancies with current code
None on the algorithm. Minor doc nits:

1. **NIT — `ytunnus.ts:6` cites `https://www.ytj.fi/`** as the algorithm
   source. The page itself does not document the algorithm, only the display
   format. Recommend adding a secondary citation to PRH's
   "Yritys- ja yhteisötietojärjestelmän asiakaspalvelu" or to Tieke.
2. **NIT — `1234567-1` test fixture is synthetic.** Replace one of the six
   with `2077474-0` (the python-stdnum canonical fixture and live-verified
   VIES entry) so the test suite has at least one provably real number.

### Confidence verdict
**High.** Algorithm matches three independent sources (python-stdnum,
finnish-business-ids, nationid) and produces verified-real VIES output. The
mathematical equivalence of the two common formulations (7-weight + remap vs.
8-weight + mod-11-zero) is preserved.

### Open questions
- The "Y-tunnus" range `0000001-0` through `0000009-*` is reserved but not
  formally excluded by the check-digit rule. nationid currently accepts e.g.
  `0000001-7` if the check passes. python-stdnum likewise. Likely correct as
  is — flag for awareness only.

---

## FI_VAT

### Primary issuer
- **Verohallinto (Finnish Tax Administration)** maintains the ALV-numero (VAT
  number) on top of the YTJ Y-tunnus.
- Statute: **Arvonlisäverolaki (1501/1993)**; format derived from EU
  Implementing Regulation (EU) No 282/2011.
- Live VIES verification: POST
  <https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number> with
  `{"countryCode":"FI","vatNumber":"20774740"}` → HTTP 200, response
  `{ valid: true, name: "Stereoscape Oy" }` (2026-05-25).

### Algorithm (verified)
`FI` + 8 digits (the Y-tunnus without the dash). Validation is the Y-tunnus
mod-11 algorithm on the 8-digit body. No separate VAT-side checksum.

#### Worked examples
1. **`FI20774740`** → body `20774740` → valid Y-tunnus (sum 187, mod-11 = 0)
   → real entity in VIES ("Stereoscape Oy").
2. **`FI12345671`** (test fixture) → body `12345671` → valid Y-tunnus
   (`1234567-1`).
3. **`FI98765430`** (test fixture) → body `98765430` → valid Y-tunnus.

### Cross-validation
- python-stdnum `stdnum/fi/alv.py` — same algorithm, accepts `FI ` prefix
  optionally, strips spaces & hyphens.
- finnish-business-ids — `VAT_NUMBER_REGEX = /^FI[\d]{8}$/`, reuses Y-tunnus
  validator on the body — exactly nationid's design.
- VIES live response for `FI20774740` — confirmation that the produced format
  is the format VIES accepts.

### Discrepancies with current code
None. Algorithm and regex match all three reference implementations and live
VIES.

### Confidence verdict
**High.**

### Open questions
- nationid does NOT normalize a "FI " (FI-space) prefix as VIES does.
  `validate("VAT", "FI 12345671")` should pass if we want parity with VIES
  input handling; currently `stripAndUpper` collapses spaces so it does pass
  — confirmed by test `validate("ALV", "fi 1234567 1") === true`. No change
  needed.

---

## Summary

- **URLs verified live (HTTP 200):**
  - <https://www.ytj.fi/en/index/businessid.html>
  - <https://www.finlex.fi/fi/laki/ajantasa/2009/20090661>
  - <https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/fi/hetu.py>
  - <https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/fi/ytunnus.py>
  - <https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/fi/alv.py>
  - <https://api.github.com/repos/arthurdejong/python-stdnum/commits?path=stdnum/fi/hetu.py&per_page=1>
    (HEAD SHA `5d4ad17cae8abeab21f446b5569f85d185566330`)
  - <https://raw.githubusercontent.com/vkomulai/finnish-business-ids/master/src/finnish-business-ids.ts>
    (SHA `512775c00d0989aae2befaffdb3cf4d1cf0ca3da`)
  - <https://en.wikipedia.org/wiki/National_identification_number>
  - <https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number> (POST)
- **URLs verified via Internet Archive** (origin Cloudflare-blocked, snapshot
  HTTP 200):
  - <https://web.archive.org/web/20260507085337/https://dvv.fi/en/personal-identity-code>
  - <https://web.archive.org/web/20260207171446/https://dvv.fi/en/reform-of-personal-identity-code>
- **Broken/missing URLs in current code:** 1 effective.
  - `hetu.ts` doc-comment links `https://dvv.fi/en/personal-identity-code` —
    technically alive (200 only with full browser challenge) but unfetchable
    by any non-browser HTTP client. Annotate with Wayback fallback.
  - `ytunnus.ts` doc-comment links `https://www.ytj.fi/` (200) — alive but
    does not document the algorithm; add a secondary citation.
  - `vat.ts` doc-comment links `https://www.vero.fi/` (not fetched but root
    domain) — alive but generic. Add the EU VIES URL as the operational
    citation.
- **Algorithm discrepancies:** 0 in HETU/Y-tunnus/VAT core checks.
- **Behavioural gaps (HETU only):** 3 — see FI_HETU discrepancies #1–#3.

### Recommended code patches

- `src/countries/fi/hetu.ts:104-110` — replace the loose
  `hasValidHetuDate(dd,mm)` check with a calendar-aware check using the
  decoded century from the separator and `Date.UTC(year, month-1, day)`
  round-trip; matches python-stdnum behaviour.
- `src/countries/fi/hetu.ts:54-95` — reject `individual === 0 || individual === 1`
  (issued range starts at 002).
- `src/countries/fi/hetu.ts:31-95` — add an `allowTemporary` option (default
  `false`) that gates the `900-999` individual range.
- `src/countries/fi/hetu.ts:6` — augment the source comment with the Wayback
  URLs above and a citation to Decree **128/2010 §2** as the actual
  separator-list authority.
- `src/countries/fi/ytunnus.ts:6` — add a citation to the canonical Tieke or
  Vero technical doc alongside the YTJ display-format URL.
- `src/countries/fi/vat.ts:6` — add the VIES POST endpoint as the operational
  source URL.
- `tests/countries/fi.test.ts:158-167` — swap one synthetic Y-tunnus fixture
  for `2077474-0` (real, live-verified in VIES at the time of writing) so
  the test suite anchors to a real registered entity.
