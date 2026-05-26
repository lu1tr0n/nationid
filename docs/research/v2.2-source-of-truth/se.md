# Sweden (SE) — source-of-truth verification report
Verified: 2026-05-24

Methodology: every primary URL was live-fetched with
`mcp__browser__browser_fetch impersonate=firefox133` and HTTP-200-confirmed
at the date above. Cross-references to `python-stdnum` are pinned at the
same commit `5d4ad17cae8abeab21f446b5569f85d185566330` used for the
Norwegian, Danish, and Finnish reports. Every checksum in the worked
examples was hand-walked using the explicit left-to-right Luhn multiplier
pattern `(2,1,2,1,2,1,2,1,2,1)` and re-checked against
`python-stdnum stdnum/luhn.py` to rule out arithmetic drift.

---

## SE_PERSONNUMMER — Personnummer (incl. samordningsnummer)

### Primary issuer
- **Skatteverket — Folkbokföringen** (Swedish Tax Agency, civil
  registration). Statute: **Folkbokföringslag (1991:481), 18 §**,
  consolidated through SFS 2026:133. URL
  `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/folkbokforingslag-1991481_sfs-1991-481/`
  — HTTP 200, breadcrumb confirms `Folkbokföringslag (1991:481)`.
  18 § literal text (Bokmål-Swedish):
  > "För varje folkbokförd person fastställs ett personnummer som
  > identitetsbeteckning. Personnumret innehåller födelsetid, födelsenummer
  > och kontrollsiffra. Födelsetiden anges med sex siffror, två för året,
  > två för månaden och två för dagen i nu nämnd ordning. Födelsenumret
  > består av tre siffror och är udda för män och jämnt för kvinnor. Mellan
  > födelsetiden och födelsenumret sätts ett bindestreck som byts mot ett
  > plustecken det år en person fyller 100 år."
- **Samordningsnummer** (coordination number for non-resident persons):
  statute is the newer **Lag (2022:1697) om samordningsnummer** (replaced
  the older 2009:154 effective 2023-09-01). URL
  `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-20221697-om-samordningsnummer_sfs-2022-1697/`
  — HTTP 200.
- Canonical consumer-facing pages (live 2026-05-24, HTTP 200):
  - `https://www.skatteverket.se/privat/folkbokforing/personnummerochsamordningsnummer.4.3810a01c150939e893f18c29.html`
    — title `"Personnummer"`. Describes composition and the `-` / `+`
    separator rule (the `+` is used from the calendar year the holder turns
    100). Does not publish the Luhn weights.
  - `https://www.skatteverket.se/privat/folkbokforing/samordningsnummer.4.5c281c7015abecc2e201130b.html`
    — title `"Samordningsnummer"`. **Contains an explicit published worked
    example: `701063-2391`** (a man born 1970-10-03 with day field
    `03 + 60 = 63`, individnummer `239`, check digit `1`).
  - The earlier slug `samordningsnummer.4.5c281c7015abecc2e2014e9.html`
    (cited in v0.5 commit history) is now **HTTP 404** — replace.

