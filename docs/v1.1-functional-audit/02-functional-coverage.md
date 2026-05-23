# v1.1 Functional Audit — Functional coverage

Audit date: 2026-05-22. Library version: `nationid@1.1.0`. Surface inspected:
`src/core/types.ts`, `src/index.ts`, `src/catalog/`, `src/extract/`,
`src/pii/`, `src/algorithms/`, `src/i18n/`, all 34 `src/countries/<cc>/`
bundles, README, MIGRATION, and `docs/v1-audit/06-confidence-tiers.md`.

## Score: 7.5 / 10

`nationid` is the most complete LATAM identity/tax library shipping today —
22 countries with checksum-verified validators, the only OSS implementation
of SV/GT/HN/DO/CR with check digits, and a passport family across all 22 —
plus a credible 12-country EU pass with first-party-cited algorithms for the
hard EU stack (FI, FR, IT, NL, BE, CH, PL, SE, NO, DK). For the KYC-onboarding
job it is fully production-ready in Latin America and Western/Northern
Europe.

It loses points on three jobs that are common in real consumer apps but
under-served by the v1.1 feature set: (1) the **`extract` module covers only
5 codes** (`MX_CURP`, `MX_RFC_PF`, `AR_*` × 3, `GT_DPI`, `PE_RUC`) while at
least **11 other shipped codes encode DOB and/or sex inside the number** and
return `null` from `extractDOB`/`extractSex` — the most painful misses are
`NO_FNR`, `SE_PERSONNUMMER`, `DK_CPR`, `FI_HETU`, `PL_PESEL`, `FR_NIR`,
`BE_NRN`, `IT_CF`, `SV_NIT`, `HN_DNI`, `NI_CEDULA`. (2) The library ships
**zero auto-detection** ("is this a CPF or a CNPJ?"), which is the gateway
to cross-border data ingest. (3) Asia/Africa/Middle East have **0 country
coverage**, leaving global KYC apps to glue a second library on top of
`nationid` for IN/CN/JP/KR/SG/IL/ZA etc. Driver licenses are also a
single-country (BR_CNH) capability and miss the ride-share use case.

The score is honest against a LATAM/EU-first scope: best-in-class for the
declared lens, with three named gaps that have clear v1.2–v1.4 fixes.

## Coverage matrix — consumer jobs

