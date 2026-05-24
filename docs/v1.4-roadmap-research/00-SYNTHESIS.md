# 00 — Synthesis: world-document backlog for v2.5 → v3.x

> Cross-region synthesis of 4 parallel `research-analyst` agents that ran
> 2026-05-23 against Asia-Pacific (14), Rest-of-Europe (27), MENA (20), and
> Sub-Saharan Africa (24). **85 new countries** mapped at backlog depth
> (issuer, top documents, algorithm, oracle availability, confidence
> ceiling, effort estimate).
>
> **Numbering note**: this doc was written when the roadmap used `v1.X`
> milestone labels. After the major bump to `nationid@2.0.0` (EU-VAT batch),
> the cadence below has been updated to use semver-correct labels: Asia
> phase 2 = v2.1-v2.4, post-Asia batches = v2.5+, architectural release =
> v3.0. The research findings themselves are unchanged.
>
> Currently shipped: 52 countries (v1.0–v2.0). Already deep-researched and
> queued for v2.1-v2.4: JP, SG, KR, TW. This document plans v2.5 onward.

---

## Universe summary

| Region | Researched | Top-tier (S) | High-tier (A) | Total available specs (est.) |
|--------|-----------:|-------------:|--------------:|-----------------------------:|
| Asia-Pacific | 14 | 3 (ID, AU, CN) | 2 (MY, PH) | ~35 |
| Rest-of-Europe | 27 | 6 (RO, IE, CZ, GR, AT, plus EU-VAT batch) | 8 | ~60 |
| MENA | 20 | 2 (IL, TR) | 3 (EG, AE, SA) | ~30 |
| Sub-Saharan Africa | 24 | 2 (ZA, NG) | 2 (KE, GH) | ~25 |
| **Total new** | **85** | **13** | **15** | **~150** |

Plus 4 queued (JP/KR/SG/TW = ~12 specs) and 52 shipped (~145 specs after v2.0).

**Realistic 18-month ceiling**: 52 (shipped) + 4 (queued v2.1-v2.4) + 28 (S/A
across all regions) = **84 countries × ~210 specs by mid-2027**. The
remaining 50 countries (~80 specs) defer to v3.x.

---

## Cross-region S-tier ranking (where to spend the next 60h)

Ranked by `(strategic value) / (implementation hours)`. Asia phase-2 already
queued (JP/SG/KR/TW = v2.1-v2.4) is not re-listed here. The EU-VAT batch
that originally appeared here as "v1.7" shipped as `nationid@2.0.0` on
2026-05-24 and is no longer in this backlog.

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

### Batch 1 — **EU-VAT completion** (SHIPPED as nationid@2.0.0 on 2026-05-24) ✅

17 VAT codes shipped for currently-unshipped EU members + Iceland: IE, AT,
LU, GR, CZ, HU, RO, BG, HR, SK, SI, LT, LV, EE, MT, CY, IS. 15 high + 2
moderate confidence. Hoisted `mod11_10CheckDigit` (ISO/IEC 7064 MOD 11,10)
to `nationid/algorithms`. Greek `EL`/`GR` prefix normalisation built in.

- **Actual effort**: ~1 sprint (research + verification + 17 specs + tests +
  docs + URL liveness audit + signing infrastructure).
- **Outcome**: "EU VIES feature parity" claim unlocked.

### Batch 2 — **JMBG core primitive** (v2.5 candidate)

Implementing the weighted mod-11 + region tables for the JMBG (former
Yugoslavia personal ID) once unlocks BA, MK, ME, RS, and reuses for HR
pre-OIB + SI EMSO + XK.

- **Effort**: 8h for the primitive + ~2h per country = 18h for 5 countries
  / 10 specs.
- **Strategic value**: completes the Balkans in one release.
- **Recommendation**: ship as **v2.5.0 "Balkans complete via JMBG"**.

### Batch 3 — **MENA Wave A** (v2.6 candidate)

5 highest-value MENA countries together (IL, TR, EG, AE, SA), per the MENA
agent's wave plan.

- **Effort**: 28h.
- **Coverage**: ~285M people, 4 `high`-confidence specs.
- **Recommendation**: ship as **v2.6.0 "MENA Wave A"** with a regional
  showcase update + RTL-safe i18n for the playground (one-time investment).

### Batch 4 — **APAC core** (v2.7 candidate)

ID + AU + CN + MY + PH in one release (or split across two minor versions).

- **Effort**: ~50h combined.
- **Coverage**: ~1.85B people across 5 specs that range high → format-only.
- **Risk**: 3 of 5 are format-only ceilings (ID NIK, MY NRIC, PH PCN) —
  load-bearing on the confidence framework.

### Batch 5 — **SSA Wave A** (v2.8 candidate)

ZA + NG + KE + GH + RW per SSA agent's plan.

- **Effort**: ~25h.
- **Caveat**: only ZA reaches `high`; the rest are `format-only` or
  `moderate` from community oracles.
- **Recommendation**: ship with prominent JSDoc + README confidence
  disclaimer explaining the publication asymmetry between African and
  LATAM/European IDs.

