# Sub-Saharan Africa — `nationid` v1.4 Roadmap Research

> **Research conditions**: Compiled 2026-05-23 without live web access; URLs and algorithmic claims are best-effort from training knowledge and **MUST be re-verified** before code is written. Sub-Saharan Africa is weak on first-party algorithm publication. Where a community library (`python-stdnum`, ID4Africa) has reverse-engineered an algorithm we cite it as oracle and cap confidence at `moderate`. Where no oracle exists we cap at `format-only`/`low`.

## Regional summary

24 countries, ~1.15 B people, dominated by two giants (NG ~225M, ET ~125M) plus a mature southern-cone regime led by South Africa. Three forces shape this backlog:

1. **Foundational-ID rollouts (post-2015)** funded by World Bank ID4D, modeled on Aadhaar: NIN (NG), Huduma (KE), Ghana Card (GH), NIDA (TZ), Fayda (ET), Ndaga Muntu (UG), NID (RW). 10-16 digits, undocumented checks.
2. **Mobile-money KYC dominance** (M-Pesa, MTN MoMo, Orange Money, Wave) keys off phone + selfie, not national ID. nationid is for *documents* — adoption-of-ID-in-KYC matters more than pop for prioritization.
3. **Francophone WAEMU/CEMAC bloc** (CI, SN, ML, BF, CM, CG) shares CEDEAO biometric formats; algorithms undocumented in English sources.

### TL;DR — Top 5 to ship in v1.4

| Rank | Country | Rationale | Ceiling |
|------|---------|-----------|---------|
| 1 | **ZA** | 13-digit ID, Luhn, embeds DOB/gender/citizenship; in `python-stdnum.za.idnr` since 2013. Only high-confidence ship in the region. | **high** |
| 2 | **NG** | 225M pop; NIN + BVN (both 11-digit) foundational to fintech KYC. Algorithms undocumented but format alone is high-value. | moderate (format) |
| 3 | **KE** | KRA PIN (`A012345678X`) is the top B2B SaaS validator in East Africa. Huduma frozen — ship legacy 8-digit ID + KRA PIN. | moderate |
| 4 | **GH** | Ghana Card `GHA-NNNNNNNNN-C`, near-universal coverage by 2024, mandatory for SIM/bank/tax. | moderate |
| 5 | **RW** | Small pop (~14M) but cleanest digital-ID stack on continent; 16-digit NID with embedded gender/year. | moderate |

Deferred to v1.5+: ET (Fayda still rolling out), TZ/UG (algorithm opacity), francophone bloc as batch.

---

## West Africa

### 🇳🇬 Nigeria (NG)

**Pop**: ~225M  ·  **Priority**: **S**  ·  **Effort**: 6-10 h

| Code | Document | Scope | Length | Algorithm | Issuer | Ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------|--------|
| `nin` | National Identification Number | person | 11 digits | undocumented (claims of Verhoeff / wmod-10, **unverified**) | NIMC | format-only (`mod` if Verhoeff confirmed) | community-only |
| `bvn` | Bank Verification Number | bank KYC | 11 digits | CBN treats as opaque | CBN | format-only | none |
| `tin` | Taxpayer ID | tax | 8-10 digits | undocumented | FIRS/JTB | format-only | none |

**Notes**: NIN and BVN visually identical (11 numeric) — disambiguation must be explicit (no auto-detect). 2023 NDPA criminalizes storing NIN without lawful basis — strong PII guidance required.

**Sources**: https://nimc.gov.ng/ · https://www.cbn.gov.ng/bvn/ · https://ndpc.gov.ng/

### 🇬🇭 Ghana (GH)

**Pop**: ~34M  ·  **Priority**: **A**  ·  **Effort**: 4-6 h

| Code | Document | Scope | Length | Algorithm | Issuer | Ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------|--------|
| `ghanaCard` | Ghana Card PIN | person | 15 chars `GHA-NNNNNNNNN-C` | community claims mod-11 on last char; **unverified** | NIA | moderate | community-only |
| `tin` | TIN (= Ghana Card PIN for individuals since 2022) | tax | 11 chars `PNNNNNNNNNN` (legacy) | format-only | GRA | format-only | none |

**Notes**: Since 2022 GRA directive, individual TIN = Ghana Card PIN. Accept both names; route to one validator. **Sources**: https://www.nia.gov.gh/ · https://gra.gov.gh/