| Job | Status | What is present | What is missing | Workaround |
|---|---|---|---|---|
| KYC onboarding LATAM (fintech / marketplaces / gig) | ✅ | All 22 LATAM countries with personal-doc validator + checksum where the issuer publishes one. `normalize` for storage, `format` for display, `parse` for typed-failure UI, `mask`/`hash`/`lastN` for safe persistence, `i18n` errors in es/en/pt, `catalog` for dropdowns with localized names. End-to-end demonstrably ships. | DOB/sex extraction from `HN_DNI`, `NI_CEDULA`, `SV_NIT` (all three encode DDMMYY). `extract` for these would let onboarding pre-fill the birth-date field from a single document scan. | Trivial — caller can `parse(...).normalized.slice(...)` and parse the date themselves. Library should still own it. |
| KYC onboarding EU | 🟡 | All 12 EU bundles validate with checksum (NIR, NIP, BSN, PESEL, FNR, CPR, HETU, Personnummer, Steuer-ID, NRN, CF, AHV — every flagship personal ID for the country is high-confidence). `mask`/`hash`/`lastN` accept every EU code, `i18n` reaches them with neutral fallback. | DOB and sex extraction from `NO_FNR`, `SE_PERSONNUMMER`, `DK_CPR`, `FI_HETU`, `PL_PESEL`, `FR_NIR`, `BE_NRN`, `IT_CF` — eight national IDs that *structurally encode the date* and currently return `null`. `i18n` does not ship French/German/Italian/Polish/Nordic locales. | Medium — extract gap is solvable today by the caller but ugly; missing locales force consumers to ship their own catalog wrapper. |
| Tax-ID intake B2B SaaS | ✅ | 49 tax-purpose specs across 34 countries (CNPJ, RFC PF+PM, NIT, RUC, RUT, VAT, USt-IdNr, P.IVA, BTW, etc.). EU VAT covered in all 12 countries plus CH/NO. Country bundle includes `defaultTax` so the form auto-selects the right code from the country toggle. `scope: "both"` is honoured for CL_RUT / CO_CC / BR_CPF cases that are both personal and tax. | No VIES (EU VAT exchange) live lookup. No NIT/CIF entity-name lookup. No "is this a person or a company?" classifier for namespace-collision IDs (CL RUT). | Medium for VIES (out of scope per zero-dep promise — caller adds it). |
| Government / healthcare integration | 🟡 | UK NHS Number with mod-11 checksum. ES_NUSS, MX_NSS, US_SSN, CA_SIN, FR_NIR, CH_AHV cover the social-security use case in 7 countries. BR Título de Eleitor + MX Clave de Elector cover voter registration. | Healthcare specifics: no NHS England specific (UK-only NHS Number is shipped — that is the only healthcare ID in the library). No FR_INS (Identifiant National de Santé) — separate from FR_NIR. No US Medicare HIC / MBI. No CO PROAFA / SS code. No drug-prescription IDs. | Hard — these are deep verticals and shipping them per country would double the catalog. Acceptable as out-of-scope for v1.x. |
| Cross-border data ingest (detect kind) | ❌ | Nothing. There is no `detect(input: string): DocumentTypeCode[]` helper. Each spec exposes its own `rawRegex` and `formattedRegex`, so a caller *can* loop through `listSupportedCodes()` and call `validate()` 120 times — but the library doesn't ship that. | A real detector that returns ranked candidates with confidence per match. This is the single highest-value missing helper for the "user pastes a number, we figure out what it is" job that fintech and marketplaces hit constantly. | Hard — implementable from primitives but tedious; 120 regexes plus tie-breaking rules (CPF vs CNPJ via length, SSN vs ITIN via 9xx prefix, MX RFC PF vs PM via 12/13 chars). Library should own this. |
| PII compliance (GDPR / LGPD) | ✅ | `mask` (configurable reveal via spec mask, separators preserved), `lastN` for indexed search, `hash` (SubtleCrypto, supports salt + SHA-1/256/384/512). All three normalize first so user formatting collapses to a single canonical form. Documentation in `MIGRATION.md` and JSDoc explicitly recommends per-tenant salt. | No "tokenize" (reversible) helper — only hash (irreversible). No FPE (format-preserving encryption) shipping. No built-in retention-policy hint per spec. | Hard for FPE (cryptographic complexity, key management); trivial to add JSDoc retention guidance. |
| Document catalog UI dropdowns | ✅ | `nationid/catalog` exposes `listDocuments(country, locale)` returning code/displayName/longName/knownAs/description/purpose/confidence per spec; `getDocumentInfo`, `listDocumentsByPurpose`. v1.1 added `listCountries(locale)` / `getCountryInfo` / `countryName` / `flagEmoji` via `Intl.DisplayNames` (works for any BCP 47 locale, not just es/en/pt). | Catalog descriptions ship in 3 locales (es/en/pt) only. No "popular IDs first" ordering hint. No `flagEmoji` accessor that returns an explicit `null`/error for unsupported codes (it accepts arbitrary 2-letter input — by design — but no validation against the `CountryCode` union). | Trivial — sufficient out of the box for any UI; missing locales addressable in a minor. |
| MRZ / passport workflows | 🟡 | ICAO 9303 algorithm primitives in `nationid/algorithms`: `mrzCheckDigit`, `mrzCharValue`, `toMrzField9`, `validateMrzNumber` plus 21 country passport specs (every LATAM country in the library + US, plus the alpha-3 codes for all 34 countries via `getCountryInfo().alpha3` so ICAO MRZ nationality field is one lookup away). | No high-level MRZ parser (`parseMrz(line1, line2, line3)` returning `{name, nationality, dob, sex, expiry, documentNumber}`). No TD1/TD2/TD3 layout helpers. Most passport specs are `low`/`moderate` confidence because issuers don't publish the printed-number format. | Medium for a TD3 parser (well-specified format, 88 chars × 2 lines); hard to make production-quality for TD1 because of varied issuer practices. |

## Per-country coverage map

Read as: `country — bundle.personal docs | bundle.tax docs | other purposes | passport? | extract? | confidence (H/M/L/U) | gap`.

### LATAM (18 countries)

**🇸🇻 El Salvador** — Personal: DUI. Tax: NIT (NIT also embeds DDMMYY birth date but `extract` skips it). Passport: yes. Extract: ❌ (despite NIT/DUI both being good candidates — NIT DDMMYY in positions 5-10 and DUI implicit). Confidence: DUI moderate, NIT moderate, passport low (0H/2M/1L). **Gap**: NUP (Número Único Previsional — social-security). No extractor for NIT-encoded DOB. SV is the project owner's own country and still only sits at moderate.

