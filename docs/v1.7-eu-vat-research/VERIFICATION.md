# v1.7 EU-VAT batch — research verification

> Read this file BEFORE implementing any spec from [`eu-vat-batch.md`](./eu-vat-batch.md).
> Independent verification pass on 2026-05-24 by a second `research-analyst`
> agent. Same pattern that caught the TW_ARC inversion bug in v1.2.

## Methodology note (read first)

Two constraints shaped this verification pass:

1. **WebFetch / WebSearch were NOT available in the verifier's environment.**
   No live HTTP check of `python-stdnum` paths, EUR-Lex, AADE, BMF, etc.
   Every URL-level claim below is based on structural plausibility (TLD
   pattern, known agency name, prior knowledge cutoff Jan 2026), NOT a live
   GET. The research document itself claims to have verified python-stdnum
   paths via the GitHub Contents API; that claim is not independently
   re-checkable from this verifier. **Action for the implementer**: run a
   quick `curl --silent --head --fail` loop over the cited URLs before
   merging, or add a CI step that does.
2. **Arithmetic IS fully verifiable offline.** Every published test-vector
   check digit was re-derived in Python from ONLY the algorithm prose. A
   set of canonical reference vectors widely circulated in the
   VAT-validation ecosystem (`IE8473625E`, `ATU13585627`, `LU15027442`,
   `EL094259216`, `HU12892312`, `HR33392005961`, `SI50223054`,
   `EE100594102`, `MT11679112`) was also reproduced from the doc's
   algorithms alone. **All 78 in-doc vectors + all 9 canonical anchors
   match.** This is strong evidence that the prose-stated algorithms are
   correct.

URL/statute claims flagged with "(URL not live-checked)" below.

---

## Verdict matrix

| Spec       | Ship at      | Action before implementing |
|------------|--------------|----------------------------|
| IE_VAT     | high         | Add `revenue.ie` to allowlist (`revenue.ie` is Irish state body but `.ie`, not `.gov.ie`). |
| AT_UID     | high         | **P0**: Add `/(?:^|\.)gv\.at$/i` TLD suffix regex — `bmf.gv.at` does NOT match existing `gov.<cc>` regex. |
| LU_TVA     | high         | Add `public.lu`, `pfi.public.lu`, `guichet.public.lu` to allowlist. |
| GR_VAT     | high         | Add `aade.gr`, `gsis.gr`. Naming: prefer `GR_VAT` over `GR_AFM`. |
| CZ_DIC     | high         | Add `financnisprava.cz`, `adisspr.mfcr.cz`. **Scope-reduce v1.7 to legal-entity branch only**. |
| HU_VAT     | high         | No allowlist edits (`nav.gov.hu` matches existing). Rename `HU_ANUM` → `HU_VAT`. |
| RO_VAT     | high         | Add `anaf.ro`. Code `RO_VAT` preferred; aliases CUI/CIF/CF in spec header prose. |
| BG_VAT     | high (9-d)   | Add `nra.bg`. **Ship 9-digit legal-entity only**; defer 10-digit branch to v1.8 with `BG_EGN`. |
| HR_OIB     | high         | Add `porezna-uprava.hr`. **Hoist `computeMod1110DV` from `de/ustid.ts` to `src/algorithms/iso7064.ts` FIRST.** |
| SK_DPH     | high         | Add `financnasprava.sk`. **Reject** python-stdnum's "RČ-might-also-be-VAT" branch in v1.7. |
| SI_DDV     | high         | No allowlist edits (`fu.gov.si` matches). |
| LT_PVM     | high         | Add `vmi.lt`. Doc proposes shipping 12-digit form in v1.7 — concur. |
| LV_PVN     | **moderate** | No allowlist edits (`vid.gov.lv` matches). Personal-code branch unconfirmed by stdnum's own comment — explicit doc. |
| EE_KMKR    | high         | Add `emta.ee`. |
| MT_VAT     | high         | No allowlist edits (`cfr.gov.mt` matches). Add `legislation.mt` if statute URL is used. |
| CY_VAT     | high         | No allowlist edits (`mof.gov.cy` matches). |
| IS_VSK     | moderate     | Add `skatturinn.is`, `rsk.is`. Spec header MUST disclose "no checksum, EEA not EU-VIES". |

**Net**: 15 `high` + 2 `moderate`. BG narrowed to 9-digit, CZ narrowed to legal-entity.

---

## Per-country findings

