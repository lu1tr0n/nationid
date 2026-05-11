# Changelog

## 0.6.0

### Minor Changes

- 9e050bb: v0.6.0 — Europe expansion: 12 new countries, 36 new document codes.

  ### New countries

  🇬🇧 United Kingdom · 🇫🇷 France · 🇩🇪 Germany · 🇮🇹 Italy · 🇳🇱 Netherlands · 🇧🇪 Belgium · 🇨🇭 Switzerland · 🇵🇱 Poland · 🇸🇪 Sweden · 🇳🇴 Norway · 🇩🇰 Denmark · 🇫🇮 Finland

  ### High-confidence specs (most are checksum-verified)

  | Country | Specs                                                                                                                            |
  | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
  | GB      | `GB_VAT` (mod-97), `GB_NHS` (mod-11), `GB_UTR`, `GB_NINO`                                                                        |
  | FR      | `FR_NIR` (mod-97 with Corsica branch), `FR_SIREN`/`FR_SIRET` (Luhn + La Poste exception), `FR_TVA`                               |
  | DE      | `DE_STEUER_ID` (ISO/IEC 7064 MOD 11,10), `DE_USTID` (mod-11), `DE_STEUERNUMMER` (format-only)                                    |
  | IT      | `IT_CF` (16-char alphanumeric with homocodia handling), `IT_PIVA` (Luhn)                                                         |
  | NL      | `NL_BSN` (eleven-test), `NL_BTW` (BSN or ISO 7064 MOD 97-10)                                                                     |
  | BE      | `BE_NRN` (mod-97 with century branch + DOB sanity), `BE_BTW` (mod-97)                                                            |
  | CH      | `CH_AHV` (EAN-13), `CH_UID` (mod-11), `CH_MWST`                                                                                  |
  | PL      | `PL_PESEL` (mod-10 + DOB sanity), `PL_NIP` (mod-11), `PL_REGON` (mod-11 9 + 14-digit)                                            |
  | SE      | `SE_PERSONNUMMER` (Luhn + samordningsnummer), `SE_ORGNR` (Luhn), `SE_VAT`                                                        |
  | NO      | `NO_FNR`/`NO_DNR` (dual mod-11), `NO_ORGNR` (mod-11), `NO_MVA`                                                                   |
  | DK      | `DK_CPR` (format + DOB plausibility, modulus check abolido 2007 — `cprMod11Legacy()` helper opt-in), `DK_CVR` (mod-11), `DK_VAT` |
  | FI      | `FI_HETU` (mod-31 with 2023 century separators), `FI_YTUNNUS` (mod-11), `FI_VAT`                                                 |

  ### Subpath imports

  ```ts
  import { validate } from "nationid/gb";
  validate("VAT", "GB123456789");
  import { validate } from "nationid/fr";
  validate("SIREN", "732829320");
  import { validate } from "nationid/de";
  validate("STEUER_ID", "47036892816");
  import { validate } from "nationid/it";
  validate("CF", "RSSMRA85T10A562S");
  // ...same pattern for /nl, /be, /ch, /pl, /se, /no, /dk, /fi
  ```

  ### Catalog metadata

  All 36 new specs ship with full localized metadata (`displayName` + `longName` + `description` × 3 locales = 108 hand-written entries) — `listDocuments("DE", "es")`, `getDocumentInfo("PL_PESEL", "en")`, etc. work out of the box. Spanish + Portuguese strings reviewed for orthography (tildes, ñ, ç, ã, ø, å).

  ### Quality

  - **6,377 tests passing** (+468 from v0.5.0)
  - Lint clean (262 files), typecheck clean, build clean (DTS for all entry points)
  - Cross-validation: PT_NIF agrees with `validator.js isTaxID('pt-PT')`; CA_SIN matches Luhn `isIdentityCard('en-CA')`; FR/DE/IT/NL/PL specs validated against `python-stdnum` reference algorithms
  - Bundle: full registry now 16.46 KB gzip (was 10.9 KB v0.5, budget 45 KB)
  - Per-country bundles all under 4 KB

  ### Bugs caught against research file

  While implementing, agents flagged 1 incorrect synthetic in research:

  - **FR_NIR**: research example `1 85 02 75 116 003 87` did not satisfy mod-97 (real clé is `09`). Library follows the algorithm and ships re-derived synthetic fixtures.

  Plus 4 deliberate algorithmic refinements:

  - FR_NIR sex-digit set extended to `[12378]` (covers INSEE temp-assignment codes 7/8)
  - FR_SIRET adds the documented La Poste exception (digit-sum mod 5 for SIREN `356000000`)
  - BE_NRN adds DOB plausibility check beyond mod-97
  - IT_CF tolerates Agenzia delle Entrate's letter substitutions (`L,M,N,P,Q,R,S,T,U,V` mapping for digits 0–9) used to disambiguate homocodia

  ### Migration

  No breaking changes. v0.5.0 consumers keep working. The 12 new countries + 36 new specs are additive — `listSupportedCodes()` returns 36 more codes.

  ### Coverage summary post-v0.6

  - **34 countries × ~120 document codes** (was 22 × 81 in v0.5)
  - 30+ high-confidence checksum specs added (mod-11, mod-97, Luhn, EAN-13, ISO/IEC 7064)
  - Solid foundation for KYC across LATAM + Europe + North America

  ### Roadmap

  - **v0.7** — Asia: IN, CN, JP, KR, SG, HK, TW + AU, NZ, ZA, IL
  - **v0.8** — `@nationid/react` companion + additional i18n locales
  - **v1.0** — API stability