### 🇨🇮 🇸🇳 Côte d'Ivoire / Senegal (CI, SN)

**Pop**: CI ~29M / SN ~18M  ·  **Priority**: **B** both  ·  **Effort**: 3-4 h each

| Country | Code | Document | Length | Algorithm | Issuer | Ceiling | Oracle |
|---|------|----------|--------|-----------|--------|---------|--------|
| CI | `cni` | CNI-CEDEAO biometric | 10 digits (post-2020) | undocumented | ONECI | format-only | none |
| SN | `cni` | CNI-CEDEAO | 13-17 alphanumeric | undocumented | Min. Intérieur | format-only | none |
| SN | `ninea` | NINEA (tax / legal entity) | 7 digits + 4-char suffix | format-only | ANSD/DGID | format-only | none |

**Notes**: CI CEDEAO format rolled out 2020-2023; older formats coexist. **Sources**: https://oneci.ci/ · https://www.servicepublic.gouv.sn/

### 🇲🇱 🇧🇫 Mali / Burkina Faso (ML, BF)

**Pop**: ML ~24M / BF ~23M  ·  **Priority**: **C** both  ·  **Effort**: 2-3 h each (defer)

| Country | Code | Document | Length | Algorithm | Issuer | Ceiling | Oracle |
|---|------|----------|--------|-----------|--------|---------|--------|
| ML | `nina` | NINA biometric | 14 alphanumeric (**unverified**) | undocumented | CTSP | format-only | none |
| BF | `cnib` | CNIB (CEDEAO biometric) | 17 chars | undocumented | ONI Burkina | format-only | none |

**Notes**: ML coverage lowest in West Africa due to 2020+ instability. BF similar. Defer both unless customer asks. **Sources**: https://mali.gouv.ml/ · https://oni.bf/ (**unverified**)

### 🇨🇲 Cameroon (CM)

**Pop**: ~28M  ·  **Priority**: **B**  ·  **Effort**: 3-4 h

| Code | Document | Scope | Length | Algorithm | Issuer | Ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------|--------|
| `cni` | Carte Nationale d'Identité | person | 9-10 digits | undocumented | DGSN | format-only | none |
| `niu` | NIU | tax | 14 alphanumeric `MNNNNNNNNNNNNL` (**unverified**) | format-only | DGI | format-only | none |

**Notes**: 2024 IDEMIA/Augentic contract for new biometric CNI — format may change 2026-2027; design with versioning. **Sources**: https://www.dgsn.cm/ · https://www.impots.cm/

---

## East Africa

### 🇰🇪 Kenya (KE)

**Pop**: ~55M  ·  **Priority**: **A**  ·  **Effort**: 5-7 h

| Code | Document | Scope | Length | Algorithm | Issuer | Ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------|--------|
| `nationalId` | National ID | person | 7-8 digits sequential | none | DCRS | format-only | community-only |
| `krapin` | KRA PIN | tax | 11 chars `A012345678X` (`A`=individual, `P`=corp) | format + char-class, no math | KRA | moderate | community-only |
| `hudumaNamba` | Huduma Namba | frozen | 10 digits (**unverified**) | undocumented | NIIMS | **do not ship** | none |

**Notes**: 2022 High Court halted Huduma; new Maisha Namba (2024) is numerically equivalent to legacy 8-digit ID. KRA PIN required on every invoice — highest-value validator. **Sources**: https://www.kra.go.ke/ · https://www.odpc.go.ke/

### 🇹🇿 Tanzania (TZ)

**Pop**: ~67M  ·  **Priority**: **B**  ·  **Effort**: 3-5 h

| Code | Document | Scope | Length | Algorithm | Issuer | Ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------|--------|
| `nida` | NIDA number | person | 20 digits `YYYYMMDD-NNNNN-NNNNN-NN` | embeds DOB; checksum undocumented | NIDA | low-mod (DOB) | none |
| `tin` | TIN | tax | 9 digits | undocumented | TRA | format-only | none |

**Sources**: https://www.nida.go.tz/ · https://www.tra.go.tz/

### 🇺🇬 Uganda (UG)

**Pop**: ~48M  ·  **Priority**: **B**  ·  **Effort**: 3-5 h