### IE_VAT
- **Statute (URL not live-checked)**: Value-Added Tax Consolidation Act 2010, s. 65. Revenue Commissioners identity stable through 2026.
- **Algorithm verified ✅**: All 5 new-format vectors recompute to the published check letter using alphabet `WABCDEFGHIJKLMNOPQRSTUV` (W=0..V=22). Canonical `IE8473625E` reproduces independently.
- **python-stdnum oracle**: `stdnum/ie/vat.py` (not live-checked).
- **Test vector spot-check**: body `3628739` → `s = 8·3+7·6+6·2+5·8+4·7+3·3+2·9 = 173`; `173 mod 23 = 12 → L`. ✓
- **Caveat**: doc's regex uses `[A-W]` for the new-format check-letter slot. python-stdnum uses the full alphabet `[WABCDEFGHIJKLMNOPQRSTUV]`. They ARE equivalent character classes (same 23 chars), but add a code comment so a future reader does not "tighten" to `[A-V]`.

### AT_UID
- **Statute**: UStG §28 Z 1. BMF identity stable.
- **Algorithm verified ✅**: All 5 vectors derive correctly. Reproduces canonical `ATU13585627` → check `7`.
- **python-stdnum oracle**: `stdnum/at/uid.py` (not live-checked).
- **Test vector spot-check**: body `1358562`, reversed = `2,6,5,8,5,3,1`. Odd-positions doubled (`6·2=12→3`, `8·2=16→7`, `3·2=6`). Sum = `2+3+5+7+5+6+1 = 29`. `(6 - 29 mod 10) mod 10 = (6-9) mod 10 = 7`. ✓
- **CRITICAL**: existing `ISSUER_TLD_SUFFIXES` regex `/(?:^|\.)gov\.[a-z]{2,3}$/i` does NOT match `bmf.gv.at`. **Without the one-line regex addition, AT spec fails the governance test.** This is the #1 blocker.

### LU_TVA
- **Statute**: Loi du 12 février 1979. AED identity stable.
- **Algorithm verified ✅**: `body6 mod 89`. All 5 vectors match. `150274 % 89 = 42` reproduces canonical `LU15027442`.
- **python-stdnum oracle**: `stdnum/lu/tva.py` (not live-checked).
- **Naming note**: doc proposes `LU_TVA`. Consider `LU_VAT` for symmetry — see cross-cutting #1.

### GR_VAT (VIES prefix `EL`)
- **Statute**: Νόμος 2859/2000 (VAT Code). AADE is post-2017 successor to General Secretariat of Public Revenue — stable since 2017.
- **Algorithm verified ✅**: Iterative `s = s*2 + d` over 8 digits, then `(s*2) mod 11 mod 10`. All 5 vectors match. Reproduces canonical `EL094259216` → check `6`.
- **python-stdnum oracle**: `stdnum/gr/vat.py` (not live-checked).
- **EL/GR prefix handling**: doc handles correctly (accept both on input, normalize to `EL` on output, country field stays `GR`, file lives at `src/countries/gr/vat.ts`). This is the #1 historical EU-VAT bug; doc addresses it explicitly. The proposed `tests/cross-vat/vies-prefix.test.ts` is essential.
- **Naming**: recommend `GR_VAT` (not `GR_AFM`) for batch symmetry. AFM appears as alias in spec header + i18n labels.

### CZ_DIC
- **Statute**: Zákon č. 235/2004 Sb. §94–95. Finanční správa identity stable.
- **Algorithm verified ✅ (8-digit legal-entity branch)**: weights `[8,7,6,5,4,3,2]`, `(11-s) mod 11` with `0→1` substitution before `mod 10`, first-digit ≠ 9. All 5 vectors match.
- **python-stdnum oracle**: `stdnum/cz/dic.py` (not live-checked — flagged complex).
- **Test vector spot-check**: body `2512389`: `8·2+7·5+6·1+5·2+4·3+3·8+2·9 = 121`; `(11 - 121 mod 11) mod 11 = 0 → 1 → mod 10 = 1`. Matches `CZ25123891`. ✓
- **SCOPE NARROWING (recommendation, not blocker)**: ship only the 8-digit legal-entity branch in v1.7. Defer the 9-digit "special natural person" + 10-digit RČ branches to v1.8 alongside `CZ_RC`. Rationale: RČ branches need a full date validator with +50/+20 month offsets which fits v1.8 personal-ID batch; shipping partial RČ creates awkward branching that we'll want to refactor when `CZ_RC` lands.

