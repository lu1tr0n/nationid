# Asia-Pacific roadmap backlog (v1.7 → v2.x)

> Compact backlog. Not a spec. Excluded: JP, KR, SG, TW (in v1.3–v1.6) and
> the 35 already-shipped countries. Per-country specs follow the
> `v1.2-asia-research/sg.md` pattern once a country is pulled into a release.
> Author: research-agent · Date: 2026-05-23.

## Regional summary

Asia-Pacific covers ~2.3B people across 14 jurisdictions missing from `nationid`. python-stdnum coverage is strong for tax/entity codes but the **citizen-ID checksum gap is the load-bearing risk**: ID-NIK, MY-NRIC, PH-PCN, VN-CCCD, BD-NID, PK-CNIC, LK-NIC all lack a publicly-documented check digit (community-reverse-engineered or structural-only). Privacy law density (PIPL, PDPA-TH/MY, UU-PDP-ID, RA-10173-PH, PDPA-LK) exceeds LATAM — `pii` redaction surface (v0.3+) should land before the first APAC ship.

## TL;DR ranking — ship order v1.7 → v2.0

1. **Indonesia (ID)** — 280M, NIK + NPWP both have python-stdnum oracles, SE-Asia SaaS expansion candidate. **S.**
2. **Australia (AU)** — 27M but mature fintech; TFN/ABN/ACN all deterministic in python-stdnum. Easiest "high-trust" APAC ship. **S.**
3. **China (CN)** — 1.41B, RIC + USCC in python-stdnum; PIPL forces `pii` story first. **S.**
4. **Malaysia (MY)** — 34M, oracle exists (structural only), strong SaaS adoption. **A.**
5. **Philippines (PH)** — 117M, PhilSys >90M cards by 2025; no public checksum → format-only ceiling. **A.**

Ships 6–14 (PK, VN, TH, BD, NZ, HK, LK, NP, MO) follow as fill-in.

---

## Backlog entries

### 🇨🇳 China (CN)

**Population**: ~1,410M · **Strategic priority**: S · **Est. impl effort**: 10–14 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `CN_RIC` | Resident Identity Card Number (居民身份证号码) | Person | 18 digits | ISO 7064 MOD 11-2 (with 'X' as 10) | Ministry of Public Security | high | `python-stdnum/cn/ric.py` |
| `CN_USCC` | Unified Social Credit Code (统一社会信用代码) | Entity | 18 alphanumeric (excl. I,O,Z,S,V) | ISO 7064 MOD 31-3 | SAIC / SAMR | high | `python-stdnum/cn/uscc.py` |

**Notes**:
- RIC = 6-digit region + YYYYMMDD birth + 3-digit seq (gender parity) + check. Heavy PII.
- USCC replaced legacy Organisation Code in 2015; transitional records coexist.
- PIPL restricts cross-border RIC transfer — README warning needed.

**Sources**: python-stdnum `cn/ric.py`, `cn/uscc.py`; GB 11643-1999.

---

### 🇭🇰 Hong Kong (HK)

**Population**: ~7.5M · **Strategic priority**: B · **Est. impl effort**: 4–6 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `HK_HKID` | Hong Kong Identity Card number | Person | 1–2 letters + 6 digits + 1 check (digit or 'A') | weighted-mod-11 (positional weights 9..2, letters A=1..Z=26, with leading-letter pre-weight 36) | Immigration Department | moderate–high | community-only |
| `HK_BRN` | Business Registration Number | Entity | 8 digits (file-number variant 11+ chars) | format-only | Inland Revenue Department (IRD) | moderate | none (format-only) |

**Notes**:
- HKID checksum is community-only (Wikipedia / gists). No first-party Immigration Dept publication located → `confidence: "moderate"`.
- BRN long form (file + branch + check) has no documented algorithm.

**Sources**: immd.gov.hk/eng/services/hkid.html, ird.gov.hk/eng/tax/bre.htm, en.wikipedia.org/wiki/Hong_Kong_identity_card.

---

### 🇲🇴 Macau (MO)

**Population**: ~700K · **Strategic priority**: C · **Est. impl effort**: 3–5 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `MO_BIR` | Bilhete de Identidade de Residente (BIR) | Person | 1 digit + 7 digits + 1 check, formatted `N/NNNNNNN/N` | weighted-mod-11 (community-reported) | DSI (Identification Services Bureau) | low–moderate | community-only |

**Notes**: Defer to v2.x — population too small; ship only on customer demand. Algorithm sources thin.

**Sources**: dsi.gov.mo/residentid_e.aspx.

---

### 🇦🇺 Australia (AU)