## 0.5.0

### Minor Changes

- 6d6f923: v0.5.0 — Passport family + BR_CNPJ alphanumeric rollout + audit fixes.

  ### 🚨 Critical: BR_CNPJ alphanumeric (effective 2026-07-01)

  Receita Federal IN RFB 2.229/2024 changes CNPJ from 14 digits to alphanumeric `[A-Z0-9]{12}\d{2}`. **All existing valid CNPJs continue to validate** — the new algorithm is byte-identical to the legacy one when input is all digits (char value = `c.charCodeAt(0) - 48`, which equals the digit value for `'0'..'9'`). Letters `'A'..'Z'` map to `17..42` for the mod-11 weighted sum.

  ```ts
  // Pre-existing v0.1+ behavior (unchanged):
  validate("BR_CNPJ", "11.222.333/0001-81"); // true

  // New alphanumeric form (post-2026-07-01):
  validate("BR_CNPJ", "12ABC34501DE35"); // true
  ```

  ### 🛂 Passport family — 21 new countries + ICAO 9303 algorithm

  Adds `<CC>_PASAPORTE` for the 21 countries that were missing one (Colombia already shipped in v0.1):

  `SV, MX, BR, PE, AR, CL, DO, GT, HN, CR, ES, US, BO, EC, PY, NI, PA, UY, CA, PT, VE`

  Plus a new universal MRZ algorithm primitive at `nationid/algorithms`:

  ```ts
  import {
    mrzCheckDigit,
    validateMrzNumber,
    mrzCharValue,
    toMrzField9,
  } from "nationid/algorithms";

  mrzCheckDigit("L898902C<"); // 3 — ICAO 9303 canonical specimen
  validateMrzNumber("L898902C<3"); // true
  toMrzField9("ABC123"); // "ABC123<<<"
  ```

  Confidence tiers per country (verified by official issuer source):

  - **High** (2): ES, CA — issuer-published format
  - **Moderate** (5): MX, BR, DO, US, PT — community-confirmed
  - **Low** (15): rest — lenient regex, no first-party publication

  ### MX_NSS — IMSS Social Security (new)

  `MX_NSS` validates the 11-digit IMSS affiliation number using ISO/IEC 7812-1 mod-10 (Luhn) check digit, identical to the algorithm used for credit cards and `CA_SIN`. `confidence: "high"`.

  ```ts
  validate("MX_NSS", "12345678903"); // true / false
  ```

  ### Audit fixes

  Driven by the v0.4 coverage audit (`nationid-research/coverage-audit-2026-05-10.md`):

  - **NI_CEDULA**: trailing DV letter regex tightened to `[ABCDEFGHJKLMNPQRSTUVWXY]` (excludes I/O/Z per CSE Nicaragua to avoid confusion with 1/0/2)
  - **EC_CEDULA**: confirmed and documented that province `30` (Galápagos) is accepted; added boundary tests
  - **PA_RUC, PT_CC, VE_RIF**: held at current confidence with documented rationale (issuers do not publish full algorithm)

  ### Quality

  - 5,556 tests passing (+506 from v0.4.0)
  - Lint clean (202 files), typecheck clean, build clean
  - Cross-validation: ICAO 9303 verified against 4 independent sources (ICAO spec, idcheck.dev, TrustDocHub, planetcalc) using 4 worked vectors
  - BR_CNPJ backwards-compat property verified by structural proof + explicit test that every legacy fixture still validates
  - Bundle: full registry now 10.9 KB gzip (was 9.67 KB v0.4) — well under 30 KB budget
  - 22 passport specs + MX_NSS = 23 new entries in catalog × 3 locales = 69 hand-curated metadata strings (Spanish + Portuguese reviewed for orthography)

  ### Migration

  No breaking changes. v0.4.0 consumers keep working. The 22 passport specs are additive.

  For Marcly and similar SaaS already wrapping `COUNTRY_SPECS`: extending coverage to the new passports + MX_NSS is a one-line change per country in the wrapper's map.

  ### Coverage summary post-v0.5

  - **22 countries × 81 document codes** (was 58 in v0.4)
  - 5 new high/moderate-confidence checksum specs (BR_CNPJ alphanum, MX_NSS, ES_PASAPORTE, CA_PASAPORTE, plus existing ICAO algorithm)
  - 16 new format-only specs (passport for low-confidence countries)