### HU_VAT
- **Statute**: 2007. évi CXXVII. törvény (VAT Act) §178. NAV stable. `nav.gov.hu` matches existing regex — no edits.
- **Algorithm verified ✅**: weights `[9,7,3,1,9,7,3,1]` over 8 digits, sum mod 10 = 0. All 5 vectors match. Canonical `HU12892312` reproduces.
- **python-stdnum oracle**: `stdnum/hu/anum.py` (not live-checked).
- **Naming**: recommend `HU_VAT` (matching batch). Hungarian `közösségi adószám` has no short native abbrev internationally recognised.

### RO_VAT
- **Statute**: Legea nr. 227/2015 (Codul fiscal) art. 316. ANAF stable.
- **Algorithm verified ✅**: pad-to-9 with leading zeros, weights `[7,5,3,2,1,7,5,3,2]`, `check = (10·s) mod 11 mod 10`. All 5 vectors recompute including worked example `1854729 → 0`.
- **python-stdnum oracle**: `stdnum/ro/cf.py` (wrapper) + `stdnum/ro/cui.py` (algorithm). Not live-checked.
- **Test vector spot-check**: body `12345` pads to `000012345`. `s = 7·0+5·0+3·0+2·0+1·1+7·2+5·3+3·4+2·5 = 52`. `(10·52) mod 11 = 520 mod 11 = 3`. `mod 10 = 3`. ✓
- **Naming**: `RO_VAT` (per prompt). Disclose synonyms CUI / CIF / CF in header.

### BG_VAT
- **Statute**: ЗДДС чл. 94. NRA stable.
- **Algorithm verified ✅ (9-digit legal-entity)**: weights `(i+1)` over 8 body digits, mod 11; if 10, retry with weights `(i+3)`. All 5 vectors match.
- **python-stdnum oracle**: `stdnum/bg/vat.py` (flagged complex, not live-checked).
- **SCOPE NARROWING**: doc proposes 9-digit legal-entity only, defer 10-digit branch (EGN/PNF/other) to v1.8 alongside `BG_EGN`. **Strongly concur**. Three sub-branches in 10-digit, depends on EGN validator that doesn't exist in v1.7. Do not ship partial.
- **Test vector spot-check**: body `17507475`: `1·1+2·7+3·5+4·0+5·7+6·4+7·7+8·5 = 178`. `178 mod 11 = 2`. Check = 2. Matches `BG175074752`. ✓

### HR_OIB
- **Statute**: Zakon o osobnom identifikacijskom broju, NN 60/2008. Statute explicitly cites ISO/IEC 7064.
- **Algorithm verified ✅**: ISO/IEC 7064 MOD 11,10 over 10 body digits. All 5 vectors match. Reproduces `HR33392005961`.
- **python-stdnum oracle**: `stdnum/hr/oib.py` (flagged complex, not live-checked).
- **Refactor sequencing**: doc proposes hoisting `computeMod1110DV` from `de/ustid.ts` to `src/algorithms/iso7064.ts` and making it generic over body length. **First commit of v1.7**, before HR_OIB consumes it. DE test suite re-runs against hoisted helper proves the move was lossless.

### SK_DPH
- **Statute**: Zákon č. 222/2004 Z. z. §4. Finančná správa stable.
- **Algorithm verified ✅**: Full 10-digit value divisibility by 11 (no separate check digit). All 5 vectors divisible.
- **python-stdnum oracle**: `stdnum/sk/dph.py` (not live-checked).
- **Structural constraints verified**: first digit `[1-9]`, third digit (idx 2) ∈ `{2,3,4,7,8,9}`. Regex `/^SK[1-9]\d{1}[234789]\d{7}$/` enforces both.
- **SCOPE NARROWING**: reject python-stdnum's "RČ-might-also-be-VAT" fallback in v1.7. Slovak RČ-as-VAT is a v1.8 concern.

### SI_DDV
- **Statute**: ZDDV-1, Uradni list RS 117/06. FURS stable. `fu.gov.si` matches existing regex.
- **Algorithm verified ✅**: weights `[8,7,6,5,4,3,2]`, `check = 11 - (s mod 11)`, `10 → 0`. All 5 vectors match. Canonical `SI50223054`.
- **python-stdnum oracle**: `stdnum/si/ddv.py` (not live-checked).
- **⚠️ Doc bug observation**: SI table contains a mid-table arithmetic correction for body `9876543`. The corrected value is `check=4` (re-derived: `s = 8·9+7·8+6·7+5·6+4·5+3·4+2·3 = 238`; `238 mod 11 = 7`; `11-7 = 4`). **Action**: the test-vector JSON committed to `tests/fixtures/vat/si.json` must use `4`, not the initial mistaken `8`. Add a comment to the fixture file noting the doc had an in-line correction so a future reader doesn't propagate the wrong value.