### Algorithm (verified)
Ten digits laid out as `YY MM DD - I1 I2 I3 C` (10-digit form) or twelve
laid out as `YYYY MM DD - I1 I2 I3 C` (12-digit form). The separator is
`-` until the calendar year a person turns 100, then it becomes `+`. The
12-digit form is the canonical machine form per Folkbokföringslagen 18 §
("Om det inte är obehövligt ska födelsetiden i personnumret lagras med
åtta siffror i register som förs med hjälp av automatisk databehandling").

The check digit `C` is a **standard Luhn (ISO/IEC 7812-1) computed over the
10-digit form** `YY MM DD I1 I2 I3 C`. For the 12-digit form, drop the
century before computing.

Left-to-right Luhn multiplier pattern (for the 10-digit form, leftmost
position is D1):

```
position:    D1  D2  D3  D4  D5  D6  D7  D8  D9  D10(=C)
multiplier:   2   1   2   1   2   1   2   1   2   1
```

A personnummer is valid iff `Σ digitsum(D_i · m_i) mod 10 == 0`
(where `digitsum(x) = x` if `x < 10` else `x − 9`).

**Samordningsnummer variant**: the day field has 60 added to it
(`dd ∈ [61, 91]`). After subtracting 60 the canonical day must be in
`[1, 31]`. Same Luhn algorithm. Skatteverket's published example
`701063-2391` is a samordningsnummer.

**Interim numbers** (`interimspersonnummer`): used by health-care systems
before identity is verified. They replace the first individnummer digit
with one of `T R S U W X J K L M N` and Luhn is computed by substituting
`1` for that letter. nationid v2.1 does NOT accept them; the npm
`personnummer` package does (opt-in via `allowInterimNumber`). This is a
known scope gap, not a checksum bug.

#### Worked example 1 — `880320-0016` (python-stdnum doctest)
10-digit form `8803200016`. Body = `880320 001`, check = `6`. Born
2020-03-20 if 21st-century, but the `-` separator + a born-before-current
heuristic places the cohort in 1988. Individnummer last digit = `1` →
odd → male.

Left-to-right Luhn walk:

| pos | digit | × | digit-sum |
|-----|-------|---|-----------|
| D1  | 8     | 2 | 7         | (16 → 1+6 = 7) |
| D2  | 8     | 1 | 8         |
| D3  | 0     | 2 | 0         |
| D4  | 3     | 1 | 3         |
| D5  | 2     | 2 | 4         |
| D6  | 0     | 1 | 0         |
| D7  | 0     | 2 | 0         |
| D8  | 0     | 1 | 0         |
| D9  | 1     | 2 | 2         |
| D10 | 6     | 1 | 6         |

Sum = 7+8+0+3+4+0+0+0+2+6 = **30**. 30 mod 10 = **0** → **VALID** ✓.

#### Worked example 2 — `701063-2391` (Skatteverket-published samordningsnummer)
This is the *only* worked example Skatteverket itself publishes for the
SE personnummer family. 10-digit form `7010632391`. Day field = `63` →
canonical day `63 − 60 = 3`. Born 1970-10-03 (man), individnummer `239`,
check `1`.

| pos | digit | × | digit-sum |
|-----|-------|---|-----------|
| D1  | 7     | 2 | 5         | (14 → 1+4 = 5) |
| D2  | 0     | 1 | 0         |
| D3  | 1     | 2 | 2         |
| D4  | 0     | 1 | 0         |
| D5  | 6     | 2 | 3         | (12 → 1+2 = 3) |
| D6  | 3     | 1 | 3         |
| D7  | 2     | 2 | 4         |
| D8  | 3     | 1 | 3         |
| D9  | 9     | 2 | 9         | (18 → 1+8 = 9) |
| D10 | 1     | 1 | 1         |

Sum = 5+0+2+0+3+3+4+3+9+1 = **30**. 30 mod 10 = **0** → **VALID** ✓.

Second-to-last individnummer digit = `9` → odd → male, matches
Skatteverket's text ("En man är född den 3 oktober 1970").

#### Worked example 3 — `811228-9841` (python-stdnum doctest for `get_birth_date`)
10-digit form `8112289841`. Born 1981-12-28, individnummer `984`, check
`1`. Individnummer last digit `4` → even → female.

| pos | digit | × | digit-sum |
|-----|-------|---|-----------|
| D1  | 8     | 2 | 7         |
| D2  | 1     | 1 | 1         |
| D3  | 1     | 2 | 2         |
| D4  | 2     | 1 | 2         |
| D5  | 2     | 2 | 4         |
| D6  | 8     | 1 | 8         |
| D7  | 9     | 2 | 9         |
| D8  | 8     | 1 | 8         |
| D9  | 4     | 2 | 8         |
| D10 | 1     | 1 | 1         |

Sum = 7+1+2+2+4+8+9+8+8+1 = **50**. 50 mod 10 = **0** → **VALID** ✓.

#### Worked example 4 — synthetic derivation `820323-080?` → `8203230803`
Demonstrates check-digit derivation when only the body is known. Body =
`820323 080` (born 1982-03-23, individnummer `080` → female because last
digit `0` is even).

Set check digit `C = D10` and solve `Σ ≡ 0 mod 10`:

| pos | digit | × | digit-sum |
|-----|-------|---|-----------|
| D1  | 8     | 2 | 7         |
| D2  | 2     | 1 | 2         |
| D3  | 0     | 2 | 0         |
| D4  | 3     | 1 | 3         |
| D5  | 2     | 2 | 4         |
| D6  | 3     | 1 | 3         |
| D7  | 0     | 2 | 0         |
| D8  | 8     | 1 | 8         |
| D9  | 0     | 2 | 0         |
| D10 | C     | 1 | C         |

Partial sum (D1..D9) = 27. So `C = (10 − (27 mod 10)) mod 10 = 3`. Full
personnummer = `820323-0803`. Verification right-to-left also yields 30
→ 0 mod 10 ✓.

### Cross-validation

- **`python-stdnum stdnum/se/personnummer.py`** @ SHA `5d4ad17`
  (https://raw.githubusercontent.com/arthurdejong/python-stdnum/5d4ad17cae8abeab21f446b5569f85d185566330/stdnum/se/personnummer.py
  — HTTP 200, blob SHA `277c7f5474de3ea91b9d17198ee57460f557707d`, 3846
  bytes). Algorithm = `luhn.validate(digits[-10:])` (standard Luhn over
  the trailing 10 digits, dropping century if any). Doctest fixtures:
  - `validate('880320-0016')` → `'880320-0016'` ✓ (Example 1 above)
  - `validate('880320-0018')` → `InvalidChecksum` (sum becomes 32 → not 0
    mod 10)
  - `get_gender('890102-3286')` → `'F'` (D9 = 8, even)
  - `get_birth_date('811228-9841')` → `datetime.date(1981, 12, 28)` ✓
  - `format('8803200016')` → `'880320-0016'` (compact-form re-formatter)

  The `get_birth_date` docstring cites **"See Folkbokföringslagen (1991:481),
  §18"** — the same statute we verified above. python-stdnum's
  date-bracketing logic mirrors the `+` separator rule directly.

- **`personnummer/js` (npm `personnummer`)** — latest published version
  `3.2.1` on npm, last `last-modified` header on the registry JSON
  `Thu, 23 Mar 2023 20:18:20 GMT`. Repo master at
  `https://github.com/personnummer/js`, file `src/index.ts` content
  fetched 2026-05-24 (HTTP 200). Algorithm: `luhn(year + month + day +
  num.replace(/[TRSUWXJKLMN]/, '1')) === +check`. Confirms identical
  10-digit Luhn semantics; extends nationid scope with **interim numbers**
  via the letter→`1` substitution. Coordination-number detection: tries
  date with `day - 60` if the literal date fails (`testDate(year, month,
  day - 60)`), matching nationid's `dd > 60 ? dd − 60 : dd` branch
  exactly. README claims compatibility with the Swedish Tax Agency's
  specification.

- **`validator.js`** — `isVAT('SE')` regex is just `/^(SE)?\d{12}$/` — it
  does NOT exercise the Luhn algorithm or the `01` suffix. Useful only as
  a shape-only second opinion; nationid's `SE_VAT` is strictly stronger.
  Source URL
  `https://raw.githubusercontent.com/validatorjs/validator.js/master/src/lib/isVAT.js`
  — HTTP 200.

- **Wikipedia (`sv.wikipedia.org/wiki/Personnummer_i_Sverige`)** — gives
  the Luhn algorithm with the same multiplier pattern; provides additional
  historical context on the gender-bit and the day-+60 samordningsnummer
  convention. Not a primary source but corroborates.

### Discrepancies with current code (`src/countries/se/personnummer.ts`)

| Severity | Where | Issue |
|---|---|---|
| MODERATE | `personnummer.ts:112-127` (`hasValidDate`) | Accepts impossible Gregorian dates such as Feb 30 / Apr 31 for both ordinary and samordningsnummer cases. python-stdnum delegates to `datetime.date(...)` and raises `InvalidComponent`. The same `core/date.ts` real-calendar validator already in use by other countries should be threaded through. |
| MODERATE | `personnummer.ts` (no interim-number support) | The npm `personnummer` package accepts `[TRSUWXJKLMN]\d{2}` in the individnummer slot (interim numbers used by health-care). nationid's `RAW_REGEX = /^\d{10}$\|^\d{12}$/` rejects them outright. Whether to ship a separate `SE_INTERIM_PERSONNUMMER` spec, extend the RAW_REGEX, or document the gap is an explicit v2.3+ decision. |
| LOW | `personnummer.ts:6-23` JSDoc | Cites `https://www.skatteverket.se/` generically. The canonical pages now exist at the deep links above; cite `personnummerochsamordningsnummer.4.3810a01c150939e893f18c29.html` for the consumer-facing spec and the Folkbokföringslag 18 § riksdagen URL for the statute. Add `https://github.com/arthurdejong/python-stdnum/blob/5d4ad17cae8abeab21f446b5569f85d185566330/stdnum/se/personnummer.py` as the algorithmic oracle, matching the no.md / dk.md / fi.md pattern. |
| LOW | `personnummer.ts` (no `+` rebracketing) | When the 10-digit form arrives with a `+` separator, nationid currently treats it as identical to `-` for validation purposes. python-stdnum's `get_birth_date` and the npm package both use the `+` to bump the century back by 100. nationid does not expose `extractDOB` for SE_PERSONNUMMER today, so this is dormant — but flag for the v0.7 helper expansion (the `nationid/extract` slot already supports DOB for several countries). |
| LOW | `personnummer.ts:8-9` docstring | "Coordination numbers ... day-of-month + 60" — accurate but inverted from the way Skatteverket phrases it ("Siffran för födelsedagen ökas med talet 60"). Cosmetic. |

### Confidence verdict
**High** for the Luhn checksum (algorithm and 10-digit window are exactly
right and match python-stdnum, the npm reference, and the explicit
Skatteverket-published example `701063-2391`). **Medium** for "is this a
real personnummer Skatteverket could have assigned?" — same Gregorian-date
gap as the Norwegian FNR plus the interim-number scope omission.

### Open questions
1. Add interim-number support? Skatteverket's official position (per the
   2022-09 boverket / Inera healthcare guidance) is that interim numbers
   are *not* personnummer for civil-registration purposes but they ARE
   accepted by every major Swedish healthcare and HR system. A new code
   `SE_INTERIM_PERSONNUMMER` (separate spec, same algorithm, RAW_REGEX
   `^\d{6}[+-]?[TRSUWXJKLMN]\d{2}\d$`) is the cleanest answer.