## 0.4.0

### Minor Changes

- bb0ca41: v0.4.0 — 9 new countries: Bolivia, Ecuador, Paraguay, Nicaragua, Panamá, Uruguay, Canadá, Portugal, Venezuela.

  Total coverage: **22 countries × 58 document codes**, all with the same APIs (validate, format, normalize, parse, extract, pii, catalog, i18n).

  ### New countries and specs

  | Country      | Code        | Type     | Algorithm                                                                  | Confidence |
  | ------------ | ----------- | -------- | -------------------------------------------------------------------------- | ---------- |
  | 🇧🇴 Bolivia   | `BO_CI`     | identity | format-only (length + departmental suffix)                                 | moderate   |
  | 🇧🇴 Bolivia   | `BO_NIT`    | tax      | format-only (7-13 digits)                                                  | low        |
  | 🇪🇨 Ecuador   | `EC_CEDULA` | identity | Luhn-variant + provincia + 3rd-digit < 6                                   | high       |
  | 🇪🇨 Ecuador   | `EC_RUC`    | tax      | mod-11 / Luhn (3 branches: natural / pública / jurídica) + establecimiento | high       |
  | 🇵🇾 Paraguay  | `PY_CI`     | identity | format-only (6-9 digits)                                                   | moderate   |
  | 🇵🇾 Paraguay  | `PY_RUC`    | tax      | mod-11 ascending weights right-to-left (Ley 125/91)                        | moderate   |
  | 🇳🇮 Nicaragua | `NI_CEDULA` | identity | format-only (depto + DOB + correlative + DV letter)                        | low        |
  | 🇳🇮 Nicaragua | `NI_RUC`    | tax      | format-only (natural + jurídica shapes)                                    | low        |
  | 🇵🇦 Panamá    | `PA_CEDULA` | identity | format-only (provincial prefix)                                            | moderate   |
  | 🇵🇦 Panamá    | `PA_RUC`    | tax      | format-only                                                                | low        |
  | 🇺🇾 Uruguay   | `UY_CI`     | identity | mod-10 weighted DV                                                         | high       |
  | 🇺🇾 Uruguay   | `UY_RUT`    | tax      | mod-11 right-to-left                                                       | moderate   |
  | 🇨🇦 Canada    | `CA_SIN`    | both     | Luhn mod-10 (Service Canada)                                               | high       |
  | 🇨🇦 Canada    | `CA_BN`     | tax      | format-only (CRA does not publish DV)                                      | low        |
  | 🇵🇹 Portugal  | `PT_NIF`    | tax      | mod-11 weights `[9..2]` (Autoridade Tributária)                            | high       |
  | 🇵🇹 Portugal  | `PT_CC`     | identity | format-only (IRN does not publish full ISO/IEC 7064 verifier publicly)     | low        |
  | 🇻🇪 Venezuela | `VE_CEDULA` | identity | format-only (V/E + 7-8 digits)                                             | low        |
  | 🇻🇪 Venezuela | `VE_RIF`    | tax      | mod-11 with letter coefficient (V/E/J/P/G/C prefix)                        | moderate   |

  ### New subpath imports

  ```ts
  import { validate } from "nationid/uy";
  validate("CI", "1.234.567-2");
  import { validate } from "nationid/pt";
  validate("NIF", "501964843");
  import { validate } from "nationid/ca";
  validate("SIN", "046-454-286");
  // ...same pattern for /bo, /ec, /py, /ni, /pa, /ve
  ```

  ### Catalog + i18n integration

  All 18 new specs ship with full localized metadata in the existing catalog (es, en, pt) — `listDocuments("UY", "es")`, `getDocumentInfo("CA_SIN", "en")`, etc. work out of the box. Spanish + Portuguese strings hand-written with correct orthography (tildes, ç, ã).

  ### Quality

  - 5,050 tests passing (+546 from v0.3.0)
  - Lint clean (178 files), typecheck clean, build clean
  - All 9 new countries follow the established `DocumentSpec` contract
  - Cross-validation: PT_NIF agrees with `validator.js isTaxID('pt-PT')` and `python-stdnum stdnum.pt.nif` on the algorithm; CA_SIN matches `validator.js isIdentityCard('en-CA')`
  - Bundle size: full registry now 9.67 KB gzip (was 7.14 KB v0.3) — well under the 30 KB budget. Per-country bundles all under 3 KB

  ### Bugs caught against research

  While implementing, agents caught and fixed three discrepancies in the original research file (corrected fixtures shipped, marked in country docs):

  - **UY_CI**: research synthetic `1.234.567-3` did not satisfy the documented mod-10 algorithm (correct DV = 2). Library follows the algorithm and ships re-derived fixtures.
  - **UY_RUT**: research weights ambiguous LTR/RTL — RTL chosen because it matches the synthetic in the research entry.
  - **VE_RIF**: research synthetic `J-12345678-9` did not satisfy the documented mod-11 (correct DV = 4). Library follows the algorithm.

  ### Migration

  No breaking changes. Existing v0.3.0 consumers keep working. The 9 new countries are additive — `listSupportedCodes()` simply returns 18 more codes.

  For Marcly and similar SaaS that already wrap `COUNTRY_SPECS`: extending coverage to the new countries is a one-line change per country in the wrapper's `COUNTRY_SPECS` map.