**🇲🇽 México** — Personal: CURP, Clave de Elector (INE), NSS. Tax: RFC PF, RFC PM. Passport: yes. Extract: ✅ for CURP (dob+sex+region) and RFC PF (dob). Confidence: CURP high, NSS high, Clave de Elector low, RFC PF/PM/passport moderate (2H/3M/1L). **Gap**: Driver license (Licencia de Conducir — per-state issuance, no national algorithm; acceptable out-of-scope). CFDI lookup out of scope. Best-covered LATAM country.

**🇨🇴 Colombia** — Personal: CC, CE, TI, Pasaporte, PEP, PPT. Tax: NIT, CC. Passport: yes. Extract: ❌. Confidence: NIT high, CC low, CE low, TI low, PEP low, PPT low, passport unconfirmed (1H/0M/5L/1U). **Gap**: 5-doc personal coverage is exceptional (best in LATAM for migratory variants), but every personal doc except NIT is format-only. Registraduría does not publish a check digit for CC; v1.1 is honest about that.

**🇧🇷 Brasil** — Personal: CPF, CNH, Título de Eleitor, PIS, Pasaporte. Tax: CNPJ, CPF, PIS. Passport: yes. Driver license: ✅ (CNH — only country with a real driver-license spec). Voter: ✅ (Título de Eleitor). Social security: ✅ (PIS). Extract: ❌ (CPF does NOT encode geographic state digit in a recoverable way — the 9th digit historically encoded the state of issuance but is publicly documented as no longer reliable post-2018). Confidence: CPF high, CNPJ high, CNH high, Título high, PIS high, passport moderate (5H/1M/0L). **Gap**: None of substance. Best LATAM coverage by depth.