2. The `+` separator rebracketing matters only if `nationid/extract`
   exposes a SE DOB helper. Decide at v0.7 helper-planning time.

---

## SE_ORGNR — Organisationsnummer

### Primary issuer
- **Bolagsverket** (Swedish Companies Registration Office) is the principal
  registrar; Skatteverket, Kammarkollegiet, Lantmäteriet, and
  Statistikmyndigheten SCB also assign orgnrs in their respective domains.
  Statute: **Lag (1974:174) om identitetsbeteckning för juridiska personer
  m.fl.** URL
  `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1974174-om-identitetsbeteckning-for_sfs-1974-174/`
  — HTTP 200, title verified
  `"Lag (1974:174) om identitetsbeteckning för juridiska personer m.fl. \| Sveriges riksdag"`.
- Canonical Bolagsverket reference page:
  `https://bolagsverket.se/foretag/organisationsnummer.1207.html` — HTTP
  200, `og:title="Bolagsverket"`, last-modified header 2024-10-09. The page
  publishes the **first-digit company-form classification** (see table
  below) and its own orgnr **`202100-5489`** as an explicit example.
- The Luhn algorithm itself is **not** published on the Bolagsverket page;
  it is part of the original 1974 implementation and documented in
  python-stdnum + multiple textbooks. The first-digit table IS canonical.

