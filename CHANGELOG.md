# Changelog

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