---

## Proposed release cadence post-v2.0

| Release | Theme | Countries / batches | Effort | Coverage delta |
|---------|-------|---------------------|-------:|----------------|
| v2.0.0 ✅ | EU-VAT complete | IE, AT, LU, GR, CZ, HU, RO, BG, HR, SK, SI, LT, LV, EE, MT, CY, IS | ~1 sprint | **SHIPPED 2026-05-24**: 17 countries / 17 specs / EU-27 VIES parity |
| v2.1.0 | Asia phase 2 — Japan | JP_MY_NUMBER + JP_CORPORATE_NUMBER | 1 day | 1 country / 2 specs |
| v2.2.0 | Asia phase 2 — Singapore | SG_NRIC, SG_FIN, SG_UEN (3 categories) | 2-3 days | 1 country / 5 specs |
| v2.3.0 | Asia phase 2 — Korea | KR_RRN, KR_BRN | 1-2 days | 1 country / 2 specs |
| v2.4.0 | Asia phase 2 — Taiwan | TW_UBN, TW_NID, TW_ARC (post-2021 + legacy) | 2 days | 1 country / 3-4 specs |
| v2.5.0 | Balkans via JMBG | RS, BA, MK, ME (+optional XK placeholder) | 18h | 5 countries / 10 specs |
| v2.6.0 | MENA Wave A | IL, TR, EG, AE, SA | 28h + 8h RTL i18n | 5 countries / 9 specs / 285M pop |
| v2.7.0 | APAC core | AU + CN + ID + MY + PH | 50h | 5 countries / 12 specs / 1.85B pop |
| v2.8.0 | SSA Wave A | ZA + NG + KE + GH + RW | 25h | 5 countries / 8 specs / 425M pop |
| v2.9.0 | EU personal IDs catch-up | RO, IE, CZ, GR, AT, HU + others | 30h | 6 countries / 12 specs |
| **v3.0.0** | Stability re-promise + i18n expansion | API freeze v3 + Arabic/Hebrew/Chinese i18n locales + lazy REGISTRY | 40h | architectural release |

**Total v2.1 → v3.0**: ~220h spread across ~6 months at current cadence
(1-2 minor releases/month). Adds **~32 new countries × ~65 specs** on top
of the post-v2.0 baseline of 52 countries × ~145 specs → **~84 countries
× ~210 specs at v3.0**.

---

## Cross-cutting risks (must address before v2.1)

### 1. Confidence-tier framework is about to be load-bearing

Today 35/35 shipped countries have at least one `high`-confidence spec
backed by first-party citation. Post-v2.0 a significant fraction of new
countries (especially APAC + SSA + Gulf) will ship at `moderate` / `low` /
`format-only` ceilings.

**Action before v2.1**: README + showcase need a prominent visual
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

**Action before v2.1**: `docs/PII_GUIDANCE.md` already exists (Sprint 1).
Extend with a **per-region appendix** added incrementally as each release
ships — APAC appendix before v2.7, MENA appendix before v2.6, SSA before
v2.8. One section per region with the 2-3 laws the consumer must comply
with.

### 3. Sanctions countries — explicit policy needed

Russia (RU), Belarus (BY), Iran (IR), Syria (SY), Iraq (IQ), Yemen (YE),
Libya (LY), Sudan (SD) all appeared in the backlog. Validation of these
countries' IDs is **lawful and in high demand** post-2022 precisely because
counterparty screening is mandatory. python-stdnum and all major KYC SaaS
ship them.

**Action before v2.1**: draft a README "Sanctions and dual-use validators"
section. The Rest-of-Europe agent already drafted suggested language for
RU; reuse-and-extend for the others. Legal review recommended.

### 4. Oracle dependency on python-stdnum is the single largest bus-factor

Of the 85 backlog countries, ~50 use `python-stdnum/<cc>/*.py` as the
authoritative cross-library oracle. If python-stdnum stalls or breaks
backwards-compat, our governance test loses its main external validator.

**Action before v2.7** (when oracle count exceeds 60 specs): port the
specific `stdnum/<cc>/<doc>.py` files we depend on into a small
`oracles/` test-only TypeScript port, version-pinned to a known-good
stdnum release. Re-derive yearly. Cost: ~4h initial + 1h/year.

### 5. RTL + non-Latin i18n inflection point

CN, JP, KR, SG (multi-script), TW, IL, TR, MENA Arabic countries all need
the showcase + i18n layer to support `dir="rtl"` and CJK display names.

**Action before v2.6** (MENA Wave A): land the RTL audit in one focused
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

The EU-VAT batch shipped as `nationid@2.0.0` on 2026-05-24, ahead of Asia
phase 2. The cleanest next move is **v2.1 — Japan** (`JP_MY_NUMBER` +
`JP_CORPORATE_NUMBER`), the lowest-risk of the four queued phase-2
countries. Plan is in [`../v2.1-plan.md`](../v2.1-plan.md). After Japan,
ship v2.2 SG → v2.3 KR → v2.4 TW in order.

Then v2.5 onward picks up from this synthesis in the order recommended
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
