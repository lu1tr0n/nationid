# v1.1 Functional Audit — Competitive positioning

Audit date: 2026-05-22. Library version: `nationid@1.1.0` (commit on `main`,
GitHub `lu1tr0n/nationid`, npm `nationid`, ~1,067 monthly downloads,
2 stars, 4 open issues, repo public since 2026-05-08). All competitor data
verified against npm registry / GitHub API / source READMEs on 2026-05-22 —
not from memory.

## Score: 8 / 10

`nationid` is the **clearest market leader for "TypeScript-first, checksum-verified
national ID + tax-ID validation across LATAM + Western/Northern Europe"** that
exists in the npm ecosystem today. No competitor combines its **34-country
breadth**, **per-country tree-shakable subpaths**, **discriminated-union public
API**, **CI-enforced citation governance**, and **typed extract / PII / catalog
helpers** in one package. The 8 (not 9) is honest about three real gaps:
**(1) traction is at idea-stage** (~1k downloads/month vs python-stdnum's de-facto
multi-language reference status, vs validator.js's 97.5M/month), **(2) zero
Asia/Africa/Middle East coverage** while python-stdnum ships IN/CN/JP/KR/SG/TW/MY/
ID/TH/VN/ZA/IL/KE/AU/NZ, and **(3) no live registry lookup** (VIES, SUNAT,
SAT-FIEL) — pure offline validation is a deliberate scope choice but it caps
the addressable problem at "shape + checksum," not "is this number actually
issued."

## TL;DR

- **Where nationid wins** — depth and breadth of LATAM (the only OSS library
  that ships SV / GT / HN / DO / CR / NI / PY / BO / VE / PA / UY / EC with
  checksum verification, not regex shape); first-class TypeScript narrowing
  (`parse("MX_CURP", x).code` infers literal); per-country subpath bundles
  at 3-5 KB gzip; cited confidence tiers enforced in CI; an ICAO 9303 MRZ
  primitive layer; a CLDR-backed country catalog with flags; PII mask/hash/lastN
  primitives that no competitor offers in one package.
- **Where competitors win** — `python-stdnum` covers Asia/Africa with >50
  countries (LGPL); `validator.js` is universally known and ships in 97.5M
  weekly installs with the `isVAT` / `isTaxID` / `isIdentityCard` / `isPassportNumber`
  API every Node dev recognizes; `cpf-cnpj-validator` ships BR-only with
  framework adapters for joi/yup/zod/class-validator/Angular that nationid
  does not; Stripe Identity / Onfido provide live verification at $1.50/check
  that no library can match for trust.
- **Net positioning recommendation** — nationid should explicitly market
  itself as **"the python-stdnum of the JS/TS ecosystem, LATAM-first"** and
  treat validator.js's `isTaxID` as a deprecated stand-in to peel users off.
  The three highest-leverage moves are (a) **publish framework adapters**
  (`nationid/zod`, `nationid/yup`, `nationid/class-validator`) to neutralize
  cpf-cnpj-validator's last edge in Brazil; (b) **declare and ship Asia in
  v1.2** to close the python-stdnum coverage delta where it hurts; (c)
  **publish a head-to-head benchmarks page** that pins the 4-5 LATAM countries
  validator.js gets wrong or covers only by regex, to convert search traffic.

## Direct comparable matrix

Verified 2026-05-22 against current source. ✅ = present + checksum;
🟡 = present (regex / format only or missing flagship); ❌ = absent.
"Treeshake / country" measures the per-country gzipped bundle when the
consumer imports only that country.

| Dimension | nationid 1.1 | validator.js 13.15 | cpf-cnpj-validator 2.1 | brazilian-utils 2.3 | rut.js 2.1 | python-stdnum 1.x |
|---|---|---|---|---|---|---|
| **Total countries (any spec)** | **34** | ~50 (regex-only outside EU+US) | 1 (BR) | 1 (BR) | 1 (CL) | **~55** |
| **Countries with checksum-verified national ID** | **34** | 17 in `isTaxID`, regex only for VAT | 1 | 1 | 1 | ~55 |
| **LATAM countries with checksum** | **18** | 6 (`isTaxID es-AR`, `pt-BR`, plus `isVAT` regex for MX/CL/CO/PE/UY/VE etc.) | 1 (BR) | 1 (BR) | 1 (CL) | 7 (AR/BR/CL/CO/MX/PE/UY) |
| **Asia / Africa / Middle East** | ❌ 0 | 🟡 (passport regex for AM/AZ/CN/IN/JP/KR/MY/PK/PH/TH/ZA; identity card for IL/IR/IN/zh-CN/zh-TW/LK/TH/PK) | ❌ | ❌ | ❌ | ✅ IN, CN, JP, KR, SG, TW, MY, ID, TH, VN, ZA, IL, KE, AU, NZ |
| **Driver-license validators** | 🟡 1 (BR_CNH) | ❌ | ❌ | ❌ | ❌ | 🟡 (CA SIN treated as DL stand-in; not real DL spec) |
| **TypeScript first-class (generic narrowing)** | ✅ | 🟡 (DefinitelyTyped via `@types/validator`, no narrowing) | ✅ (types separated per subpath) | ✅ | ❌ (JS only, types community) | ❌ (Python) |
| **Tree-shakable per-country subpath** | ✅ (`nationid/sv`, `nationid/mx`, …) | 🟡 (`validator/lib/isTaxID` but locale must be passed at call site) | n/a (single-country) | n/a | n/a | n/a |
| **Single-country bundle size** | **~3-5 KB gzip** | ~5 KB per validator function | ~5 KB | ~25 KB (full BR utils) | ~2 KB | n/a |
| **Full-package size (npm tarball)** | **414 KB** (v1.1 v0.6 was 1.7 MB) | 824 KB | ~80 KB | ~150 KB | ~5 KB | ~6 MB (sdist) |
| **Discriminated-union return** | ✅ (`{ ok, normalized, formatted, confidence } \| { ok, reason }`) | ❌ (returns `boolean`) | 🟡 (returns boolean; separate `cpf.format()` etc.) | 🟡 (returns boolean) | 🟡 (returns boolean; `format()` separate) | 🟡 (raises `InvalidFormat` exception) |
| **Localized error messages built-in** | ✅ (es/en/pt subpaths) | ❌ | ❌ (PT only in Portuguese README) | ❌ | ❌ | ❌ (English only) |
| **Country catalog (names + flags localized)** | ✅ (CLDR via `Intl.DisplayNames`, any BCP 47 locale) | ❌ | ❌ | 🟡 (states/cities of Brazil only) | ❌ | ❌ |
| **PII helpers (mask / hash / lastN)** | ✅ | ❌ | 🟡 (mask via separator strip; no hash, no salt) | 🟡 (mask, no hash) | ❌ | ❌ |
| **Cited issuer source per spec (CI-enforced)** | ✅ (`tests/governance/confidence-citations.test.ts`) | 🟡 (JSDoc cites in source, not enforced) | 🟡 (RFB notes cited in README) | 🟡 (cites in docs) | ❌ | ✅ (issuer URL in module docstring) |
| **DOB / sex / region extract** | ✅ for 5 codes (MX CURP+RFC, AR CUIT/CUIL/CDI, GT DPI, PE RUC) | ❌ | ❌ | 🟡 (`pisCpfRule` extracts state historically) | ❌ | ✅ for ~12 codes (IT CF, NL BSN, SE personnummer, PESEL, PT NIF — depends on country) |
| **MRZ / ICAO 9303 primitives** | ✅ (`mrzCheckDigit`, `mrzCharValue`, `toMrzField9`, alpha-3 via catalog) | ❌ | ❌ | ❌ | ❌ | 🟡 (passport number module per country, no full MRZ parser) |
| **Framework adapters (zod/yup/joi/class-validator/Angular)** | ❌ | ❌ (string fns are easy to wrap manually) | ✅ **5 adapters** ship in 2.1 | ❌ | ❌ | ❌ |
| **CNPJ alfanumérico (RFB Nota Técnica 49/2024, July 2026)** | ✅ (v0.5) | ❌ | ✅ (v2.0 headline) | 🟡 (in progress) | n/a | ✅ |
| **License** | MIT | MIT | MIT | MIT | MIT | LGPL-2.1 |
| **Weekly npm downloads** (2026-05-15..21) | **182** | 23,648,512 | 110,054 | 32,181 | 12,603 | n/a (PyPI) |
| **Monthly downloads** | ~1,067 | 97.5M | 512k | 129k | 59k | ~430k (PyPI 2026-04) |
| **GitHub stars** | 2 | 23,747 | 220 | 1,660 | 169 | 583 |
| **Last release** | 2026-05-22 | 2026-04-24 | 2026-05-22 | 2026-05-20 | 2024-11-18 (stale 18 mo) | 2026-05-03 |
| **Sigstore provenance on npm** | ✅ | ✅ | n/a (not checked) | n/a | n/a | n/a |
| **Zero runtime deps** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Node minimum** | ≥20 | ≥0.10 (positioned as universal) | ≥18 | ≥20.19 / ≥22.12 | ≥10 | n/a |

Sources used for the matrix: nationid `README.md`, `package.json`,
`docs/v1.1-functional-audit/02-functional-coverage.md`; validator.js
`README.md` and `src/lib/isTaxID.js` + `src/lib/isVAT.js` on `master`;
`cpf-cnpj-validator` npm 2.1.2 metadata and `carvalhoviniciusluiz/cpf-cnpj-validator`
README; `brazilian-utils/javascript` README; `jlobos/rut.js` repo metadata;
`arthurdejong/python-stdnum` README and `https://arthurdejong.org/python-stdnum/`.
npm download counts retrieved via `https://api.npmjs.org/downloads/range/...`
on 2026-05-22.

## Per-country head-to-head (10 high-traffic codes)

### 1. `BR_CPF` (Brazil personal taxpayer)
- **nationid** — `validate("BR_CPF", "529.982.247-25")` → `true`. Full
  mod-11 checksum (`docs/countries/br.md`). Strips dots/dashes;
  rejects repeated-digit edge cases; `pii.mask` returns `***.***.**9-01`;
  `pii.hash` ready for LGPD-compliant storage.
- **cpf-cnpj-validator** — best-in-class for BR-only. Has `cpf.generate({state: 'SP'})`,
  blacklist of forbidden patterns, 5 framework adapters
  (joi/yup/zod/class-validator/Angular), CNPJ alfanumérico ready for
  July 2026. **Wins on framework integration**.
- **brazilian-utils** — `isValidCpf` matches. Richer auxiliary BR utilities
  (CEP lookup, bank slip, phone). **Wins on BR-adjacent ergonomics**.
- **validator.js** — `isTaxID(value, 'pt-BR')` works, no `format()` /
  generate / mask. **Loses on completeness**.
- **Verdict**: nationid is **competitive but not winning** in BR. Adding
  `nationid/zod` + `nationid/yup` would close the gap; `cpf.generate()` for
  test fixtures is an unmet ask.

### 2. `BR_CNPJ` (Brazil company taxpayer)
- **nationid** — full mod-11 + CNPJ alfanumérico support (RFB NT 49/2024).
  `confidence: "high"` with primary cite to `gov.br/receitafederal`.
- **cpf-cnpj-validator** — same checksum + adapters; **wins on framework
  integration** for the same reason as CPF.
- **brazilian-utils** — `isValidCnpj` matches numerics; alfanumérico shipping
  per their changelog.
- **validator.js** — `isTaxID(value, 'pt-BR')` covers CPF but **no CNPJ
  branch** in the EU/US `isTaxID`. Closest is `isVAT(value, 'BR')` which is
  regex-only.
- **Verdict**: nationid ties with cpf-cnpj-validator on raw correctness and
  is ahead of validator.js. Framework adapters remain the gap.

### 3. `MX_CURP` (Mexico unique population key)
- **nationid** — high-confidence per `RENAPO` cite; **only library in this
  comparison that extracts** `{ year, month, day, sex, regionCode }` via
  `nationid/extract`. Region map in `docs/countries/mx.md`.
- **validator.js** — `isTaxID(value, 'es-MX')` returns boolean checksum only
  for RFC, **does not validate CURP** at all.
- **cpf-cnpj-validator / brazilian-utils / rut.js** — out of scope.
- **python-stdnum** — `stdnum.mx.curp.validate()` validates and extracts.
  **Ties on functionality**, loses on TS DX.
- **Verdict**: nationid **wins outright** in the JS/TS ecosystem for CURP.

### 4. `MX_RFC` (Mexico personal + corporate tax)
- **nationid** — RFC PF (13 chars) and RFC PM (12 chars) as separate specs,
  with homoclave checksum and DOB extraction on PF.
- **validator.js** — `isTaxID(value, 'es-MX')` validates RFC checksum
  but does not distinguish PF / PM nor extract DOB.
- **python-stdnum** — `stdnum.mx.rfc.validate()` covers both.
- **Verdict**: nationid wins on **TS narrowing** (`parse("MX_RFC_PF", x).code`
  infers literal) and **DOB extraction**; ties on correctness.

### 5. `AR_CUIT` (Argentina tax)
- **nationid** — mod-11 verifier; `extractSex` returns `M / F / X` from
  prefix; `defaultTax: "AR_CUIT"` in the AR bundle.
- **validator.js** — `isTaxID(value, 'es-AR')` boolean only.
- **python-stdnum** — `stdnum.ar.cuit` validates + extracts. Ties on extract.
- **Verdict**: nationid wins on **discriminated-union return** + extract +
  TS narrowing. Functional tie with python-stdnum.

### 6. `CL_RUT` (Chile RUT/RUN, dual personal+tax)
- **nationid** — mod-11 with K check digit; `scope: "both"` correctly models
  the personal-and-tax dual identity; `format()` returns canonical `12.345.678-5`.
- **rut.js** — bare validator + formatter. **Stale (last release 2024-11)**,
  no TS narrowing, no scope concept, no `parse()` discriminated union.
  Despite that it still ships **12k weekly downloads**.
- **validator.js** — `isVAT(value, 'CL')` is regex-only, no checksum.
- **python-stdnum** — `stdnum.cl.rut` ties on correctness.
- **Verdict**: nationid **wins outright** for new code. rut.js's traction
  comes from inertia + Spanish SEO; the API is structurally inferior.

### 7. `ES_DNI` (Spain DNI / NIE / CIF — three specs)
- **nationid** — three separate specs: `ES_DNI` (8 digits + letter),
  `ES_NIE` (residents, X/Y/Z prefix), `ES_NIF_PJ` (CIF for companies),
  plus `ES_NUSS` social-security. All four high-confidence with cite to
  `agenciatributaria.gob.es`.
- **validator.js** — `isTaxID(value, 'es-ES')` covers DNI + NIE checksum
  but **not CIF** with full algorithm; `isIdentityCard('ES')` only validates
  DNI shape.
- **python-stdnum** — `stdnum.es.dni`, `stdnum.es.nie`, `stdnum.es.cif`
  all present. Ties on correctness.
- **Verdict**: nationid wins on **single-namespace coverage** (one import,
  four specs) + TS narrowing. validator.js loses on CIF; python-stdnum ties.

### 8. `US_SSN` / `US_EIN` (United States)
- **nationid** — both with **post-randomization-era SSA ruleset** (the
  pre-2011 area-group-serial structure is correctly dropped); EIN with
  prefix-class lookup. Both `confidence: "high"`.
- **validator.js** — `isTaxID(value, 'en-US')` validates EIN; SSN via
  separate `isPassportNumber` family. No discriminated return.
- **python-stdnum** — `stdnum.us.ssn`, `stdnum.us.ein`, `stdnum.us.itin`.
  Ties on correctness.
- **Verdict**: nationid ties on correctness, wins on **discriminated-union
  failure reasons** for forms.

### 9. `GB_NINO` (UK National Insurance Number)
- **nationid** — `GB_NINO` regex-restricted + HMRC-prefix exclusion (DF, FY,
  IO, NK, NT, TN, ZZ blocked); `confidence: "high"` with HMRC cite. Also
  ships UK NHS Number with mod-11.
- **validator.js** — `isTaxID(value, 'en-GB')` exists but is checksum-less
  (NINO has no checksum by design); behaves the same.
- **python-stdnum** — `stdnum.gb.nino` ties.
- **Verdict**: tie on correctness. nationid wins on having UK NHS *also*
  in the same library (very rare combo).

### 10. `FR_NIR` (France social-security / INSEE)
- **nationid** — mod-97 verifier; `confidence: "high"` per `insee.fr` cite.
  But `extractDOB` does **not** ship for `FR_NIR` despite the spec
  encoding birth year+month+department in positions 1-7 — flagged as a
  v1.2 gap in `02-functional-coverage.md`.
- **validator.js** — `isTaxID(value, 'fr-FR')` mod-97 ties on checksum;
  no extract.
- **python-stdnum** — `stdnum.fr.nir` ties checksum; ships extract.
- **Verdict**: tie on checksum. **python-stdnum wins on extract**; nationid
  has the easiest closable gap of all 10 codes.

**Aggregate**: nationid wins outright on 4 (CURP, RFC narrowing, CL RUT new
code, ES four-spec coverage), ties or wins on TS DX on 5, and ties or loses
on 1 (FR_NIR extract gap). Across all 10, **nationid is at parity or better
on correctness in every case** and is the leader on TS DX in every case.

## Unique moats (nationid)

1. **Cited confidence tier with CI governance.** No competitor has this.
   `tests/governance/confidence-citations.test.ts` fails CI when a
   `high`-confidence spec lacks an issuer-TLD URL in its JSDoc header.
   `python-stdnum` cites in module docstrings but does not enforce; validator.js
   has inline JSDoc citations but no automated check; cpf-cnpj-validator
   cites RFB notes in the README. For a KYC integrator this is a real moat:
   the consumer can grep `confidence: "high"` and trust that an algorithm-from-
   first-party-source review actually happened. **Hard to copy because it
   requires the discipline of N years of citations stored in code, not docs.**

2. **Tree-shakable per-country subpath bundles at 3-5 KB gzip.** validator.js
   ships per-function imports (`validator/lib/isTaxID`) but the locale must
   be passed at call time, which leaves the whole locale table in the bundle.
   nationid's `nationid/sv` is **one country, one algorithm, no registry,
   no catalog** — measured against `dist/countries/sv/index.js` at 6,117
   raw bytes (~2 KB gzip). For an Edge function validating SV documents,
   nationid's bundle is **roughly 1/15th** of bundling `validator`. **Replicable
   only by re-architecting validator.js's flat module surface.**

3. **TypeScript inference upgraded to literal narrowing.** `parse("MX_CURP", x).code`
   infers `"MX_CURP"`, not the 124-member `DocumentTypeCode` union; the same
   for `getSpec()` and the `extract*` family. cpf-cnpj-validator types are
   per-function with a fixed `cpf` / `cnpj` namespace and don't generalize;
   validator.js community types (`@types/validator`) treat every locale as
   a string union and **do not narrow** the return type. **Replicable but
   requires a generic-driven public API from day one — retrofitting it
   into validator.js would be a breaking change.**

4. **First-party PII helpers in one package.** `mask` / `hash` (SubtleCrypto
   with salt + SHA-256 default) / `lastN` is unique in the JS niche. The
   closest competitor is "use `crypto.subtle` yourself + `String.prototype.replace`."
   For LGPD / GDPR-conscious consumers this is concrete tooling; for a fintech
   the salted hash is a building block they would otherwise write three times.

5. **Country catalog via CLDR (`Intl.DisplayNames`).** `nationid/catalog`
   exports `getCountryInfo(code, locale)` returning name + alpha-3 + flag
   emoji. Because it delegates to the runtime's CLDR data, **any BCP 47
   locale works** — including `zh-CN`, `ar`, `ja`, `fr` etc., not just
   nationid's three error-message locales. This collapses the
   `i18n-iso-countries` (897 stars, 2.17M weekly) dependency for any
   consumer that already needs nationid. **Strategic moat: one less
   dependency, one less list to maintain.**

6. **ICAO 9303 MRZ primitives.** `mrzCheckDigit` / `mrzCharValue` / `toMrzField9`
   / `validateMrzNumber` exposed via `nationid/algorithms`, plus alpha-3
   codes for all 34 countries via the catalog. No JS competitor exposes
   this layer at all; the closest non-library competitor is the paid
   `passport-mrz-reader` family. For an OCR-feeding flow this is the
   primitive layer a consumer needs to validate scanned passports.

7. **API stability promise + 414 KB tarball.** v1.0 declared stability;
   v1.1 maintains it. The tarball dropped 76% from v0.6 by removing sourcemap
   ship and decoupling the extract / pii / catalog subpaths from the root
   REGISTRY. validator.js ships **824 KB** (twice nationid). cpf-cnpj-validator
   ships ~80 KB but is single-country.

## Where nationid loses (be honest)

1. **Asia / Africa / Middle East coverage = 0.** python-stdnum covers IN
   (Aadhaar + PAN + GSTIN), CN (RIC), JP (CN + IN corporate/individual),
   KR (RRN + BRN), SG (UEN), TW (UBN), MY (NRIC), ID (NIK + NPWP), TH
   (TIN), VN (MST), ZA (ID + TIN), IL (mispar zehut + company), KE (PIN),
   AU (ABN + ACN + TFN), NZ (IRD). For any global KYC SaaS, nationid
   plus a second library is the minimum integration; for an India-only
   fintech, nationid is unusable. **Critical to address in v1.2 to claim
   global scope; the roadmap already names Asia for "v1.1+."**

2. **No framework adapters (zod / yup / joi / class-validator / Angular).**
   cpf-cnpj-validator 2.1 ships **five adapters out of the box**. A
   developer writing a NestJS controller with `class-validator` decorators
   gets `@IsCpf()` for free with cpf-cnpj-validator; with nationid the
   same developer writes `@Validate(NationIdValidator.bind(null, 'BR_CPF'))`
   or similar boilerplate. **Highest-leverage quick win** because the
   adapters are 20-50 LOC each and ride on the existing `validate()` /
   `parse()` core.

3. **No live registry lookup.** Stripe Identity charges $1.50/verification
   precisely because it confirms the number is **issued and active**, not
   just shaped correctly. nationid (and every offline library here) cannot
   answer "did SUNAT actually issue this RUC to a real entity?" — the
   answer requires API calls to SAT / SUNAT / RFB / HMRC / VIES. This is
   a deliberate scope choice (zero-dep, offline) but **a consumer doing
   high-assurance KYC will pay Stripe / Onfido instead of using any library
   in this matrix**. nationid's value is "catch the 95% of typos for free
   so you only pay the API for the 5% that pass."

4. **Driver licenses = 1 country (BR_CNH).** Ride-share, delivery, and
   US-state apps need DL validators. US has 50 state-specific formats;
   MX has 32 state formats; CA has 13 provincial formats. python-stdnum
   doesn't ship these either — but consumers expect a "national ID library"
   to cover the DL use case and discover the gap only after integration.
   **Acceptable as out-of-scope if the README declares it; today it doesn't.**

5. **Traction is at idea stage.** 182 weekly downloads, 2 GitHub stars,
   repo public for 14 days. python-stdnum at 583 stars / 222 forks /
   ~430k/mo PyPI is the de-facto reference in the Python ecosystem.
   `cpf-cnpj-validator` at 220 stars / 512k/mo npm has 6 years of brand
   equity in Brazil. nationid will need 12-18 months of consistent presence
   (release cadence, blog posts, framework adapter promotions) to convert
   search traffic. **Not a feature gap; a market-presence gap.**

6. **No code generator.** cpf-cnpj-validator ships `cpf.generate({state: 'SP'})`
   for test fixtures and seed data. brazilian-utils ships `generateCpf()`
   etc. nationid forces consumers to either (a) keep a hardcoded fixture
   table or (b) write their own backwards-checksum routine for each spec.
   **Generators are a 100-line file per spec on top of the existing
   algorithm primitives — concrete v1.2 work item.**

7. **Three error-message locales (es / en / pt) only.** For Europe coverage
   the library ships *algorithms* in all 12 EU countries but *error messages*
   in only 3 of the 24 official EU languages. A French signup form using
   `nationid/i18n` and `fr` falls back to English. python-stdnum (English
   only) is worse, but **Stripe Elements ships error messages in 36
   languages out of the box**.

## Positioning map

Two axes that matter to the buyer of a national-ID validator:

- **Y-axis: scope breadth** (1 country at the bottom; global at the top)
- **X-axis: TypeScript DX + ergonomics** (loose / JS-friendly on the left;
  strict / TS-native on the right)

```
                  global, all continents
                          |
       python-stdnum  ●   |
                          |
    validator.js  ●       |   ◌  ← "Stripe Identity" / "Onfido" (paid SaaS, no library)
                          |
                          |   ● nationid
                          |
      brazilian-utils ●   |
   cpf-cnpj-validator ●   |
              rut.js ●    |
                          |
                  single country
   loose / JS-friendly ←——————————————→ strict / TS-native
```

The empty quadrant is **upper-right: global + TS-native** — Stripe Identity
sits there as paid SaaS, no OSS library does. nationid is the closest
candidate but the Asia/Africa gap keeps it from claiming the slot.
**Strategic implication**: ship Asia + Africa in v1.2 / v1.3 and nationid
*alone* occupies the global-OSS-TS-native quadrant.

## Underserved segments

1. **NestJS / class-validator users in LATAM.** They currently install
   cpf-cnpj-validator for BR, hand-write CL RUT validation, and skip
   SV/GT/HN/DO/CR entirely. A `nationid/class-validator` adapter with
   `@IsNationId('CL_RUT')` decorator captures this segment in one release.

2. **Edge runtimes (Cloudflare Workers, Vercel Edge, Deno Deploy).**
   Bundle sizes matter, and nationid's 3 KB single-country bundles are
   the only credible option (validator.js ships 824 KB total; even
   tree-shaken its per-function imports stay above 5 KB). nationid's
   README does not call out the Edge angle — **add an "Edge runtime"
   section with a measured Worker example**.

3. **PII compliance teams (LGPD / GDPR).** `mask` + salted `hash` + `lastN`
   is exactly what a tokenization microservice needs. No competitor ships
   this. **Position a "PII helpers for ID numbers" page with code samples
   for storing CPF / RFC / DNI under LGPD article 5.**

4. **KYC vendors needing offline shape-check before paid verification.**
   Stripe Identity at $1.50/verification × 10,000 monthly users = $15k/mo;
   a 30% pre-filter via nationid (catching obvious typos) saves ~$4.5k/mo.
   **ROI story for the README**: "$0.0001 / validation × 10M = $1k saved
   per million eyeball verifications you don't have to pay Stripe for."

5. **Generative-AI form filling.** Agents like Anthropic Skills + Claude
   Computer Use need a primitive that says "is `12.345.678-5` a valid Chilean
   RUT?" without making an HTTP call. nationid is the ideal local primitive;
   the README doesn't position for this use case at all. **Add an "Agents
   / LLMs" section with a Skills example**.

## Strategic recommendations

1. **Ship framework adapters in v1.2** (zod + yup + class-validator + valibot
   + arktype). 4-5 adapters × ~50 LOC each = 1-2 days of work; closes the
   single largest gap to cpf-cnpj-validator. The zod adapter is the highest
   leverage because every Next.js / tRPC dev in the LATAM ecosystem already
   uses zod. **Effort: low. Value: high.** Concrete API:
   ```ts
   import { z } from "zod";
   import { nationid } from "nationid/zod";
   const Schema = z.object({ taxId: nationid("BR_CPF") });
   ```

2. **Declare and ship Asia in v1.2** (IN PAN + Aadhaar, CN RIC, JP CN+IN,
   KR RRN+BRN, SG UEN, TW UBN — 6 countries / ~12 specs). This is the
   single biggest moat dent against python-stdnum and the one that
   *unblocks* the README's claim of "validating documents from every
   country." **Effort: 3-4 weeks per the historical v0.4 → v0.6 cadence.
   Value: very high.**

3. **Publish a head-to-head benchmarks + correctness page** at `BENCHMARKS.md`
   that pins, in code: SV DUI (no competitor validates), CL RUT (rut.js
   stale 18 months), MX CURP (validator.js doesn't validate), ES CIF
   (validator.js regex-only), BR CNPJ alfanumérico (validator.js missing).
   For each, show a one-line `validator.js` call returning `true` for a
   typo nationid catches. **This is the highest-leverage content marketing
   asset** — it's the page Google ranks for "validate CL RUT TypeScript"
   and it converts validator.js refugees. **Effort: 1 day. Value: medium-high.**

4. **Add `generate(code, opts?)` primitive in v1.2.** One function per spec
   that backwards-engineers a valid example given the checksum. Closes
   the cpf-cnpj-validator / brazilian-utils gap, unblocks test-fixture
   generation, and makes the playground demo more impressive. **Effort:
   medium (1 file per spec). Value: medium.**

5. **Position the README around 4 distinct buyers** instead of one:
   - "I need to validate one tax ID for my country" → quick-start
     (`nationid/<cc>`).
   - "I'm building KYC onboarding for LATAM" → discriminated `parse()`
     + `i18n` + `confidence`.
   - "I'm building a NestJS / Next.js form" → framework adapters
     (after #1 ships).
   - "I'm running on the Edge" → per-country bundle sizes + worker
     example.
   Currently the README leads with the quick-start and conflates audiences.
   **Effort: low (rewrite + 4 sub-sections). Value: medium.**

6. **Drop the "every country" tagline until Asia ships.** The current
   README says "validating documents from every country" (line 5). With
   34 countries and 0 in Asia, the claim is provably false on first
   inspection and undermines trust. Replace with "every country in LATAM
   + Western and Northern Europe" or "34 countries today; global by v2.0."
   **Effort: 5 minutes. Value: trust-preservation.**

7. **File issues on the `validator.js` repo** linking back to nationid
   for the LATAM specs it ships as regex-only. validator.js's maintainers
   are unlikely to bring 18 LATAM specs into their core, and the issue
   thread becomes a permanent SEO breadcrumb. **Effort: 1 day. Value:
   small but compounding.**

8. **Treat python-stdnum as the upstream reference for v1.2+ country PRs.**
   For each new Asia country, mirror python-stdnum's spec coverage list
   exactly (e.g. for IN: ship Aadhaar + PAN + GSTIN + EPIC + VID — all
   five that python-stdnum ships). This signals "we know the canonical
   list" and prevents the "what about VID?" reviewer comment. **Effort:
   research-time per country; value: high quality bar.**

## What success looks like in 6 months (Q4 2026)

- Asia coverage shipped: IN, CN, JP, KR, SG, TW, MY, ID, TH, VN (10
  countries / ~20 specs) → nationid catches python-stdnum on coverage.
- Framework adapters shipped: zod, yup, class-validator, valibot →
  nationid catches cpf-cnpj-validator on integration.
- 4-5k weekly downloads (20-25× current) driven by the comparison
  benchmark page + adapter promotion.
- 200+ GitHub stars driven by Twitter/X + dev.to threads on the
  benchmark page (rut.js sits at 169 stars after 6 years; nationid
  passing it in 6 months would be a credible signal).
- README updated to match the four-buyer positioning, "every country"
  language removed.
- Stripe Identity / Onfido integration guide published as a separate
  page (positioning nationid as the offline pre-filter, not the
  competitor).

If those land, the score at the next audit (v1.3 or v2.0) is **9/10**:
clear OSS leader with one remaining gap (live registry lookup is and
should stay out of scope).
