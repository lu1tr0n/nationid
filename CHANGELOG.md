# Changelog

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