## 0.3.0

### Minor Changes

- 531e9a3: v0.3.0 — Developer Experience release.

  Four new tree-shakable subpath modules for using `nationid` in real apps without writing glue code: extract, pii, i18n, and catalog.

  ### `nationid/extract`

  Pull structured data out of valid identity documents that **encode** it.

  ```ts
  import { extractDOB, extractSex, extractRegion } from "nationid/extract";

  extractDOB("MX_CURP", "GOMC850315HDFRRR07"); // { year: 1985, month: 3, day: 15 }
  extractSex("MX_CURP", "GOMC850315HDFRRR07"); // "M"
  extractRegion("MX_CURP", "GOMC850315HDFRRR07"); // { code: "DF", kind: "state" }
  extractSex("AR_CUIT", "20-12345678-3"); // "M" (prefix 20)
  extractRegion("GT_DPI", "1234567890101"); // { code: "01", kind: "department" }
  ```

  Supports MX_CURP (DOB+sex+state), MX_RFC_PF (DOB), AR_CUIT/CUIL/CDI (sex), GT_DPI (department), PE_RUC (taxpayer type). Returns `null` for codes that don't structurally encode the requested kind.

  ### `nationid/pii`

  Mask documents for safe display + hash for safe storage.

  ```ts
  import { mask, hash, lastN } from "nationid/pii";

  mask("MX_CURP", "GOMC850315HDFRRR07"); // "**************RR07"
  mask("BR_CPF", "12345678901"); // "***.***.**9-01"
  mask("BR_CNPJ", "12345678000190"); // "**.***.***/**01-90"

  await hash("BR_CPF", "12345678901", { salt: "tenant-42" }); // hex SHA-256
  lastN("BR_CPF", "12345678901", 4); // "8901"
  ```

  Hash uses the Web Crypto API (Node 20+, Deno, Bun, browsers, edge runtimes — zero-dep). `mask` reveals the last `n = min(4, ⌊len/3⌋)` chars per spec, preserving separators.

  ### `nationid/i18n`

  Localized error messages in Spanish, English, and Portuguese. Each locale ships as its own subpath for surgical bundling.

  ```ts
  import { getErrorMessage } from "nationid/i18n";

  getErrorMessage({ kind: "too_short" }, "es", "DUI");
  // "El DUI es demasiado corto."

  getErrorMessage({ kind: "invalid_checksum" }, "pt", "CPF");
  // "O CPF não é válido (dígito verificador incorreto)."

  // Bundle only one locale:
  import { errors } from "nationid/i18n/es"; // ~200 bytes
  ```

  ### `nationid/catalog`

  Queryable document catalog for building UIs. Exposes localized `displayName`, `longName`, `knownAs` aliases, `description`, `purpose`, and `confidence` per spec.

  ```ts
  import {
    listDocuments,
    getDocumentInfo,
    listDocumentsByPurpose,
  } from "nationid/catalog";

  listDocuments("MX", "es");
  // [{ code: "MX_CURP", displayName: "CURP",
  //    longName: "Clave Única de Registro de Población",
  //    description: "Identificador personal único para residentes mexicanos.",
  //    knownAs: ["CURP"], purpose: "identity", confidence: "high" }, ...]

  getDocumentInfo("ES_NUSS", "en");
  // { code: "ES_NUSS", displayName: "NUSS",
  //   longName: "Spanish Social Security Number",
  //   description: "Spanish social security affiliation number.",
  //   purpose: "social_security", confidence: "high", ... }

  listDocumentsByPurpose("tax", "es");
  // every tax doc across the 13 countries — useful for global tax-ID dropdowns
  ```

  Coverage: all 42 codes × 3 locales (`es`, `en`, `pt`) = 126 hand-curated entries. Drift-guarded by tests so every registered spec must have a catalog entry.

  ### Quality

  - 4,504 tests passing (+331 from v0.2.0)
  - Spanish + Portuguese strings reviewed for orthography (tildes, ñ, ç, ã)
  - Cross-validated extraction rules against RENAPO (CURP), AFIP/ARCA (CUIT/CUIL/CDI), SUNAT (RUC)
  - Bundle budgets: i18n locale < 200 B; extract/pii ≤ 10 KB (each pulls full registry for `getSpec`); catalog ~11 KB (all locales bundled)
  - All four subpaths are independently tree-shakable; the core `nationid` package is unchanged in size

  ### Migration

  No breaking changes. Existing consumers of `nationid` (validate/format/parse) keep working. The four new features are opt-in via subpath imports.

