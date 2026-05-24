# 00 — Synthesis: world-document backlog for v1.7 → v2.x

> Cross-region synthesis of 4 parallel `research-analyst` agents that ran
> 2026-05-23 against Asia-Pacific (14), Rest-of-Europe (27), MENA (20), and
> Sub-Saharan Africa (24). **85 new countries** mapped at backlog depth
> (issuer, top documents, algorithm, oracle availability, confidence
> ceiling, effort estimate).
>
> Currently shipped: 35 countries (v1.0–v1.2). Already deep-researched and
> queued for v1.3-v1.6: JP, KR, SG, TW. This document plans v1.7 onward.

---

## Universe summary

| Region | Researched | Top-tier (S) | High-tier (A) | Total available specs (est.) |
|--------|-----------:|-------------:|--------------:|-----------------------------:|
| Asia-Pacific | 14 | 3 (ID, AU, CN) | 2 (MY, PH) | ~35 |
| Rest-of-Europe | 27 | 6 (RO, IE, CZ, GR, AT, plus EU-VAT batch) | 8 | ~60 |
| MENA | 20 | 2 (IL, TR) | 3 (EG, AE, SA) | ~30 |
| Sub-Saharan Africa | 24 | 2 (ZA, NG) | 2 (KE, GH) | ~25 |
| **Total new** | **85** | **13** | **15** | **~150** |

Plus 4 queued (JP/KR/SG/TW = ~12 specs) and 35 shipped (~125 specs).

**Realistic 18-month ceiling**: 35 (shipped) + 4 (queued v1.3-v1.6) + 28 (S/A
across all regions) = **67 countries × ~190 specs by mid-2027**. The
remaining 50 countries (~80 specs) defer to v2.x.

---

## Cross-region S-tier ranking (where to spend the next 60h)

Ranked by `(strategic value) / (implementation hours)`. Asia phase-2 already
queued (JP/SG/KR/TW = v1.3-v1.6) is not re-listed here.

| # | Country | Region | Specs | Effort | Strategic value | Oracle |
|--:|---------|--------|------:|-------:|-----------------|--------|
| 1 | **Israel (IL)** | MENA | 2 (`IL_TZ`, `IL_HP`) | 6h | Mature fintech; both `high`; stdnum oracle | `stdnum/il/{idnr,hp}.py` |
| 2 | **Turkey (TR)** | MENA | 2 (`TR_TCKN`, `TR_VKN`) | 8h | 85M pop, MERNIS public algorithm, large diaspora | `stdnum/tr/{tckimlik,vkn}.py` |
| 3 | **China (CN)** | APAC | 2 (`CN_RIC`, `CN_USCC`) | 14h | 1.41B pop, ISO 7064 algorithms, both `high`; PIPL story first | `stdnum/cn/{ric,uscc}.py` |
| 4 | **Australia (AU)** | APAC | 3 (`AU_TFN`, `AU_ABN`, `AU_ACN`) | 6h | Mature fintech, all 3 `high`, stdnum | `stdnum/au/*.py` |
| 5 | **Indonesia (ID)** | APAC | 2 (`ID_NIK`, `ID_NPWP`) | 8h | 280M pop, SE-Asia SaaS expansion; NPWP `high`, NIK format-only | `stdnum/id/{nik,npwp}.py` |
| 6 | **South Africa (ZA)** | SSA | 1 (`ZA_ID`) | 4h | Only African `high` ship; Luhn over 13 digits | `stdnum/za/idnr.py` |
| 7 | **Romania (RO)** | Europe | 3 (`RO_CNP`, `RO_CUI`, `RO_VAT`) | 6h | 19M, fintech/BPO; CNP well-documented | `stdnum/ro/*.py` |
| 8 | **Ireland (IE)** | Europe | 2 (`IE_PPS`, `IE_VAT`) | 6h | EU tech HQ (Stripe, Google, Meta) | `stdnum/ie/*.py` |
| 9 | **Egypt (EG)** | MENA | 2 (`EG_NID`, `EG_TIN`) | 5h | 110M, largest Arab market; stdnum handles eastern-Arabic numerals | `stdnum/eg/tn.py` |
| 10 | **Nigeria (NG)** | SSA | 2 (`NG_NIN`, `NG_BVN`) | 8h | 225M, fintech KYC ubiquitous; both `format-only` but high-value | community-only |

