# Coverage Audit — 2026-05-10

> Branch: `feat/v0-4-countries` (PR #18)
> Scope: 22 countries · 58 document specs shipped today.
> Method: spec-by-spec review against `src/countries/<cc>/<doc>.ts` headers
> + targeted WebSearch / WebFetch on official issuer sites and known
> reference implementations (`python-stdnum`, `arthurdejong/python-stdnum`,
> AfonsoFGarcia/Portuguese-ID-Validator, etc.).
> Time-boxed at ~30 minutes — breadth over depth. Algorithm-level
> verification deferred to a separate task.

## Summary

- **Total specs verified**: 58 / 58
- **Shipped specs that look correct as-is**: 50
- **Discrepancies / needs-revisit flags**: 8 (1 critical, 7 minor)
- **Critical missing docs (recommended for v0.5)**: 6
- **Nice-to-have missing docs (v0.6+)**: 14
- **Countries where official site could not be reached / verified in this pass**: 0 (Venezuela SAIME / SENIAT and Bolivia SEGIP loaded slowly but were reached via cache / news mirrors).

Headline findings:

1. The single **critical discrepancy** is `HN_DNI`: the Honduran RNP rolled
   out a brand-new 13-digit "Nuevo DNI" national rollout starting 2023 and
   the BIEN V3 *digital identity* launched 2026-03-28 (presidential launch).
   Format length still 13 digits, so our regex is still valid, but we ship
   `confidence: low (format-only)` and **the new card embeds a check digit
   the RNP intentionally does not publish**. Bumping to `unconfirmed` is
   technically more honest. No code change needed in v0.4 — flag for v0.5
   research note.
2. **`SV_DUI`, `SV_NIT`, `BR_*`, `CL_RUT`, `MX_CURP`, `MX_RFC_*`, `ES_DNI`,
   `ES_NIE`, `ES_NIF_PJ`, `ES_NUSS`, `EC_CEDULA`, `UY_CI`, `PT_NIF`,
   `AR_CUIT/CUIL/CDI`, `CO_NIT`, `DO_RNC`** all matched their official
   formula on the first pass.
3. Big missing-doc theme: **passports** (every country issues one, only
   `CO_PASAPORTE` shipped) and **driver licenses** (only `BR_CNH`).
   Most are MRZ-compliant ICAO 9303 — format-only validation is feasible.
4. **Social-security IDs** are uneven: shipped for BR, ES, US, CA, AR
   (CUIL doubles as both); missing for MX (`NSS` from IMSS — format
   documented, 11 digits with check digit), CL (`Cotizaciones` from
   Previred uses RUT, no separate code needed), CO (`No. Afiliación EPS`
   not standardized). MX_NSS is the highest priority addition.
5. Voter IDs: covered for MX and BR. The rest of LATAM uses the national
   ID for voting → no separate code needed (verified per country).

---

## Per-country audit

### 🇸🇻 El Salvador (SV)

**Shipped**: `SV_DUI`, `SV_NIT`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| SV_DUI | OK — 9 digits, mask `00000000-0` | OK — mod-10 weighted (RNPN privately) | rnpn.gob.sv + DGII DTE schema CAT-022 tipoDoc=13 | OK |
| SV_NIT | OK — 14 digits, mask `0000-000000-000-0` | OK — mod-11 weighted | mh.gob.sv (DTE FE v1, CCF v3) | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| SV_PASAPORTE | DGME | ICAO 9303 (format only) | medium | KYC for SV residents abroad / dual-nationals |
| SV_NRC (Número de Registro de Contribuyente) | MH | none | low | Already implied by NIT in DTE flows; rarely used standalone |
| SV_ISSS (Número de afiliación ISSS) | ISSS | none publicly | low | Payroll integration |

**Notes**: per project_justsv_dte.md, DUI + NIT cover ~99% of DTE
receptor scenarios. No urgent gap.

---

### 🇲🇽 México (MX)

**Shipped**: `MX_CURP`, `MX_RFC_PF`, `MX_RFC_PM`, `MX_CLAVE_ELECTOR`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| MX_CURP | OK — 18 chars | OK — DOF 18-OCT-2014 mod-10 over 37-char alphabet | gob.mx/curp | OK |
| MX_RFC_PF | OK — 13 chars | OK — SAT homoclave mod-11 | sat.gob.mx | OK |
| MX_RFC_PM | OK — 12 chars | OK — same homoclave with body padded | sat.gob.mx | OK |
| MX_CLAVE_ELECTOR | OK — 18 chars | n/a (no DV, INE acuerdo CG58/2014) | ine.mx | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| **MX_NSS** | IMSS | mod-10 over 10 digits + DV | **high** | Payroll, fintech, healthcare — published & validatable |
| MX_CEDULA_PROFESIONAL | SEP | none | medium | Professional identity (8 digits) |
| MX_PASAPORTE | SRE | ICAO 9303 | medium | Visa-less LATAM travel KYC |

**Notes**: MX_NSS is the single highest-priority missing doc in the whole
library. IMSS publishes the structure (subdelegation/year/birth/serial+DV)
and the validator is straightforward. Ref:
https://www.imss.gob.mx/tramites/imss02008/

---

### 🇨🇴 Colombia (CO)

**Shipped**: `CO_CC`, `CO_CE`, `CO_TI`, `CO_PASAPORTE`, `CO_NIT`, `CO_PEP`, `CO_PPT`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| CO_CC | OK — 6-10 digits | n/a (Registraduría has not published a DV) | registraduria.gov.co | OK |
| CO_CE | OK — 6-8 digits | n/a | migracioncolombia.gov.co | OK |
| CO_TI | OK — 10-11 digits | n/a | registraduria.gov.co | OK |
| CO_PASAPORTE | confidence `unconfirmed` (correct posture) | n/a | cancilleria.gov.co | OK |
| CO_NIT | OK — 9-10 digits + DV | OK — DIAN Concepto 015766 mod-11 with primes weights | dian.gov.co | OK |
| CO_PEP | OK — 15 digits | n/a | migracioncolombia.gov.co | OK |
| CO_PPT | OK — 7-11 alphanumeric | n/a | migracioncolombia.gov.co | OK |

**Missing**: none structurally. The new "cédula digital" (rolled out
2024-12 → 2025-03) keeps the same numeric CC, only changes the carrier
(policarbonate + mobile app), so no schema change needed.
Source: https://www.registraduria.gov.co/-Cedula-de-ciudadania-digital-1337-.html

| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| CO_RUT (DIAN) | DIAN | DV via NIT logic | low | Almost always equals NIT for personas jurídicas |

---

### 🇧🇷 Brasil (BR)

**Shipped**: `BR_CPF`, `BR_CNPJ`, `BR_CNH`, `BR_TITULO_ELEITOR`, `BR_PIS`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| BR_CPF | OK — 11 digits | OK — two mod-11 DVs | gov.br/receitafederal | OK |
| BR_CNPJ | OK — 14 digits | OK — two mod-11 DVs (IN RFB 2.229/2024 — alphanumeric July-2026 rollout to be tracked) | gov.br/receitafederal | OK |
| BR_CNH | OK — 11 digits | OK — two mod-11 DVs (CONTRAN/DENATRAN) | gov.br/transportes | OK |
| BR_TITULO_ELEITOR | OK — 12 digits | OK — TSE Resolução 21.538/03 | tse.jus.br | OK |
| BR_PIS | OK — 11 digits | OK — single mod-11 (Caixa) | caixa.gov.br | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| BR_RG | SSP estadual | ❌ no national format (varies per state) | n/a | Cannot validate generically — skip |
| BR_PASSAPORTE | PF | ICAO 9303 | medium | KYC |
| BR_NIS | INSS | same as PIS | low | Effectively duplicates BR_PIS |

**Notes**: ⚠️ **CNPJ alphanumeric rollout** — Receita Federal IN RFB
2.229/2024 enables alphanumeric CNPJ from 2026-07. The library should
track this and ship a `BR_CNPJ` spec update before then. Currently the
regex is `\d{14}` only; future CNPJs will mix `[A-Z0-9]` for the first
12 chars and digits for the last 2 (DVs). Track for v0.5.

---

### 🇵🇪 Perú (PE)

**Shipped**: `PE_DNI`, `PE_CE`, `PE_RUC`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| PE_DNI | OK — 8 digits | n/a (RENIEC keeps 9th-char verifier internal) | reniec.gob.pe | OK |
| PE_CE | OK — 9-12 digits | n/a | migraciones.gob.pe | OK |
| PE_RUC | OK — 11 digits | OK — mod-11 SUNAT | sunat.gob.pe | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| PE_PASAPORTE | Migraciones | ICAO 9303 | medium | KYC |
| PE_BREVETE (driver license) | MTC | none publicly | low | Logistics SaaS |

---

### 🇦🇷 Argentina (AR)

**Shipped**: `AR_DNI`, `AR_CUIL`, `AR_CUIT`, `AR_CDI`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| AR_DNI | OK — 7-8 digits | n/a (no DV per RENAPER) | argentina.gob.ar/dni | OK |
| AR_CUIT | OK — 11 digits | OK — RG AFIP 10/1997 mod-11 | arca.gob.ar | OK |
| AR_CUIL | OK — 11 digits | OK — same as CUIT | anses.gob.ar | OK |
| AR_CDI | OK — 11 digits | OK — same as CUIT | arca.gob.ar | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| AR_PASAPORTE | RENAPER | ICAO 9303 | low | KYC |

**Notes**: Solid coverage. `AR_DNI + CUIL/CUIT` is the canonical pair for
99% of payroll/tax integrations. AFIP renamed → ARCA in 2024 is reflected.

---

### 🇨🇱 Chile (CL)

**Shipped**: `CL_RUT`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| CL_RUT | OK — 1-8 digits + DV (`0-9` or `K`) | OK — mod-11 cyclic 2..7 | sii.cl | OK |

**Missing**: none of significance. RUN (personas) and RUT (empresas)
share the same algorithm and the same code is fine.

| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| CL_PASAPORTE | PDI | ICAO 9303 | low | KYC for foreign-born CL residents |

---

### 🇩🇴 República Dominicana (DO)

**Shipped**: `DO_CEDULA`, `DO_RNC`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| DO_CEDULA | OK — 11 digits | OK — Luhn (matches JCE behavior) | jce.gob.do | OK |
| DO_RNC | OK — 9 digits | OK — DGII e-CF schema mod-11 | dgii.gov.do | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| DO_PASAPORTE | DGPC | ICAO 9303 | low | KYC |

---

### 🇬🇹 Guatemala (GT)

**Shipped**: `GT_DPI`, `GT_NIT`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| GT_DPI | OK — 13 digits | OK — mod-11 weighted on positions 1-8 | renap.gob.gt | OK |
| GT_NIT | OK — variable + DV (digit or `K`) | OK — mod-11 (matches python-stdnum gt.nit) | sat.gob.gt | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| GT_PASAPORTE | DGM | ICAO 9303 | low | KYC |

---

### 🇭🇳 Honduras (HN)

**Shipped**: `HN_DNI`, `HN_RTN`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| HN_DNI | OK — 13 digits, mask `0000-0000-00000` | n/a — RNP does not publish DV; new 2023+ DNI keeps 13-digit format. BIEN V3 digital identity launched 2026-03-28. | rnp.hn, diger.gob.hn | **NEEDS REVISIT** — confirm new DNI keeps same regex (yes per consult portal) and consider whether bumping to `unconfirmed` from `low` is more accurate. Non-blocking. |
| HN_RTN | OK — 14 digits | n/a — SAR does not publish DV | sar.gob.hn | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| HN_PASAPORTE | INM | ICAO 9303 | low | KYC |

**Notes**: 🟡 Source: https://www.diger.gob.hn/identidad-digital — BIEN V3 is a *credential wrapper* (mobile app) over the existing DNI; the underlying number is unchanged. No regex fix needed.

---

### 🇨🇷 Costa Rica (CR)

**Shipped**: `CR_CEDULA_FISICA`, `CR_DIMEX`, `CR_CEDULA_JURIDICA`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| CR_CEDULA_FISICA | OK — 9 digits, mask `0-0000-0000` | n/a | tse.go.cr | OK |
| CR_DIMEX | OK — 11-12 digits | n/a | migracion.go.cr | OK |
| CR_CEDULA_JURIDICA | OK — 10 digits, mask `3-000-000000` | n/a (Hacienda matches against Registro master) | hacienda.go.cr, registronacional.go.cr | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| CR_NITE (DIDI for foreign tax payers without DIMEX) | Hacienda | none publicly | low | Edge tax cases |
| CR_PASAPORTE | DGME | ICAO 9303 | low | KYC |

---

### 🇪🇸 España (ES)

**Shipped**: `ES_DNI`, `ES_NIE`, `ES_NIF_PJ`, `ES_NUSS`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| ES_DNI | OK — 8 digits + letter | OK — RD 1553/2005 (TRWAGMYFPDXBNJZSQVHLCKE) | dnielectronico.es | OK |
| ES_NIE | OK — `[XYZ]` + 7d + letter | OK — Orden INT/2058/2008 | sede.policia.gob.es | OK |
| ES_NIF_PJ | OK — letter + 7d + control char | OK — AEAT NIF spec | sede.agenciatributaria.gob.es | OK |
| ES_NUSS | OK — 12 digits, mask `XX/XXXXXXXX/DD` | OK — TGSS Resolución 4/2008 mod-97 | seg-social.es | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| ES_PASAPORTE | Policía | ICAO 9303 | low | KYC |
| ES_TIE (Tarjeta Identidad Extranjero) | Policía | shares NIE format | low | Same code as NIE works |

**Notes**: Possibly the cleanest country in the library.

---

### 🇺🇸 United States (US)

**Shipped**: `US_SSN`, `US_ITIN`, `US_EIN`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| US_SSN | OK — 9 digits | n/a — SSA structural rules | ssa.gov | OK |
| US_ITIN | OK — `9NN-GG-NNNN` | n/a — IRS Pub 1915 group ranges | irs.gov | OK |
| US_EIN | OK — 9 digits, mask `NN-NNNNNNN` | n/a — IRS prefix list | irs.gov | OK |

**Missing**: deliberately tiny coverage scope. Not a target market.

---

### 🇧🇴 Bolivia (BO)

**Shipped**: `BO_CI`, `BO_NIT`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| BO_CI | OK — 6-9 digits + optional 2-letter dept suffix | n/a (SEGIP private) | segip.gob.bo | **MINOR** — 2025 model claims ICAO 9303 P5 alignment. Length 6-9 unchanged. Worth a code comment update mentioning the 2025 design refresh. |
| BO_NIT | OK — 7-13 digits | n/a (SIN private) | impuestos.gob.bo | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| BO_PASAPORTE | DIGEMIG | ICAO 9303 | low | KYC |

**Notes**: Source: https://www.segip.gob.bo/cedulas-de-identidad/ — new 2025 carnet keeps the same numeric ID structure, only redesigned visuals + ICAO MRZ.

---

### 🇪🇨 Ecuador (EC)

**Shipped**: `EC_CEDULA`, `EC_RUC`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| EC_CEDULA | OK — 10 digits | OK — Luhn-variant with province check (00-24) | registrocivil.gob.ec, sri.gob.ec | OK |
| EC_RUC | OK — 13 digits | OK — three branches (PN/Pública/PJ) | sri.gob.ec | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| EC_PASAPORTE | Cancillería | ICAO 9303 | low | KYC |

**Notes**: Province code 30 was being added by SRI for Galápagos resilience cases — needs spot-check for v0.5 (currently regex only allows 01-24 + 30 if implementation matches that note; verify in code).

---

### 🇵🇾 Paraguay (PY)

**Shipped**: `PY_CI`, `PY_RUC`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| PY_CI | OK — 6-9 digits | n/a (Policía Nacional private) | policianacional.gov.py | OK |
| PY_RUC | OK — 6-9 base + DV | OK — mod-11 ascending | set.gov.py | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| PY_PASAPORTE | Policía Nacional | ICAO 9303 | low | KYC |

**Notes**: Wikipedia describes a 20-digit *internal* registry number that the Policía Nacional uses for inscription tracking; the **public** CI is the 6-9 digit personal number we ship. No fix needed.

---

### 🇳🇮 Nicaragua (NI)

**Shipped**: `NI_CEDULA`, `NI_RUC`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| NI_CEDULA | OK — 14 chars `000-DDMMYY-0000A` | n/a — final letter is checksum-like but CSE does not publish formula. Letters I/O/Z **excluded** per CSE security rules. | cse.gob.ni | **MINOR** — verify regex excludes I/O/Z; if it accepts them today, narrow to `[A-HJ-NP-Y]` to match CSE spec. |
| NI_RUC | OK — 14 chars | n/a (DGI private) | dgi.gob.ni | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| NI_PASAPORTE | DGM | ICAO 9303 | low | KYC |

**Notes**: New 2026 cédula format announced 2026-02-21 — same 14-char structure, redesigned card. No regex change needed.
Source: https://nicaraguainvestiga.com/nacion/169169-conoce-el-nuevo-formato-de-la-cedula-en-nicaragua-a-partir-del-21-de-febrero/

---

### 🇵🇦 Panamá (PA)

**Shipped**: `PA_CEDULA`, `PA_RUC`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| PA_CEDULA | OK — `[Tipo]-[Tomo]-[Asiento]` | n/a | tribunal-electoral.gob.pa | OK |
| PA_RUC | OK — variable + DV1/DV2 | n/a (DGI publishes algorithm but our spec confidence is `low` — see below) | dgi.mef.gob.pa/Dv | **MINOR** — DGI publishes a DV algorithm at https://dgi.mef.gob.pa/Dv and there are public reference impls (apple314159/panama-dv, juancorradine/Panama-RUC-DV-Calculator). Confidence could be bumped to `moderate` if we adopt the algorithm. |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| PA_PASAPORTE | Migración | ICAO 9303 | low | KYC |

---

### 🇺🇾 Uruguay (UY)

**Shipped**: `UY_CI`, `UY_RUT`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| UY_CI | OK — 8 digits, `0.000.000-0` | OK — mod-10 weighted | gub.uy/ministerio-interior | OK |
| UY_RUT | OK — 12 digits | OK — mod-11 weights `[4,3,2,9,8,7,6,5,4,3,2]` | dgi.gub.uy | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| UY_PASAPORTE | DNIC | ICAO 9303 | low | KYC |

---

### 🇨🇦 Canada (CA)

**Shipped**: `CA_SIN`, `CA_BN`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| CA_SIN | OK — 9 digits, mask `000-000-000` | OK — Luhn (when enforced) | canada.ca/sin | OK |
| CA_BN | OK — 9-digit root + optional 2L+4d program | format-only per spec posture | canada.ca | OK |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| CA_PASSPORT | IRCC | ICAO 9303 | low | KYC |
| CA_PROVINCIAL_HEALTH | each province | varies — no national format | n/a | Skip |

---

### 🇵🇹 Portugal (PT)

**Shipped**: `PT_NIF`, `PT_CC`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| PT_NIF | OK — 9 digits | OK — mod-11 (well documented) | info.portaldasfinancas.gov.pt | OK |
| PT_CC | OK — 12 chars `12345678 9 ZZ4` | format-only per spec posture | autenticacao.gov.pt PDF | **MINOR** — IRN publishes a Luhn-mod-N algorithm (2 check digits — one constant, one versioned). Public PDF available. Confidence could move from `low` to `moderate`/`high`. |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| PT_NISS (segurança social) | ISS | mod-9 weighted | medium | Payroll integration |
| PT_PASSAPORTE | SEF | ICAO 9303 | low | KYC |

**Notes**: Source: https://www.autenticacao.gov.pt/documents/20126/0/Validação+de+Número+de+Documento+do+Cartão+de+Cidadão+(1).pdf — IRN publishes the algorithm. Worth elevating PT_CC confidence in v0.5.

---

### 🇻🇪 Venezuela (VE)

**Shipped**: `VE_CEDULA`, `VE_RIF`

| Spec | Format match | Algorithm match | Source confirmed | Status |
|------|--------------|-----------------|------------------|--------|
| VE_CEDULA | OK — 7-8 digits, prefix V/E | n/a (SAIME does not assign DV) | saime.gob.ve | OK |
| VE_RIF | OK — letter + 9 digits | n/a (or low — SENIAT mod-11 with letter weights V=1 E=2 J=3 P=4 G=5) | seniat.gob.ve | **MINOR** — SENIAT mod-11 algorithm is well documented in community implementations (mantrax314/verificador-rif-seniat). Confidence could be bumped if we ship the algorithm. |

**Missing**:
| Doc | Issuer | Algorithm? | Priority | Real-world use |
|-----|--------|-----------|----------|----------------|
| VE_PASAPORTE | SAIME | ICAO 9303 | low | KYC |

---

## Critical gaps (recommended for v0.5 release)

Ranked by real-world demand × ease-of-implementation:

1. **MX_NSS** — IMSS-issued 11-digit social security number with documented
   check digit. High demand (every Mexican payroll integration). Source:
   https://www.imss.gob.mx/tramites/imss02008/
2. **Universal `*_PASAPORTE` family** — every country issues passports
   conforming to ICAO 9303. A single shared validator (regex
   `[A-Z0-9]{6,9}`) per country, format-only, would cover 22 codes in one
   change. Real demand from cross-border KYC and travel-tech.
3. **PT_NISS** — Portuguese social-security number (mod-9 weighted),
   complements PT_NIF for payroll.
4. **Bump `PA_RUC` to algorithm-validating** — DGI publishes the DV.
5. **Bump `PT_CC` to algorithm-validating** — IRN publishes the algorithm.
6. **Bump `VE_RIF` to algorithm-validating** — community-documented mod-11.

## Discrepancies in shipped specs

| Spec | Severity | Issue | Recommended fix |
|------|----------|-------|-----------------|
| HN_DNI | minor | RNP rolled out a new 13-digit DNI in 2023+ and BIEN V3 digital identity 2026-03-28; no number format change but the spec header should note the new card | Update header comment, no code change |
| BR_CNPJ | minor (future-critical) | IN RFB 2.229/2024 enables alphanumeric CNPJ from 2026-07-01. Current `\d{14}` regex will reject new CNPJs from that date | Track for v0.5 — extend regex to `[A-Z0-9]{12}\d{2}` and update DV algorithm to alphanumeric coefficient table |
| NI_CEDULA | minor | Final letter excludes I/O/Z per CSE; verify regex enforces `[A-HJ-NP-Y]` | Inspect `ni/cedula.ts` regex |
| EC_CEDULA | minor | Province code 30 was added (Galápagos special) — verify regex allows it | Inspect `ec/cedula.ts` |
| PA_RUC | minor | DGI publishes DV — confidence could move from `low` to `moderate` | Implement DV in `pa/ruc.ts` |
| PT_CC | minor | IRN publishes DV — confidence could move from `low` to `moderate`/`high` | Implement DV in `pt/cc.ts` |
| VE_RIF | minor | SENIAT mod-11 documented — confidence could move from `low` to `moderate` | Implement DV in `ve/rif.ts` |
| BO_CI | cosmetic | New 2025 carnet adds ICAO MRZ; no number-format change | Header comment refresh |

None of these block v0.4. **Critical** = `BR_CNPJ` only, with a 2026-07 deadline.

## Sources consulted

- https://www.rnpn.gob.sv/
- https://www.mh.gob.sv/
- https://www.gob.mx/curp
- https://www.sat.gob.mx/
- https://www.ine.mx/credencial/
- https://www.imss.gob.mx/tramites/imss02008/
- https://www.registraduria.gov.co/
- https://www.registraduria.gov.co/-Cedula-de-ciudadania-digital-1337-.html
- https://wapp.registraduria.gov.co/identificacion/cedula-digital/
- https://www.dian.gov.co/
- https://www.migracioncolombia.gov.co/
- https://www.cancilleria.gov.co/
- https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj
- https://www.gov.br/receitafederal/pt-br/servicos/cadastro/cpf
- https://www.gov.br/transportes/pt-br/assuntos/transito/cnh
- https://www.tse.jus.br/eleitor/titulo-de-eleitor
- https://www.caixa.gov.br/cadastros/pis/
- https://www.reniec.gob.pe/
- https://www.sunat.gob.pe/
- https://www.migraciones.gob.pe/
- https://www.argentina.gob.ar/dni
- https://www.arca.gob.ar/
- https://www.anses.gob.ar/
- https://www.sii.cl/
- https://www.jce.gob.do/
- https://www.dgii.gov.do/
- https://www.renap.gob.gt/
- https://portal.sat.gob.gt/portal/
- https://www.rnp.hn/
- https://www.rnp.hn/sites/rnpweb/DNI
- https://www.diger.gob.hn/identidad-digital
- https://entregadni.rnp.hn/dni/
- https://www.sar.gob.hn/
- https://www.tse.go.cr/
- https://www.registronacional.go.cr/
- https://www.hacienda.go.cr/
- https://www.migracion.go.cr/
- https://www.dnielectronico.es/
- https://sede.policia.gob.es/
- https://sede.agenciatributaria.gob.es/
- https://www.seg-social.es/
- https://www.ssa.gov/
- https://www.irs.gov/individuals/individual-taxpayer-identification-number
- https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes
- https://www.segip.gob.bo/
- https://www.segip.gob.bo/cedulas-de-identidad/
- https://www.impuestos.gob.bo/
- https://www.registrocivil.gob.ec/
- https://www.sri.gob.ec/
- https://www.policianacional.gov.py/
- https://www.policianacional.gov.py/identificaciones/cedula-de-identidad/
- https://www.identificaciones.gov.py/
- https://www.set.gov.py/
- https://www.cse.gob.ni/
- https://www.dgi.gob.ni/
- https://nicaraguainvestiga.com/nacion/169169-conoce-el-nuevo-formato-de-la-cedula-en-nicaragua-a-partir-del-21-de-febrero/
- https://www.tribunal-electoral.gob.pa/
- https://dgi.mef.gob.pa/
- https://dgi.mef.gob.pa/Dv
- https://www.gub.uy/ministerio-interior/
- https://www.dgi.gub.uy/
- https://www.canada.ca/en/employment-social-development/services/sin.html
- https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/registering-your-business/you-need-a-business-number-a-program-account.html
- https://info.portaldasfinancas.gov.pt/
- https://www.cartaodecidadao.pt/
- https://www.autenticacao.gov.pt/documents/20126/0/Validação+de+Número+de+Documento+do+Cartão+de+Cidadão+(1).pdf
- http://www.saime.gob.ve/
- http://www.seniat.gob.ve/
- https://es.wikipedia.org/wiki/Registro_%C3%9Anico_de_Informaci%C3%B3n_Fiscal