**Population**: ~27M · **Strategic priority**: S · **Est. impl effort**: 5–7 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `AU_TFN` | Tax File Number | Person + entity | 8 or 9 digits | weighted-mod-11 (weights 1,4,3,7,5,8,6,9,10) | Australian Taxation Office (ATO) | high | `python-stdnum/au/tfn.py` |
| `AU_ABN` | Australian Business Number | Entity | 11 digits, first 2 = check | weighted-mod-89 (modified) | Australian Business Register (ABR) | high | `python-stdnum/au/abn.py` |
| `AU_ACN` | Australian Company Number | Entity (companies only) | 9 digits | weighted-mod-10 (weights 8..1, complement of 10) | ASIC | high | `python-stdnum/au/acn.py` |

**Notes**:
- TFN highly sensitive under Privacy Act s.17 (TFN guidelines) — `pii: "high"`, never log.
- ABN/ACN public via abr.business.gov.au — safe for entity look-up.
- Best "first-day-confidence" APAC ship (3 deterministic oracles).

**Sources**: python-stdnum `au/tfn.py`, `au/abn.py`, `au/acn.py`; ato.gov.au, abr.business.gov.au, asic.gov.au.

---

### 🇳🇿 New Zealand (NZ)

**Population**: ~5.2M · **Strategic priority**: B · **Est. impl effort**: 3–5 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `NZ_IRD` | IRD number | Person + entity | 8 or 9 digits | weighted-mod-11 (primary + secondary weight set fallback) | Inland Revenue Department (Te Tari Tāke) | high | `python-stdnum/nz/ird.py` |
| `NZ_NZBN` | NZ Business Number | Entity | 13 digits (GS1 GLN) | GS1 mod-10 (Luhn-like) | NZBN Registry (MBIE) | high | community / GS1 spec |

**Notes**:
- NZ has no citizen ID; tax + business numbers cover SaaS use-cases.
- NZBN is a GS1 GLN — algorithm is GS1 standard, no NZ-specific oracle needed.

**Sources**: python-stdnum `nz/ird.py`; ird.govt.nz, nzbn.govt.nz.

---

### 🇮🇩 Indonesia (ID)

**Population**: ~280M · **Strategic priority**: S · **Est. impl effort**: 8–12 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `ID_NIK` | Nomor Induk Kependudukan (KTP) | Person | 16 digits | **format-only** (PPRRSS province+city+sub + DDMMYY birth, female +40 to DD; province + DOB validation; **no public check digit**) | Dukcapil (Ministry of Home Affairs) | **moderate** (no checksum) | `python-stdnum/id/nik.py` |
| `ID_NPWP` | Nomor Pokok Wajib Pajak | Person + entity | 15 legacy or 16 modern (NIK-aligned) | Luhn-style mod-10 on first 8 digits | DJP (Directorate General of Taxes) | high | `python-stdnum/id/npwp.py` |

**Notes**:
- NIK has NO published checksum. python-stdnum validates province + DOB structure only → `hasCheckDigit: false`, `confidence: "moderate"`.
- NPWP modernised 2024: persons = NIK, entities = 16-digit. Must support legacy 15-digit too.
- UU PDP (2022) classifies NIK as sensitive — pii surface critical.

**Sources**: python-stdnum `id/nik.py`, `id/npwp.py`; OECD CRS Indonesia-TIN PDF.

---

### 🇲🇾 Malaysia (MY)

**Population**: ~34M · **Strategic priority**: A · **Est. impl effort**: 4–6 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `MY_NRIC` | MyKad / NRIC number | Person | 12 digits (formatted `YYMMDD-PB-NNNG`) | **format-only** (date validation + birthplace code lookup; no check digit) | National Registration Department (JPN) | moderate | `python-stdnum/my/nric.py` |
| `MY_BRN` | Business Registration Number (SSM) | Entity | 12 digits (new) or legacy variable | format-only | SSM (Companies Commission) | moderate | none |

**Notes**:
- NRIC has NO checksum — structural only (DOB + birthplace + gender parity). `hasCheckDigit: false`.
- SSM unified BRN to 12 digits in 2019; legacy `1234567-A` still circulates.
- Sensitive under PDPA 2010.

**Sources**: python-stdnum `my/nric.py`; jpn.gov.my, ssm.com.my.

---

### 🇹🇭 Thailand (TH)