**S-tier subtotal**: 10 countries / 21 specs / **~71h** = ~6-9 release weeks at current cadence. Adds population coverage of **~2.95 billion people**.

---

## High-leverage batches (multipliers, not single countries)

Some batches deliver disproportionate value because one shared primitive
unlocks N countries.

### Batch 1 — **EU-VAT completion** (v1.7 candidate)

10–16 new VAT codes for currently-unshipped EU members: AT, BG, CY, CZ, EE,
GR, HR, HU, IE, LT, LU, LV, MT, RO, SI, SK. All have `python-stdnum/<cc>/vat.py`
or share the existing EU mod-N algorithms.

- **Effort**: 25-30h batched (vs ~5h each if shipped depth-first).
- **Marketing**: unlocks "EU VIES feature parity" claim independent of
  personal IDs. Single bullet in the announcement post.
- **Risk**: low — every VAT spec already validated upstream by stdnum.
- **Recommendation**: ship as **v1.7.0 "EU-VAT complete"**, then iterate
  personal IDs per country in v1.8+.

### Batch 2 — **JMBG core primitive** (v1.8 candidate)

Implementing the weighted mod-11 + region tables for the JMBG (former
Yugoslavia personal ID) once unlocks BA, MK, ME, RS, and reuses for HR
pre-OIB + SI EMSO + XK.

- **Effort**: 8h for the primitive + ~2h per country = 18h for 5 countries
  / 10 specs.
- **Strategic value**: completes the Balkans in one release.
- **Recommendation**: ship as **v1.8.0 "Balkans complete via JMBG"**.

### Batch 3 — **MENA Wave A** (v1.9 candidate)

5 highest-value MENA countries together (IL, TR, EG, AE, SA), per the MENA
agent's wave plan.

- **Effort**: 28h.
- **Coverage**: ~285M people, 4 `high`-confidence specs.
- **Recommendation**: ship as **v1.9.0 "MENA Wave A"** with a regional
  showcase update + RTL-safe i18n for the playground (one-time investment).

### Batch 4 — **APAC core** (v1.10 candidate)

ID + AU + CN + MY + PH in one release (or split across two minor versions).

- **Effort**: ~50h combined.
- **Coverage**: ~1.85B people across 5 specs that range high → format-only.
- **Risk**: 3 of 5 are format-only ceilings (ID NIK, MY NRIC, PH PCN) —
  load-bearing on the confidence framework.

### Batch 5 — **SSA Wave A** (v1.11 candidate)

ZA + NG + KE + GH + RW per SSA agent's plan.

- **Effort**: ~25h.
- **Caveat**: only ZA reaches `high`; the rest are `format-only` or
  `moderate` from community oracles.
- **Recommendation**: ship with prominent JSDoc + README confidence
  disclaimer explaining the publication asymmetry between African and
  LATAM/European IDs.

---

## Proposed release cadence v1.7 → v2.0

| Release | Theme | Countries / batches | Effort | Coverage delta |
|---------|-------|---------------------|-------:|----------------|
| v1.7.0 | EU-VAT complete | 10–16 VAT codes (no personal IDs) | 25-30h | EU-27 VIES parity claim |
| v1.8.0 | Balkans via JMBG | RS, BA, MK, ME (+optional XK placeholder) | 18h | 5 countries / 10 specs |
| v1.9.0 | MENA Wave A | IL, TR, EG, AE, SA | 28h + 8h RTL i18n | 5 countries / 9 specs / 285M pop |
| v1.10.0 | APAC core | AU + CN + ID + MY + PH | 50h | 5 countries / 12 specs / 1.85B pop |
| v1.11.0 | SSA Wave A | ZA + NG + KE + GH + RW | 25h | 5 countries / 8 specs / 425M pop |
| v1.12.0 | EU personal IDs catch-up | RO, IE, CZ, GR, AT, HU + others | 30h | 6 countries / 12 specs |
| **v2.0.0** | Stability re-promise + i18n expansion | API freeze v2 + Arabic/Hebrew/Chinese i18n locales + lazy REGISTRY | 40h | architectural release |

