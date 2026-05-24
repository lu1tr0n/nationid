# Rest of Europe — Country Backlog (v1.4 → v2.0)

> Scope: EU/EEA not yet shipped (17) + Eastern Europe / Balkans (10) = 27 entries.
> Already covered: GB, FR, DE, IT, NL, BE, CH, PL, SE, NO, DK, FI, ES, PT.
> Oracle baseline: `python-stdnum` 2.1 index — <https://arthurdejong.org/python-stdnum/doc/2.1/>.

## Regional summary

Europe is the easiest region to ship: python-stdnum covers every EU/EEA country in this batch (most with personal + VAT both); EU VAT is a single VIES-validated framework with public per-country algorithms; Yugoslav successors (BA, HR, ME, MK, RS, SI, partially XK) share the **JMBG/EMBG** 13-digit weighted mod-11 algorithm — one core unlocks 5+ countries. Strategic angle: shipping **"EU-27 VAT complete" as a single v1.5 milestone** is a low-cost high-marketing-value play (~16 new VAT modules, ~25-30h batched, all with stdnum oracle, unlocks "EU VIES feature parity" claim).

### TL;DR — recommended ship order

| Rank | Country | Why | Effort |
|------|---------|-----|--------|
| 1 | RO | 19M, fintech/outsourcing, CNP well-documented | 6h |
| 2 | IE | EU tech HQ (Stripe, Google, Meta) | 6h |
| 3 | CZ | 10M, mature B2B, rodné číslo clean | 6h |
| 4 | HU | 10M, smallest effort in batch | 4h |
| 5 | GR | 10M, AMKA + AFM widely needed | 6h |
| 6 | AT | DACH completion with DE+CH | 6h |
| 7 | **EU-VAT batch** (BG/HR/SK/SI/LT/LV/EE/MT/CY/LU) | Completes EU-27 VIES coverage | 25-30h |
| 8 | UA | Humanitarian + reconstruction tooling | 6h |
| 9 | RS | Largest Balkan; JMBG core unlocks BA/MK/ME | 6h |
| 10 | RU | High export-compliance demand; ship with policy disclaimer | 8h |

Personal IDs for the Baltic / small-EU batch can follow VAT in a second pass.

---

## EU / EEA — not yet covered

### 🇮🇪 Ireland (IE)

**Population**: 5.3M · **Strategic priority**: A · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `IE_PPS` | Personal Public Service Number | personal/tax | 8-9 | mod-23 letter check | DSP | high | `python-stdnum/ie.pps` |
| `IE_VAT` | VAT number | tax | 8-9 | mod-23 (PPS family) | Revenue | high | `python-stdnum/ie.vat` |

**Notes**:
- Post-2013 PPS adds 9th char (usually "W"); validator must handle both 8- and 9-char forms.
- VAT and PPS share the same mod-23 letter-checksum core.
- Tech-stack reality: every EU SaaS hits Irish entities → VAT is more requested than PPS.

**Sources**: <https://www.revenue.ie/en/jobs-and-pensions/pps-number/index.aspx> · `python-stdnum/ie.pps`, `ie.vat`.

---

### 🇦🇹 Austria (AT)

**Population**: 9.1M · **Strategic priority**: A (DACH completion) · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `AT_VNR` | Sozialversicherungsnummer | personal/social | 10 | weighted mod-11 | Hauptverband SV | high | `python-stdnum/at.vnr` |
| `AT_UID` | Umsatzsteuer-ID (VAT) | tax | 9 (`ATU` + 8) | weighted mod-10 | BMF | high | `python-stdnum/at.uid` |
| `AT_TIN` | Steuernummer | tax | variable | format-only (regional prefix) | regional Finanzamt | moderate | `python-stdnum/at.tin` |

**Notes**: VNR embeds birth date at pos 5-10 (PII). UID has literal "U" between AT and digits. TIN has no national checksum.

**Sources**: <https://www.bmf.gv.at> · `python-stdnum/at.vnr`, `at.uid`, `at.tin`.

---

### 🇱🇺 Luxembourg (LU)