| Code | Document | Scope | Length | Algorithm | Issuer | Ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------|--------|
| `nin` | Ndaga Muntu NIN | person | 14 chars (`CM`/`CF` prefix = gender + birth year) | encodes gender/year, no checksum | NIRA | low-mod | none |
| `tin` | URA TIN | tax | 10 digits | undocumented | URA | format-only | none |

**Notes**: Mandatory NIN renewal starts 2026 (10-yr expiry from 2014 mass-issue) — do not encode expiry. **Sources**: https://www.nira.go.ug/ · https://www.ura.go.ug/

### 🇪🇹 Ethiopia (ET)

**Pop**: ~125M  ·  **Priority**: **B** (S by 2027)  ·  **Effort**: 4-6 h

| Code | Document | Scope | Length | Algorithm | Issuer | Ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------|--------|
| `fan` | Fayda Number | person | 12 digits (**unverified**) | MOSIP-based, likely Verhoeff | NIDP | low-mod | MOSIP src ref |

**Notes**: Built on **MOSIP** (same as Morocco, Philippines); MOSIP UIN uses Verhoeff + restricted-number rules — strongest algorithmic lead in region, but ET config not published. Coverage <20% mid-2025; defer to v1.5. **Sources**: https://id.gov.et/ · https://github.com/mosip/

### 🇷🇼 Rwanda (RW)

**Pop**: ~14M  ·  **Priority**: **A**  ·  **Effort**: 3-4 h

| Code | Document | Scope | Length | Algorithm | Issuer | Ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------|--------|
| `nid` | National ID | person | 16 digits `C YYYY G NNNNNNN CC` (century + birth year + gender + serial + 2-digit check) | last 2 = checksum; algorithm **unverified** | NIDA Rwanda | moderate | community-only |
| `tin` | RRA TIN | tax | 9 digits | format-only | RRA | format-only | none |

**Notes**: Cleanest digital ID stack on continent (Irembo); embedded DOB + gender enables strong extract API. **Sources**: https://www.nida.gov.rw/ · https://www.rra.gov.rw/

### 🇸🇸 South Sudan (SS)

**Pop**: ~12M  ·  **Priority**: **C**  ·  **Effort**: defer. No foundational digital ID in production; revisit post-2027.

---

## Southern Africa

### 🇿🇦 South Africa (ZA)

**Pop**: ~62M  ·  **Priority**: **S**  ·  **Effort**: 4-6 h (highest-quality ship in region)

| Code | Document | Scope | Length | Algorithm | Issuer | Ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------|--------|
| `idnr` | RSA ID Number | person | 13 digits `YYMMDD SSSS C A Z` (DOB+gender+citizenship+race-legacy+Luhn) | **Luhn on full 13** | DHA | **high** | `python-stdnum.za.idnr` |
| `tin` | SARS Income Tax Ref | tax | 10 digits starting 0/1/2/3/9 | mod-10 (**unverified**) | SARS | moderate | community-only |
| `cipc` | Company registration | legal entity | `YYYY/NNNNNN/NN` | format-only | CIPC | format-only | community-only |

**Notes**: Gender bit (SSSS positions 7-10): <5000 female, ≥5000 male — expose in extract. POPIA (2020) restricts processing. Smart ID Card issuance does not change number format. **Sources**: https://www.dha.gov.za/ · https://arthurdejong.org/python-stdnum/doc/2.1/stdnum.za.idnr.html · https://www.sars.gov.za/

### 🇲🇿 🇦🇴 Mozambique / Angola (MZ, AO) — Lusophone block

**Pop**: MZ ~33M / AO ~37M  ·  **Priority**: **B** both  ·  **Effort**: 3-4 h each

| Country | Code | Document | Length | Algorithm | Issuer | Ceiling | Oracle |
|---|------|----------|--------|-----------|--------|---------|--------|
| MZ | `bi` | Bilhete de Identidade | 13 chars `NNNNNNNNNCANNNN` (**unverified**) | undocumented | DNIC | format-only | none |
| MZ | `nuit` | NUIT (tax) | 9 digits | undocumented | AT | format-only | none |
| AO | `bi` | Bilhete de Identidade | 14 chars `NNNNNNNNNLLNNN` | undocumented | SME | format-only | community-only |
| AO | `nif` | NIF (tax) | 9-10 digits | undocumented | AGT | format-only | none |