**Total v1.7 → v2.0**: ~220h spread across ~6 months at current cadence
(1-2 minor releases/month). Adds **~36 new countries × ~75 specs** on top
of the post-v1.6 baseline of 39 countries × ~137 specs → **~75 countries
× ~210 specs at v2.0**.

---

## Cross-cutting risks (must address before v1.7)

### 1. Confidence-tier framework is about to be load-bearing

Today 35/35 shipped countries have at least one `high`-confidence spec
backed by first-party citation. Post-v1.7 a significant fraction of new
countries (especially APAC + SSA + Gulf) will ship at `moderate` / `low` /
`format-only` ceilings.

**Action before v1.7**: README + showcase need a prominent visual
explanation of what `confidence: "format-only"` means and how a consumer
should layer additional verification (KYC vendor, government API, document
photo) on top. The governance test already enforces citation; the
**communication** to consumers needs an upgrade.

### 2. Privacy-law density explodes outside LATAM/EU

PIPL (China), PDPA (Singapore, Thailand, Malaysia), UU-PDP (Indonesia),
PDPA (Sri Lanka), RA 10173 (Philippines), NDPA (Nigeria 2023), Privacy
Protection Law (Israel), POPIA (South Africa), KVKK (Turkey) — every new
region adds laws that restrict cross-border ID transfer, mandate
masking-at-display, and require breach notification.

**Action before v1.7**: `docs/PII_GUIDANCE.md` already exists (Sprint 1).
Extend with a **per-region appendix** added incrementally as each release
ships — APAC appendix before v1.10, MENA appendix before v1.9, SSA before
v1.11. One section per region with the 2-3 laws the consumer must comply
with.

### 3. Sanctions countries — explicit policy needed

Russia (RU), Belarus (BY), Iran (IR), Syria (SY), Iraq (IQ), Yemen (YE),
Libya (LY), Sudan (SD) all appeared in the backlog. Validation of these
countries' IDs is **lawful and in high demand** post-2022 precisely because
counterparty screening is mandatory. python-stdnum and all major KYC SaaS
ship them.

**Action before v1.7**: draft a README "Sanctions and dual-use validators"
section. The Rest-of-Europe agent already drafted suggested language for
RU; reuse-and-extend for the others. Legal review recommended.

### 4. Oracle dependency on python-stdnum is the single largest bus-factor

Of the 85 backlog countries, ~50 use `python-stdnum/<cc>/*.py` as the
authoritative cross-library oracle. If python-stdnum stalls or breaks
backwards-compat, our governance test loses its main external validator.

**Action before v1.10** (when oracle count exceeds 60 specs): port the
specific `stdnum/<cc>/<doc>.py` files we depend on into a small
`oracles/` test-only TypeScript port, version-pinned to a known-good
stdnum release. Re-derive yearly. Cost: ~4h initial + 1h/year.

### 5. RTL + non-Latin i18n inflection point

CN, JP, KR, SG (multi-script), TW, IL, TR, MENA Arabic countries all need
the showcase + i18n layer to support `dir="rtl"` and CJK display names.

**Action before v1.9** (MENA Wave A): land the RTL audit in one focused
release — 8h is the agent estimate. Reuse for all Arabic countries
downstream.

### 6. Confidence inversions caught in v1.2 verification will recur

Already in v1.2-asia-research/VERIFICATION.md we caught: TW_ARC old/new
format inverted, SG_UEN ceiling under-stated, JP statute citations wrong,
KR_RRN missing 2020 callout. **Every** future country research doc needs
the same parallel verification pass before implementation. Don't skip it.