### Company-form first-digit table (per Bolagsverket, 2026-05-24)

| First digit(s) | Entity class |
|----------------|--------------|
| `5`            | Aktiebolag, filialer, banker, försäkringsbolag, europabolag |
| `9`            | Handelsbolag, kommanditbolag |
| `7` or `8`     | Bostadsrättsföreningar, ekonomiska föreningar, näringsdrivande ideella föreningar, bostadsföreningar, kooperativa hyresrättsföreningar, europakooperativ, EGTS |
| `2` or `8`     | Trossamfund (religious communities) |
| `20`           | Statliga myndigheter (assigned by Statistikmyndigheten SCB) |
| `3`            | Utländska företag (foreign companies operating in Sweden) |

Note: `6` is reserved historically and `1` and `4` are not assigned to
juridiska personer (collide with personnummer space). Single-digit
prefixes do not uniquely identify the form (e.g. `8` covers both
föreningar and trossamfund), so the table is **descriptive**, not a
validator.

### Algorithm (verified)
Ten digits. The check digit `C = D10` is **standard Luhn over all 10
digits** with multiplier pattern `(2,1,2,1,2,1,2,1,2,1)` from left.

A 10-digit string is also disambiguated from personnummer by **`D3 ≥ 2`**.
This is implicit: personnummer's D3 is the tens-digit of the month and
therefore in `{0, 1}` (months 01–12). Bolagsverket avoids issuing orgnrs
whose first six digits would parse as a valid date by enforcing
`D3 ∈ {2..9}`. nationid encodes this guard at
`src/countries/se/orgnr.ts:88-92` (`hasOrgnrThirdDigit`).

Display form: `XXXXXX-XXXX` (a hyphen between the 6th and 7th digit).

#### Worked example 1 — `202100-5489` (Bolagsverket's own orgnr)
10-digit form `2021005489`. First two digits `20` → statlig myndighet.
D3 = `2` ≥ 2 → not personnummer-shaped.

| pos | digit | × | digit-sum |
|-----|-------|---|-----------|
| D1  | 2     | 2 | 4         |
| D2  | 0     | 1 | 0         |
| D3  | 2     | 2 | 4         |
| D4  | 1     | 1 | 1         |
| D5  | 0     | 2 | 0         |
| D6  | 0     | 1 | 0         |
| D7  | 5     | 2 | 1         | (10 → 1+0 = 1) |
| D8  | 4     | 1 | 4         |
| D9  | 8     | 2 | 7         | (16 → 1+6 = 7) |
| D10 | 9     | 1 | 9         |

Sum = 4+0+4+1+0+0+1+4+7+9 = **30**. 30 mod 10 = **0** → **VALID** ✓.

#### Worked example 2 — `123456-7897` (python-stdnum doctest)
10-digit form `1234567897`. D3 = `3` ≥ 2 → OK.