**Population**: 0.66M · **Strategic priority**: B · **Est. effort**: 4h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `LU_VAT` | TVA number | tax | 8 | weighted mod-89 | AED | high | `python-stdnum/lu.tva` |
| `LU_MNID` | Matricule national | personal | 13 | mod-11 + mod-13 dual | CTIE | moderate | community-only |

**Notes**: Punches above weight for fund admin / holdcos. Personal matricule has no stdnum module — implement from CTIE spec.

**Sources**: <https://pfi.public.lu> · <https://ctie.gouvernement.lu> · `python-stdnum/lu.tva`.

---

### 🇬🇷 Greece (GR)

**Population**: 10.4M · **Strategic priority**: A · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `GR_AMKA` | Social Security Number | personal/social | 11 | Luhn | IDIKA | high | `python-stdnum/gr.amka` |
| `GR_AFM` | Tax Registry No. (also VAT) | tax | 9 | weighted mod-11 | AADE | high | `python-stdnum/gr.vat` |

**Notes**: AMKA encodes DDMMYY birth at pos 1-6 (PII). AFM serves both personal tax + VAT. **VIES prefix is `EL`, not `GR`** — document explicitly.

**Sources**: <https://www.amka.gr> · <https://www.aade.gr> · `python-stdnum/gr.amka`, `gr.vat`.

---

### 🇨🇿 Czechia (CZ)

**Population**: 10.5M · **Strategic priority**: A · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `CZ_RC` | Rodné číslo | personal | 9-10 | mod-11 (10-d only) + date | MV ČR | high | `python-stdnum/cz.rc` |
| `CZ_DIC` | DIČ (VAT) | tax | 8-10 | mod-11 (multi-variant) | Finanční správa | high | `python-stdnum/cz.dic` |

**Notes**: Pre-1954 RC = 9 digits no checksum; post-1954 = 10 digits mod-11. Shares pre-1993 heritage with SK_RC.

**Sources**: <https://www.financnisprava.cz> · `python-stdnum/cz.rc`, `cz.dic`.

---

### 🇭🇺 Hungary (HU)

**Population**: 9.6M · **Strategic priority**: A · **Est. effort**: 4h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `HU_ANUM` | Közösségi adószám (VAT) | tax | 8 | weighted mod-10 `[9,7,3,1,9,7,3]` | NAV | high | `python-stdnum/hu.anum` |
| `HU_AT` | Adóazonosító jel | personal/tax | 10 | weighted mod-11 | NAV | moderate | community-only |

**Notes**: Smallest effort in batch. Personal Adóazonosító jel not in stdnum — write from NAV spec.

**Sources**: <https://nav.gov.hu> · `python-stdnum/hu.anum`.

---

### 🇷🇴 Romania (RO)

**Population**: 19M · **Strategic priority**: S · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `RO_CNP` | Cod numeric personal | personal | 13 | weighted mod-11 `[2,7,9,1,4,6,3,5,8,2,7,9]` | DEPABD | high | `python-stdnum/ro.cnp` |
| `RO_CUI` | Cod unic de înregistrare | business | 2-10 | weighted mod-11 `[7,5,3,2,1,7,5,3,2]` | ONRC | high | `python-stdnum/ro.cui` |
| `RO_CF` | Cod fiscal (VAT) | tax | 2-10 | same as CUI, `RO` prefix | ANAF | high | `python-stdnum/ro.cf` |

**Notes**: CNP digit 1 = sex + century (1/2=1900s, 5/6=2000s, 7/8/9=foreigner). CUI and CF are the same number; CF = VAT-registered alias.

**Sources**: <https://www.anaf.ro> · `python-stdnum/ro.cnp`, `ro.cui`, `ro.cf`.

---

### 🇧🇬 Bulgaria (BG)

**Population**: 6.7M · **Strategic priority**: B · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `BG_EGN` | Personal No. | personal | 10 | weighted mod-11 + date | GRAO | high | `python-stdnum/bg.egn` |
| `BG_PNF` | Foreigner ID | personal | 10 | same as EGN | MoI | high | `python-stdnum/bg.pnf` |
| `BG_VAT` | ДДС номер | tax | 9-10 | EGN reuse (10-d) or mod-11 (9-d) | NRA | high | `python-stdnum/bg.vat` |

