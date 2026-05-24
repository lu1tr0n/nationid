# EU-VAT batch (16+1) — research for nationid v1.7

> Target version: `nationid@1.7.0` ("EU-VAT complete")
> Author: research-agent · Date: 2026-05-24
> Scope: 16 EU member states not yet shipped, all participating in EU VIES,
> plus an EEA bonus section for IS (Iceland VSK, not in VIES).
> Already shipped (do not duplicate): GB, FR, DE, IT, NL, BE, PL, SE, DK, FI, ES, PT.
>
> **Goal**: complete EU-27 VIES coverage as a single named release. Each spec
> in this batch ships as `<CC>_VAT` (or the equivalent national code where the
> national code is universally used — e.g., `AT_UID`, `LU_TVA`, `GR_AFM`,
> `CZ_DIC`, `RO_CF`, `HR_OIB`, `SK_DPH`, `SI_DDV`, `LT_PVM`, `LV_PVN`,
> `EE_KMKR`, `MT_VAT`, `CY_VAT`, `HU_ANUM`, `BG_VAT`, `IE_VAT`).

---

## 1. EU VIES cross-validation primer

The **VAT Information Exchange System (VIES)** is the European Commission
service at <https://ec.europa.eu/taxation_customs/vies/> that lets any party
verify a VAT identification number issued by an EU member state by querying
the issuing member state's tax administration in real time. The service was
codified by Council Regulation (EU) No 904/2010 on administrative
cooperation and combating fraud in the field of value added tax (article 31),
and by the predecessor regulation 1798/2003. Council Directive 2006/112/EC
("VAT Directive") article 214 obliges member states to maintain an
electronic register and to expose it through VIES.

**What VIES does**: receives a `(member state code, VAT number)` tuple,
forwards the query to the member state's national tax authority, and replies
with `valid` / `invalid`. When `valid`, the trader's name and address may
also be returned if the member state opted to publish them.

**What VIES does NOT do**:

1. **It does not perform checksum validation by itself.** VIES is a
   directory lookup against the national tax authority's live registry.
   A VAT number can be algorithmically well-formed and still fail VIES
   because it was never issued, was deregistered, or is paused for fraud
   review. Conversely, in periods of national downtime, VIES returns
   `MS_UNAVAILABLE` even for a perfectly valid number.
2. **It does not standardise per-country format.** Every member state retains
   its own format, alphabet, length and check-digit algorithm. The only
   convention VIES imposes is the 2-letter member-state prefix
   (ISO 3166-1 alpha-2) — with **Greece using `EL` instead of `GR`** as
   a historical artefact, and **Northern Ireland using `XI` post-Brexit**
   while Great Britain remains `GB` (and `GB` is no longer in VIES at all
   except for NI traders).
3. **It is not designed for bulk validation.** The EU explicitly forbids
   automated scraping; the throttling threshold for the SOAP/REST endpoint
   is documented at <https://ec.europa.eu/taxation_customs/vies/#/technical-information>.

**This library's positioning vs VIES**: `nationid` is an *offline,
deterministic* validator. We replicate each member state's **published
check-digit algorithm** so that a number with a malformed checksum can be
rejected before any network call. The library does NOT prove the VAT number
exists or is currently active — that is what VIES is for. Documentation in
the spec headers and the README must make this distinction explicit (see
the existing NL `btw.ts` for the canonical wording).

References:

- VIES landing: <https://ec.europa.eu/taxation_customs/vies/>
- VIES technical info / SOAP WSDL: <https://ec.europa.eu/taxation_customs/vies/#/technical-information>
- Council Regulation (EU) No 904/2010: <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32010R0904>
- VAT Directive 2006/112/EC art. 214: <https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32006L0112>

**Confidence: high.** EU primary law and the VIES portal are canonical.

---

## 2. Per-country sections

Convention used in every section below:

- **Issuer / statute / URL** — first-party citation that satisfies the
  governance test in `tests/governance/confidence-citations.test.ts`.
- **Format** — raw regex used by `rawRegex` and the displayed mask.
- **Algorithm** — prose + pseudocode for the check digit; named ISO/IEC 7064
  variant when applicable.
- **Confidence** — `high` / `moderate` / `low`, with justification.
- **Sources** — at minimum: (a) first-party tax authority URL, (b) python-stdnum
  module, (c) VIES.
- **Synthetic test vectors** — at least 5 valid + 3 invalid, **all hand-derived
  via the documented algorithm**. The verification agent must be able to
  re-derive every digit using only the algorithm in this document.

All Python source quoted below is from `arthurdejong/python-stdnum` master
branch (commit accessed 2026-05-24); the module path is given for each
section. Directory listing of the parent package was confirmed via
<https://api.github.com/repos/arthurdejong/python-stdnum/contents/stdnum/>
before each module was cited.

---

### 2.1 Ireland — IE_VAT

**Issuer**: Office of the Revenue Commissioners (Revenue).
**Statute**: Value-Added Tax Consolidation Act 2010, s. 65.
**First-party URLs**:

- <https://www.revenue.ie/en/vat/index.aspx>
- <https://www.revenue.ie/en/vat/registration-for-vat/index.aspx>
- <https://www.revenue.ie/en/tax-professionals/tdm/value-added-tax/part-02-accountable-persons/02-09-vat-identification-numbers.pdf>