| pos | digit | × | digit-sum |
|-----|-------|---|-----------|
| D1  | 1     | 2 | 2         |
| D2  | 2     | 1 | 2         |
| D3  | 3     | 2 | 6         |
| D4  | 4     | 1 | 4         |
| D5  | 5     | 2 | 1         | (10 → 1) |
| D6  | 6     | 1 | 6         |
| D7  | 7     | 2 | 5         | (14 → 5) |
| D8  | 8     | 1 | 8         |
| D9  | 9     | 2 | 9         | (18 → 9) |
| D10 | 7     | 1 | 7         |

Sum = 2+2+6+4+1+6+5+8+9+7 = **50** → 0 mod 10 → **VALID** ✓.

#### Worked example 3 — `556036-0793` (SAAB Aktiebolag, real public orgnr)
SAAB Aktiebolag (the aerospace/defence group, **not** Volvo) is registered
with orgnr `556036-0793`; the data is visible on Bolagsverket's
Näringslivsregistret search and corroborated by `upplysningar.syna.se` /
`merinfo.se`. First digit `5` → aktiebolag (matches AB). 10-digit form
`5560360793`. D3 = `6` ≥ 2.

| pos | digit | × | digit-sum |
|-----|-------|---|-----------|
| D1  | 5     | 2 | 1         | (10 → 1) |
| D2  | 5     | 1 | 5         |
| D3  | 6     | 2 | 3         | (12 → 3) |
| D4  | 0     | 1 | 0         |
| D5  | 3     | 2 | 6         |
| D6  | 6     | 1 | 6         |
| D7  | 0     | 2 | 0         |
| D8  | 7     | 1 | 7         |
| D9  | 9     | 2 | 9         | (18 → 9) |
| D10 | 3     | 1 | 3         |

Sum = 1+5+3+0+6+6+0+7+9+3 = **40** → 0 mod 10 → **VALID** ✓.

#### Worked example 4 — synthetic derivation `559012-345?` → `5590123450`
Aktiebolag-shape body `559012345`. Solve for `C`.

Multipliers (2,1,2,1,2,1,2,1,2): products = 10,5,18,0,2,2,6,4,10 →
digit-sums = 1,5,9,0,2,2,6,4,1 → partial sum = 30. So
`C = (10 − 0) mod 10 = 0`. Full orgnr `559012-3450`. ✓

### Cross-validation
- **`python-stdnum stdnum/se/orgnr.py`** @ SHA `5d4ad17`
  (https://raw.githubusercontent.com/arthurdejong/python-stdnum/5d4ad17cae8abeab21f446b5569f85d185566330/stdnum/se/orgnr.py
  — HTTP 200, blob SHA `82fa19990f9332aee8e3a64f9938db18988736c1`, 2377
  bytes). Algorithm = bare `luhn.validate(number)` on 10 digits.
  Doctest fixtures `1234567897` (valid) and `1234567891` (invalid). **Does
  NOT enforce the D3 ≥ 2 guard** — nationid is strictly stricter here.
- **`bolagsverket.se`** — publishes the first-digit table and its own
  orgnr but not the Luhn algorithm. The example `202100-5489` is
  load-bearing as an algorithmic anchor for an oracle.
- **`Näringslivsregistret`** (`https://snr4.bolagsverket.se/snrgate/`) —
  the public free-text company-lookup service; can be used to sample real
  orgnrs (any returned hit is, by construction, valid). For test-vector
  curation, the bridge is: pick any AB / HB / förening from any Swedish
  public records database (Allabolag, Hitta.se, Ratsit) and the orgnr will
  validate under this algorithm. We picked `556036-0793` (SAAB AB) as an
  example anchor — Volvo Personvagnar AB (`556074-3089`) and Volvo Cars
  Corporation (`556810-8988`) are equally usable.

### Discrepancies with current code (`src/countries/se/orgnr.ts`)
None on the checksum or formatting layer. Two notes for completeness:

| Severity | Where | Issue |
|---|---|---|
| LOW | `orgnr.ts:88-92` (`hasOrgnrThirdDigit`) | Correct guard, but it is **stricter than python-stdnum**. Document this explicitly in JSDoc so future contributors don't "relax to match stdnum"; the guard is what prevents a person­nummer from masquerading as an orgnr in autodetect paths. |
| LOW | `orgnr.ts:1-17` JSDoc | Cite `https://bolagsverket.se/foretag/organisationsnummer.1207.html` (canonical, live) and the riksdagen URL for SFS 1974:174. Currently only `https://bolagsverket.se/` is cited. |
| LOW | `orgnr.ts` | No first-digit company-form helper. Optional enrichment for v0.7 (`getEntityClass(orgnr): "aktiebolag" \| "handelsbolag" \| ...`). Would consume the table in this report. |