### LT_PVM
- **Statute**: Lietuvos Respublikos PVM įstatymas art. 71. VMI stable.
- **Algorithm verified ✅**: weights cycle `[1,2,3,4,5,6,7,8,9,1,2,…]`; if mod-11 returns 10, fallback weights `[3,4,5,6,7,8,9,1,2,3,4,…]`. Final mod-11 then mod-10. All 5 nine-digit + both 12-digit vectors recompute.
- **python-stdnum oracle**: `stdnum/lt/pvm.py` (not live-checked).
- **Structural constraint verified**: position 7 of 9-digit form (and position 10 of 12-digit) must be `1`. Both 12-digit vectors satisfy.

### LV_PVN
- **Statute**: Pievienotās vērtības nodokļa likums, LV 197/2012. VID stable. `vid.gov.lv` matches existing regex.
- **Algorithm verified ✅ (legal-entity)**: weights `[9,1,4,8,3,10,2,5,7,6,1]` over 11 digits, sum mod 11 = 3. All 5 vectors match.
- **python-stdnum oracle**: `stdnum/lv/pvn.py` (not live-checked).
- **Confidence: moderate**. Correct: python-stdnum's own comment states the natural-person branch algorithm "has not been confirmed by an independent source". Spec prose should attribute uncertainty to natural-person branch and confirm legal-entity branch as VID-documented.

### EE_KMKR
- **Statute**: Käibemaksuseadus (RT I 2003, 82, 554) §20. MTA stable.
- **Algorithm verified ✅**: weights `[3,7,1,3,7,1,3,7,1]` over 9 digits including check, sum mod 10 = 0. All 5 vectors match. Canonical `EE100594102` reproduces.
- **python-stdnum oracle**: `stdnum/ee/kmkr.py` (not live-checked).

### MT_VAT
- **Statute**: Value Added Tax Act Cap. 406. CFR (Commissioner for Revenue) is post-2012 successor to VAT Department, stable since merger. `cfr.gov.mt` matches existing regex.
- **Algorithm verified ✅**: weights `[3,4,6,7,8,9,10,1]` over 8 digits, sum mod 37 = 0. All 6 vectors (including worked example) match.
- **python-stdnum oracle**: `stdnum/mt/vat.py` (flagged complex, not live-checked).
- **Test vector spot-check**: body `1167911`: `3·1+4·1+6·6+7·7+8·9+9·1+10·1 = 183`. `183 mod 37 = 35` (`37·4=148`, `183-148=35`). Check = `(-35) mod 37 = 2`. ✓
- **Quirk concur**: mod-37 means ~73% of random 7-digit bodies have a required check ≥10 (not representable as single digit) — validator legitimately rejects them. Tune property-test budget accordingly (or seed valid bodies via inverse-table).

### CY_VAT
- **Statute**: Ν. 95(I)/2000. `mof.gov.cy` matches existing regex.
- **Algorithm verified ✅**: positional translation table for even-indexed digits (0,2,4,6), raw value for odd-indexed (1,3,5,7), sum mod 26 → letter `A..Z`. All 5 vectors recompute including canonical `CY10259033P`.
- **python-stdnum oracle**: `stdnum/cy/vat.py` (flagged complex, not live-checked).
- **Reserved-prefix verified**: first two digits cannot be `12`. Doc enforces this in `validate()` body (correct — maps cleanly to `invalid_format`), NOT the regex.
- **Test vector spot-check**: body `10259033`: even positions 0,2,4,6 → digits `1,2,9,3` → translated `0,5,21,7` sum `33`. Odd positions 1,3,5,7 → digits `0,5,0,3` sum `8`. Total `41`. `41 mod 26 = 15`. Alphabet[15] = `P`. ✓

### IS_VSK
- **Statute**: Lög um virðisaukaskatt nr. 50/1988. RSK stable.
- **Algorithm**: format-only (no checksum). Verified: 5/6 digits, all digits.
- **python-stdnum oracle**: `stdnum/is_/vsk.py` (note underscore — `is` is Python keyword). Not live-checked.
- **Confidence: moderate**. Correct: no algorithm to fail means no `high` defensibility. Header MUST disclose "no checksum, format-only, EEA but NOT in VIES".

