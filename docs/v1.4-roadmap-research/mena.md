# MENA Country Backlog — nationid v1.4+

> **Scope**: 20 countries across Levant, Gulf, and North Africa. Compact research dossier for prioritising the next regional expansion after Asia (JP/SG/KR/TW) ships.
> **Author**: research-agent · **Date**: 2026-05-23 · **Library version**: nationid@1.3.x → planned 1.4.0
> **Verification**: Algorithm claims cross-checked against `python-stdnum` master (`il/{idnr,hp}.py`, `tr/{tckimlik,vkn}.py`, `eg/tn.py`, `ma/ice.py`, `tn/mf.py`, `dz/nif.py`). Gulf and sanctioned countries: format-only structure from Wikipedia + issuer landing pages; checksum algorithms typically NOT published — flagged per country.

## Regional summary

MENA splits into three confidence tiers: **(1) Mature publishers** — Israel (Mispar Zehut, Luhn-like) and Turkey (TC Kimlik, 11-digit weighted) have public algorithms with 5+ independent open-source implementations; the only MENA documents where `confidence: "high"` is defensible. **(2) Public format, private checksum** — Gulf states (UAE, Saudi, Qatar, Kuwait, Bahrain, Oman) publish format and length but treat checksum algorithms as undocumented internals; ship `format-only` validators at `confidence: "moderate"`. **(3) Tax-IDs only** — Egypt, Morocco, Tunisia, Algeria have algorithmically validatable tax IDs in python-stdnum but their personal IDs lack public checksums. Sanctioned jurisdictions (IR, SY, IQ, YE, LY, SD) carry an ethical layer: validation supports KYC/sanctions screening (lawful under OFAC general licenses), but ship behind `confidence: "low"` with explicit `pii.warning`.

**RTL/i18n (regional)**: All 20 countries use Arabic, Hebrew, or Persian script. Showcase i18n must wrap MENA country pages in `dir="rtl"` blocks for native labels (`رقم الهوية`, `מספר זהות`, `کد ملی`); validation inputs remain LTR. Eastern Arabic numerals (٠–٩) appear in EG tax numbers — stdnum's `eg/tn.py` ships the transliteration table; port it.

## TL;DR — Ship order (top 5)

1. **IL (Israel)** — Mispar Zehut + ח.פ. Public Luhn-like checksums; `stdnum/il/{idnr,hp}.py` oracles. ~6h.
2. **TR (Turkey)** — TC Kimlik + VKN. Public algorithms, 85M pop, mature fintech. `stdnum/tr/{tckimlik,vkn}.py`. ~8h.
3. **EG (Egypt)** — Tax number with eastern-Arabic numeral handling in stdnum. 110M pop, largest Arab market. ~5h.
4. **AE (UAE)** — Emirates ID format-only (`784-YYYY-NNNNNNN-N`). High ROI for DIFC/ADGM fintech. ~4h.
5. **SA (Saudi Arabia)** — National ID (`1...`) + Iqama (`2...`). Format-only; prefix-distinguished citizen vs resident. ~5h.

Wave A total: ~28h for 5 countries / 9 specs covering ~285M people.

---

### 🇮🇱 Israel (IL)

**Population**: 9.9M  ·  **Strategic priority**: S  ·  **Est. impl effort**: 5–7 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `IL_TZ` | Teudat Zehut (תעודת זהות) | personal | 9 digits | Luhn-variant (weights 1,2,1,2…; if product>9, sum digits) | Ministry of Interior | **high** | `python-stdnum/il/idnr.py` |
| `IL_HP` | Mispar Chevra (ח.פ.) | entity | 9 digits, first=`5` | same Luhn-variant as TZ | Registrar of Companies | **high** | `python-stdnum/il/hp.py` |

**Notes**:
- Mispar Zehut is permanent-for-life; first 8 digits = sequence, last = check. `normalize()` must left-pad to 9 chars (stdnum does this).
- Privacy: sensitive PII under Privacy Protection Law 5741-1981; mask to last 4 in UI.