**🇵🇪 Perú** — Personal: DNI, CE, Pasaporte. Tax: RUC. Extract: ✅ region (RUC tipo-contribuyente). Confidence: RUC high; DNI/CE/passport low (1H/0M/3L). **Gap**: DNI is low confidence (Reniec doesn't publish a checksum); CE has the same issue. Real-world this hurts: PE DNI is the most-used PYME ID and consumers have to settle for format-only. SUNAT's RUC is the only solid PE validator.

**🇦🇷 Argentina** — Personal: DNI, CUIL, Pasaporte. Tax: CUIT, CDI. Extract: ✅ sex from CUIT/CUIL/CDI. Confidence: DNI high, CUIL high, CUIT high, CDI high, passport low (4H/0M/1L). **Gap**: No extractor for AR DNI (which is just a sequential number with no encoded fields, so this is correct).

**🇨🇱 Chile** — Personal: RUT/RUN. Tax: RUT/RUN. Extract: ❌. Confidence: RUT high, passport low (1H/0M/1L). **Gap**: RUT does not encode DOB or sex by design — so the extract gap is "by spec". Passport is low. CL RUT 9th-digit region rule from the audit prompt does NOT exist — CL RUT carries no regional digit.

**🇩🇴 Rep. Dominicana** — Personal: Cédula, Pasaporte. Tax: RNC. Extract: ❌. Confidence: all three moderate (0H/3M/0L). **Gap**: Cédula uses a Luhn-like algorithm that is widely adopted but the JCE never published it, so it stays moderate. DGII publishes RNC algorithm in the e-CF schema — promotable to high in a future release.

**🇬🇹 Guatemala** — Personal: DPI, Pasaporte. Tax: NIT. Extract: ✅ region (department from DPI). Confidence: DPI moderate, NIT moderate, passport low (0H/2M/1L). **Gap**: NIT confidence could rise — SAT publishes a mod-11 variant; would need a primary cite. No municipality extractor (DPI carries it but extract surfaces only the department).

**🇭🇳 Honduras** — Personal: DNI, Pasaporte. Tax: RTN. Extract: ❌ (DNI encodes DDMMYY but no extractor ships). Confidence: 0H/0M/2L/1U (worst country). **Gap**: All three Honduran specs are format-only. RTN is "unconfirmed" — SAR has never published its algorithm. Real-world: HN onboarding apps cannot rely on `nationid` for anything beyond shape checking. This is a gap rooted in upstream data, not library quality.

**🇨🇷 Costa Rica** — Personal: Cédula Física, DIMEX, Pasaporte. Tax: Cédula Jurídica. Extract: ❌. Confidence: física high, jurídica high, DIMEX moderate, passport low (2H/1M/1L). **Gap**: No NUP (Número Único Previsional — CCSS social-security ID).

**🇧🇴 Bolivia** — Personal: CI, Pasaporte. Tax: NIT. Extract: ❌. Confidence: CI moderate, NIT low, passport low (0H/1M/2L). **Gap**: SEGIP doesn't publish a CI verifier. Bolivia stays low because the issuer simply doesn't ship the spec.

**🇪🇨 Ecuador** — Personal: Cédula, Pasaporte. Tax: RUC. Extract: ❌. Confidence: cédula high, RUC high, passport low (2H/0M/1L). **Gap**: Solid coverage.

**🇵🇾 Paraguay** — Personal: CI, Pasaporte. Tax: RUC. Extract: ❌. Confidence: CI moderate, RUC moderate, passport low (0H/2M/1L). **Gap**: No DGRP first-party documentation.

**🇳🇮 Nicaragua** — Personal: Cédula, Pasaporte. Tax: RUC. Extract: ❌ (Cédula encodes DDMMYY but no extractor). Confidence: all three low (0H/0M/3L). **Gap**: Worst-tier confidence alongside HN.

**🇵🇦 Panamá** — Personal: Cédula, Pasaporte. Tax: RUC. Extract: ❌. Confidence: cédula moderate, RUC moderate, passport low (0H/2M/1L). **Gap**: Tribunal Electoral cédula spec only partially documented.

**🇺🇾 Uruguay** — Personal: CI, Pasaporte. Tax: RUT. Extract: ❌. Confidence: CI high, RUT moderate, passport low (1H/1M/1L). **Gap**: Best small-LATAM coverage after VE.

**🇻🇪 Venezuela** — Personal: Cédula, Pasaporte. Tax: RIF. Extract: ❌. Confidence: cédula low, RIF moderate, passport low (0H/1M/2L). **Gap**: SAIME does not publish a cédula algorithm; SENIAT publishes the RIF mod-11 variant.

### North America (2)

**🇺🇸 United States** — Personal: SSN, ITIN, Pasaporte. Tax: EIN, ITIN, SSN. Extract: ❌. Confidence: SSN high, ITIN high, EIN high, passport moderate (3H/1M/0L). **Gap**: No state driver-license validators (Driver License Number formats are per-state, ~50 different patterns — would need a v2 sub-feature). No Medicare MBI. SSA's randomization-era ruleset is correctly implemented.

**🇨🇦 Canadá** — Personal: SIN, Pasaporte. Tax: BN. Extract: ❌. Confidence: SIN high, BN low, passport moderate (1H/1M/1L). **Gap**: BN (Business Number) algorithm is Luhn-derived but CRA's docs are sparse — moderate would be a reasonable promotion. Provincial Health Insurance numbers (OHIP, RAMQ etc.) absent.

### Iberia (2)

**🇪🇸 España** — Personal: DNI, NIE, Pasaporte. Tax: NIF-PJ (CIF), NUSS. Extract: ❌. Confidence: DNI high, NIE high, NIF-PJ high, NUSS high, passport moderate post-v1.0 demotion (4H/1M/0L). **Gap**: Most-complete Iberian coverage. DGT driver license absent (per-state? — actually centralized but no checksum spec). NIE/DNI work for both nationals and residents — solid.

**🇵🇹 Portugal** — Personal: CC, Pasaporte. Tax: NIF. Extract: ❌. Confidence: NIF high, CC low, passport moderate (1H/1M/1L). **Gap**: Cartão de Cidadão (CC) format is published but the Polícia Judiciária verifier is unpublished — explaining the low. NISS (Segurança Social) absent.

### Western Europe (5)

**🇬🇧 United Kingdom** — Personal: NINO, NHS. Tax: UTR, VAT, NINO. Extract: ❌. Confidence: NHS high, VAT high, NINO moderate, UTR moderate (2H/2M/0L). **Gap**: NHS Number ships with mod-11 — only national-healthcare ID currently in the library. UK driver license (DVLA) algorithm published but not in scope.

**🇫🇷 France** — Personal: NIR. Tax: SIREN, SIRET, TVA. Extract: ❌ (NIR encodes DOB + sex + département in positions 1-7 — major miss). Confidence: NIR high, SIREN high, SIRET high, TVA high (4H/0M/0L). **Gap**: No extractor for the most extractable EU ID in the library. FR_INS (health ID) absent. Carte d'identité has no checksum (correctly omitted).

**🇩🇪 Germany** — Personal: Steuer-ID. Tax: Steuernummer, USt-IdNr. Extract: ❌. Confidence: Steuer-ID high, USt-IdNr high, Steuernummer low (2H/0M/1L). **Gap**: Steuernummer's regional prefix encodes the Finanzamt (tax office), unsurfaced. SV-Nummer (social security) absent. Personalausweisnummer (national ID card) absent — Germany has no central national-ID number for citizens, so the gap is real but partially upstream.

**🇮🇹 Italy** — Personal: (none, CF spans personal+tax). Tax: CF, P.IVA. Extract: ❌ (CF encodes DOB + sex + birth-comune — significant miss). Confidence: CF high, P.IVA high (2H/0M/0L). **Gap**: No CF extractor is a clear v1.2 priority. Codice Fiscale is the closest analogue to MX_CURP (same dense personal data encoding); the library validates the check char but doesn't lift the fields. Categorization quirk: CF tagged `purpose: "tax"` in the catalog even though Italians use it as primary personal ID — minor mis-tagging.

**🇨🇭 Switzerland** — Personal: AHV. Tax: UID, MWST. Extract: ❌. Confidence: AHV high, UID high, MWST moderate (2H/1M/0L). **Gap**: AHV-13 is checksum-verified — good. No CH driver license, no Ausländerausweis.

### Benelux (3)

**🇳🇱 Netherlands** — Personal: BSN. Tax: BTW. Extract: ❌. Confidence: BSN high, BTW moderate (1H/1M/0L). **Gap**: BSN does NOT encode DOB (sequence-assigned) so no extract gap on that side. KVK (Chamber of Commerce) number absent.

**🇧🇪 Belgium** — Personal: NRN. Tax: BTW. Extract: ❌ (NRN encodes DOB + sex). Confidence: both high (2H/0M/0L). **Gap**: NRN extractor missing — same shape as the Nordic FNR family.

(Switzerland already covered above.)

### Nordics (4)

**🇸🇪 Sweden** — Personal: Personnummer. Tax: Organisationsnummer, Moms. Extract: ❌ (Personnummer encodes DOB + sex). Confidence: all three high (3H/0M/0L). **Gap**: Personnummer extractor missing. Skatteverket published the spec — easy.

**🇳🇴 Norway** — Personal: FNR, D-nummer. Tax: Organisasjonsnummer, MVA. Extract: ❌ (FNR encodes DOB + sex; D-nummer encodes DOB shifted +40). Confidence: all four high (4H/0M/0L). **Gap**: FNR/D-nummer extractors missing.

**🇩🇰 Denmark** — Personal: CPR. Tax: CVR, Moms. Extract: ❌ (CPR encodes DOB + sex). Confidence: CPR moderate, CVR high, VAT high (2H/1M/0L). **Gap**: CPR extractor missing; CPR is the canonical DDMMYY-NNNN format that everyone reading the docs expects to extract. CPR moderate because the mod-11 check was abandoned for some 1990s ranges — that nuance is documented.

**🇫🇮 Finland** — Personal: HETU. Tax: Y-tunnus, ALV. Extract: ❌ (HETU encodes DOB + sex + century via separator char). Confidence: all three high (3H/0M/0L). **Gap**: HETU extractor missing; the century separator (`-` for 1900s, `A` for 2000s, `+` for 1800s) is a particularly clean signal to lift.

### Eastern Europe (1)

**🇵🇱 Poland** — Personal: PESEL. Tax: NIP, REGON. Extract: ❌ (PESEL encodes DOB + sex + century). Confidence: all three high (3H/0M/0L). **Gap**: PESEL extractor missing.

## Confidence tier distribution

Distribution at v1.1.0 (sourced from `docs/v1-audit/06-confidence-tiers.md`
with the two passport demotions applied for v1.0):

| Region | High | Moderate | Low | Unconfirmed | Total |
|---|---:|---:|---:|---:|---:|
| LATAM (18) | 16 | 26 | 23 | 1 | 66 |
| North America (2) | 4 | 2 | 1 | 0 | 7 |
| Iberia (2) | 5 | 1 | 1 | 0 | 7 |
| Western Europe (5) | 11 | 3 | 1 | 0 | 15 |
| Benelux (2) | 3 | 1 | 0 | 0 | 4 |
| Nordics (4) | 12 | 1 | 0 | 0 | 13 |
| Eastern Europe (1) | 3 | 0 | 0 | 0 | 3 |
| Passports family (21) | 0 | 8 | 11 | 1 | 20 (CO+v0.5) |
| **Library total** | **58** | **27** | **31** | **2** | **118** |

(60 high + 25 moderate in the v1.0 audit; the two CA/ES passport
demotions land at v1.0 → 58 high + 27 moderate at v1.1.)

Region take-aways:

- **Nordics + Eastern Europe** are the cleanest: 15 / 16 specs at high. Algorithms are published by tax authorities (Skatteverket, Skatteetaten, Skatteforvaltningen, Skattestyrelsen, ZUS / GUS).
- **LATAM has the largest absolute high count** (16) but the highest low ratio (35% of all LATAM specs). Drivers: governments not publishing checksums (CO_CC, PE_DNI) and reverse-engineered passports.
- **Passports are the systemic confidence weak point**: 0 of 20 in the high tier post-v1.0 demotions because issuers don't publish printed-number formats. Calling this out is itself a strength — the alternative is over-claiming.

## Notable gaps

### Gap 1 — `extract` covers 5 codes; 11+ shipped codes encode lift-able data

Shipped today (`SUPPORT_TABLE` in `src/extract/index.ts`):

```
MX_CURP   → dob, sex, region
MX_RFC_PF → dob
AR_CUIT   → sex
AR_CUIL   → sex
AR_CDI    → sex
GT_DPI    → region
PE_RUC    → region (tipo de contribuyente)
```

Shipped codes that encode DOB and/or sex but return `null`:

| Code | Encoded | Difficulty |
|---|---|---|
| `NO_FNR` | DOB + sex (DDMMYY + individnummer parity) | Trivial — spec already documents it (`src/countries/no/fnr.ts:9-14`). |
| `NO_DNR` | DOB + sex (DDMMYY+40 + individnummer parity) | Trivial — same algorithm shifted. |
| `SE_PERSONNUMMER` | DOB + sex | Trivial — Skatteverket spec. |
| `DK_CPR` | DOB + sex | Trivial — last-digit parity = sex. |
| `FI_HETU` | DOB + sex + century | Trivial — separator char encodes century. |
| `PL_PESEL` | DOB + sex + century | Trivial — PESEL spec public. |
| `FR_NIR` | DOB + sex + département | Medium — département is a 2-digit code that maps to a 95-entry table; ships well via `Region.kind = "department"`. |
| `BE_NRN` | DOB + sex | Trivial — same shape as DK_CPR. |
| `IT_CF` | DOB + sex + birth-comune | Medium — comune needs the codice-catastale table (~8K rows; could be a 100KB JSON shipped lazily). |
| `SV_NIT` | DOB | Trivial — DDMMYY in positions 5-10. |
| `HN_DNI` | (debated, but doc cites DOB) | Low priority — confirm with SR first. |
| `NI_CEDULA` | DDMMYY | Trivial. |

Total addressable lift: 5 → 16 codes supporting at least `extractDOB`,
plus 5 → 13 codes supporting `extractSex`. Several are 1-day-of-work
each because the underlying spec files already documented the encoding.

**Real-world consumer impact**: KYC onboarding forms in EU/Nordics
expect to pre-fill "birth date" from a single ID input. Today the
consumer has to import `nationid` *and* `dayjs` *and* a parser they
write themselves. That is the canonical reason developers reach for a
multi-country ID library — and the one job v1.1 only delivers in
LATAM (MX) + AR.

### Gap 2 — Asia / Africa / Middle East have zero coverage

Roadmap line says "Asia (IN, CN, JP, KR, SG, HK, TW + AU, NZ, ZA, IL)"
for v1.1+. v1.1 shipped without it.

Consumer impact:
- **India (IN)** — Aadhaar (12-digit Verhoeff checksum, 1.4B issued), PAN
  (10-char alphanumeric with checksum), GSTIN (15-char composite). Major
  gap for any LATAM SaaS expanding into IN — and IN is the #2 SaaS
  destination after US.
- **China (CN)** — Resident Identity Card (18-digit with mod-11 weights),
  USCC (Unified Social Credit Code).
- **Japan (JP)** — My Number (12-digit, mod-11 variant), Corporate Number
  (13-digit Luhn variant).
- **South Korea (KR)** — RRN (13-digit, deprecated checksum), Foreigner
  Registration Number.
- **Singapore (SG)** — NRIC / FIN (Coleman algorithm).
- **Israel (IL)** — Teudat Zehut (Luhn variant, 9 digits).
- **South Africa (ZA)** — ID number (13-digit, DOB + sex encoded, Luhn).

Each of these has a publicly-published algorithm and existing OSS
implementations. The bar to clear v1.1 → v1.2 is execution, not
research. Combined audience: 3+ billion identifiable persons, vs the
1.2B currently covered by 34 countries.

### Gap 3 — No detector ("is this a CPF or a CNPJ?")

The library lacks a `detect(input: string, countryHint?: CountryCode): readonly DocumentTypeCode[]`
helper. Every spec exposes `rawRegex` and `formattedRegex`, so callers
*can* loop through `listSupportedCodes()` and call `validate()` 120 times
— but the library doesn't ship that pattern.

Consumer impact: marketplaces accepting a single "tax ID" field on
signup need to dispatch on type. Today they write something like:

```ts
function guessTaxId(input: string): "BR_CPF" | "BR_CNPJ" | null {
  if (validate("BR_CPF", input)) return "BR_CPF";
  if (validate("BR_CNPJ", input)) return "BR_CNPJ";
  return null;
}
```

That code is wrong in subtle ways (CPF is a substring of CNPJ
patterns; the library validates a CPF as a CPF even if the user
intended a CNPJ that happened to start with the same digits). A
library-owned detector would resolve those ambiguities once.

Detector design notes for v1.2:
1. Length pre-filter (collapse 120 candidates to ~5 per length bucket).
2. `rawRegex` test (collapse to 1-3 candidates).
3. `validate()` confirm.
4. Tie-break on `country === countryHint` if provided.
5. Return ranked array so caller can show "Did you mean…?" UX.

Estimated effort: 2 days, including ambiguity test fixtures.

### Gap 4 — Driver licenses: 1 of 34

Only `BR_CNH` ships. Major real-world misses:

- **MX** — Licencia de Conducir is per-state (32 different formats) — likely unfixable without per-state research.
- **US** — Same problem (50 states).
- **ES** — DGT central, no public checksum.
- **AR / CL / CO** — Provincial.
- **UK (DVLA)** — Published algorithm, 16-char composite. Single-day-of-work.
- **FR (Permis de conduire)** — Centralized, no public checksum.
- **DE (Führerschein)** — No checksum, format-only feasible.
- **IT, NL, BE** — Format-only feasible.

Real-world consumer impact: ride-share platforms (Uber, Bolt, Rappi,
DiDi) routinely intake driver licenses in onboarding. `nationid` cannot
serve that flow today outside BR.

### Gap 5 — No high-level MRZ parser

Primitives ship (`mrzCheckDigit`, `validateMrzNumber`, `toMrzField9`)
and 21 passport specs ship, but the canonical "parse a TD3 MRZ string
into a typed object" helper does not. ICAO TD3 (passport) is well-spec'd
(2 lines × 44 chars). A `parseMrzTd3(line1, line2): MrzData | null`
helper would cover 90% of passport-scan workflows in 1-2 days.

### Gap 6 — `i18n` ships 3 locales; library claims 34 countries

Error catalog covers `es / en / pt`. Western/Eastern Europe consumers
have to interpolate their own French / German / Italian / Dutch /
Polish / Nordic translations of 5 error kinds (`empty`, `too_short`,
`too_long`, `invalid_format`, `invalid_checksum`). Country names work
in any BCP 47 locale via `Intl.DisplayNames` (good v1.1 design); but
the document-name catalog (`catalog/data/{es,en,pt}.ts`) is hard-coded
to those three. Easy minor: add `fr / de / it / nl / pl` with a
machine translation + native review pass per locale (~1 day each).

### Gap 7 — Several EU "social_security" IDs mis-categorized as `"identity"`

The catalog `common.ts` tags `BE_NRN`, `DK_CPR`, `SE_PERSONNUMMER`,
`PL_PESEL`, `FI_HETU`, `NO_FNR`, `NO_DNR`, `NL_BSN` as `purpose:
"identity"`. Strictly speaking, every one of those *is* the social
security number for its country (or includes it). In contrast,
`CH_AHV`, `FR_NIR`, `GB_NINO`, `MX_NSS`, `ES_NUSS`, `US_SSN`, `CA_SIN`,
`AR_CUIL`, `BR_PIS` are correctly tagged `"social_security"`. The
inconsistency makes `listDocumentsByPurpose("social_security")` return
fewer results than a consumer would expect. Easy minor: add a `both`
purpose or duplicate the SSN-ish nordics into a second list. Or
introduce `national_id` as a distinct purpose.

## Strengths to preserve

- **Best-in-class LATAM coverage**. The only OSS library that ships
  SV/GT/HN/DO/CR with check digits, and the only one that covers
  18 LATAM countries with a single API.
- **Passport family across all 22 LATAM/NA/Iberia codes**, plus
  ICAO 9303 primitives. Most general validators don't ship passport
  specs at all (Microsoft Purview catalogs them, OSS does not).
- **Honest confidence tier system**. 116 of 118 specs cite a source
  on the issuing authority's TLD or a legal statute. The two
  outliers got publicly demoted at v1.0. This is well ahead of
  `validator.js` and `python-stdnum`.
- **PII primitives baked in**. `mask` + `hash` + `lastN` are
  table-stakes for KYC and are first-class members of the public
  API, not afterthoughts.
- **Tree-shakable subpath imports**. Importing `nationid/sv` gives
  3-5 KB gzipped — competitive with any single-country library.
- **Zero deps**. Easy to vendor into a fintech that hates dep churn.
- **Country catalog uses `Intl.DisplayNames`** (CLDR) for v1.1 so
  any BCP 47 locale works — not the typical hand-maintained
  `nameEs/nameEn/namePt` triplet that ages badly.

## Recommendations (priority order)

1. **Ship `extract` for the 8 EU personal IDs that encode DOB+sex**
   (`NO_FNR`, `NO_DNR`, `SE_PERSONNUMMER`, `DK_CPR`, `FI_HETU`,
   `PL_PESEL`, `FR_NIR`, `BE_NRN`) — **biggest functional ROI in
   the library**. Each is 1 day of work (spec files already document
   the encoding). Why: turns the EU bundle from "validator" into
   "validator + auto-fill", which is what KYC consumers want.
   Estimated effort: 5-7 days. Value: 5× consumer-facing impact for
   EU SaaS apps. Land as v1.2.0.

2. **Add `detect(input: string, hint?: CountryCode): readonly DocumentTypeCode[]`**.
   Closes the cross-border ingest gap and is the single helper users
   would most often write themselves. Effort: 2 days. Lands as v1.2.0
   alongside the EU extractors. Value: removes the "120 validate
   calls in a loop" workaround.

3. **Italy `IT_CF` extractor**. Same shape as MX_CURP but with a
   codice-catastale lookup for birth-comune. The catastale table is
   ~8K entries — ship as a separate JSON via dynamic import so the
   default `nationid/extract` bundle stays small. Effort: 3 days.
   Value: Italy becomes parity with Mexico for KYC use.

4. **TD3 MRZ parser**. `parseMrzTd3(line1, line2): MrzData | null`
   plus a `formatMrzTd3(data): { line1, line2 }` round-tripper.
   Builds on the existing `mrzCheckDigit` primitive. Effort:
   2 days. Value: passport-scan integrations stop needing a second
   library.

5. **Asia phase 1 — IN + JP + SG**. India is the highest-value
   addition (1.4B users, big SaaS destination). Japan and Singapore
   round out the trio with clean published algorithms. Effort: 5
   days per country including tests and fixtures (~15 days).
   Value: unlocks Asian KYC market. Land as v1.3.0.

6. **`i18n` add `fr / de / it / nl / pl`**. Pure translation work
   (5 error templates × 5 locales = 25 strings). Effort: 1 day per
   locale + native-speaker review. Value: stops European consumers
   from owning their own translation layer.

7. **Categorize EU personal IDs more honestly**. Either introduce a
   `national_id` purpose or tag `BE_NRN / DK_CPR / SE_PERSONNUMMER /
   PL_PESEL / FI_HETU / NO_FNR / NO_DNR / NL_BSN / IT_CF` with both
   `identity` and `social_security`. Most ergonomic: extend
   `DocumentPurpose` to a union (`identity | tax | identity_and_ss
   | ...`) and document the precedence. Effort: half-day. Value:
   `listDocumentsByPurpose("social_security")` returns the answer
   consumers expect.

8. **Driver license coverage — UK + DE + IT phase 1**. UK has a
   published checksum (Verhoeff variant); DE/IT/NL/BE ship as
   format-only. Effort: 4 days. Value: unlocks ride-share /
   delivery onboarding in 4 European countries.

9. **Asia phase 2 — CN + KR + IL + ZA**. After phase 1 lands and
   the framework for non-Latin scripts is validated. Effort:
   ~20 days. Value: completes major non-LATAM/EU markets.

10. **Re-examine CL_RUT "regional digit" claim in the audit prompt**.
    CL RUT does NOT encode a region in the 9th digit (that was a
    misconception in the audit charter — the 9th digit is the
    check digit). Likewise CPF state-of-issuance digit has been
    obsoleted by post-2018 Brazilian Federal Revenue practice and
    should not be added. The library is correct to skip both.

---

**Audit complete.** Library is best-in-class on its declared LATAM/EU
scope but leaves 6-9 months of clear additive work on the table before
it covers the global SaaS onboarding job. The recommendations are
ordered by ROI; #1 + #2 + #3 together would lift the library from 7.5
to ~9 in one minor.