---

## Critical issues (must fix before implementing)

1. **`gv.at` TLD suffix [P0 blocker]**. Existing governance regex `/(?:^|\.)gov\.[a-z]{2,3}$/i` does NOT match `bmf.gv.at`. Without `/(?:^|\.)gv\.at$/i` added to `ISSUER_TLD_SUFFIXES`, AT_UID fails CI. Research doc flags this as risk #13.

2. **SI vector copy-paste hazard**. Research doc's SI table contains a mid-table arithmetic correction for body `9876543`. Corrected value is `check=4`. Mechanical copy into `tests/fixtures/vat/si.json` will ship `8` (wrong). Add fixture-file comment noting the doc had an in-line correction.

3. **CZ scope narrowing (recommendation, not blocker)**. Reduce v1.7's `CZ_DIC` to 8-digit legal-entity only. Defer 9-digit "special natural person" + 10-digit RČ branches to v1.8 alongside `CZ_RC`. RČ requires a Czech-RČ date validator with +50/+20 month offsets — closer to v1.8 personal-ID batch in scope.

4. **BG scope narrowing**. Ship 9-digit legal-entity only. Defer 10-digit EGN/PNF/other branch to v1.8 alongside `BG_EGN`. Three sub-branches, depends on EGN validator that doesn't exist in v1.7.

5. **HR_OIB refactor sequencing**. Hoist `computeMod1110DV` from `de/ustid.ts` to `src/algorithms/iso7064.ts` as the FIRST commit of v1.7. Make it length-generic. DE test suite must remain green before HR_OIB consumes the helper.

---

## Cross-cutting verification

- **Greek EL/GR prefix handling — verified correct ✅**. Accept both `EL` and `GR` on input, normalize to `EL` on output, file path under `src/countries/gr/`, spec `country` field stays `"GR"`, raw regex requires `EL`. Proposed `tests/cross-vat/vies-prefix.test.ts` is essential.

- **Northern Ireland `XI` scope — verified correct decision ✅**. XI is a UK post-Brexit carve-out under Windsor Framework (effective 2024-Q1). XI numbers share GB VAT format. Windsor Framework did NOT change XI VAT namespace. Deferring XI to v1.8 as a GB variant is the right call. Document XI as explicit non-feature in `gb/vat.ts` header and CHANGELOG.

- **Subpath proposal soundness — verified ✅**. Per-country imports remain canonical; additive `nationid/vat` aggregator at `src/vat/index.ts` is pure re-exports. Tree-shaking preserved. No two-canonical-paths foot-gun.

- **Governance regex completeness — needs the additions below**:

  **Required (not in current allowlist)**:
  ```
  revenue.ie  ·  bmf.gv.at  ·  usp.gv.at
  public.lu  ·  pfi.public.lu  ·  guichet.public.lu
  aade.gr  ·  gsis.gr
  financnisprava.cz  ·  adisspr.mfcr.cz
  anaf.ro
  nra.bg
  porezna-uprava.hr
  financnasprava.sk
  vmi.lt
  emta.ee
  legislation.mt
  skatturinn.is  ·  rsk.is
  ```

  **Optional** (or substitute with EU-statute regexes in `STATUTE_PATTERNS`):
  ```
  ec.europa.eu  ·  eur-lex.europa.eu
  ```

  **Suggested STATUTE_PATTERNS additions**:
  ```ts
  /\bDirective 2006\/112\/EC/i,
  /\bCouncil Regulation \(EU\) No \d+\/\d+/i,
  /\bZákon č\. \d+\/\d+ Sb\./i,    // CZ
  /\bZákon č\. \d+\/\d+ Z\. z\./i, // SK
  /\bLög nr\. \d+\/\d+/i,           // IS
  ```

  **Already covered by existing `gov.<cc>` suffix regex** (no edits needed):
  `nav.gov.hu` · `vid.gov.lv` · `cfr.gov.mt` · `mof.gov.cy` ·
  `taxnet.mof.gov.cy` · `fu.gov.si`.

---

## Open questions for the implementer