**Action**: lock in the pattern — every country (or batch) research doc
gets a paired `<region>-VERIFICATION.md` from a different agent before
the implementation PR opens. Adds ~1h per country, prevents shipping
algorithmic bugs.

---

## Specific corrections to apply pre-implementation

From the 4 region docs, these are the items that **must** be checked
against live first-party sources before any code goes in:

### Sub-Saharan Africa
- **The entire SSA backlog was produced without live web access.** Every
  URL and many algorithmic claims (NG NIN Verhoeff, GH Ghana Card mod-11,
  MU NIC mod-29, RW NID checksum) are best-effort from training data and
  flagged `**unverified**`. **Mandatory**: re-verify every cell in
  `sub-saharan-africa.md` before any SSA ship.

### Asia-Pacific
- HK_HKID first-party checksum source (only community refs found).
- PH_PCN algorithm — PSA has not published; check RA 11055 IRRs.
- VN_CCCD checksum — confirm via Decree 137/2015 + Circular 07/2016.
- BD smart↔legacy NID mapping.

### Rest-of-Europe
- JMBG region tables per successor state (BA, HR, ME, MK, RS, SI, XK).
- HU adóazonosító jel community algo vs NAV official spec.
- LU matricule needs Luxembourgish source or CTIE Règlement.

### MENA
- SA_NID / SA_IQAMA Luhn claim — cross-validate against 50+ Absher sandbox
  samples before raising above `moderate`.
- AE_EID checksum — 3 GitHub repos disagree; ship `format-only`.
- IR_NID mod-11 — convergent across 10+ libs but no first-party citation.

---

## Deferred (out of scope for v1.x)

Either too small, too unstable politically, or no publishable algorithm:

- **APAC**: Bhutan, Mongolia, Cambodia, Laos, Brunei, Myanmar, PNG, Fiji.
- **Europe**: Kosovo (XK, ISO 3166 transitional).
- **MENA**: Wave D conditional on demand (IQ, SY, YE, LY, SD).
- **SSA**: Central Africa (CD/CG biometric ONIP pilot incomplete);
  francophone WAEMU/CEMAC bloc (CI, SN, ML, BF, CM) until algorithms
  documented.
- **Pacific Islands, Caribbean micro-states**: <2M pop each, ship on
  request only.

Estimated **~50 additional countries** in this deferred bucket. Revisit
quarterly. Most likely candidates for v2.x as ecosystems mature: Ethiopia
(Fayda MOSIP config publication), Indonesia (UU-PDP enforcement clarity),
Egypt (sandbox API maturity).

---

## Next concrete action

After v1.6 (Taiwan) ships, the cleanest next move is **v1.7 EU-VAT
batch** — lowest risk (every spec has an upstream oracle), highest
"complete the EU" marketing leverage, no per-country research load.
~25-30h, one focused weekend.

Then v1.8 onward picks up from this synthesis in the order recommended
above. Each release shipping starts with a per-country / per-batch
deep-research doc paired with a verification agent (same pattern as the
v1.2-asia-research/VERIFICATION.md flow that already saved us from the
TW_ARC inversion bug).

---

## Provenance

- 4 parallel `research-analyst` agents run 2026-05-23 against region
  prompts emphasizing strategic priority + algorithm publication status +
  oracle availability + python-stdnum directory listings as quick checks.
- Sub-Saharan Africa agent ran without web access (`WebSearch` / `WebFetch`
  unavailable in that environment). All other agents had live web access.
- Source docs:
  - [`asia-pacific.md`](./asia-pacific.md) — 14 countries, 1242 words
  - [`rest-of-europe.md`](./rest-of-europe.md) — 27 countries, 3508 words
  - [`mena.md`](./mena.md) — 20 countries, 2806 words
  - [`sub-saharan-africa.md`](./sub-saharan-africa.md) — 24 countries, 2281 words (`**unverified**` flagged throughout)