**Population**: ~71M · **Strategic priority**: A · **Est. impl effort**: 5–7 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `TH_PIN` | Personal Identification Number | Person | 13 digits | weighted-mod-11 (weights 13..2) | Ministry of Interior | high | `python-stdnum/th/pin.py` |
| `TH_MOA` | Memorandum of Association Number | Entity | 13 digits (leading 0) | same mod-11 as PIN | DBD (Dept of Business Development) | high | `python-stdnum/th/moa.py` |
| `TH_TIN` | Taxpayer Identification Number | Person + entity | 13 digits | mod-11 (PIN for individuals, MOA for companies) | Revenue Department | high | `python-stdnum/th/tin.py` |

**Notes**:
- PIN/MOA/TIN share algorithm — implement once, expose 3 codes (SG NRIC/FIN pattern).
- PDPA 2022 GDPR-aligned; classify PIN as sensitive.

**Sources**: python-stdnum `th/pin.py`, `th/moa.py`, `th/tin.py`; rd.go.th, dbd.go.th.

---

### 🇵🇭 Philippines (PH)

**Population**: ~117M · **Strategic priority**: A · **Est. impl effort**: 6–8 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `PH_PSN` | Philippine Identification System Number | Person | 12 digits (PSN, internal — never disclosed) | not applicable (PSN is never shown to RPs) | PSA (Philippine Statistics Authority) | n/a — defer | none |
| `PH_PCN` | PhilSys Card Number (PCN, what's on the card) | Person | 16 digits (formatted `XXXX-XXXXXXX-X`) | **format-only** (algorithm not publicly published by PSA) | PSA | **low–moderate** | none |
| `PH_TIN` | Bureau of Internal Revenue TIN | Person + entity | 9 base + 3–5 branch | format-only (no public checksum) | BIR | moderate | none |
| `PH_SSS` | Social Security System number | Person | 10 digits | format-only (no public checksum) | SSS | moderate | none |

**Notes**:
- RA 11055 prohibits sharing PSN with relying parties — validate **PCN only**, never PSN.
- PhilSys >90M cards by mid-2025 but PSA has not published the PCN algorithm → format-only ceiling.
- RA 10173 (Data Privacy Act 2012) + NPC IRRs make PCN sensitive. TIN/SSS lack public checksums.

**Sources**: psa.gov.ph/philsys, officialgazette.gov.ph (RA 11055), bir.gov.ph.

---

### 🇻🇳 Vietnam (VN)

**Population**: ~100M · **Strategic priority**: A · **Est. impl effort**: 6–8 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `VN_CCCD` | Căn cước công dân (Citizen ID, post-2016) | Person | 12 digits (PPGYYNNNNNN: 3-digit province + 1-digit gender/century + 2-digit YY + 6-digit serial) | **format-only** (no published check digit) | Ministry of Public Security | **moderate** | community-only |
| `VN_MST` | Mã số thuế | Person + entity | 10 digits (HQ) or 13 (branch: 10 + '-' + 3) | weighted-mod-11 on first 9 digits | General Department of Taxation | high | `python-stdnum/vn/mst.py` |

**Notes**:
- CCCD replaced 9-digit CMND in 2016, smart-chip 2021. Algorithm reverse-engineered; no MPS publication → `confidence: "moderate"`.
- MST solid: python-stdnum has full algorithm.
- Decree 13/2023/NĐ-CP classifies CCCD as sensitive.

**Sources**: python-stdnum `vn/mst.py`; en.wikipedia.org/wiki/Vietnamese_identity_card.

---

### 🇧🇩 Bangladesh (BD)

**Population**: ~173M · **Strategic priority**: A · **Est. impl effort**: 5–7 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `BD_NID_OLD` | Old NID number | Person | 13 digits (sometimes seen as 17 = 4-digit birth year + 13) | format-only | Election Commission (legacy) → MoHA (since 2023) | moderate | none |
| `BD_NID_SMART` | Smart NID number | Person | 10 digits | format-only (no public checksum) | NIDW, Ministry of Home Affairs | **moderate** | none |
| `BD_TIN` | Taxpayer's Identification Number (e-TIN) | Person + entity | 12 digits | format-only | National Board of Revenue | moderate | none |

**Notes**:
- **Two overlapping NID schemes** (legacy 13/17 + smart 10) — both must be accepted, users supply either.
- NIDW transferred EC→MoHA in 2023 (National Identity Registration Act 2023). No public checksum for any format.
- PDP Bill drafted but unenacted as of 2026; treat conservatively.

**Sources**: nidw.gov.bd, nbr.gov.bd; en.wikipedia.org/wiki/National_identity_card_(Bangladesh).

---

### 🇵🇰 Pakistan (PK)

**Population**: ~240M · **Strategic priority**: A · **Est. impl effort**: 5–7 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `PK_CNIC` | Computerised National Identity Card | Person | 13 digits (formatted `XXXXX-XXXXXXX-X`) | **format-only** (5-digit locality + 7-digit serial + 1-digit gender parity; no checksum) | NADRA | moderate | `python-stdnum/pk/cnic.py` |
| `PK_NTN` | National Tax Number | Person + entity | 7–8 digits (legacy) or CNIC for persons since 2014 | format-only | FBR | moderate | none |
| `PK_STRN` | Sales Tax Registration Number | Entity | 13 digits | format-only | FBR | moderate | none |

**Notes**:
- CNIC has no public check digit; python-stdnum validates structural fields + gender parity only.
- Individual NTN = CNIC since 2014; entity NTN separate.
- PDP Bill pending; NADRA treats CNIC as sensitive (Ordinance 2000).

**Sources**: python-stdnum `pk/cnic.py`; nadra.gov.pk, fbr.gov.pk.

---

### 🇱🇰 Sri Lanka (LK)

**Population**: ~22M · **Strategic priority**: B · **Est. impl effort**: 4–6 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `LK_NIC_OLD` | Old National Identity Card | Person | 9 digits + letter (`V` voter, `X` non-voter); format: `YYDDD####V` (year + day-of-year, female +500) | format-only | Department for Registration of Persons (DRP) | moderate | community-only |
| `LK_NIC_NEW` | New (post-2016) NIC | Person | 12 digits; format: `YYYYDDD#####` | format-only | DRP | moderate | community-only |
| `LK_TIN` | Taxpayer Identification Number | Person + entity | 9 or 10 digits | format-only | Inland Revenue Department | moderate | none |

**Notes**:
- DDD 001–366 + female +500 well-documented in community but not in DRP publication. Validate range only.
- 12-digit format rolled out late 2016; 9-digit+V/X remains valid indefinitely. Accept both.
- PDP Act of Sri Lanka 2022 in full force by 2024.

**Sources**: drp.gov.lk; en.wikipedia.org/wiki/National_identity_card_(Sri_Lanka).

---

### 🇳🇵 Nepal (NP)

**Population**: ~30M · **Strategic priority**: C · **Est. impl effort**: 4–6 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `NP_NID` | Nepal National Identity Card | Person | 11 digits (per current rollout) | format-only (no published algorithm) | Department of National ID and Civil Registration (DoNIDCR), MoHA | **low** | none |
| `NP_PAN` | Permanent Account Number (tax) | Person + entity | 9 digits | format-only | Inland Revenue Department | moderate | none |

**Notes**:
- Partial rollout since 2018, ~5M issued by 2024 (est.). Format may still change. **Defer.**
- Historic Citizenship Certificate is district-varying free text — not a candidate.

**Sources**: donidcr.gov.np; en.wikipedia.org/wiki/National_Identity_Card_(Nepal).

---

## Open questions / unverified items

1. **HK_HKID checksum first-party source**: only in community refs. Worth a 30-min search of Cap. 177 Registration of Persons Regulations annexes before shipping.
2. **PH_PCN algorithm**: PSA has not published the check digit derivation. Check RA 11055 IRRs and PSA technical bulletins; otherwise format-only is the ceiling.
3. **VN_CCCD checksum**: MPS has not published an algorithm. Confirm via Decree 137/2015/NĐ-CP and Circular 07/2016/TT-BCA before committing.
4. **BD_NID smart↔legacy mapping**: confirm whether 10-digit smart NID is deterministically derivable from 13/17-digit legacy. If yes, document cross-walk.
5. **LK_NIC old↔new migration**: confirm DRP cross-walk. Some 9-digit holders received parallel 12-digit numbers.
6. **MO_BIR, NP_NID**: defer until customer demand / rollout stabilises.
7. **Out of scope**: Bhutan, Mongolia, Cambodia, Laos, Brunei, Myanmar, PNG, Fiji — population/ecosystem too small or political situation too unstable. Mark "deferred indefinitely."

## Risk flags for v1.7+ planning

- **7 of 14 countries (ID, MY, PH, VN, BD, PK, LK)** have NO publicly-documented checksum on their primary citizen ID — `confidence` field becomes load-bearing. Review README confidence documentation before first APAC ship.
- **Privacy law density** (PIPL, PDPA-TH/MY, UU-PDP-ID, PDPA-LK, RA 10173-PH) exceeds LATAM. Ship `pii` redaction helpers (v0.3) before the first APAC country goes live.
- **python-stdnum coverage**: 8/14 prefixes have a module, but deterministic checksums concentrate in CN/AU/NZ/TH/VN-MST/PK-CNIC. ID/MY/VN-CCCD modules are structural-only.