1. **Code naming convention** (lock before any i18n keys added). Two options:

   - **(a)** Native abbreviations everywhere: `LU_TVA`, `GR_AFM`, `HU_ANUM`, `RO_CF`, `CZ_DIC`, `SK_DPH`, `SI_DDV`, `LT_PVM`, `LV_PVN`, `EE_KMKR`, `MT_VAT`, `CY_VAT`, `AT_UID`, `IE_VAT`, `BG_VAT`, `HR_OIB`, `IS_VSK`.
   - **(b) [Recommended]** `<CC>_VAT` everywhere EXCEPT where native abbreviation is universally recognised internationally: `AT_UID`, `CZ_DIC`, `HR_OIB`. All others → `<CC>_VAT` (`GR_VAT`, `HU_VAT`, `RO_VAT`, `LU_VAT`, `BG_VAT`, `MT_VAT`, `CY_VAT`, `IE_VAT`, `IS_VSK`, `SK_VAT`, `SI_VAT`, `LT_VAT`, `LV_VAT`, `EE_VAT`).

   Decision affects i18n keys (`documents.<CODE>.label`), spec file names, and the public API surface. Rename PR later is larger.

2. **CZ branch decision** (per Critical Issue #3): legal-entity only in v1.7, or all three branches?

3. **`format()` mask per spec**: research doc shows masks for IE/AT/LU but not every spec. Convention to lock: "use issuer's published display mask if any, otherwise just `<CC> <body>`". Examples:
   - AT: `ATU 1234 5678`
   - LU: `LU 150 274 42`
   - HU: `HU 12345678`
   - HR: `HR 12345678901`

4. **Property-based testing budget for MT**: mod-37 means ~73% of random 7-digit bodies rejected. Tune fast-check `numRuns` for MT specifically, or seed valid bodies via inverse-table.

5. **`is_` directory in python-stdnum**: upstream uses `stdnum/is_/vsk.py` (Python keyword). nationid uses `is` (ISO 3166) for the country dir. No source-of-truth conflict, but flag in spec header so a future reader doesn't propose a rename.

6. **Live URL audit**: before merging implementation PR, `curl --silent --head --fail` against the 19 new allowlist domains + python-stdnum file URLs. Add as CI step.

---

## Recommended action

**Ship v1.7 with the following narrowed scope and four pre-conditions met:**

### Pre-conditions (do these IN ORDER as separate commits, before any spec lands)

1. Add `/(?:^|\.)gv\.at$/i` to `ISSUER_TLD_SUFFIXES` and the 19 new domains to `ISSUER_ALLOWLIST_DOMAINS` in `tests/governance/confidence-citations.test.ts`. Single commit. CI proves no existing test regression.
2. Add EU/CZ/SK/IS statute regexes to `STATUTE_PATTERNS` (Directive 2006/112/EC, Council Regulation (EU) No 904/2010, Zákon č. NN/YYYY Sb., Zákon č. NN/YYYY Z. z., Lög nr. NN/YYYY). Same PR or split, no functional change.
3. Hoist `computeMod1110DV` from `de/ustid.ts` to `src/algorithms/iso7064.ts`. Make length-generic. DE test suite remains green.
4. Decide and lock the code-naming convention (Open Q #1).

### Spec scope

- **Ship all 17** at the confidence tiers in the verdict matrix (15 high + 2 moderate).
- **Narrow CZ_DIC** to 8-digit legal-entity only.
- **Narrow BG_VAT** to 9-digit legal-entity only.
- **Defer XI** to v1.8 as `GB_VAT` variant.

### Quality bar

The research document is high-quality. All 78 published test vectors recompute correctly from documented algorithms. All 9 canonical reference vectors widely cited in the VAT-validation ecosystem also reproduce. EL/GR and XI scope decisions are correct. Governance-test gaps (specifically `gv.at`) identified accurately. The two `moderate` tiers (LV, IS) are well-justified.

**Verdict**: implementation may begin once the four pre-conditions land and the naming-convention decision is made.

---

## Provenance

- Subject document: [`eu-vat-batch.md`](./eu-vat-batch.md) (1499 lines, 8006 words, produced 2026-05-23 by research-analyst with live web access).
- Verification: 2026-05-24 by independent research-analyst (WebFetch/WebSearch unavailable in verifier environment; all arithmetic re-derived offline; 78 vectors + 9 canonical anchors all match).
- Reference files for the implementer:
  - `tests/governance/confidence-citations.test.ts` (lines 62–142 = lists that need extending).
  - `src/countries/de/ustid.ts` — source of `computeMod1110DV` helper that HR_OIB should reuse after hoisting.
  - `src/countries/{at, bg, cy, cz, ee, gr, hr, hu, ie, is, lt, lu, lv, mt, ro, si, sk}/` need to be created for v1.7.
