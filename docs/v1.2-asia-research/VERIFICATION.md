# Asia phase 2 — research verification synthesis

> Read this file BEFORE implementing any spec from `jp.md`, `kr.md`, `sg.md`,
> or `tw.md`. Three independent `research-analyst` agents cross-checked each
> research doc against first-party and cross-library sources on 2026-05-23.
> Findings are recorded as deltas to apply on top of the original research.
>
> The original research docs are preserved for provenance — they reflect what
> we knew before verification. This file is the diff between research and
> reality. When the two disagree, **this file wins**.

---

## Verdict matrix

| Spec             | Ship at | Action before implementing                                          |
| ---------------- | ------- | ------------------------------------------------------------------- |
| `JP_MY_NUMBER`   | high    | Update statute citation + python-stdnum oracle (see §JP-1).          |
| `JP_CORPORATE_NUMBER` | high | Replace statute citation + fix python-stdnum module name (§JP-2).    |
| `KR_RRN`         | high    | Add 2020 randomization callout (§KR-1).                              |
| `KR_BRN`         | high    | Tighten JSDoc on algorithm-source provenance (§KR-2).                |
| `KR_PASSPORT`    | low     | Defer to v1.4+ (no public algorithm beyond ICAO 9303 MRZ).           |
| `SG_NRIC`        | high    | Repair dead ICA permalink (§SG-1).                                   |
| `SG_FIN` (F, G)  | high    | Cite OECD CRS Singapore-TIN PDF in addition to ICA statute (§SG-2).  |
| `SG_FIN` (M)     | moderate | The python-stdnum oracle the research doc cites does NOT exist — see §SG-3. |
| `SG_UEN` (all 3) | high    | **Upgrade** from research doc's `hasCheckDigit: false` to `true` — python-stdnum ships a working algorithm for all 3 categories (§SG-4). |
| `TW_UBN`         | high    | Drop or cite the "2023-09-01 MOF expansion" claim — currently unverified (§TW-1). |
| `TW_NID`         | high    | Replace `python-stdnum/tw/twid.py` oracle (doesn't exist) with `enylin/taiwan-id-validator` (§TW-2). |
| `TW_ARC` (post-2021) | high | **Critical: research doc inverts old/new formats.** Swap before implementing (§TW-3). |
| `TW_ARC` (legacy) | moderate | Keep, but under the corrected label (§TW-3).                       |

---

## Japan

### §JP-1 — `JP_MY_NUMBER` statute + oracle fixes

**Research doc cites:**
- Short title `個人番号の指定に関する省令` for the algorithm-defining ordinance.
- Claims python-stdnum "does NOT currently ship a `my_number` module as of v1.20".

**Verified reality:**
- The algorithm is defined in **平成26年総務省令第85号 第5条**, full title:
  「行政手続における特定の個人を識別するための番号の利用等に関する法律の規定による通知カード及び個人番号カード並びに情報提供ネットワークシステムによる特定個人情報の提供等に関する省令」
  Citation source: JA Wikipedia, 個人番号 §チェックデジット, which transcribes the gazette.
- python-stdnum **ships** `stdnum/jp/in_.py` (added 2025 by Luca Sicurello).
  Master branch: <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/jp/in_.py>. Weight vector `(6,5,4,3,2,7,6,5,4,3,2)` left-to-right with `r ≤ 1 → 0` substitution agrees byte-for-byte with the research doc.

**Action when implementing:**
1. JSDoc statute line: `Algorithm: 平成26年総務省令第85号 第5条 (Ministerial Ordinance, Ministry of Internal Affairs and Communications)`.
2. Cross-validate against `stdnum/jp/in_.py` doctests (sample `621498320257`). Drop the "does NOT ship" sentence in the JSDoc.

### §JP-2 — `JP_CORPORATE_NUMBER` statute + oracle fixes

**Research doc cites:**
- `国税庁告示第31号 (平成26年9月10日)` as the algorithm authority.
- `python-stdnum/stdnum/jp/corporate_number.py` as the oracle.

**Verified reality:**
- The algorithm is in **「法人番号の指定等に関する省令」第3条** (Ministerial Ordinance on the Designation of Corporate Numbers, METI/MOF). The "国税庁告示第31号" line is not supported by a first-party verification trail; possible confusion with the MIC ordinance also dated 2014-09-10.
- python-stdnum's module is named **`stdnum/jp/cn.py`** (not `corporate_number.py`).
  Source: <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/jp/cn.py>.
- NTA's own corporate number `7000012050002` resolves to "国税庁" on the live `houjin-bangou.nta.go.jp` registry (verified 2026-05-23).

**Action when implementing:**
1. JSDoc statute line: `Algorithm: 法人番号の指定等に関する省令 第3条 (Ministerial Ordinance on Designation of Corporate Numbers, Article 3).`
2. Cross-validate against `stdnum/jp/cn.py` doctests (sample `5835678256246`).
3. Governance regex (already in research doc draft) covers `houjin-bangou.nta.go.jp` and `digital.go.jp` — both pass without further changes.

### JP test vectors (verified)

Both spec docs' hand-derived vectors all pass against python-stdnum:
- My Number boundaries `40000000005 → 0`, `00000000000 → 0` + stdnum sample `621498320257`.
- Corporate Number including in-line correction `987654321098 → 3987654321098` and stdnum sample `5835678256246`.

---

## South Korea

### §KR-1 — `KR_RRN` 2020 randomization callout

**Research doc gap:** §Algorithm presents the formula as static since 1975, with no mention of the 2020-10-05 MOIS reform that randomized positions 8–12.

**Verified reality (OECD CRS Korea-TIN PDF + MOIS 2020-05-25 notice):**
- The 2020 reform abolished only the regional code at positions 8–11 and replaced it with random digits (임의번호).
- Position 13 (the check digit) is still deterministically computed from the now-random positions 8–12. The MOIS weighted-sum mod 11 algorithm is unchanged.
- Sex/century table 1–8 unchanged. Codes 9/0 (1800s historic) are out of OECD CRS scope but still issued for the few centenarian holders in the MOIS database.

**Action when implementing:**
JSDoc note under §Algorithm:
> 주민등록법 시행령 Annex 1 weighting has been unchanged since 1975. The MOIS reform announced 2020-05-25 randomized positions 8–12 from 2020-10-05 onward; position 13 is still the deterministic check digit and MUST be verified.

With this note `confidence: "high"` is defensible.

### §KR-2 — `KR_BRN` JSDoc provenance tightening

**Research doc gap:** Claims `confidence: "high"` while the checksum algorithm is universally implemented across Korean tax software but **not** published in 부가가치세법 시행령 Article 11.

**Verified reality:**
- python-stdnum `stdnum/kr/brn.py` validates layout, tax-office code, type, and serial but **does not compute the check digit** — research doc's gap claim is correct.
- The weights `(1,3,7,1,3,7,1,3,5)` + `d_9·5` carry are correct (hand-verified against `116-82-00276` 삼성전자 → check = 6; `134-86-72683` → check = 3).

**Action when implementing:**
JSDoc tightening:
> Structural layout per 부가가치세법 시행령 Article 11. Check-digit algorithm not in the public 시행령; algorithm verified by convergence across Korean tax software, OECD CRS doctests, and known-good BRNs `116-82-00276` (Samsung Electronics) and `134-86-72683`.

With this note, `confidence: "high"` stands as documented engineering convergence.

### §KR-3 — Deferred: `KR_PASSPORT` and partial-RRN mode

- **`KR_PASSPORT`**: M/G/D/R series, 9 chars `[A-Z]\d{3}[A-Z]\d{4}`, no internal check digit beyond ICAO 9303 MRZ. Defer to v1.4+ as `confidence: "low"`.
- **Partial-RRN mode for PIPA**: many services collect only `YYMMDD-G` (7 chars) for KYC. Library currently has no exposed mode for this. Defer as a separate v1.3 enhancement.

### KR governance regex additions (apply with the implementation)

```ts
/(?:^|\.)go\.kr$/i,                    // .go.kr top-level
/시행령|Act\s+No\.\s+\d+|시행규칙/,      // Korean statutes
```

---

## Singapore

### §SG-1 — `SG_NRIC` dead permalink

**Research doc cites:** `https://www.ica.gov.sg/news-and-publications/newsroom/media-release/new-fin-format-from-1-january-2022` (404 as of 2026-05-23).

**Action when implementing:**
Replace with `https://web.archive.org/web/2022*/https://www.ica.gov.sg/*` snapshot OR with the dated `gov.sg` press release index entry. Confirm the link returns 200 before the governance test runs in CI.

Statute citation `National Registration Act 1965 (Cap. 201, 2020 Rev. Ed.)` at `https://sso.agc.gov.sg/Act/NRA1965` is **stable and verified**. Governance regex `gov.sg` already covers it.

### §SG-2 — Strengthen citation with OECD CRS

OECD CRS Singapore-TIN PDF is referenced by python-stdnum and provides a strong cross-citation. URL: `https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Singapore-TIN.pdf`. Add as a secondary source.

### §SG-3 — `SG_FIN` M-prefix oracle problem

**Research doc claims:** `python-stdnum/stdnum/sg/nric.py v1.18+` is the oracle for the M-prefix table and `+3` offset.

**Verified reality:**
- `python-stdnum/stdnum/sg/` ships **only** `__init__.py` and `uen.py`. There is **no** `nric.py` module.
- M-prefix table `KLJNPQRTUWX` and the `+3` offset are community-reverse-engineered without a first-party algorithmic citation.

**Action when implementing:**
1. **Downgrade `SG_FIN` M-prefix to `confidence: "moderate"`** in `nationid` until a vetted oracle is located.
   Candidates to evaluate before downgrading-permanently:
   - Ruby `stdnum` gem (active community fork).
   - Go community libs (search `github.com/ … singapore fin`).
   - ICA explicit publication of the algorithm.
2. F-prefix and G-prefix tier remains `high` (community standard, validated by every Singapore bank for 30+ years).

### §SG-4 — `SG_UEN` upgrade (CRITICAL for shipping)

**Research doc recommends:** `hasCheckDigit: false`, conservative posture, claims python-stdnum does NOT ship a SG UEN module.

**Verified reality (corrects research doc):**
- `python-stdnum/stdnum/sg/uen.py` **ships and is mature since 2020**. Source: <https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/sg/uen.py>.
- Algorithm constants for **all three** UEN categories are explicit:

  | Category | Weights | Mapping table / formula |
  | -------- | ------- | ----------------------- |
  | Business (ACRA, pre-2009) | `(10,4,9,3,8,2,7,1)` mod 11 | table `XMKECAWLJDB` |
  | Local Company (UEN-LC) | `(10,8,6,4,9,7,5,3,1)` mod 11 | table `ZKCMDNERGWH` |
  | Other Entity (UEN-OE) | `(4,3,5,3,10,2,2,5,7)` over alphabet `ABCDEFGHJKLMNPQRSTUVWX0123456789` | `(sum - 5) mod 11` |

  Doctest fixtures: `S16FC0121D` and `T01FC6132D`.

**Action when implementing:**
1. **Set `hasCheckDigit: true`** for all three UEN categories.
2. Set `confidence: "high"` for all three.
3. Use `python-stdnum/stdnum/sg/uen.py` as the cross-reference oracle. Doctest fixtures lock in algorithm; recompute checksum match against ~10 known-good UENs from `bizfile.gov.sg`.
4. **Reconcile the entity-type code list**. The research doc lists 32 codes; python-stdnum lists 38 (extras: `CM, CP, CX, DP, FB, TC, NR`). Snapshot the live list from `https://www.uen.gov.sg/` before merging; record the snapshot date in JSDoc.

---

## Taiwan

### §TW-1 — `TW_UBN` "2023-09-01 MOF expansion" claim is unverified

**Research doc claims:** 2023-09-01 MOF expanded the digit-7 dual-checksum rule.

**Verified reality:**
- No first-party MOF PDF or 官報 entry confirms this 2023 change.
- python-stdnum's `tw/ubn.py` has not been touched for algorithmic logic since 2020-04-05.
- Existing algorithm: digit-7 special rule (when `d[6]=='7'`, accept `sum mod 10 ∈ {0, 9}`) is the current spec and matches the doc's worked example `12345675`.

**Action when implementing:**
Either:
- Cite the MOF document title (likely `營利事業統一編號檢查碼邏輯修正說明`) WITH date and URL; OR
- Remove the 2023 expansion claim entirely. The pre-2023 rule is the current rule.

With the claim removed, `confidence: "high"` stands via `etax.nat.gov.tw` + `einvoice.nat.gov.tw` + python-stdnum cross-validation.

### §TW-2 — `TW_NID` oracle replacement

**Research doc cites:** `python-stdnum/tw/twid.py` as oracle.

**Verified reality:**
- `python-stdnum/stdnum/tw/` ships **only** `__init__.py` and `ubn.py`. There is **no** `twid.py` or `nid.py`.
- Functional oracle: `enylin/taiwan-id-validator` (TypeScript, npm, MIT, actively maintained).
  Source: <https://github.com/enylin/taiwan-id-validator/blob/main/src/id-card-number.ts>.
- Letter-pair table (`I=34, O=35, W=32, X=30, Y=31, Z=33`) and weights `[1,9,8,7,6,5,4,3,2,1,1]` verified.

**Action when implementing:**
Replace the oracle reference. Cite `enylin/taiwan-id-validator` in JSDoc. Sample `A123456789` is the canonical test value.

### §TW-3 — `TW_ARC` old/new format INVERSION (CRITICAL)

**Research doc says:**
- "**New (post-2021-01-02)** — `^[A-Z][A-D]\d{8}$`"
- "**Old (pre-2021, legacy)** — `^[A-Z][89]\d{8}$`"

**Verified reality (Wikipedia + enylin/taiwan-id-validator + MOI 2021 reform):**
- **OLD** (pre-2021): two-letter prefix → `^[A-Z][A-D]\d{8}$`. enylin: `oldFormat: /[A-Z][A-D]\d{8}/`.
- **NEW** (post-Jan 2, 2021): one letter + 9 digits with digit-2 in `{8, 9}` → `^[A-Z][89]\d{8}$`. enylin: `newFormat: /[A-Z][89][0-6]\d{7}/`. This aligns with the National ID Card format, sharing the same algorithm but with digit-2 in `{8, 9}` instead of `{1, 2}`.

**Impact if shipped as-is:** every post-2021 ARC would be rejected and every legacy ARC would be accepted — opposite of intended UX.

**Action when implementing:**
1. **Swap the format labels** in the research doc / JSDoc / regex constants.
2. Post-2021 `TW_ARC` shares the `TW_NID` algorithm; only the digit-2 set differs (`{8,9}` vs `{1,2}`). Implement as the SAME function with parameterized digit-2 set.
3. Worked example `AB12345677` in the research doc is a LEGACY-format example, not a post-2021 one. Replace with a post-2021 example computed via enylin's algorithm.
4. Legacy `TW_ARC` keeps `confidence: "moderate"` under the corrected label. Post-2021 ships at `confidence: "high"`.

### §TW-4 — Live registry cross-check (pre-merge)

Before merging the TW PR, cross-check 3–5 real entities (e.g. well-known public companies for `TW_UBN`) against `gcis.nat.gov.tw` so the algorithm is validated against the actual public registry, not only against test fixtures.

---

## Cross-cutting findings

### Governance citation regex (incremental additions)

Apply on top of the existing `tests/governance/confidence-citations.test.ts` allowlist:

```ts
// Japan
/(?:^|\.)go\.jp$/i,
/(?:^|\.)digital\.go\.jp$/i,
/houjin-bangou\.nta\.go\.jp/i,
/平成\d+年[総財政省]+省令第\d+号/,
/法人番号の指定等に関する省令/,

// Korea
/(?:^|\.)go\.kr$/i,
/시행령|시행규칙/,
/Act\s+No\.\s+\d+/,            // OECD-style English statute reference

// Singapore (already mostly covered by gov.sg)
/(?:^|\.)gov\.sg$/i,
/sso\.agc\.gov\.sg\/Act\//i,
/NRA1965|UEN_Act/,             // statute identifiers
/Singapore-TIN\.pdf/,          // OECD CRS reference

// Taiwan
/(?:^|\.)gov\.tw$/i,
/(?:^|\.)nat\.gov\.tw$/i,
/中華民國身分證/,
/營利事業統一編號/,
```

Add as a single PR alongside the first Asia-phase-2 country.

### Oracle library matrix (final)

| Country | First-party citation | Cross-library oracle (use in CI) |
| ------- | -------------------- | -------------------------------- |
| JP — My Number | 平成26年総務省令第85号 第5条 | `python-stdnum/stdnum/jp/in_.py` |
| JP — Corporate Number | 法人番号の指定等に関する省令 第3条 + 法人番号公表サイト | `python-stdnum/stdnum/jp/cn.py` |
| KR — RRN | 주민등록법 시행령 + MOIS 2020-05-25 notice | `python-stdnum/stdnum/kr/rrn.py` |
| KR — BRN | 부가가치세법 시행령 Article 11 | engineering convergence (python-stdnum BRN does not compute check digit) |
| SG — NRIC/FIN | National Registration Act 1965 + OECD CRS Singapore-TIN PDF | community standard (no python-stdnum module) |
| SG — UEN | UEN Act + `uen.gov.sg` | `python-stdnum/stdnum/sg/uen.py` (CRITICAL UPGRADE) |
| TW — UBN | `etax.nat.gov.tw` + `einvoice.nat.gov.tw` | `python-stdnum/stdnum/tw/ubn.py` |
| TW — NID/ARC | MOI 2021 reform + 中華民國身分證 | `enylin/taiwan-id-validator` (NPM TS lib) |

### Test-fixture rule (re-statement)

Every Asia-phase-2 PR must include:
- ≥5 synthetic-but-valid fixtures per spec, **flagged as synthetic in JSDoc**.
- At least 1 cross-library oracle agreement test per spec where an oracle exists.
- For any spec without a first-party algorithm publication (e.g. `KR_BRN`), explicit JSDoc engineering-convergence note as in §KR-2.

---

## Recommended v1.3 ordering

After research verification, the optimal ship order is:

1. **v1.3 — Japan** (JP_MY_NUMBER + JP_CORPORATE_NUMBER). Lowest-risk Asia-phase-2 country: two algorithms, both with first-party citations after the §JP-1/§JP-2 fixes, both with a maintained python-stdnum oracle. ~1 day implementation; mirrors `nationid/in` shape.
2. **v1.4 — Singapore** (SG_NRIC + SG_FIN[F,G,M] + SG_UEN[3 categories]). 5 specs; the §SG-4 SG_UEN upgrade is meaningful new credibility (`high`/`hasCheckDigit: true`). M-prefix ships at `moderate` until a stronger oracle is located.
3. **v1.5 — South Korea** (KR_RRN + KR_BRN). 2 specs; the §KR-1 2020 randomization callout is the main pre-flight step. KR_PASSPORT and partial-RRN mode deferred.
4. **v1.6 — Taiwan** (TW_UBN + TW_NID + TW_ARC). 3 specs; the §TW-3 inversion is fixed pre-implementation and gates merge. Recommend a Taiwanese reviewer pass before publish.

Each release ships as one country + ~10 minutes of governance test additions.

---

## Provenance

- Research verification by 3 parallel `research-analyst` agents on 2026-05-23.
- Sources cross-referenced: OECD CRS TIN PDFs (KR, SG), python-stdnum master (commit refs via `api.github.com` directory listings), JA Wikipedia (法人番号, 個人番号), KO Wikipedia (주민등록번호), enylin/taiwan-id-validator master, ICA + 内政部 statute references.
- Original research docs (`jp.md`, `kr.md`, `sg.md`, `tw.md`) are preserved unchanged for audit trail. This file is the authoritative delta to apply on top of them.