**Notes**: EGN month-shift family (PESEL/CNP cousin): +20 = 1800s, +40 = 2000s. VAT for individuals literally IS the EGN.

**Sources**: <https://www.grao.government.bg> · `python-stdnum/bg.egn`, `bg.vat`.

---

### 🇭🇷 Croatia (HR)

**Population**: 3.9M · **Strategic priority**: B (EU member) · **Est. effort**: 4h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `HR_OIB` | Osobni identifikacijski broj | personal + business + VAT | 11 | ISO 7064 mod 11,10 | Porezna uprava | high | `python-stdnum/hr.oib` |

**Notes**: Cleanest EU country to ship — one code, one algo covers personal + tax + VAT (VIES prefix `HR`).

**Sources**: <https://www.porezna-uprava.hr> · `python-stdnum/hr.oib`.

---

### 🇸🇰 Slovakia (SK)

**Population**: 5.4M · **Strategic priority**: B · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `SK_RC` | Rodné číslo | personal | 9-10 | mod-11 (10-d) + date | MV SR | high | `python-stdnum/sk.rc` |
| `SK_DPH` | IČ DPH (VAT) | tax | 10 | mod-11 | Finančná správa | high | `python-stdnum/sk.dph` |

**Notes**: Pre-1993 common heritage with CZ_RC — share helpers.

**Sources**: <https://www.financnasprava.sk> · `python-stdnum/sk.rc`, `sk.dph`.

---

### 🇸🇮 Slovenia (SI)

**Population**: 2.1M · **Strategic priority**: B · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `SI_EMSO` | Personal No. | personal | 13 | weighted mod-11 (JMBG family) | MNZ | high | `python-stdnum/si.emso` |
| `SI_DDV` | Davčna številka (VAT) | tax | 8 | weighted mod-11 | FURS | high | `python-stdnum/si.ddv` |
| `SI_MATICNA` | Business reg | business | 7-10 | weighted mod-11 | AJPES | moderate | `python-stdnum/si.maticna` |

**Notes**: EMSO is just JMBG (13-d) inherited from SFRY — shares algorithm with BA/MK/RS/ME.

**Sources**: <https://www.fu.gov.si> · `python-stdnum/si.emso`, `si.ddv`, `si.maticna`.

---

### 🇱🇹 Lithuania (LT)

**Population**: 2.8M · **Strategic priority**: B (EU fintech hub) · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `LT_AK` | Asmens kodas | personal | 11 | weighted mod-11 (dual-weight fallback) | Reg. centras | high | `python-stdnum/lt.asmens` |
| `LT_PVM` | PVM (VAT) | tax | 9 or 12 | weighted mod-11 (variants) | VMI | high | `python-stdnum/lt.pvm` |

**Notes**: Asmens kodas digit 1 = sex+century. EU fintech-licensing hub (Revolut etc.) → disproportionate B2B demand.

**Sources**: <https://www.vmi.lt> · `python-stdnum/lt.asmens`, `lt.pvm`.

---

### 🇱🇻 Latvia (LV)

**Population**: 1.8M · **Strategic priority**: B · **Est. effort**: 5h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `LV_PK` | Personas kods | personal | 11 | weighted mod-11; **post-2017 "2-prefix" form is format-only** | PMLP | moderate | community-only |
| `LV_PVN` | VAT | tax | 11 | weighted mod-11 | VID | high | `python-stdnum/lv.pvn` |

**Notes**: 2017 reform allows non-DOB-encoding personal codes (privacy). Validator must accept both. stdnum ships only VAT.

**Sources**: <https://www.pmlp.gov.lv> · <https://www.vid.gov.lv> · `python-stdnum/lv.pvn`.

---

### 🇪🇪 Estonia (EE)