**Sources**: https://www.gov.il/en/departments/ministry_of_interior · https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/il/idnr.py · https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Israel-TIN.pdf

---

### 🇹🇷 Turkey (TR)

**Population**: 85M  ·  **Strategic priority**: S  ·  **Est. impl effort**: 6–8 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `TR_TCKN` | T.C. Kimlik Numarası (MERNIS) | personal | 11 digits, first≠0 | custom: d10=((d1+d3+d5+d7+d9)·7−(d2+d4+d6+d8)) mod 10; d11=Σ(d1..d10) mod 10 | NVİ | **high** | `python-stdnum/tr/tckimlik.py` |
| `TR_VKN` | Vergi Kimlik Numarası | entity | 10 digits | custom mod-10 transformation | GİB | **high** | `python-stdnum/tr/vkn.py` |

**Notes**:
- TCKN underpins e-Devlet, banking, and health records.
- NVİ exposes a live SOAP verify endpoint — do NOT call from the library; ship local checksum only.
- VKN first digit is derived from company name; only structural mod-10 portable.

**Sources**: https://www.nvi.gov.tr/ · https://tckimlik.nvi.gov.tr/ · https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/tr/tckimlik.py

---

### 🇪🇬 Egypt (EG)

**Population**: 110M  ·  **Strategic priority**: A  ·  **Est. impl effort**: 5–7 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `EG_TN` | Tax Reg. Number (الرقم الضريبي) | both | 9 digits (XXX-XXX-XXX) | format-only | Egyptian Tax Authority | **moderate** | `python-stdnum/eg/tn.py` |
| `EG_NID` | National ID (الرقم القومي) | personal | 14 digits (CYYMMDD-GG-SSSS-G-C) | format + DOB + governorate plausibility; checksum unpublished | Civil Status Organization | **moderate** (format) | community-only |

**Notes**:
- `EG_TN` no checksum but high B2B utility (e-invoice mandate since 2020).
- `EG_NID` encodes century (2/3), YYMMDD, governorate (01-35, 88=foreign-born), serial (odd=male/even=female), check. Community Luhn variants not corroborated by CSO — ship format + date-plausibility only.
- Eastern-Arabic numerals (٠–٩) transliterated in `normalize()`.

**Sources**: https://eta.gov.eg/ · https://www.moi.gov.eg/ · https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/eg/tn.py

---

### 🇸🇦 Saudi Arabia (SA)

**Population**: 36M  ·  **Strategic priority**: A  ·  **Est. impl effort**: 4–6 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `SA_NID` | National ID (الهوية الوطنية) | personal | 10 digits, starts `1` | Luhn (community-verified, not officially published) | MoI / Absher | **moderate** | community-only |
| `SA_IQAMA` | Iqama (إقامة) | resident-foreign | 10 digits, starts `2` | same Luhn variant | Jawazat | **moderate** | community-only |
| `SA_CR` | Commercial Registration | entity | 10 digits | format-only | Ministry of Commerce | **moderate** | community-only |

**Notes**:
- Prefix `1` vs `2` is critical modelling decision: same length & checksum family, different legal subject → ship as two specs.
- Absher/Tawakkalna validate locally via Luhn; multiple GitHub repos converge but no Royal Decree publishes it.

**Sources**: https://www.absher.sa/ · https://www.moi.gov.sa/ · https://mc.gov.sa/

---

### 🇦🇪 United Arab Emirates (AE)

**Population**: 10M  ·  **Strategic priority**: S  ·  **Est. impl effort**: 3–5 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `AE_EID` | Emirates ID | personal | 15 digits, `784-YYYY-NNNNNNN-N` | **checksum undocumented**; format-only | ICP | **moderate** | community-only |
| `AE_TRN` | Tax Registration Number | entity | 15 digits, starts `100` | format-only | Federal Tax Authority | **moderate** | community-only |

**Notes**:
- `784` = ISO 3166 numeric for UAE, fixed prefix. YYYY = year of birth.
- ICP does NOT publish the check-digit algorithm. Reverse-engineering attempts on GitHub disagree — ship `format-only` and flag.
- AE TRN critical for VAT (5% since 2018, e-invoicing mandated 2026).