**Sources**: https://www.at.gov.mz/ · https://agt.minfin.gov.ao/

### 🇿🇲 🇿🇼 🇧🇼 🇳🇦 🇲🇬 C-tier Southern + Madagascar batch

**Priority**: **C** all  ·  **Effort**: 2-3 h each (defer or batch with v1.6)

| Country | Pop | Code | Document | Length / format | Algorithm | Issuer | Ceiling | Oracle |
|---|---|------|----------|--------|-----------|--------|---------|--------|
| ZM | 21M | `nrc` | NRC | `NNNNNN/NN/N` (last digit = province code) | range check, not math | DNRPC | low-mod | none |
| ZM | 21M | `tpin` | TPIN | 10 digits | undocumented | ZRA | format-only | none |
| ZW | 16M | `nationalId` | NRN | `NN-NNNNNNL NN` (district + serial + check letter) | alphabetic check via unpublished table | Registrar-General | low | none |
| BW | 2.6M | `omang` | Omang | 9 digits (1st=district, 5th=gender 1/2) | embeds district+gender, no math | DCEC/DNCR | low-mod | community-only |
| NA | 2.7M | `nationalId` | ID Number | 11 digits `YYMMDD NNNNN` | embeds DOB, no checksum | MHAISS | low-mod (DOB sanity) | none |
| MG | 30M | `cin` | CIN | 12 digits (**unverified**) | undocumented | Min. Intérieur | format-only | none |

**Sources**: https://www.zra.org.zm/ · http://www.rg.gov.zw/ (**unverified**) · https://www.gov.bw/ · https://mhaiss.gov.na/

### 🇲🇺 Mauritius (MU)

**Pop**: ~1.3M  ·  **Priority**: **B** (offshore-finance value > pop)  ·  **Effort**: 3-4 h

| Code | Document | Scope | Length | Algorithm | Issuer | Ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------|--------|
| `nic` | NIC | person | 14 chars `LNNNNNNNNNNNNL` (letter + 12 digits + check letter) | community: mod-29 weighted-sum letter check (**unverified**) | Civil Status Div. | moderate | community-only |
| `brn` | Business Registration Number | legal entity | 9 digits | format-only | CBRD | format-only | none |

**Notes**: NIC weight > pop due to Mauritius's Africa-Asia financial-hub role; offshore-banking KYC needs it. **Sources**: https://csd.govmu.org/ · https://companies.govmu.org/

---

## Central Africa

### 🇨🇩 🇨🇬 DR Congo / Congo-Brazzaville (CD, CG)

**Pop**: CD ~105M / CG ~6M  ·  **Priority**: **C**  ·  **Effort**: defer (both).

CD: new biometric ONIP in pilot 2024-2025, no stable format; old electoral card is not a national ID. CG: CNI format undocumented. Revisit v1.6. **Sources**: https://onip.cd/ (**unverified**)

---

## Open questions / unverifiable IDs

Cannot ship responsibly — no oracle AND no first-party spec. Every cell above is hypothesis.

1. **NG NIN** — Verhoeff vs weighted-mod-10 claims; needs NIMC bulletin or empirical attack. Highest-value unknown.
2. **NG BVN** — CBN states opaque; likely format-only forever.
3. **ET Fayda** — likely Verhoeff via MOSIP; confirm via deployed MOSIP config.
4. **TZ NIDA** — embeds DOB but checksum unknown.
5. **UG NIN** — gender/year decodable, checksum undocumented.
6. **AO / MZ / MG / CD / CG** — Lusophone/Francophone block: anecdotal formats, no first-party spec.
7. **ZW** — alphabetic check via unpublished Registrar-General table; likely needs FOI.

### v1.4 engineering ship order

1. **ZA** — high-confidence Luhn, oracle ready, proves the region.
2. **NG NIN + BVN** — biggest market; document algorithmic gap loudly in JSDoc.
3. **KE KRA PIN + legacy ID** — most-requested by B2B SaaS.
4. **GH Ghana Card** — mandatory adoption = real demand.
5. **RW NID** — clean format, easy demo, fills East Africa.
6. **MU NIC** — offshore-finance KYC, low effort.

Defer to v1.5: ET Fayda once MOSIP config public; TZ/UG NIN after empirical sampling; francophone bloc as batch; SARS TIN deep-validation.