**Population**: 1.4M · **Strategic priority**: A (e-Residency) · **Est. effort**: 5h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `EE_IK` | Isikukood | personal | 11 | weighted mod-11 (primary + secondary weights) | SMIT | high | `python-stdnum/ee.ik` |
| `EE_KMKR` | VAT | tax | 9 | weighted mod-10 | MTA | high | `python-stdnum/ee.kmkr` |
| `EE_RK` | Registrikood (business) | business | 8 | weighted mod-11 | RIK | high | `python-stdnum/ee.registrikood` |

**Notes**: Isikukood is also issued to e-Residency holders worldwide → applies cross-border, not just to Estonian residents.

**Sources**: <https://www.id.ee> · <https://www.emta.ee> · `python-stdnum/ee.ik`, `ee.kmkr`, `ee.registrikood`.

---

### 🇲🇹 Malta (MT)

**Population**: 0.55M · **Strategic priority**: B (iGaming/crypto hub) · **Est. effort**: 4h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `MT_VAT` | VAT | tax | 8 | weighted mod-37 | CFR | high | `python-stdnum/mt.vat` |
| `MT_IDCARD` | ID card | personal | 7 digits + letter (M/G/A/P/L/H/B/Z) | format-only (letter = category, not check) | Identity Malta | low | community-only |

**Notes**: ID-card letter is categorical, no published checksum. Treat as format-only.

**Sources**: <https://cfr.gov.mt> · `python-stdnum/mt.vat`.

---

### 🇨🇾 Cyprus (CY)

**Population**: 1.2M · **Strategic priority**: B · **Est. effort**: 4h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `CY_VAT` | TIC | tax | 9 (8 digits + letter) | custom-checksum (letter = check) | Tax Dept | high | `python-stdnum/cy.vat` |

**Notes**: Citizen ID has no widely-documented checksum. VAT-only ship is fine (holdco / forex use cases are B2B-only).

**Sources**: <https://www.mof.gov.cy/mof/tax> · `python-stdnum/cy.vat`.

---

### 🇮🇸 Iceland (IS)

**Population**: 0.39M · **Strategic priority**: B (EEA, not EU) · **Est. effort**: 4h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `IS_KENNITALA` | Kennitala | personal + business | 10 | weighted mod-11 `[3,2,7,6,5,4,3,2]` | Þjóðskrá | high | `python-stdnum/is_.kennitala` |
| `IS_VSK` | VAT | tax | 5-6 | format-only | RSK | moderate | `python-stdnum/is_.vsk` |

**Notes**: Kennitala is universal (persons AND companies); last digit encodes category. IS not in VIES — kennitala serves as VAT-equivalent. Note Python keyword collision → module name is `is_`.

**Sources**: <https://www.skra.is> · <https://www.rsk.is> · `python-stdnum/is_.kennitala`.

---

## Eastern Europe / Balkans

### 🇷🇺 Russia (RU)

**Population**: 144M · **Strategic priority**: S (with policy disclaimer) · **Est. effort**: 8h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `RU_INN` | Taxpayer ID | personal + business + tax | 10 (legal) / 12 (personal) | weighted mod-11 (single 10-d / dual 12-d) | FNS | high | `python-stdnum/ru.inn` |
| `RU_OGRN` | State reg. number | business | 13 (OGRN) / 15 (OGRNIP) | custom mod (last = N mod 11/13) | FNS | high | `python-stdnum/ru.ogrn` |

**Sanctions posture — recommended: ship it, with explicit README disclaimer.** Validation of Russian taxpayer IDs is **more** in demand since 2022, not less, because every Western company subject to EU/US/UK sanctions regimes needs to validate counterparty INN/OGRN against OFAC/EU/UK sanctions lists. A bare validator does not enable sanctioned trade — it enables compliance against it. python-stdnum, every major KYC SaaS, and JVM/Go/Rust equivalents all ship Russian validators for this reason. Removing it would punish compliance teams, not Russia. README must state: *"`RU_INN` and `RU_OGRN` validation does not constitute authorization for any transaction. Consumers must independently screen against applicable sanctions regimes."* Flag the policy choice in v1.4 release notes so it can be revisited.

**Sources**: <https://www.nalog.gov.ru> · `python-stdnum/ru.inn`, `ru.ogrn`.

---

### 🇺🇦 Ukraine (UA)