**Sources**: https://icp.gov.ae/en/ · https://tax.gov.ae/en/

---

### 🇶🇦 Qatar (QA)

**Population**: 3M  ·  **Strategic priority**: B  ·  **Est. impl effort**: 3–4 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `QA_QID` | Qatar ID (الرقم الشخصي) | personal | 11 digits, `CYYNNNNNNNN` (C=century: 2/3) | format + DOB plausibility | MOI Qatar | **moderate** | community-only |
| `QA_CR` | Commercial Registration | entity | up to 8 digits | format-only | MOCI | **moderate** | community-only |

**Notes**:
- QID encodes century, YY, country-of-origin code. Strong KYC use case via QFC (~1,800 firms).

**Sources**: https://portal.moi.gov.qa/ · https://www.moci.gov.qa/

---

### 🇰🇼 Kuwait (KW)

**Population**: 4.3M  ·  **Strategic priority**: B  ·  **Est. impl effort**: 3–4 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `KW_CIVIL` | Civil Number (الرقم المدني) | personal | 12 digits, `NYYMMDDNNNNN` | format + DOB; checksum unverified | PACI | **moderate** | community-only |

**Notes**:
- PACI publishes structure, not checksum. Community Luhn claims uncorroborated.
- Encoded DOB is high-value normaliser for v1.4 `extract()` module.

**Sources**: https://www.paci.gov.kw/

---

### 🇧🇭 Bahrain (BH)

**Population**: 1.6M  ·  **Strategic priority**: B  ·  **Est. impl effort**: 3–4 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `BH_CPR` | Personal Number / CPR | personal | 9 digits, `YYMMNNNNC` | format + DOB; check digit community-only | iGA | **moderate** | community-only |

**Notes**:
- CBB fintech sandbox makes CPR central to KYC. Minority of legacy CPRs don't follow YYMM — flag exception.

**Sources**: https://www.iga.gov.bh/ · https://en.wikipedia.org/wiki/National_identification_number#Bahrain

---

### 🇴🇲 Oman (OM)

**Population**: 4.6M  ·  **Strategic priority**: C  ·  **Est. impl effort**: 2–3 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `OM_CIVIL` | Civil ID Number | personal | 8 digits | format-only | Royal Oman Police | **moderate** | community-only |
| `OM_CR` | Commercial Registration | entity | 7–8 digits | format-only | MoCIIP | **moderate** | community-only |

**Notes**:
- No public checksum. Lower priority vs UAE/SA/QA.

**Sources**: https://www.rop.gov.om/ · https://mocia.gov.om/

---

### 🇯🇴 Jordan (JO)

**Population**: 11.3M  ·  **Strategic priority**: A  ·  **Est. impl effort**: 3–5 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `JO_NID` | National Number (الرقم الوطني) | personal | 10 digits | format-only | Civil Status & Passports Dept | **moderate** | community-only |
| `JO_TIN` | Tax Identification Number | entity | 9 digits | format-only | Income & Sales Tax Dept | **moderate** | community-only |

**Notes**:
- Used at every banking touchpoint + Sanad e-gov portal. Format stable since 2002. Strong Levant SaaS target.

**Sources**: https://www.cspd.gov.jo/ · https://www.istd.gov.jo/

---

### 🇱🇧 Lebanon (LB)

**Population**: 5.4M  ·  **Strategic priority**: C  ·  **Est. impl effort**: 2–3 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `LB_NID` | National ID (Hawiyya) | personal | up to 12 digits — varies by mohafaza | format-only | Directorate General of Personal Status | **low** | community-only |

**Notes**:
- Numbering **inconsistent across governorates**; cannot ship single regex without prefix table.
- Crisis has stalled registry digitisation; algorithm unlikely soon.

**Sources**: https://www.interior.gov.lb/

---

### 🇸🇾 Syria (SY)

**Population**: 23M  ·  **Strategic priority**: C  ·  **Est. impl effort**: 2–3 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `SY_NID` | National Number (الرقم الوطني) | personal | 11 digits | format-only | Civil Affairs Directorate | **low** | none |