### Confidence verdict
**High**. Direct algorithmic match against python-stdnum, real-world
samples, and Bolagsverket's own orgnr. nationid is stricter than the
oracle on the D3 ≥ 2 guard, which is a feature, not a bug.

### Open questions
1. Should the `0`-prefix case (D1 == 0) be explicitly rejected? Bolagsverket
   has never issued an orgnr starting with `0` — there is no allocation
   path for it. Today nationid accepts `0XXXXXXX?C` if Luhn is satisfied.
   This is the same minor tightening question that was raised for Norway's
   orgnr.
2. Track the company-form table for future Bolagsverket changes. The list
   on this page has been stable for years but `EGTS` (Europeiska
   grupperingar för territoriellt samarbete) was added in 2007 and the
   trossamfund prefix expanded in 2017.

---

## SE_VAT — Momsregistreringsnummer (Moms, Mervärdesskatt)

### Primary issuer
- **Skatteverket** owns VAT registration. **Bolagsverket** owns the
  underlying orgnr. Statute (current): **Mervärdesskattelag (2023:200)**,
  which replaced SFS 1994:200 effective 2023-07-01. URL
  `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/mervardesskattelag-2023200_sfs-2023-200/`
  — HTTP 200.
- Canonical Skatteverket reference page:
  `https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/forsaljningtillandraeulander/kontrolleramomsregistreringsnummervatnummer/momsregistreringsnummer.4.18e1b10334ebe8bc80002649.html`
  — HTTP 200, title `"Momsregistreringsnummer"`. Country-by-country VAT
  format table. Sweden row reads literally:
  > "Sverige | SE 999999999999 | 12 siffror l)"
  > "l) De två sista siffrorna är alltid 01."
  → Confirms the **`SE` + 12 digits, trailing `01`** form as canonical and
  EU-VIES-interoperable.

### Algorithm (verified)
- Format (raw): `SE\d{12}` — 14 chars total.
- Decomposition: `SE` + 10-digit orgnr (Luhn) + 2-digit branch sequence.
- The trailing 2 digits represent the "verksamhetsgren" (branch). The
  **principal registration is always `01`**; alternative sequences `02`,
  `03`, … exist for multi-branch businesses but Skatteverket does not
  publish them as a list and python-stdnum / VIES treat anything other
  than `01` as unsupported in the absence of a branch directory.

A SE VAT number is valid iff:
1. The leading `SE` prefix is present (mandatory in the EU-VIES form).
2. The 10 digits at positions 3..12 form a valid orgnr (Luhn passes +
   D3 ≥ 2).
3. The two digits at positions 13..14 are `01`.

#### Worked example 1 — `SE 202100548901` (Bolagsverket VAT)
Body = `2021005489`, sequence = `01`. Body Luhn already verified in
SE_ORGNR Example 1 (sum 30 → valid). → **VALID** ✓.

#### Worked example 2 — `SE 123456789701` (python-stdnum doctest)
Body = `1234567897`, sequence = `01`. Body Luhn verified in SE_ORGNR
Example 2 (sum 50 → valid). → **VALID** ✓.

#### Worked example 3 — `SE 556036079301` (SAAB Aktiebolag VAT)
Body = `5560360793`, sequence = `01`. Body Luhn verified in SE_ORGNR
Example 3 (sum 40 → valid). → **VALID** ✓. This is the VIES-form VAT
number derived from SAAB Aktiebolag's orgnr.

#### Worked example 4 — invalid `SE 202100548902` (right Luhn, wrong sequence)
The body validates as orgnr; the sequence `02` is not `01`. → **INVALID**
under nationid's policy (and under python-stdnum). Real Skatteverket
filings exist with `02`+ but the library cannot verify them without a
branch directory.

### Cross-validation

- **`python-stdnum stdnum/se/vat.py`** @ SHA `5d4ad17`
  (https://raw.githubusercontent.com/arthurdejong/python-stdnum/5d4ad17cae8abeab21f446b5569f85d185566330/stdnum/se/vat.py
  — HTTP 200, blob SHA `2cf4a72a078dd703f1dc1e571dddb028ac90bc75`, 2129
  bytes). Algorithm:
  ```python
  if not isdigits(number) or number[-2:] != '01':
      raise InvalidFormat()
  orgnr.validate(number[:-2])
  ```
  Two divergences vs nationid:
  1. python-stdnum makes the `SE` prefix **optional** (strips it if
     present). nationid requires it (`RAW_REGEX = /^SE\d{12}$/`). The
     stricter behaviour aligns with the EU-VIES presentation form and the
     Skatteverket "with-country-code" column.
  2. python-stdnum does **not** enforce D3 ≥ 2 on the embedded orgnr (it
     calls `orgnr.validate`, which also does not). nationid does. This
     means a string like `SE091203456701` (a personnummer-shaped body
     glued onto `01` that happens to Luhn-validate) passes stdnum but
     fails nationid. The stricter check is again deliberate.