**Population**: 38M · **Strategic priority**: A (humanitarian + reconstruction) · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `UA_RNTRC` | Tax ID | personal/tax | 10 | weighted mod-11 `[-1,5,7,9,4,6,10,5,7]` | DPS | high | `python-stdnum/ua.rntrc` |
| `UA_EDRPOU` | Business reg | business | 8 | weighted mod-11 (primary + secondary weights) | DPS | high | `python-stdnum/ua.edrpou` |

**Notes**: Post-2022 high relevance: refugee status, reconstruction-funding KYC, diaspora payroll. RNTRC encodes sex bit (PII). Refugee-issued docs use same format.

**Sources**: <https://tax.gov.ua> · `python-stdnum/ua.rntrc`, `ua.edrpou`.

---

### 🇲🇩 Moldova (MD)

**Population**: 2.6M · **Strategic priority**: B (EU-candidate 2022) · **Est. effort**: 5h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `MD_IDNP` | Personal ID | personal | 13 | weighted mod-11 | ASP | high | `python-stdnum/md.idno` (verify scope) |
| `MD_IDNO` | Legal entity ID | business/tax | 13 | weighted mod-11 | ASP | high | `python-stdnum/md.idno` |

**Notes**: IDNP and IDNO share format and algorithm. EU accession track → VIES integration on medium-term horizon.

**Sources**: <https://www.asp.gov.md> · `python-stdnum/md.idno`.

---

### 🇧🇾 Belarus (BY)

**Population**: 9.2M · **Strategic priority**: C (same sanctions context as RU; lower commercial pull) · **Est. effort**: 5h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `BY_UNP` | Taxpayer ID | tax (personal + business) | 9 | weighted mod-11 (letter-suffix variant) | MNS | moderate-high | `python-stdnum/by.unp` |
| `BY_PERSONAL` | Passport personal No. | personal | 14 (alnum) | format-only (no public checksum) | MVD | low | community-only |

**Notes**: Apply same sanctions-disclaimer language as RU. Ship after RU given lower demand.

**Sources**: <https://www.nalog.gov.by> · `python-stdnum/by.unp`.

---

### 🇷🇸 Serbia (RS)

**Population**: 6.6M · **Strategic priority**: A (largest non-EU Balkan) · **Est. effort**: 6h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `RS_JMBG` | Jedinstveni matični broj građana | personal | 13 | weighted mod-11 (JMBG family) | MUP | high | community-only (algo public) |
| `RS_PIB` | Tax ID | tax | 9 | ISO 7064 mod 11,10 | Poreska uprava | high | `python-stdnum/rs.pib` |

**Notes**: **JMBG is the shared SFRY algorithm** for BA/HR (pre-OIB)/ME/MK/RS/SI (as EMSO)/XK. Implementing once unlocks 5+ countries. Positions 7-9 encode "region of birth" — table required to identify issuing republic. stdnum surprisingly only ships PIB, not JMBG — write algo from public 1976 SFRY spec.

**Sources**: <https://www.purs.gov.rs> · `python-stdnum/rs.pib` · SFRY 1976 JMBG Law.

---

### 🇧🇦 Bosnia and Herzegovina (BA)

**Population**: 3.2M · **Strategic priority**: B (JMBG reuse) · **Est. effort**: 3h (after RS JMBG)

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `BA_JMBG` | Personal No. | personal | 13 | JMBG (region bytes 10-19) | IDDEEA | high | community-only |
| `BA_JIB` | Jedinstveni identifikacioni broj (tax) | tax/business | 13 | weighted mod-11 variant | UIO | moderate | community-only |

**Notes**: **No python-stdnum modules at all** for BA. Cheapest country IF RS JMBG core lands first (mostly region-code tables).

**Sources**: <https://www.iddeea.gov.ba> · <https://www.uino.gov.ba>.

---

### 🇲🇰 North Macedonia (MK)

**Population**: 2.1M · **Strategic priority**: B · **Est. effort**: 3h (after RS JMBG)

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `MK_EMBG` | Personal No. | personal | 13 | JMBG (region 41-49) | MVR | high | community-only |
| `MK_EDB` | Tax ID | tax | 13 | weighted mod-11 | UJP | high | `python-stdnum/mk.edb` |