**Notes**:
- **Sanctions context**: OFAC/EU sanctions partially relaxed 2025. Validation lawful for KYC; ship with `pii.warning` + `region: "sanctioned"` flag.
- Algorithm unpublished; civil registry partially destroyed.

**Sources**: https://www.moi.gov.sy/ (intermittent)

---

### 🇮🇶 Iraq (IQ)

**Population**: 44M  ·  **Strategic priority**: C  ·  **Est. impl effort**: 3–4 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `IQ_NID` | Iraq National Card (البطاقة الوطنية) | personal | 12 digits (biometric since 2016) | format-only | MoI — Civil Status Dir | **low** | none |

**Notes**:
- 2016 biometric card replaces legacy Nationality Certificate + Civil ID. No checksum publication.
- KRG (Kurdistan) historically issued separate documents.

**Sources**: https://www.moi.gov.iq/

---

### 🇮🇷 Iran (IR)

**Population**: 89M  ·  **Strategic priority**: C  ·  **Est. impl effort**: 3–4 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `IR_NID` | National Code / کد ملی | personal | 10 digits, `XXX-XXXXXX-X` | weighted-mod-11 (weights 10..2; community-published) | National Org. for Civil Registration | **moderate** | community-only |

**Notes**:
- **Sanctions context**: comprehensive OFAC sanctions. Validation lawful; PII processing of sanctioned persons may not be. Ship with `region: "sanctioned"` flag.
- Algorithm widely implemented in Iranian fintech (Shaparak, Sepah) — credible reproduction, no canonical NOCR spec.
- Persian labels (`کد ملی`) require RTL.

**Sources**: https://www.sabteahval.ir/ · https://en.wikipedia.org/wiki/National_identification_number#Iran

---

### 🇲🇦 Morocco (MA)

**Population**: 38M  ·  **Strategic priority**: A  ·  **Est. impl effort**: 4–5 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `MA_CIN` | Carte d'Identité Nationale (CIN/CNIE) | personal | 1–2 letters + 6 digits (`AB123456`) | format-only (letter = prefecture prefix) | DGSN | **moderate** | community-only |
| `MA_ICE` | Identifiant Commun de l'Entreprise | entity | 15 digits (9 entity + 4 establishment + 2 check) | custom checksum on last 2 digits | DGI / OMPIC | **high** | `python-stdnum/ma/ice.py` |

**Notes**:
- ICE is one of few MENA entity IDs with public checksum. Implement first.
- CIN letter prefix documented in DGSN circulars but no machine-readable list.

**Sources**: https://www.dgsn.gov.ma/ · https://www.tax.gov.ma/ · https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/ma/ice.py

---

### 🇹🇳 Tunisia (TN)

**Population**: 12M  ·  **Strategic priority**: B  ·  **Est. impl effort**: 3–4 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `TN_CIN` | Carte d'Identité Nationale | personal | 8 digits | format-only | Ministry of Interior | **moderate** | community-only |
| `TN_MF` | Matricule Fiscal | entity | 7d + letter + 3-letter cat + 3d branch | letter check digit (alphabetic mod, excludes I/O/U) | DGI Tunisia | **high** | `python-stdnum/tn/mf.py` |

**Notes**:
- MF rich format: identifiant fiscal + code TVA + code catégorie + secondaire. One spec; expose parts via `extract()`.

**Sources**: https://www.finances.gov.tn/ · https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/tn/mf.py

---

### 🇩🇿 Algeria (DZ)

**Population**: 45M  ·  **Strategic priority**: B  ·  **Est. impl effort**: 4–5 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `DZ_NIN` | Numéro d'Identité National | personal | 18 digits | format-only (encodes wilaya + commune + birth-year) | DGSN | **moderate** | community-only |
| `DZ_NIF` | Numéro d'Identification Fiscale | entity | 15 digits (20 with branch) | format-only | DGI Algeria | **moderate** | `python-stdnum/dz/nif.py` |