(NB Revenue's TLD is `.ie` and the institution is part of the Irish state;
`revenue.ie` will need to be added to `ISSUER_ALLOWLIST_DOMAINS` in the
governance test — see section 3.4. Alternatively the file header may add a
`gov.ie` companion URL such as
<https://www.gov.ie/en/organisation/office-of-the-revenue-commissioners/>.)

**python-stdnum module**: `stdnum/ie/vat.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/ie/vat.py>

**VIES check**: <https://ec.europa.eu/taxation_customs/vies/#/vat-validation>
(prefix `IE`).

**Format**: 8 or 9 characters after the `IE` prefix. Three legacy variants
co-exist in production data:

1. **Pre-2013 "new" format** — 7 digits + 1 letter (8 chars).
2. **Post-2013 "new" format** — 7 digits + 2 letters (9 chars). The 9th
   letter was originally `W` for joint registrations of married couples;
   since 2013 it is also used as a generic registration suffix.
3. **Old (legacy) format** — 1 digit, 1 letter/symbol (`+` or `*`), 5 digits,
   1 letter (8 chars). Revenue stopped issuing these in 1992, but they are
   still active for businesses that never re-registered.

Raw regex (normalised, prefix optional, accept all three forms):

```
/^IE(?:(?:\d{7}[A-W])|(?:\d{7}[A-W][AW])|(?:\d[A-Z+*]\d{5}[A-W]))$/
```

(The check letter is drawn from `WABCDEFGHIJKLMNOPQRSTUV`. Note `W` is
position 0 in that alphabet — see the algorithm below.)

**Algorithm** — mod-23 letter check, alphabet
`WABCDEFGHIJKLMNOPQRSTUV` (W = 0, A = 1, …, V = 22):

For the **new format** (7 digits + check letter, optionally + suffix):

```
n = digits[0..6]                          # the 7 body digits
s = sum((8 - i) * int(n[i]) for i in 0..6)
if there is a 9th char (suffix letter L):
    s += 9 * alphabet.index(L)
check = alphabet[s mod 23]
```

For the **old format** (1 digit + 1 letter/symbol + 5 digits + check letter):
re-arrange as `'0' + digits[2..6] + digits[0]` (7-digit body where the second
char is dropped and the original first digit moves to position 7), then
apply the same `sum((8-i)*int(d_i))` formula and look up
`alphabet[sum mod 23]`.

**Confidence: high.** Revenue publishes the algorithm in TDM 02-09-VAT
(linked above). python-stdnum reproduces it verbatim. Two community libs
agree: `pl-vat` (npm) `node-vat-id` and `validator.js isVAT('en-IE')`.

**Synthetic vectors** (all derived via the algorithm above, new-format
7-digit + 1 letter):

| Body 7 digits | sum(8-i)·d_i | mod 23 | check letter | Full VAT |
|---|---|---|---|---|
| 1234567 | 8·1+7·2+6·3+5·4+4·5+3·6+2·7 = 112 | 112 mod 23 = 20 | T | `IE1234567T` |
| 3628739 | 8·3+7·6+6·2+5·8+4·7+3·3+2·9 = 173 | 173 mod 23 = 12 | L | `IE3628739L` |
| 7654321 | 8·7+7·6+6·5+5·4+4·3+3·2+2·1 = 168 | 168 mod 23 = 7  | G | `IE7654321G` |
| 0000001 | 8·0+7·0+6·0+5·0+4·0+3·0+2·1 = 2   | 2  mod 23 = 2  | B | `IE0000001B` |
| 9999999 | (8+7+6+5+4+3+2)·9 = 315 | 315 mod 23 = 16 | P | `IE9999999P` |

Invalid (mark each clearly):

- Wrong format: `IE12345` — too short (8/9 expected). Reason: `too_short`.
- Wrong format: `IE12345Z9` — letter in middle of 8-char form. Reason:
  `invalid_format`.
- Wrong checksum: `IE1234567A` — should be `T`. Reason: `invalid_checksum`.
- Wrong format (symbol-letter old form malformed): `IE8?79739J` — `?` not
  in `[A-Z+*]`. Reason: `invalid_format`.

**Reforms / quirks**:

- 2013 reform extends 8-char → 9-char form. Validator MUST accept both.
- Old-format `+` / `*` numbers (pre-1992) still active. Do NOT auto-convert
  in `format()` — preserve input (mirror `gb/vat.ts` pattern).
- `XI` (Northern Ireland) is NOT an Irish VAT number — see §5 risk #2.

---

### 2.2 Austria — AT_UID

**Issuer**: Bundesministerium für Finanzen (BMF) via the Finanzamt
Österreich.
**Statute**: Umsatzsteuergesetz 1994 (UStG), §28 Z 1.
**First-party URLs**:

- <https://www.bmf.gv.at/services/uid-ust-id-nr.html>
- <https://www.usp.gv.at/en/steuern-finanzen/umsatzsteuer/uid-nummer.html>
- <https://finanzonline.bmf.gv.at>

(`bmf.gv.at` and `usp.gv.at` already match the governance test's
`gov.<cc>` regex via `gv.at` ≈ `gov.at` — wait, **no**: `gv.at` is NOT
`gov.at`. The Austrian government TLD is **`.gv.at`** (e.g. `bmf.gv.at`).
The current governance regex `/(?:^|\.)gov\.[a-z]{2,3}$/i` does NOT
match `bmf.gv.at`. **Action required**: extend the suffix regex with
`/(?:^|\.)gv\.at$/i` (see section 3.4).)

**python-stdnum module**: `stdnum/at/uid.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/at/uid.py>

**Format**: `ATU` + 8 digits. The literal `U` is **part of the number**, not
the country prefix; pure-numeric `12345678` should NOT round-trip as
`ATU12345678` without the literal U. Displayed `ATU 1234 5627`.

Raw regex: `/^ATU\d{8}$/`.

**Algorithm**: modified Luhn over the first 7 digits.

`check_digit = (6 - luhn_checksum(body7)) mod 10`

where `luhn_checksum` is the standard Luhn weighting (right-to-left,
alternate ×1 ×2, subtract 9 if doubled value > 9), applied to the 7-digit
body that follows the `U`. The 8th digit is the check digit.

Pseudocode:

```
luhn_sum(s):
    total = 0
    for i, c in enumerate(reverse(s)):
        d = int(c)
        if i is odd: d = d*2; if d > 9: d -= 9
        total += d
    return total mod 10

check = (6 - luhn_sum(body7)) mod 10
```

**Confidence: high.** BMF publishes the algorithm in the USt-Richtlinien
2000, Rz 2581. python-stdnum reproduces. Reproduced by `validator.js
isVAT('AT')` and `node-vat-validator`.

**Synthetic vectors** (computed via above):

- `ATU 1358562` → luhn_sum = 0 → (6-0)%10 = 6 → check 7? Let's recompute
  rigorously: digits reversed = `2,6,5,8,5,3,1`. Positions 0..6:
  `2·1 + 6·2(=12→3) + 5·1 + 8·2(=16→7) + 5·1 + 3·2 + 1·1
   = 2+3+5+7+5+6+1 = 29`. `29 mod 10 = 9`. `(6 - 9) mod 10 = 7`.
  Result: `ATU13585627` ✓ (matches python-stdnum doctest).
- `ATU23456784` (body `2345678`, computed check 4).
- `ATU90000007` (body `9000000`, check 7).
- `ATU10000014` (body `1000001`, check 4).
- `ATU76543215` (body `7654321`, check 5).

Invalid:

- Wrong format: `AT12345678` (missing literal `U`). Reason: `invalid_format`.
- Wrong format: `ATU1234567` (only 7 digits after U). Reason: `too_short`.
- Wrong checksum: `ATU13585626` — should end in 7. Reason: `invalid_checksum`.

**Reforms / quirks**: the literal `U` after `AT` is not optional. Always
normalise to include it: 8 raw digits → prepend `ATU`; `AT12345678` →
prepend the `U`. python-stdnum strips it during `compact()` but we keep
it in the normalised form.

---

### 2.3 Luxembourg — LU_TVA

**Issuer**: Administration de l'Enregistrement, des Domaines et de la TVA (AED).
**Statute**: Loi du 12 février 1979 concernant la TVA (modifiée).
**First-party URLs**:

- <https://pfi.public.lu/fr/entreprises/fiscalite-entreprise/tva.html>
  (Portail des Finances de l'État luxembourgeois)
- <https://guichet.public.lu/en/entreprises/fiscalite/tva.html>

The `public.lu` TLD is the official Grand Ducal portal. **Action required**:
add `public.lu` and `pfi.public.lu` to `ISSUER_ALLOWLIST_DOMAINS`.

**python-stdnum module**: `stdnum/lu/tva.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/lu/tva.py>

**Format**: `LU` + 8 digits. Last 2 digits are check digits.

Raw regex: `/^LU\d{8}$/`. Displayed `LU 150 274 42`.

**Algorithm**: `check2 = body6 mod 89`, zero-padded to 2 digits.

```
body6 = digits[0..5]
check = (int(body6) mod 89) as 2-digit string
```

**Confidence: high.** Algorithm appears in AED Circular n° 770 (1997) and is
reproduced by python-stdnum. `validator.js isVAT('LU')` agrees.

**Synthetic vectors**:

| body6 | body6 mod 89 | check | Full VAT |
|---|---|---|---|
| 150274 | 150274 mod 89 = 42 | `42` | `LU15027442` |
| 100000 | 100000 mod 89 = 53 | `53` | `LU10000053` |
| 200000 | 200000 mod 89 = 17 | `17` | `LU20000017` |
| 999999 | 999999 mod 89 = 84 | `84` | `LU99999984` |
| 135790 | 135790 mod 89 = 65 | `65` | `LU13579065` |

Invalid:

- Wrong format: `LU1234567` (7 digits). Reason: `too_short`.
- Wrong format: `LU1502744A`. Reason: `invalid_format`.
- Wrong checksum: `LU15027443`. Reason: `invalid_checksum`.

**Reforms / quirks**: AED issues numbers from a contiguous range
(historically `LU10000017+`). Do NOT enforce a minimum value — registry
state is VIES's job, not the validator's.

---

### 2.4 Greece — GR_AFM (VIES prefix EL)

**Issuer**: Independent Authority for Public Revenue (Ανεξάρτητη Αρχή
Δημοσίων Εσόδων, AADE).
**Statute**: Νόμος 1642/1986 (introduced AFM), as harmonised with EU VAT
under Νόμος 2859/2000 (current VAT Code, Κώδικας ΦΠΑ).
**First-party URLs**:

- <https://www.aade.gr> (AADE main portal)
- <https://www.aade.gr/polites/afm> (citizen-facing AFM page)
- <https://www.gsis.gr> (Γενική Γραμματεία Πληροφοριακών Συστημάτων)

`aade.gr` and `gsis.gr` are AADE-operated. Both end in `.gr` (not
`.gov.gr`). **Action required**: add `aade.gr` and `gsis.gr` (and `gr/gov.gr`
suffix) to `ISSUER_ALLOWLIST_DOMAINS`. There IS a `.gov.gr` Greek domain
(see <https://www.gov.gr>) but AADE doesn't sit on it.

**python-stdnum module**: `stdnum/gr/vat.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/gr/vat.py>

**Format**: 9 digits total. The first digit may be `0` (zero-padded from the
older 8-digit form — every 8-digit historical AFM is padded with a leading
`0` to become 9). For VIES the country prefix is **`EL`**, not `GR` —
this is the single most-replicated bug in EU-VAT libraries.

Raw regex (with EL prefix): `/^EL\d{9}$/`. Also accept `GR` prefix on input
and normalise to `EL` (matches python-stdnum's `compact()` which strips
both).

**Algorithm**: weighted iterative checksum over the first 8 digits.

```
sum = 0
for d in digits[0..7]:
    sum = sum * 2 + int(d)
check = (sum * 2) mod 11 mod 10
```

The double `% 11 % 10` collapses the `10` case to `0`.

**Confidence: high.** Algorithm published by AADE in Yπουργική Απόφαση
1027411/842/ΔΜ/26.2.1998 and reproduced by python-stdnum.

**Synthetic vectors** (computed via above):

For body `09425921` (8 first digits of 9-digit `094259216`):
- `s = 0`. After d=0: 0. After d=9: 9. After d=4: 22. After d=2: 46.
  After d=5: 97. After d=9: 203. After d=2: 408. After d=1: 817.
- `(817·2) mod 11 = 1634 mod 11 = 6`. `6 mod 10 = 6`. ✓

| body8 | check | Full |
|---|---|---|
| 09425921 | 6 | `EL094259216` |
| 12345678 | 3 | `EL123456783` |
| 00000001 | 2 | `EL000000012` |
| 99999999 | 3 | `EL999999993` |
| 08147029 | 1 | `EL081470291` |

Invalid:

- Wrong format: `EL12345678` (8 digits). Reason: `too_short`.
- Wrong format: `ELABCDEFGHI`. Reason: `invalid_format`.
- Wrong checksum: `EL094259217`. Reason: `invalid_checksum`.

**Reforms / quirks**:

- **`EL` vs `GR` prefix is the #1 historical EU-VAT bug.** ISO 3166 says
  `GR`; VAT Directive art. 215 carves out `EL`. Accept both on input,
  normalise to `EL` on output. README + spec header must call this out.
- 8-digit legacy AFMs were left-padded to 9 in 1999. Pad in `normalize()`
  but require 9 on `validate()` (mirror `nl/btw.ts` pattern).
- The same number (AFM) serves both personal tax and VAT. v1.7 ships
  only the `tax` scope; personal scope can re-use the spec in v1.8.

---

### 2.5 Czechia — CZ_DIC

**Issuer**: Finanční správa České republiky (Czech Financial Administration).
**Statute**: Zákon č. 235/2004 Sb., o dani z přidané hodnoty, §94–95.
**First-party URLs**:

- <https://www.financnisprava.cz/cs/dane/dane/dan-z-pridane-hodnoty>
- <https://adisspr.mfcr.cz/dpr/DphReg> (DIČ registry lookup)

`.financnisprava.cz` is the agency's official domain. `.cz` is not a
gov-suffix; **action required**: add `financnisprava.cz` and `adisspr.mfcr.cz`
to `ISSUER_ALLOWLIST_DOMAINS`.

**python-stdnum module**: `stdnum/cz/dic.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/cz/dic.py>

**Format**: `CZ` + 8, 9, or 10 digits. Three variants:

1. **Legal entity** (8 digits) — corresponds to the IČO (company registration
   number) with its own check digit.
2. **Special natural person** (9 digits starting with `6`) — uncommon.
3. **Individual with RČ** (9 or 10 digits) — the Czech rodné číslo (birth
   number). 9-digit RČs (pre-1954) have no checksum; 10-digit RČs (1954+)
   use `int(body9) mod 11 mod 10` as the check digit.

Raw regex: `/^CZ\d{8,10}$/`.

**Algorithms**:

*8-digit legal entity:*

```
weights = [8,7,6,5,4,3,2]
s = sum(weights[i] * int(body[i]) for i in 0..6)
check_raw = (11 - s) mod 11
check     = (check_raw or 1) mod 10   # if check_raw == 0, use 1
# the literal "or 1" means: if result is 0, replace with 1 BEFORE the mod 10
```

Additionally, **first digit must NOT be `9`** (`InvalidComponent`).

*9-digit special (starts with `6`):*

```
weights = [8,7,6,5,4,3,2]
body = digits[1..7]                      # skip the leading '6' and the check
s = sum(weights[i] * int(body[i])) mod 11
check = (8 - (10 - s) mod 11) mod 10
```

*9 / 10 digit individual (RČ):* the value must validate as a Czech rodné
číslo: date components (YYMMDD with optional +50 month offset for females
and +20 since 2004) must form a valid date, and for 10-digit numbers
`int(body9) mod 11 mod 10 == check_digit`.

**Confidence: high** for the algorithm itself (financnisprava.cz publishes
the IČO check-digit, and Zákon č. 133/2000 Sb., §13 odst. 5 defines the
RČ format and check digit). python-stdnum reproduces all three variants.

**Synthetic vectors** (hand-derived):

Legal 8-digit: `25123891`, `10000003`, `23456710`, `76543200`, `88888886`.

Worked example for body `2512389`:
- weights = [8,7,6,5,4,3,2]
- s = 8·2+7·5+6·1+5·2+4·3+3·8+2·9 = 16+35+6+10+12+24+18 = 121
- (11 - 121) mod 11 = -110 mod 11 = 0 → "or 1" → 1 → mod 10 = 1. ✓
- Full: `CZ25123891`.

Special 9-digit (starts `6`): `640903926`, `612345670`, `600000010`,
`677777771`, `650505059`.

Individual 10-digit (RČ): `8001151235` (male, 1980-01-15, serial 123),
`7562037890` (female, 1975-12-03, serial 789), `9006280019` (male,
1990-06-28, serial 001).

Invalid:

- Wrong format: `CZ1234567` (7 digits). Reason: `too_short`.
- Wrong format: `CZ12345678901` (11 digits). Reason: `too_long`.
- Wrong checksum: `CZ25123890`. Reason: `invalid_checksum`.
- `InvalidComponent`: `CZ91234567` (legal entity, first digit 9). Reason:
  `invalid_format` (we don't have a separate kind for `InvalidComponent`).

**Reforms / quirks**: 9-digit numbers starting `6` → "special natural
person" branch; other 9-digit and all 10-digit → RČ branch. 10-digit RČs
starting year 2000+ use month +20 offset. Highest-complexity spec in the
batch — recommend dedicated `cz/dic.ts` with three helpers + unit-test
matrix.

---

### 2.6 Hungary — HU_ANUM

**Issuer**: Nemzeti Adó- és Vámhivatal (NAV) — National Tax and Customs
Administration.
**Statute**: 2007. évi CXXVII. törvény az általános forgalmi adóról
(VAT Act), §178.
**First-party URLs**:

- <https://nav.gov.hu>
- <https://nav.gov.hu/ado/afa> (VAT section)
- <https://onlineszamla.nav.gov.hu> (real-time invoicing system)

`nav.gov.hu` matches `/(?:^|\.)gov\.[a-z]{2,3}$/` → governance test
**passes without change**.

**python-stdnum module**: `stdnum/hu/anum.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/hu/anum.py>

**Format**: `HU` + 8 digits.

Raw regex: `/^HU\d{8}$/`.

**Algorithm**: weighted mod-10. Weights `[9,7,3,1,9,7,3,1]` over all 8
digits including the check.

```
weights = [9,7,3,1,9,7,3,1]
sum(weights[i] * int(d[i]) for i in 0..7) mod 10 == 0
```

Equivalently, given the 7-digit body, check digit = `(- (9·d0 + 7·d1 +
3·d2 + 1·d3 + 9·d4 + 7·d5 + 3·d6)) mod 10`.

**Confidence: high.** NAV publishes the algorithm; python-stdnum confirms.

**Synthetic vectors**:

| body7 | check (= (-s) mod 10) | Full |
|---|---|---|
| 1289231 | 9·1+7·2+3·8+1·9+9·2+7·3+3·1 = 98 → (-98)%10=2 | `HU12892312` |
| 2345678 | 9·2+7·3+3·4+1·5+9·6+7·7+3·8 = 183 → 7 | `HU23456787` |
| 9876543 | 9·9+7·8+3·7+1·6+9·5+7·4+3·3 = 246 → 4 | `HU98765434` |
| 1111111 | (9+7+3+1+9+7+3)·1 = 39 → 1 | `HU11111111` |
| 5050505 | 9·5+0+3·5+0+9·5+0+3·5 = 120 → 0 | `HU50505050` |

Invalid:

- Wrong format: `HU1234567` (7 digits). Reason: `too_short`.
- Wrong format: `HU1289231A`. Reason: `invalid_format`.
- Wrong checksum: `HU12892313`. Reason: `invalid_checksum`.

**Reforms / quirks**: Hungary distinguishes the 11-digit *adószám*
(`XXXXXXXX-Y-ZZ` with county + VAT-status flag) from the 8-digit
*közösségi adószám* (community VAT). **v1.7 ships only the 8-digit form**;
`HU_ADOSZAM` is a future v1.8 code.

---

### 2.7 Romania — RO_CF / RO_CUI

**Issuer**: Agenția Națională de Administrare Fiscală (ANAF).
**Statute**: Legea nr. 227/2015 privind Codul fiscal, art. 316
(VAT registration); Ordonanța de Urgență nr. 116/2009 (codul de
înregistrare fiscală).
**First-party URLs**:

- <https://www.anaf.ro>
- <https://www.anaf.ro/anaf/internet/ANAF/servicii_online/inregistrare_inreg_fiscala>
- <https://static.anaf.ro/static/10/Anaf/AsistentaContribuabili_r/Codfiscal2015.pdf>

`anaf.ro` is not a `.gov.ro` domain (Romania's gov TLD is `.gov.ro`).
**Action required**: add `anaf.ro` to `ISSUER_ALLOWLIST_DOMAINS`. There is
also <https://www.gov.ro> but ANAF does not redirect there.

**python-stdnum module**: `stdnum/ro/cf.py` (VAT-prefixed wrapper around
`stdnum/ro/cui.py`) —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/ro/cf.py>
and
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/ro/cui.py>

**Format**: `RO` + 2 to 10 digits. The CUI/CIF can be as short as 2 digits.
First digit must not be `0`. A 13-digit input is actually a CNP (personal
number) that may also be registered for VAT — out of scope for v1.7 (CNP
ships as `RO_CNP` in v1.8 alongside the personal-ID batch).

Raw regex (VAT scope only, 2-10 digits): `/^RO[1-9]\d{1,9}$/`.

**Algorithm**: weighted mod-11 over the zero-left-padded 9-digit body.

```
weights = [7, 5, 3, 2, 1, 7, 5, 3, 2]
body9 = body.padStart(9, '0')             # body excludes the check digit
s = sum(weights[i] * int(body9[i]) for i in 0..8)
check = (10 * s) mod 11 mod 10            # the % 11 % 10 collapses 10 → 0
```

Note the `10 * sum` factor — that's the published Romanian quirk, not a typo.

**Confidence: high.** ANAF publishes the algorithm in OUG 116/2009 anexa,
reproduced verbatim in python-stdnum.

**Synthetic vectors** (hand-derived):

For `RO18547290` (body `1854729`, check `0`):
- pad to 9: `001854729`
- s = 7·0+5·0+3·1+2·8+1·5+7·4+5·7+3·2+2·9 = 0+0+3+16+5+28+35+6+18 = 111
- (10·111) mod 11 mod 10 = 1110 mod 11 mod 10 = 10 mod 10 = 0. ✓

| body (excl check) | computed check | Full |
|---|---|---|
| 1854729 | 0 | `RO18547290` |
| 12345 | 3 | `RO123453` |
| 22 | 1 | `RO221` |
| 9876543 | 8 | `RO98765438` |
| 98765432 | 8 | `RO987654328` |

Invalid:

- Wrong format: `RO1` (1 digit). Reason: `too_short`.
- Wrong format: `RO12345678901` (11 digits, not in 2..10 range and not a
  CNP). Reason: `too_long`.
- Wrong format: `RO01234567` (leading zero). Reason: `invalid_format`.
- Wrong checksum: `RO18547291`. Reason: `invalid_checksum`.

**Reforms / quirks**:

- `CUI`, `CIF`, and `CF` are all the same number. CUI = ONRC's view;
  CIF = ANAF's view; CF = VIES-prefixed variant. Ship as `RO_CF`; spec
  header notes the synonyms.
- 13-digit Romanian CNP is sometimes accepted by VIES for sole
  proprietors. Defer to v1.8 (`RO_CNP`).

---

### 2.8 Bulgaria — BG_VAT

**Issuer**: Национална агенция за приходите (NRA / NAP).
**Statute**: Закон за данък върху добавената стойност (ЗДДС), чл. 94, обн.
ДВ бр. 63/2006.
**First-party URLs**:

- <https://nra.bg>
- <https://nra.bg/wps/portal/nra/dds> (VAT registration)
- <https://www.grao.government.bg> (citizen registry — for EGN cross-check)

`nra.bg` is the agency's domain. `government.bg` is a government TLD
already in our allowlist for GRAO. **Action required**: add `nra.bg`.

**python-stdnum module**: `stdnum/bg/vat.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/bg/vat.py>

**Format**: `BG` + 9 or 10 digits.

- **9 digits** — legal entity VAT number.
- **10 digits** — natural person: either the EGN (Bulgarian personal
  number) of the registrant, the PNF (foreigner ID), or a synthetic
  "other" number with its own check.

Raw regex: `/^BG\d{9,10}$/`.

**Algorithms**:

*9-digit legal entity*:

```
s = sum((i+1) * int(d[i]) for i in 0..7) mod 11
if s == 10:
    s = sum((i+3) * int(d[i]) for i in 0..7) mod 11
check = s mod 10        # collapses 10 → 0 only via this rule
```

*10-digit "other"* (used when EGN/PNF validators both fail):

```
weights = [4, 3, 2, 7, 6, 5, 4, 3, 2]
check = (11 - sum(weights[i] * int(d[i]) for i in 0..8)) mod 11
        # if 10, also collapses to 10 (which would be rejected)
```

*10-digit EGN / PNF*: delegate to the EGN/PNF validator (out of scope for
v1.7 — EGN is in the v1.8 personal-ID batch). For v1.7 the validator
should accept the 10-digit "other" path AND fall back to "accepted as
EGN/PNF if no check-fail" — i.e., **mirror python-stdnum's three-way
fallback**.

**Confidence: high** for the legal-entity 9-digit case, **moderate** for
the 10-digit case until EGN ships. Conservative ship strategy: declare the
top-level `confidence: "moderate"` because the 10-digit branch is not
fully checked. Alternative: ship only the 9-digit form in v1.7 and add the
10-digit branch in v1.8 when EGN lands.

**Recommendation: ship 9-digit only as `BG_VAT` confidence "high" in v1.7;
add a TODO referencing the EGN dependency for the 10-digit branch.**

**Synthetic vectors** (9-digit legal entity, computed via above):

For `BG175074752` (body `17507475`):
- weights `1..8`: 1·1+2·7+3·5+4·0+5·7+6·4+7·7+8·5 = 1+14+15+0+35+24+49+40 = 178
- 178 mod 11 = 2. Not 10. check = 2. ✓

| body8 | check | Full |
|---|---|---|
| 17507475 | 2 | `BG175074752` |
| 12345678 | 6 | `BG123456786` |
| 11111111 | 3 | `BG111111113` |
| 99999999 | 5 | `BG999999995` |
| 22334455 | 3 | `BG223344553` |

Invalid:

- Wrong format: `BG12345678` (8 digits). Reason: `too_short`.
- Wrong format: `BG175A74752`. Reason: `invalid_format`.
- Wrong checksum: `BG175074751`. Reason: `invalid_checksum`.

**Reforms / quirks**: numbers that yield raw `s == 10` in the primary
formula get re-weighted with the second formula. Don't skip that branch —
python-stdnum's doctests cover one of these cases.

---

### 2.9 Croatia — HR_OIB

**Issuer**: Porezna uprava (Tax Administration of the Ministry of Finance).
**Statute**: Zakon o osobnom identifikacijskom broju, NN 60/2008.
**First-party URLs**:

- <https://www.porezna-uprava.hr>
- <https://www.porezna-uprava.hr/HR_OIB/Stranice/default.aspx>
- <https://www.porezna-uprava.hr/HR_OIB/Documents/Zakon_o_OIB.pdf>

`porezna-uprava.hr` is the official agency domain. **Action required**:
add to `ISSUER_ALLOWLIST_DOMAINS`.

**python-stdnum module**: `stdnum/hr/oib.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/hr/oib.py>

**Format**: `HR` + 11 digits. The OIB is universal — person, sole trader,
and legal entity share the same number space. VIES prefix is `HR`.

Raw regex: `/^HR\d{11}$/`.

**Algorithm**: **ISO/IEC 7064 MOD 11,10** over all 10 body digits. (Same
family as the German USt-IdNr's check — see existing `de/ustid.ts` for the
exact JS implementation; we can re-use that helper.)

```
p = 10
for d in body10:
    s = (p + int(d)) mod 10
    if s == 0: s = 10
    p = (s * 2) mod 11
check = (11 - p) mod 10
```

**Confidence: high.** Zakon o OIB explicitly cites ISO/IEC 7064.
python-stdnum delegates to its `iso7064.mod_11_10`. Trivially shareable
with DE_USTID's `computeMod1110DV`.

**Synthetic vectors** (hand-derived using algorithm above):

For body `3339200596`:
- p=10. d=3: s=(10+3)%10=3; p=(3·2)%11=6.
- d=3: s=(6+3)%10=9; p=(9·2)%11=7.
- d=3: s=(7+3)%10=0→10; p=(10·2)%11=9.
- d=9: s=(9+9)%10=8; p=16%11=5.
- d=2: s=(5+2)%10=7; p=14%11=3.
- d=0: s=3; p=6.
- d=0: s=6; p=12%11=1.
- d=5: s=6; p=12%11=1.
- d=9: s=(1+9)%10=0→10; p=20%11=9.
- d=6: s=(9+6)%10=5; p=10%11=10.
- check = (11 - 10) % 10 = 1. ✓

| body10 | check | Full |
|---|---|---|
| 3339200596 | 1 | `HR33392005961` |
| 1234567890 | 3 | `HR12345678903` |
| 0000000001 | 0 | `HR00000000010` |
| 9876543210 | 6 | `HR98765432106` |
| 1111111111 | 9 | `HR11111111119` |

Invalid:

- Wrong format: `HR1234567890` (10 digits). Reason: `too_short`.
- Wrong format: `HR3339200596Z`. Reason: `invalid_format`.
- Wrong checksum: `HR33392005962`. Reason: `invalid_checksum`.

**Reforms / quirks**: cleanest spec in the batch. Re-use the
`computeMod1110DV` helper from `de/ustid.ts` (DE body=8, HR body=10 —
make the helper generic over length).

---

### 2.10 Slovakia — SK_DPH

**Issuer**: Finančné riaditeľstvo SR (Finančná správa).
**Statute**: Zákon č. 222/2004 Z. z. o dani z pridanej hodnoty, §4.
**First-party URLs**:

- <https://www.financnasprava.sk>
- <https://www.financnasprava.sk/sk/podnikatelia/dane/dan-z-pridanej-hodnoty>

`financnasprava.sk`: **action required**, add to allowlist.

**python-stdnum module**: `stdnum/sk/dph.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/sk/dph.py>

**Format**: `SK` + 10 digits. First digit non-zero; third digit (index 2)
must be in `{2,3,4,7,8,9}`.

Raw regex: `/^SK[1-9]\d{1}[234789]\d{7}$/`.

**Algorithm**: `int(body10) mod 11 == 0` — simple divisibility check.

```
check_ok = int(body10) mod 11 == 0
```

Edge case: a value that also validates as a Slovak rodné číslo (RČ) is
accepted by python-stdnum's `is_valid` regardless of the mod-11 check.
We exclude that path in v1.7 — see "Reforms" below.

**Confidence: high** for the divisibility-only spec. The structural
constraint on digit 2 ∈ `{2,3,4,7,8,9}` and digit 0 ≠ 0 is documented
in Finančná správa's metodický pokyn k registrácii.

**Synthetic vectors**:

Strategy: pick a 9-digit prefix (first 9 digits) with `[1-9]` at pos 0
and `[234789]` at pos 2, then compute check digit `d` such that
`int(prefix + d) mod 11 == 0`.

Worked example for prefix `202274961`:
- prefix · 10 = 2022749610
- 2022749610 mod 11 = 2 (compute by hand: 2022749610 / 11 = 183886328 rem 2)
- need (-2) mod 11 = 9. So check = 9. Full: `SK2022749619`. ✓

| prefix9 | check | Full |
|---|---|---|
| 202274961 | 9 | `SK2022749619` |
| 123723452 | 6 | `SK1237234526` |
| 567389017 | 8 | `SK5673890178` |
| 814247029 | 2 | `SK8142470292` |
| 912348107 | 0 | `SK9123481070` |

Invalid:

- Wrong format: `SK123456789` (9 digits). Reason: `too_short`.
- Wrong format: `SK0234567890` (leading zero). Reason: `invalid_format`.
- Wrong format: `SK1212345678` (digit 2 = 1, not in {2,3,4,7,8,9}). Reason:
  `invalid_format`.
- Wrong checksum: `SK2022749610`. Reason: `invalid_checksum`.

**Reforms / quirks**: omit python-stdnum's "RČ-might-also-be-VAT" branch
— v1.7 ships the strict 10-digit mod-11 only; RČ-as-VAT is a v1.8 concern.
Pre-2009 numbers with relaxed digit-2 constraint are slowly aging out.

---

### 2.11 Slovenia — SI_DDV

**Issuer**: Finančna uprava Republike Slovenije (FURS).
**Statute**: Zakon o davku na dodano vrednost (ZDDV-1), Uradni list RS 117/06.
**First-party URLs**:

- <https://www.fu.gov.si>
- <https://www.fu.gov.si/davki_in_druge_dajatve/podrocja/davek_na_dodano_vrednost_ddv/>

`fu.gov.si` matches `gov.si` → governance test **passes without change**.

**python-stdnum module**: `stdnum/si/ddv.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/si/ddv.py>

**Format**: `SI` + 8 digits. First digit non-zero.

Raw regex: `/^SI[1-9]\d{7}$/`.

**Algorithm**: weighted mod-11.

```
weights = [8, 7, 6, 5, 4, 3, 2]
s = sum(weights[i] * int(body[i]) for i in 0..6)
check = 11 - (s mod 11)
if check == 10:  check = 0
# else if check == 11: also 0 (but stdnum doesn't special-case 11)
```

**Confidence: high.** Algorithm published by FURS; python-stdnum reproduces.

**Synthetic vectors**:

| body7 | s | s%11 | 11-(s%11) | check | Full |
|---|---|---|---|---|---|
| 5022305 | 8·5+7·0+6·2+5·2+4·3+3·0+2·5 = 84 | 7 | 4 | 4 | `SI50223054` |
| 1234567 | 8+14+18+20+20+18+14 = 112 | 2 | 9 | 9 | `SI12345679` |
| 7654321 | 56+42+30+20+12+6+2 = 168 | 3 | 8 | 8 | `SI76543218` |
| 9876543 | 72+56+42+25+16+15+8 = 234 | 3 | 8 | wait: 234 mod 11 = 3. 11-3=8 — but actual stdnum says 4? Recompute: 8·9+7·8+6·7+5·6+4·5+3·4+2·3 = 72+56+42+30+20+12+6 = 238. 238 mod 11 = 7. 11-7=4. check=4. | 4 | `SI98765434` |
| 3145927 | 8·3+7·1+6·4+5·5+4·9+3·2+2·7 = 24+7+24+25+36+6+14 = 136 | 4 | 7 | 7 | `SI31459277` |

(Re-derivation of `9876543` row: arithmetic correction inline.)

Invalid:

- Wrong format: `SI1234567` (7 digits). Reason: `too_short`.
- Wrong format: `SI01234567` (leading zero). Reason: `invalid_format`.
- Wrong checksum: `SI50223055`. Reason: `invalid_checksum`.

**Reforms / quirks**: DDV is the same number space as the Slovenian
*davčna številka* (DŠ) for natural persons. v1.7's `SI_DDV` covers both;
`SI_DS` personal alias is a v1.8 zero-cost addition.

---

### 2.12 Lithuania — LT_PVM

**Issuer**: Valstybinė mokesčių inspekcija (VMI).
**Statute**: Lietuvos Respublikos pridėtinės vertės mokesčio įstatymas,
2002 m. kovo 5 d. Nr. IX-751, art. 71.
**First-party URLs**:

- <https://www.vmi.lt>
- <https://www.vmi.lt/evmi/pvm-moketojo-kodo-suteikimas>

`vmi.lt`: **action required**, add to allowlist (`.lt` not government-suffixed).

**python-stdnum module**: `stdnum/lt/pvm.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/lt/pvm.py>

**Format**: `LT` + **9 digits** (legal entity) **or 12 digits** (temporarily
registered taxpayer / natural person). The 8th digit of the 9-digit form
(index 7) MUST be `1`; the 11th digit of the 12-digit form (index 10) MUST
be `1`. These are structural constraints, not checksums.

Raw regex (combined): `/^LT(?:\d{7}1\d|\d{10}1\d)$/` — i.e. 9 or 12 digits
where position-from-end -2 (the one before the check digit) is `1`.

**Algorithm**: weighted mod-11 with a two-pass fallback.

```
def calc_check(body):                     # body excludes the check digit
    weights = [1+i%9 for i in range(len(body))]   # 1,2,3,4,5,6,7,8,9,1,2,...
    s = sum(weights[i] * int(body[i])) mod 11
    if s == 10:
        weights2 = [1+(i+2)%9 for i in range(len(body))]   # 3,4,5,6,7,8,9,1,2,3,...
        s = sum(weights2[i] * int(body[i]))
    return s mod 11 mod 10
```

The `% 11 % 10` collapses 10 → 0.

**Confidence: high.** VMI publishes the algorithm in their PVM-mokėtojo
metodikos handbook; python-stdnum reproduces.

**Synthetic vectors** (9-digit body8 must end with `1`):

| body8 | check | Full |
|---|---|---|
| 11951151 | 5 | `LT119511515` |
| 21111111 | 4 | `LT211111114` |
| 39876541 | 4 | `LT398765414` |
| 40000001 | 1 | `LT400000011` |
| 77777771 | 6 | `LT777777716` |

12-digit body11 (index 10 must be `1`):

| body11 | check | Full |
|---|---|---|
| 10000191901 | 7 | `LT100001919017` |
| 10000480161 | 0 | `LT100004801610` |

Worked example for body8 `11951151`:
- weights = [1,2,3,4,5,6,7,8]
- s = 1·1+2·1+3·9+4·5+5·1+6·1+7·5+8·1 = 1+2+27+20+5+6+35+8 = 104
- 104 mod 11 = 5. Not 10. check = 5. ✓

Invalid:

- Wrong format: `LT12345678` (8 digits, not 9 or 12). Reason: `too_short`.
- Wrong format: `LT119511525` (index 7 is `2`, not `1`). Reason:
  `invalid_format`.
- Wrong checksum: `LT119511516`. Reason: `invalid_checksum`.

**Reforms / quirks**: the `1` at pos 7 (9-d) / 10 (12-d) is
**structural**, not a checksum — violations are `invalid_format`. 12-digit
form is for non-resident traders and natural persons.

---

### 2.13 Latvia — LV_PVN

**Issuer**: Valsts ieņēmumu dienests (VID).
**Statute**: Pievienotās vērtības nodokļa likums, Latvijas Vēstnesis 197/2012.
**First-party URLs**:

- <https://www.vid.gov.lv>
- <https://www.vid.gov.lv/lv/pievienotas-vertibas-nodoklis>

`vid.gov.lv` matches `gov.lv` → governance test **passes without change**.

**python-stdnum module**: `stdnum/lv/pvn.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/lv/pvn.py>

**Format**: `LV` + 11 digits.

Raw regex: `/^LV\d{11}$/`.

**Algorithm**: branches on first digit.

*Legal entity (first digit `4..9`)*: weighted mod-11 over all 11 digits
must equal **3**.

```
weights = [9, 1, 4, 8, 3, 10, 2, 5, 7, 6, 1]
sum(weights[i] * int(d[i]) for i in 0..10) mod 11 == 3
```

*Natural person, "new" personal code (starts with `32`, issued 2017+)*:
last digit derived from weighted mod-11 over the first 10 digits:

```
weights = [10, 5, 8, 4, 2, 1, 6, 3, 7, 9]
check = (1 + sum(weights[i] * int(d[i]) for i in 0..9)) mod 11 mod 10
```

*Natural person, "old" personal code (first digit `0..3`, not starting
`32`)*: date components (DDMMYY + century in position 6) must form a valid
date AND the same `calc_check_digit_pers` formula above must match.

**Confidence: high** for the legal-entity branch (VID-documented). **Moderate**
for the natural-person branches — python-stdnum's own comment on the
personal-code weights reads *"note that this algorithm has not been
confirmed by an independent source"*. v1.7 should ship `confidence:
"moderate"` at spec level, with prose clarifying the per-branch certainty.

**Synthetic vectors** (legal entity, body10 first digit > `3`):

For `LV40003521600` (body10 `4000352160`):
- weights (first 10) = [9,1,4,8,3,10,2,5,7,6]
- pref_sum = 9·4+1·0+4·0+8·0+3·3+10·5+2·2+5·1+7·6+6·0 = 36+0+0+0+9+50+4+5+42+0 = 146
- need total + (last·1) mod 11 = 3. last = (3 - 146) mod 11 = -143 mod 11 = 0.
- Full: `LV40003521600`. ✓

| body10 | check | Full |
|---|---|---|
| 4000352160 | 0 | `LV40003521600` |
| 9000000001 | 4 | `LV90000000014` |
| 5123456789 | 3 | `LV51234567893` |
| 7777777777 | 3 | `LV77777777773` |
| 8765432101 | 1 | `LV87654321011` |

Invalid:

- Wrong format: `LV1234567890` (10 digits). Reason: `too_short`.
- Wrong format: `LV4000352160A`. Reason: `invalid_format`.
- Wrong checksum: `LV40003521601`. Reason: `invalid_checksum`.

**Reforms / quirks**: 2017 reform introduced personal codes starting
`32` that do NOT encode DOB (privacy). Both forms valid for sole-trader
PVN. Spec-level `confidence: "moderate"` is correct because the
natural-person branch has no authoritative published algorithm
(python-stdnum acknowledges this).

---

### 2.14 Estonia — EE_KMKR

**Issuer**: Maksu- ja Tolliamet (MTA / Estonian Tax and Customs Board).
**Statute**: Käibemaksuseadus (RT I 2003, 82, 554), §20.
**First-party URLs**:

- <https://www.emta.ee>
- <https://www.emta.ee/eraklient/maksud-ja-tasumine/kaibemaks>

`emta.ee`: **action required**, add to allowlist.

**python-stdnum module**: `stdnum/ee/kmkr.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/ee/kmkr.py>

**Format**: `EE` + 9 digits.

Raw regex: `/^EE\d{9}$/`.

**Algorithm**: weighted mod-10. Weights `[3,7,1,3,7,1,3,7,1]` over all
9 digits including the check.

```
weights = [3, 7, 1, 3, 7, 1, 3, 7, 1]
sum(weights[i] * int(d[i]) for i in 0..8) mod 10 == 0
```

**Confidence: high.** Algorithm published by MTA, mirrored by python-stdnum.

**Synthetic vectors**:

| body8 | check | Full |
|---|---|---|
| 10059410 | 2 | `EE100594102` |
| 10093155 | 8 | `EE100931558` |
| 12345678 | 0 | `EE123456780` |
| 99999999 | 2 | `EE999999992` |
| 55555555 | 0 | `EE555555550` |

Worked example for body8 `10059410`:
- weights × digits = 3·1 + 7·0 + 1·0 + 3·5 + 7·9 + 1·4 + 3·1 + 7·0 = 88
- Last weight is 1. Need 88 + 1·d ≡ 0 mod 10 → d = 2. ✓

Invalid:

- Wrong format: `EE12345678` (8 digits). Reason: `too_short`.
- Wrong format: `EE12345678A`. Reason: `invalid_format`.
- Wrong checksum: `EE100594101`. Reason: `invalid_checksum`.

**Reforms / quirks**: e-Residency holders abroad can hold KMKR; format
unchanged. *Isikukood* (personal ID) is NOT a VAT number — `EE_IK` ships
in v1.8.

---

### 2.15 Malta — MT_VAT

**Issuer**: Commissioner for Revenue (CFR / formerly VAT Department).
**Statute**: Value Added Tax Act, Cap. 406 of the Laws of Malta.
**First-party URLs**:

- <https://cfr.gov.mt>
- <https://cfr.gov.mt/en/vat/Pages/default.aspx>
- <https://legislation.mt/eli/cap/406/eng>

`cfr.gov.mt` matches `gov.mt` → governance test **passes without change**.

**python-stdnum module**: `stdnum/mt/vat.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/mt/vat.py>

**Format**: `MT` + 8 digits. First digit non-zero.

Raw regex: `/^MT[1-9]\d{7}$/`.

**Algorithm**: weighted mod-37.

```
weights = [3, 4, 6, 7, 8, 9, 10, 1]
sum(weights[i] * int(d[i]) for i in 0..7) mod 37 == 0
```

The last weight is `1`, so the check digit is the value that makes the
total a multiple of 37. Because the mod is 37 and the check digit is a
single decimal digit, **not every 7-digit body has a valid 1-digit check**:
when the required value is in `10..36`, the body is unrepresentable and
will not have been issued. The validator silently accepts only those that
yield 0..9.

**Confidence: high.** Algorithm in CFR's VAT registration guidelines;
python-stdnum confirms.

**Synthetic vectors** (only bodies for which the required check ∈ 0..9):

| body7 | check | Full |
|---|---|---|
| 1167911 | 2 | `MT11679112` |
| 1234567 | 1 | `MT12345671` |
| 3141592 | 0 | `MT31415920` |
| 7463343 | 1 | `MT74633431` |
| 7793667 | 0 | `MT77936670` |
| 7007071 | 5 | `MT70070715` |

Worked example for body7 `1167911`:
- weighted sum (first 7) = 3·1+4·1+6·6+7·7+8·9+9·1+10·1 = 3+4+36+49+72+9+10 = 183
- need 183 + d ≡ 0 mod 37 → d = (-183) mod 37 = 224 mod 37 = 224 - 5·37 = 224-185 = 39. wait that's >9. Re-check.
- Actually 183 mod 37: 37·4 = 148; 37·5 = 185. So 183 mod 37 = 183 - 148 = 35.
- (-35) mod 37 = 2. So d = 2. ✓ Full: `MT11679112`. ✓

Invalid:

- Wrong format: `MT1234567` (7 digits). Reason: `too_short`.
- Wrong format: `MT01234567` (leading zero). Reason: `invalid_format`.
- Wrong checksum: `MT11679113`. Reason: `invalid_checksum`.

**Reforms / quirks**: mod-37 is unusual in EU VAT — it predates EU
harmonisation. Keep it as published; do NOT "correct" to mod-11.

---

### 2.16 Cyprus — CY_VAT

**Issuer**: Tax Department (Τμήμα Φορολογίας) of the Ministry of Finance.
**Statute**: Περί Φόρου Προστιθέμενης Αξίας Νόμος του 2000 (N. 95(I)/2000).
**First-party URLs**:

- <https://www.mof.gov.cy/mof/tax/taxdep.nsf>
- <https://www.mof.gov.cy/mof/tax/taxdep.nsf/All/[VAT-page]>
- <https://www.taxnet.mof.gov.cy>

`mof.gov.cy` matches `gov.cy` → governance test **passes without change**.

**python-stdnum module**: `stdnum/cy/vat.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/cy/vat.py>

**Format**: `CY` + 8 digits + 1 letter (9 chars total). First 2 digits MUST
NOT be `12`.

Raw regex: `/^CY\d{8}[A-Z]$/` (with the `12` exclusion enforced
imperatively in `validate()`).

**Algorithm**: positional translation + mod-26 letter mapping.

Translate even-indexed digits (positions 0, 2, 4, 6 — counting from 0)
through this table:

```
'0' → 1
'1' → 0
'2' → 5
'3' → 7
'4' → 9
'5' → 13
'6' → 15
'7' → 17
'8' → 19
'9' → 21
```

Odd-indexed digits (1, 3, 5, 7) are summed as their raw value. Compute:

```
total = sum(translate[d[i]] for i in [0,2,4,6]) + sum(int(d[i]) for i in [1,3,5,7])
check_letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[total mod 26]
```

**Confidence: high.** Algorithm in the Tax Department's VAT manual;
python-stdnum reproduces.

**Synthetic vectors**:

For body8 `10259033`:
- even-idx digits at positions 0,2,4,6 = `1,2,9,3` → translated `0+5+21+7 = 33`
- odd-idx digits at positions 1,3,5,7 = `0,5,0,3` → sum `8`
- total = 33+8 = 41. 41 mod 26 = 15. Letter index 15 = `P`. ✓

| body8 | check | Full |
|---|---|---|
| 10259033 | P | `CY10259033P` |
| 00428342 | T | `CY00428342T` |
| 13456789 | P | `CY13456789P` |
| 98765432 | A | `CY98765432A` |
| 13579024 | B | `CY13579024B` |

Invalid:

- Wrong format: `CY1025903P` (only 7 digits + letter). Reason: `too_short`.
- Wrong format: `CY10259033` (missing letter). Reason: `invalid_format`.
- Wrong format / component: `CY12345678X` (starts with `12`). Reason:
  `invalid_format` (we map `InvalidComponent` to `invalid_format` per
  existing convention).
- Wrong checksum: `CY10259033Z`. Reason: `invalid_checksum`.

**Reforms / quirks**: `12` prefix is reserved (`InvalidComponent` →
mapped to `invalid_format`). Trailing-letter check is unique in this
batch; alphabet is full `A..Z` (NO exclusions — differs from IE's
`WABCDEFGHIJKLMNOPQRSTUV`).

---

## 3. Bonus — IS Iceland VSK (EEA, not in VIES)

**Issuer**: Ríkisskattstjóri (Iceland Revenue and Customs, RSK).
**Statute**: Lög um virðisaukaskatt nr. 50/1988.
**First-party URLs**:

- <https://www.skatturinn.is>
- <https://www.skatturinn.is/atvinnurekstur/virdisaukaskattur/>
- <https://www.rsk.is>

`skatturinn.is` and `rsk.is`: **action required**, add to allowlist.

**python-stdnum module**: `stdnum/is_/vsk.py` —
<https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/is_/vsk.py>

**Format**: `IS` + 5 or 6 digits. Format-only — no published checksum.

Raw regex: `/^IS\d{5,6}$/`.

**Confidence: moderate.** RSK does NOT publish a check digit (because
there isn't one); the number is a sequential allocation. python-stdnum
performs only length + digit checks. Spec-level confidence MUST be
`moderate` because there's no checksum to fail. The spec header should
state this explicitly.

**Synthetic vectors** (format-only — all valid 5/6 digit numbers pass):

Valid: `IS00621`, `IS121603`, `IS999999`, `IS00001`, `IS54321`.

Invalid: `IS0062199` (7 digits → `too_long`), `IS1234` (4 digits →
`too_short`), `ISABCDE` (non-digits → `invalid_format`).

**Reforms / quirks**: Iceland is EEA but NOT in VIES — cross-border
queries return `MS_NOT_SUPPORTED`. Lower utility than EU specs; ship for
completeness. Iceland's **kennitala** (10-digit personal+business mod-11
ID) is the higher-utility IS document — belongs in v1.8.

---

## 4. Cross-cutting decisions

### 4.1 Subpath layout — `nationid/vat` vs `nationid/<cc>`

**Recommendation: keep per-country subpaths AND add an additive
`nationid/vat` aggregator.** Per-country imports stay canonical (one
module per spec); the aggregator (`src/vat/index.ts`) is pure re-exports
keyed by code. Tree-shaking ensures consumers that only want one country
still pay only for that country, while EU-wide accounting apps can
`import { ieVatSpec, atUidSpec, ... } from "nationid/vat"`. No
duplication, no two-canonical-paths foot-gun.

### 4.2 VIES live API integration

**Recommendation: DEFER.** Ship an `examples/vies-check.ts` recipe that
calls `https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number`
and link it from the README's "online verification" section. The library
itself remains offline-by-design — VIES has documented `MS_UNAVAILABLE`
modes that flip for hours per member state; coupling a validator to it
would introduce non-determinism that breaks the v1.0 reliability claim.
If demand justifies it, a separate `@nationid/vies` add-on can re-export
the offline validator AND wrap the live VIES call.

### 4.3 i18n — exact label keys to add

Catalog convention is `documents.<CODE>.label`. v1.7 adds 17 keys to
all three locales (`src/i18n/locales/{es,en,pt}.ts`) in the same commit
per the `feedback_i18n_all_locales.md` rule:

`documents.IE_VAT.label`, `documents.AT_UID.label`, `documents.LU_TVA.label`,
`documents.GR_AFM.label`, `documents.CZ_DIC.label`, `documents.HU_ANUM.label`,
`documents.RO_CF.label`, `documents.BG_VAT.label`, `documents.HR_OIB.label`,
`documents.SK_DPH.label`, `documents.SI_DDV.label`, `documents.LT_PVM.label`,
`documents.LV_PVN.label`, `documents.EE_KMKR.label`, `documents.MT_VAT.label`,
`documents.CY_VAT.label`, `documents.IS_VSK.label`.

Label text follows the pattern "`<native-abbrev>` (`<country>`)" with
country names localised per existing convention (e.g., `AFM (Greece)` /
`NIF IVA (Grecia, AFM)` / `NIF IVA (Grécia, AFM)`). HR uses `OIB` in all
three locales because the native term has crossed over into international
usage; same for `DIČ`, `KMKR`, `PVM`, `PVN`, `DDV`. Sentence case
required per `feedback_no_uppercase_labels.md`.

### 4.4 Governance test — domains to add

`tests/governance/confidence-citations.test.ts` requires the following
edits before any spec in this batch can ship with `confidence: "high"`:

**New TLD suffix patterns** to add to `ISSUER_TLD_SUFFIXES`:

- `/(?:^|\.)gv\.at$/i` — Austrian government TLD (`bmf.gv.at`).
- `/(?:^|\.)gov\.ie$/i` — Irish government (already covered by `gov.<cc>`?
  `gov.ie` matches `/(?:^|\.)gov\.[a-z]{2,3}$/i` — yes, the existing
  regex covers it. No edit needed unless we lean on `revenue.ie`.)
- `/(?:^|\.)gov\.gr$/i` — covered by `gov.<cc>`.
- `/(?:^|\.)gov\.hu$/i`, `gov.mt`, `gov.cy`, `gov.si`, `gov.lv` — all
  covered.

**New domains to add to `ISSUER_ALLOWLIST_DOMAINS`** (omitting those
already covered by `gov.<cc>` suffix):

```
revenue.ie, bmf.gv.at, usp.gv.at, public.lu, pfi.public.lu,
guichet.public.lu, aade.gr, gsis.gr, financnisprava.cz, adisspr.mfcr.cz,
anaf.ro, nra.bg, porezna-uprava.hr, financnasprava.sk, vmi.lt, emta.ee,
legislation.mt, skatturinn.is, rsk.is, eur-lex.europa.eu, ec.europa.eu
```

Already covered by `gov.<cc>`: `vid.gov.lv`, `cfr.gov.mt`, `mof.gov.cy`,
`taxnet.mof.gov.cy`, `nav.gov.hu`, `fu.gov.si`, `grao.government.bg`.

Adding `ec.europa.eu` and `eur-lex.europa.eu` lets spec headers cite EU
primary law inline. Complementary alternative: add EU-specific statute
patterns to `STATUTE_PATTERNS` such as `/\bCouncil Regulation \(EU\)
No \d+\/\d+/i` and `/\bDirective 2006\/112\/EC/i`.

### 4.5 Tests & oracle strategy

Per-country test files at `tests/<cc>/vat.test.ts` (mirrors existing
`tests/de/`, `tests/fr/` layout). Each imports synthetic vectors from
`tests/fixtures/vat/<cc>.json` plus python-stdnum doctest vectors pinned
via a one-shot script. Cross-validation: `tests/cross-vat/vies-prefix.test.ts`
asserts each spec's regex uses the correct VIES prefix (`EL` for GR,
otherwise ISO alpha-2; `XI` is out of scope per §5 #2).

---

## 5. Open questions / risks

1. **Greek `EL` vs `GR` prefix (HIGH risk)** — #1 historical bug. Spec
   code is `GR_AFM` (we key on ISO 3166) but the canonical regex requires
   `EL`. Validator must accept `GR` on input and normalise to `EL` on
   output. Tests must assert: `validate("GR094259216")` true,
   `parse("GR094259216").formatted` starts with `EL`,
   `validate("EL094259216")` true.

2. **Northern Ireland `XI` (MEDIUM risk)** — XI is a UK post-Brexit
   carve-out (NI Protocol). XI numbers share GB VAT format but live in
   a separate VIES namespace. **Out of scope for v1.7.** Document in
   `gb/vat.ts` header that XI is not yet supported; add to v1.8 roadmap.

3. **Romanian CNP-as-VAT (LOW)** — python-stdnum accepts 13-digit CNP
   as VAT. v1.7 rejects (length 2..10 only). Sole-trader callers should
   use the future `RO_CNP` directly. Flag in spec header.

4. **Czech individual-DIČ via RČ (MEDIUM)** — 9/10-digit Czech RC
   validates as DIČ. Ship the RC date check inside `cz/dic.ts` now;
   extract `cz/shared.ts` so v1.8's `CZ_RC` (personal) can re-use.

5. **LV personal-code branch (MEDIUM)** — python-stdnum's own comment:
   *"algorithm has not been confirmed by an independent source"*. Ship
   `LV_PVN` at `confidence: "moderate"` rather than reject natural-person
   codes (real LV sole-trader VAT numbers ARE personal codes).

6. **Bulgarian 10-digit branch depends on EGN (HIGH risk for confidence
   tier)** — see §2.8. **Recommendation: ship only the 9-digit legal-entity
   form with `confidence: "high"`** in v1.7; add the 10-digit path in
   v1.8 alongside `BG_EGN`.

7. **SK RC-as-VAT (LOW)** — python-stdnum accepts a Slovak RC as VAT.
   v1.7 strict spec rejects this; revisit in v1.8 with `SK_RC`.

8. **MT mod-37 unrepresentable bodies (LOW)** — ~75% of random 7-digit
   bodies have required check ≥ 10. Validator just rejects. Tune
   property-test budget so fuzzing doesn't exhaust on rejected inputs.

9. **LT structural `1` at pos 7/10 + CY reserved `12*` prefix (LOW)** —
   both report as `invalid_format`, not `invalid_checksum`. Map
   python-stdnum's `InvalidComponent` → `invalid_format` per existing
   convention.

10. **PII implications (LOW)** — LV PVN and BG VAT 10-digit forms
    contain date-encoded personal codes. v1.7's VAT-only scope side-steps
    this, but `docs/PII.md` should reference both when those branches go
    live (v1.8).

11. **IS VSK has no checksum** — ship `IS_VSK` at `confidence: "moderate"`.
    Governance test already only gates `high`, so this is compatible.

12. **EUR-Lex citations preferred via `STATUTE_PATTERNS`** — adding
    `/\bDirective 2006\/112\/EC/i` etc. to statute patterns is cleaner
    than whitelisting `ec.europa.eu`. Both can coexist.

13. **`gv.at` recognition** — without `/(?:^|\.)gv\.at$/i` in
    `ISSUER_TLD_SUFFIXES` the AT_UID spec cannot cite `bmf.gv.at` and CI
    fails. One-line fix.

14. **Old-format Irish VAT (`+`/`*`)** — accept on input but do NOT
    auto-fuzz: hand-pick legacy fixtures.

15. **DB column length** — longest formatted form across the batch is
    14 chars (`LT100004801610`). `VARCHAR(15)` covers the full EU set;
    update `getMaxLength(spec)` helper accordingly.

---

## 6. Confidence summary

| ISO-2 | Code | Confidence | Basis |
|---|---|---|---|
| IE | `IE_VAT` | high | Revenue TDM 02-09-VAT + python-stdnum |
| AT | `AT_UID` | high | BMF UStR 2000 (Luhn-based) |
| LU | `LU_TVA` | high | AED Circulaire 770 (mod-89) |
| GR | `GR_AFM` | high | AADE YA 1027411/842 (quirk: EL prefix) |
| CZ | `CZ_DIC` | high | Finanční správa, 3 branches |
| HU | `HU_ANUM` | high | NAV (weighted mod-10) |
| RO | `RO_CF` | high | ANAF / OUG 116/2009 anexa |
| BG | `BG_VAT` | **high (9-d only)** / moderate (full) | Recommend 9-digit-only ship |
| HR | `HR_OIB` | high | Zakon o OIB cites ISO/IEC 7064 MOD 11,10 |
| SK | `SK_DPH` | high | Finančná správa metodický pokyn |
| SI | `SI_DDV` | high | FURS |
| LT | `LT_PVM` | high | VMI methodology |
| LV | `LV_PVN` | **moderate** | Personal-code branch unconfirmed (stdnum ack.) |
| EE | `EE_KMKR` | high | MTA (weighted mod-10) |
| MT | `MT_VAT` | high | CFR VAT manual (mod-37) |
| CY | `CY_VAT` | high | Tax Department manual (mod-26 letter) |
| IS | `IS_VSK` | **moderate** | Format-only; no checksum |

Net: 15 of 17 at `high` (with the recommended BG 9-d-only ship);
LV and IS at `moderate` with explicit, documented reasons. The
governance test passes for every `high` claim once the domains/patterns
in §4.4 land.

---

## 7. Implementation checklist (operational)

- Extend governance test with `gv.at` TLD + ~20 allowlist domains.
- Add EU statute patterns to `STATUTE_PATTERNS`.
- Implement 17 spec files at `src/countries/<cc>/<code>.ts`.
- Hoist `mod_11_10` from `de/ustid.ts` into `src/algorithms/iso7064.ts`;
  reuse for HR_OIB.
- Create `src/vat/index.ts` aggregator (re-exports only).
- Add 17 label keys to all three locales in the same commit.
- Per-country test files + `tests/fixtures/vat/<cc>.json` vectors.
- Update `docs/CATALOG.md` and README "Countries" tables.
- Ship `examples/vies-check.ts` recipe.
- `CHANGELOG.md` v1.7 entry plus EL/GR + XI scope notes.

---

## 8. Sources index

Every URL above is already cited inline next to the spec it supports.
The python-stdnum module path pattern is
`https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/<cc>/<mod>.py`
where `<cc>/<mod>` is given per country in section 2. EU primary law
references (VIES portal, Council Regulation 904/2010, Directive
2006/112/EC) are listed in section 1.

— end of research document —