**Notes**: EMBG = local name for JMBG. Country dispute resolved 2019; ISO code unchanged.

**Sources**: <https://www.ujp.gov.mk> · `python-stdnum/mk.edb`.

---

### 🇦🇱 Albania (AL)

**Population**: 2.8M · **Strategic priority**: B (EU-candidate) · **Est. effort**: 5h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `AL_NID` | Personal No. | personal | 10 (`YYMMDDSSSC`) | custom-checksum (letter A-W) + month-shift encoding | MPB | high | community-only (Council of Ministers Decision 827/2003) |
| `AL_NIPT` | Tax/VAT | tax/business | 10 (letter+8+letter) | format + checksum | DPT | high | `python-stdnum/al.nipt` |

**Notes**: NID month field: 01-12=M, 51-62=F, +30 for foreigners. YY field uses a lookup table (per Decision 827), not direct year.

**Sources**: <https://www.gjendjacivile.gov.al> · <https://www.tatime.gov.al> · `python-stdnum/al.nipt`.

---

### 🇲🇪 Montenegro (ME)

**Population**: 0.62M · **Strategic priority**: C · **Est. effort**: 2h (after RS JMBG)

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `ME_JMBG` | Personal No. | personal | 13 | JMBG (region 20-29) | MUP | high | community-only |
| `ME_PIB` | Tax ID | tax/business | 8 | weighted mod-11 | Poreska uprava | high | `python-stdnum/me.pib` |

**Notes**: Cheapest country in the whole backlog once JMBG core exists.

**Sources**: <https://www.poreskauprava.gov.me> · `python-stdnum/me.pib`.

---

### 🇽🇰 Kosovo (XK)

**Population**: 1.8M · **Strategic priority**: C (defer) · **Est. effort**: 5h

| Code | Document | Scope | Length | Algorithm | Issuer | Confidence ceiling | Oracle |
|------|----------|-------|--------|-----------|--------|---------------------|--------|
| `XK_PNR` | Numri Personal | personal | 10 | unverified | MPB | low | none |
| `XK_FISCAL` | Numri Fiskal | tax/business | 9 | format-only (community reports mod-11 variant) | ATK | low | none |

**ISO 3166 caveat**: Kosovo has no official 2-letter code. `XK` is user-assigned/transitional (adopted by EU, IMF, SWIFT) but **not stable** — may change if UN accession resolves. Document in README. **Recommend deferring to v2.x** unless concrete user demand emerges; ship format-only `XK_PNR` placeholder otherwise. Recognition status does not affect technical validation (same posture as RU/BY).

**Sources**: <https://www.atk-ks.org> · <https://mpb.rks-gov.net>.

---

## Open questions / unverified

1. **JMBG region tables** (BA, HR, ME, MK, RS, SI, XK) — confirm current authoritative source per successor state before shipping `extractRegion()` helpers.
2. **HU Adóazonosító jel** — cross-validate community algo against NAV official spec before promoting to high confidence.
3. **LU Matricule national** — no first-party English doc; need Luxembourgish-speaking contributor or direct CTIE Règlement.
4. **LV Personas kods post-2017** — validate "2-prefix" rules against current PMLP API behaviour, not reform-announcement text.
5. **MT identity card** — confirm letter is purely categorical (not check). Format-only until verified.
6. **BY 14-char passport ID** — no public checksum confirmed; format-only likely long-term.
7. **XK PNR & Fiscal** — search Kosovo academic / legal publications for any documented checksum.
8. **EU-VAT batch milestone** — decide v1.5 = "EU-27 VAT complete" (16 new VAT codes, ~25-30h batched, no personal IDs same release) vs. depth-first per country. Recommendation: batch VAT first, iterate personal IDs in v1.6+.
9. **Sanctions disclaimer wording** (RU, BY) — finalize exact README language with legal review before shipping.
10. **Iceland VAT** — confirm any EFTA/EEA equivalent cross-validation channel, or document VSK as offline-only.