**Notes**:
- NIN-18 introduced 2016 with biometric card.
- NIF no checksum; stdnum ships format normaliser.

**Sources**: https://www.interieur.gov.dz/ · https://www.mfdgi.gov.dz/ · https://raw.githubusercontent.com/arthurdejong/python-stdnum/master/stdnum/dz/nif.py

---

### 🇱🇾 Libya (LY)

**Population**: 7M  ·  **Strategic priority**: C  ·  **Est. impl effort**: 2–3 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `LY_NID` | National Number (الرقم الوطني) | personal | 12 digits | format-only | Civil Status Authority | **low** | none |

**Notes**:
- Dual-government context (GNU vs HoR) fragments civil registry. UN-recognised CSA in Tripoli publishes format on `nid.ly`.
- Partial OFAC sanctions on specific entities (not country-wide).

**Sources**: https://nid.ly/ (intermittent)

---

### 🇾🇪 Yemen (YE)

**Population**: 34M  ·  **Strategic priority**: C  ·  **Est. impl effort**: 1–2 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `YE_NID` | National Number | personal | 10–11 digits (varies) | format-only | Civil Status & Civil Registry Authority | **low** | none |

**Notes**:
- Conflict split issuance between Aden (IRG) and Sana'a (Houthi). OFAC sanctions on specific entities. Flag.

**Sources**: https://www.cso.gov.ye/ (intermittent)

---

### 🇸🇩 Sudan (SD)

**Population**: 48M  ·  **Strategic priority**: C  ·  **Est. impl effort**: 1–2 hours

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `SD_NID` | National Number (الرقم الوطني) | personal | 11 digits | format-only | Civil Registry (MoI) | **low** | none |

**Notes**:
- 2023 conflict (SAF vs RSF) destroyed parts of civil registry. Algorithm not published.
- OFAC sanctions partially lifted 2017, re-tightened on specific entities. Flag as `region: "sanctioned"`.

**Sources**: (no stable government source currently online)

---

## Open questions / unverified

Confirm with a domain expert (ideally local KYC vendor) before shipping ANY checksum logic:

1. **SA_NID / SA_IQAMA Luhn**: OSS libs use standard Luhn but no MoI/Absher publication confirms it. Cross-validate against 50+ samples from Absher dev sandbox before raising above `moderate`.
2. **AE_EID checksum**: community claim is "modified Luhn with offset"; at least 3 GitHub repos disagree on the constant. Ship `format-only`.
3. **EG_NID checksum**: 14-digit personal number widely parsed for DOB; no library converges on check-digit math. Ship format + DOB plausibility only.
4. **IR_NID mod-11**: reproduced identically across 10+ Iranian fintech SDKs; raise to `high` ONLY after sabteahval.ir technical reference (none found).
5. **JO_NID, KW_CIVIL, QA_QID, BH_CPR, OM_CIVIL**: all have community Luhn/mod-11 claims; none corroborated by issuer. Default `format-only`.
6. **LB, SY, IQ, LY, YE, SD**: format-only is the only ethically and operationally defensible position. Do not invent or import community checksums.
7. **Sanctions handling**: confirm with legal counsel the `pii.warning` wording for IR/SY/YE/LY/SD specs. Validation = lawful; storage may require additional safeguards under OFAC/EU rules.

## Suggested wave plan

- **Wave A (v1.4.0)**: IL, TR, EG, AE, SA — 5 countries, 9 specs, ~28h, ~285M coverage, 4 `high`-confidence specs.
- **Wave B (v1.4.1)**: JO, MA, TN, DZ, QA, KW, BH — 7 countries, 11 specs, ~24h, +2 `high`-confidence (MA_ICE, TN_MF).
- **Wave C (v1.4.2)**: OM, LB, IR — 3 countries, ~9h, IR shipped as `moderate` after corroboration.
- **Wave D (v1.5.x, conditional)**: IQ, SY, YE, LY, SD — only if demand justifies; `low` confidence + sanctions flag, format-only.

Total: 20 countries / 25–27 specs / ~65–70h implementation + ~30h cross-validation against real samples.