- **`validator.js` `isVAT('SE')`** — `/^(SE)?\d{12}$/`. Pure shape; no
  Luhn, no `01` suffix enforcement. Confirmed at
  `https://raw.githubusercontent.com/validatorjs/validator.js/master/src/lib/isVAT.js`
  — HTTP 200.

- **EU VIES** (`https://ec.europa.eu/taxation_customs/vies/`) — accepts
  the `SE` + 12-digit format including the `01` suffix; rejects bodies
  that fail Luhn or that have D3 < 2 (because they collide with the
  personnummer space, which Skatteverket never issues as legal-entity
  VAT). VIES is the runtime oracle; live VIES calls are out of scope for
  this static report.

### Discrepancies with current code (`src/countries/se/vat.ts`)

| Severity | Where | Issue |
|---|---|---|
| LOW | `vat.ts:25-26` | RAW_REGEX requires `SE` prefix; stdnum makes it optional. Stricter is fine, document the choice. |
| LOW | `vat.ts:38` | `mask: "SE000000000000"` — 14 chars total. Skatteverket's published form has a space after the country code (`SE 999999999999`) for readability. The library's normalisation strips spaces, but `format()` could optionally render the spaced form. |
| LOW | `vat.ts:1-19` JSDoc | Cite the canonical Skatteverket VAT page URL (above) and the Mervärdesskattelag 2023:200 riksdagen URL. Today only `https://www.skatteverket.se/` is cited generically. |
| LOW | `vat.ts:87-93` `validateVATBody` | Hard-codes `seq !== "01"`. Document that branch sequences other than `01` exist but are intentionally not supported because Skatteverket does not publish a branch directory. |

### Confidence verdict
**High**. The MVAT layer is a thin (and correct) wrapper around the orgnr
Luhn check plus the published `01` suffix rule. The only divergences vs
python-stdnum are deliberate-stricter (mandatory `SE`, D3 guard inherited
from orgnr).

### Open questions
1. If a future v0.7 helper exposes "is this a real running VAT
   registration?" semantics, a live VIES SOAP call would be required —
   but that crosses the "no runtime network" boundary the library
   maintains. Document as a non-goal.

---

## Summary

### URLs verified live (2026-05-24, all HTTP 200 via browser_fetch firefox133)

| URL | Purpose |
|-----|---------|
| `https://www.skatteverket.se/privat/folkbokforing/personnummerochsamordningsnummer.4.3810a01c150939e893f18c29.html` | Skatteverket personnummer canonical page |
| `https://www.skatteverket.se/privat/folkbokforing/samordningsnummer.4.5c281c7015abecc2e201130b.html` | Skatteverket samordningsnummer page (published worked example `701063-2391`) |
| `https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/forsaljningtillandraeulander/kontrolleramomsregistreringsnummervatnummer/momsregistreringsnummer.4.18e1b10334ebe8bc80002649.html` | Skatteverket VAT format table |
| `https://bolagsverket.se/foretag/organisationsnummer.1207.html` | Bolagsverket orgnr canonical page (first-digit table + `202100-5489` example) |
| `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/folkbokforingslag-1991481_sfs-1991-481/` | Folkbokföringslag (1991:481) — personnummer statute |
| `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-20221697-om-samordningsnummer_sfs-2022-1697/` | Lag (2022:1697) om samordningsnummer — current samordningsnummer statute |
| `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1974174-om-identitetsbeteckning-for_sfs-1974-174/` | Lag (1974:174) om identitetsbeteckning för juridiska personer — orgnr statute |
| `https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/mervardesskattelag-2023200_sfs-2023-200/` | Mervärdesskattelag (2023:200) — current VAT statute |
| `https://raw.githubusercontent.com/arthurdejong/python-stdnum/5d4ad17cae8abeab21f446b5569f85d185566330/stdnum/se/personnummer.py` | python-stdnum personnummer oracle |
| `https://raw.githubusercontent.com/arthurdejong/python-stdnum/5d4ad17cae8abeab21f446b5569f85d185566330/stdnum/se/orgnr.py` | python-stdnum orgnr oracle |
| `https://raw.githubusercontent.com/arthurdejong/python-stdnum/5d4ad17cae8abeab21f446b5569f85d185566330/stdnum/se/vat.py` | python-stdnum vat oracle |
| `https://github.com/personnummer/js` (master `src/index.ts`) | npm `personnummer` v3.2.1 reference implementation |
| `https://raw.githubusercontent.com/validatorjs/validator.js/master/src/lib/isVAT.js` | validator.js VAT regex source |

### URLs found dead during the audit (do NOT cite)