## 0.2.0

### Minor Changes

- e0aaa50: v0.1.1 — 8 new document codes (driven by real LATAM SaaS demand).

  ### High-confidence checksums (5)

  - 🇧🇷 **`BR_CNH`** (Carteira Nacional de Habilitação) — CONTRAN/DENATRAN mod-11 dual DV. Driver's license, also accepted as identity in non-tax contexts.
  - 🇧🇷 **`BR_TITULO_ELEITOR`** (Título de Eleitor) — TSE mod-11 dual DV. Voter ID, used for KYC by Brazilian fintechs that don't have CPF on record yet.
  - 🇧🇷 **`BR_PIS`** (PIS-PASEP / NIT / NIS) — Caixa/Receita mod-11 single DV. Social security / payroll tracking number.
  - 🇦🇷 **`AR_CDI`** (Clave de Identificación) — ARCA (ex-AFIP) mod-11. Tax ID variant for non-residents and certain regimes; reuses CUIT algorithm with different prefix set.
  - 🇪🇸 **`ES_NUSS`** (Número de Seguridad Social) — TGSS mod-97. Spanish social security number used in employment/pension forms.

  ### Format-only structural validation (3)

  - 🇲🇽 **`MX_CLAVE_ELECTOR`** (alias `MX_INE`) — 18-char voter ID code printed on Mexican INE/IFE card. Most-carried physical ID in Mexico. Format-only with structural validation (entidad federativa code + sex letter). No public checksum.
  - 🇨🇴 **`CO_PEP`** (Permiso Especial de Permanencia) — 15-digit Colombian migratory document for Venezuelan nationals. Format-only.
  - 🇨🇴 **`CO_PPT`** (Permiso por Protección Temporal) — Colombian replacement for PEP since 2021. Format-only with structural rules.

  ### Quality

  - All 8 new specs follow the established `DocumentSpec` contract.
  - High-confidence specs cross-validated against `@brazilian-utils/brazilian-utils` (BR_PIS), `validator.js` (where applicable), and the issuer's published algorithm.
  - Format-only specs include structural validation (e.g. MX_CLAVE_ELECTOR validates entidad federativa codes against the same RENAPO set used by MX_CURP).
  - Bundle size budget unchanged: full registry stays under 20 KB gzip; per-country budgets respected.

  ### Migration

  Drop-in upgrade — `pnpm update nationid` and the new codes are available via:

  ```ts
  import { validate } from "nationid";
  validate("MX_CLAVE_ELECTOR", "..."); // new
  validate("BR_CNH", "..."); // new
  ```

  Or via subpath:

  ```ts
  import { validate } from "nationid/mx";
  validate("CLAVE_ELECTOR", "..."); // new short alias
  validate("INE", "..."); // alternate alias
  ```

  No breaking changes. v0.1.0 consumers (e.g. Marcly's `document-id` wrapper) automatically gain the new codes after `pnpm update`.

  See `docs/countries/{br,mx,co,ar,es}.md` for per-spec algorithm references and
  sources, and `docs/PROPERTY_TESTS.md` for the property-test invariants the new
  specs satisfy.

## 0.1.0

### Minor Changes

- 64dc61f: Ship v0.1.0 — 13 countries with comprehensive document validation.

  ### Countries

  - 🇸🇻 **El Salvador** — DUI, NIT (moderate confidence: mod-10 / mod-11)
  - 🇲🇽 **México** — CURP, RFC PF, RFC PM (high / moderate confidence: RENAPO mod-10 + SAT homoclave mod-11)
  - 🇨🇴 **Colombia** — CC, CE, TI, Pasaporte (low: format-only) + NIT (high: DIAN mod-11 with weights `[3,7,13,17,19,23,29,37,41,43]`)
  - 🇧🇷 **Brasil** — CPF, CNPJ (high: Receita Federal mod-11 dual DV)
  - 🇵🇪 **Perú** — DNI, CE (low: format-only) + RUC (high: SUNAT mod-11 with prefix gates `{10,15,16,17,20}`)
  - 🇦🇷 **Argentina** — DNI (format), CUIL, CUIT (high: ARCA RG 10/1997 mod-11)
  - 🇨🇱 **Chile** — RUT/RUN (high: SII mod-11 with cyclic weights `2..7` and `K` verifier)
  - 🇩🇴 **República Dominicana** — Cédula (Luhn), RNC (DGII mod-11)
  - 🇬🇹 **Guatemala** — DPI (RENAP mod-11), NIT (SAT mod-11 with `K` verifier)
  - 🇭🇳 **Honduras** — DNI (low: structural), RTN (unconfirmed: length only)
  - 🇨🇷 **Costa Rica** — Cédula física, DIMEX, Cédula jurídica (high: TSE/Hacienda format with structural rules; no public DV)
  - 🇪🇸 **España** — DNI (high: BOE mod-23 letter), NIE (high: prefix substitution + DNI), NIF Persona Jurídica / CIF (high: AEAT Luhn-fold)
  - 🇺🇸 **United States** — SSN (high: SSA structural — invalid areas + groups), ITIN (high: IRS group ranges), EIN (high: IRS campus prefix)

  ### API

  - `validate(code, input)` → boolean
  - `format(code, input)` → string (canonical mask)
  - `normalize(code, input)` → string (canonical storage form)
  - `parse(code, input)` → `ParseResult` discriminated union (no exceptions thrown)
  - `getSpec(code)` → full `DocumentSpec`
  - `listSupportedCodes()`, `listSupportedCountries()`

  ### Tree-shakable subpath exports

  - `nationid` — full registry (13 countries, ~6 KB gzip)
  - `nationid/<cc>` — single country (~1-2 KB gzip each)
  - `nationid/algorithms` — Luhn (ISO 7812-1), parameterized mod-11 primitives

  ### Quality

  - 437 source tests + 21 packaged-export tests
  - Zero runtime dependencies
  - Dual ESM + CJS build with `.d.ts` and `.d.cts`
  - Bundle budgets enforced via `size-limit` (full registry < 20 KB; single country < 5 KB)
  - Every spec ships with an explicit `confidence` flag (`high | moderate | low | unconfirmed`)
  - All test fixtures are synthetic — no real PII

  See `docs/countries/<cc>.md` for per-country algorithm references and
  `THIRD_PARTY.md` for credits to libraries whose algorithms informed ours.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning 2.0](https://semver.org/spec/v2.0.0.html).

Entries are managed via [changesets](https://github.com/changesets/changesets) — create one with `pnpm changeset` when opening a PR.

## [Unreleased]

### Added

- Initial scaffold with TypeScript-first dual ESM+CJS build
- Core types: `CountryCode`, `DocumentTypeCode`, `DocumentSpec`, `ParseResult`
- Algorithm primitives: Luhn (ISO/IEC 7812-1), parameterized mod-11
- Tree-shakable subpath exports per country
- npm provenance attestations on releases