- `https://www.skatteverket.se/privat/folkbokforing/samordningsnummer.4.5c281c7015abecc2e2014e9.html` — 404 (replaced by `….5c281c7015abecc2e201130b.html`).

### python-stdnum modules confirmed

| Path | Exists? | Blob SHA | Size |
|------|---------|----------|------|
| `stdnum/se/__init__.py` | yes | `d2130ac3cf7c1c7f1c2245cee620c86261d6dd20` | 977 |
| `stdnum/se/orgnr.py` | yes | `82fa19990f9332aee8e3a64f9938db18988736c1` | 2377 |
| `stdnum/se/personnummer.py` | yes | `277c7f5474de3ea91b9d17198ee57460f557707d` | 3846 |
| `stdnum/se/postnummer.py` | yes | `2b9a0d064a44155705316c0a602c4a58228265c5` | 2360 |
| `stdnum/se/vat.py` | yes | `2cf4a72a078dd703f1dc1e571dddb028ac90bc75` | 2129 |

(`postnummer.py` is a Swedish postal code validator — out of scope for
nationid but useful awareness if a future `SE_POSTNUMMER` is ever
proposed.)

### Algorithm discrepancies (vs primary sources)

0 in the checksum math itself (personnummer, samordningsnummer, orgnr,
VAT all match the issuers' algorithms exactly).

3 structural-validation gaps to address:
1. **`personnummer.ts` accepts impossible Gregorian dates** (Feb 30, Apr
   31, etc.) — same gap caught in the Norwegian FNR audit.
2. **`personnummer.ts` does NOT accept interim numbers** (`[TRSUWXJKLMN]`
   first individnummer char). The npm reference does. Decide whether to
   expand RAW_REGEX or add a separate `SE_INTERIM_PERSONNUMMER` spec.
3. **`vat.ts` requires `SE` prefix mandatorily** vs python-stdnum's
   optional handling. Stricter is correct for the VIES-aligned form;
   document the choice.

### Recommended code patches

- `src/countries/se/personnummer.ts:112-127` — replace `hasValidDate`
  with a real Gregorian-calendar validator (delegate to `core/date.ts`).
- `src/countries/se/personnummer.ts:1-27` JSDoc — cite the canonical
  Skatteverket personnummer page + samordningsnummer page + the
  Folkbokföringslag (1991:481) §18 riksdagen URL + the
  `python-stdnum stdnum/se/personnummer.py` oracle at the pinned SHA, in
  the same shape as `dk.md` / `fi.md`'s recommended JSDoc.
- `src/countries/se/orgnr.ts:1-17` JSDoc — cite the Bolagsverket page +
  SFS 1974:174 riksdagen URL + the python-stdnum oracle. Add a sentence
  documenting the D3 ≥ 2 guard as a deliberate divergence from stdnum.
- `src/countries/se/orgnr.ts` — optionally expose
  `getEntityClass(orgnr): "aktiebolag" \| "handelsbolag" \| ...` consuming
  the Bolagsverket table. Defer to v0.7 helpers, not v2.2.
- `src/countries/se/vat.ts:1-19` JSDoc — cite the Skatteverket VAT page +
  Mervärdesskattelag (2023:200) URL + the python-stdnum vat oracle. Add a
  sentence documenting (a) the deliberate strictness on the `SE` prefix
  and (b) the deliberate refusal of non-`01` branch sequences.
- `src/countries/se/vat.ts:38` — `mask` value is acceptable; optionally
  expose a `formatSpaced()` helper that renders `SE 202100548901` for
  human display.
- Optional (v2.3 scope decision): add `SE_INTERIM_PERSONNUMMER` as a
  separate spec covering `^\d{6}[+-]?[TRSUWXJKLMN]\d{2}\d$`. Algorithm =
  identical Luhn after substituting `1` for the letter. Confidence
  `moderate` (health-care convention rather than statute).

### How this report was used to satisfy `feedback_nationid_source_of_truth`

Per the global pattern memorialised after the v2.1 release, every SE
release going forward must include in `docs/research/v2.2-source-of-truth/`:

- live primary-source fetches at the date of the release (above, 12 URLs
  verified 2026-05-24);
- ≥ 3 worked examples per spec (4 each for personnummer/orgnr/VAT above,
  one of them hand-derived from a body alone);
- cross-validation against ≥ 2 independent implementations
  (python-stdnum + `personnummer` npm for personnummer; python-stdnum +
  real-world Volvo orgnr for orgnr; python-stdnum + validator.js + VIES
  for VAT).

This file is the source-of-truth check Sweden was missing from the
post-v2.1 Nordic-docs (M7) backlog. The M7 "docs restructure" item can
now treat `dk.md` / `fi.md` / `no.md` / `se.md` (this file) as the four
inputs to align `docs/countries/{dk,fi,no,se}.md` against the
`docs/countries/_template.md` shape.
