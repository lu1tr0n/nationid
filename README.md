# nationid

**[English](./README.md) · [Español](./README.es.md) · [Português](./README.pt.md)**

> TypeScript-first, zero-dependency validator for national identity and tax documents from every country.

[![npm version](https://img.shields.io/npm/v/nationid?color=blue)](https://www.npmjs.com/package/nationid)
[![bundle size](https://img.shields.io/bundlephobia/minzip/nationid?label=bundle)](https://bundlephobia.com/package/nationid)
[![types](https://img.shields.io/npm/types/nationid)](https://www.npmjs.com/package/nationid)
[![license](https://img.shields.io/npm/l/nationid)](./LICENSE)
[![CI](https://github.com/lu1tr0n/nationid/actions/workflows/ci.yml/badge.svg)](https://github.com/lu1tr0n/nationid/actions)

🎮 **Live playground**: https://lu1tr0n.github.io/nationid_example/ — try every country, every helper, in 3 locales.
📖 **API Reference**: https://lu1tr0n.github.io/nationid/
📊 **Benchmarks**: see [BENCHMARKS.md](./BENCHMARKS.md)

`nationid` is a focused, comprehensive library for validating national identity documents and tax IDs. It ships with checksum verification (not just regex shape), proper formatting and normalization, and works in Node, browsers, Bun, Deno and edge runtimes.

## Why

Existing tools cover a fraction of the world. `validator.js` only validates 6 LATAM tax IDs. `cpf-cnpj-validator` covers Brazil. `rut.js` covers Chile. None ship El Salvador, Guatemala, Honduras, Dominican Republic, or Costa Rica with checksum verification.

`nationid` fills that gap. As of v1.0 it ships **34 countries with ~120 document codes**, all with proper algorithms documented from official sources — and ships an API-stability promise plus a CI-enforced governance test that every `high`-confidence spec cites a first-party issuer source.

## What's new in v1.0

- **TypeScript inference upgraded.** `parse("MX_CURP", x).code` now infers the literal `"MX_CURP"`, not the 124-member union. `extractDOB / extractSex / extractRegion` constrain their first argument to the codes that actually encode each field. Country bundles expose literal `country` / `defaultPersonal` / `defaultTax` types.
- **76% smaller npm tarball.** From 1.7 MB → 414 KB by dropping shipped sourcemaps and breaking the `extract`/`pii`/`catalog` subpaths' dependency on the root REGISTRY. `nationid/extract` alone drops -90% raw.
- **Three small breaking changes**, all documented in [`MIGRATION.md`](./MIGRATION.md) §0: `pii.mask` now throws on unknown codes (symmetric with `hash`/`lastN`); `package.json` exports denies undocumented subpaths; `CA_PASAPORTE` and `ES_PASAPORTE` confidence demote `high → moderate` (no first-party issuer spec to cite).
- **Governance test.** New `tests/governance/confidence-citations.test.ts` fails CI if any `confidence: "high"` spec lacks an issuer-TLD URL or recognized legal statute in its JSDoc header.

See [MIGRATION.md §0](./MIGRATION.md#0-migrating-from-v0x-to-v10) before upgrading from v0.x.

## Install

```sh
npm i nationid
# or
pnpm add nationid
# or
yarn add nationid
```

Requires Node 20+.

## Quick start

```ts
import { validate, format, normalize, parse } from "nationid";

validate("SV_DUI", "04567890-3");          // true
validate("BR_CPF", "529.982.247-25");      // true
validate("CL_RUT", "12.345.678-5");        // true
validate("ES_DNI", "12345678Z");           // true

format("SV_DUI", "045678903");             // "04567890-3"
normalize("SV_DUI", "04567890-3");         // "045678903"

const result = parse("SV_NIT", "0614-150585-101-5");
if (result.ok) {
  console.log(result.normalized);          // "06141505851015"
  console.log(result.formatted);           // "0614-150585-101-5"
  console.log(result.confidence);          // "moderate"
}
```

`parse()` returns a discriminated union — no exceptions are thrown from the
public API. On failure it carries a typed `reason.kind`:

```ts
const r = parse("SV_DUI", "");
if (!r.ok) r.reason.kind; // "empty" | "too_short" | "too_long" | "invalid_format" | "invalid_checksum"
```

## Live playground

Try every country and every helper without installing anything: **https://lu1tr0n.github.io/nationid_example/**

The playground covers:

- ✅ `validate / parse / format / normalize` for all 22 countries
- 🎯 `extract` (DOB, sex, region) where the document encodes it
- 🔒 `pii` masking + SHA-256 hashing for safe display and storage
- 🌍 `i18n` error messages in `es`, `en`, `pt`
- 📚 `catalog` — queryable document metadata for UI dropdowns
- 6 best-practice code examples (React forms, server validation, KYC display, etc.)

Source code for the showcase site: https://github.com/lu1tr0n/nationid_example

## Tree-shakable subpath imports

Single country, ~3-5KB gzipped:

```ts
import { validate } from "nationid/sv";
validate("DUI", "045678903");
```

Algorithm primitives:

```ts
import { luhnValid, mod11WeightedSum } from "nationid/algorithms";
```

## DX helpers — extract / pii / i18n / catalog

Four tree-shakable modules for common app needs (available since v0.3):

```ts
// Extract structured data from valid documents
import { extractDOB, extractSex, extractRegion } from "nationid/extract";
extractDOB("MX_CURP", "GOMC850315HDFRRR07");  // { year: 1985, month: 3, day: 15 }
extractSex("AR_CUIT", "20-12345678-3");        // "M"

// Mask + hash for safe display and storage
import { mask, hash, lastN } from "nationid/pii";
mask("BR_CPF", "12345678901");                          // "***.***.**9-01"
await hash("BR_CPF", "12345678901", { salt: "tenant" }); // hex SHA-256

// Localized error messages (es, en, pt)
import { getErrorMessage } from "nationid/i18n";
getErrorMessage({ kind: "too_short" }, "es", "DUI");  // "El DUI es demasiado corto."

// Document catalog with localized names — for UI dropdowns
import { listDocuments } from "nationid/catalog";
listDocuments("MX", "es");
// [{ code: "MX_CURP", displayName: "CURP",
//    longName: "Clave Única de Registro de Población",
//    purpose: "identity", confidence: "high", ... }, ...]

// Country catalog (v1.1) — names + flags for every supported country.
// Uses Intl.DisplayNames (CLDR) so any locale the runtime supports works.
import { getCountryInfo, listCountries, flagEmoji } from "nationid/catalog";
getCountryInfo("MX", "es");
// { code: "MX", alpha3: "MEX", name: "México", flag: "🇲🇽" }
flagEmoji("BR");          // "🇧🇷"
listCountries("pt").length; // 34
```

Each subpath is independently tree-shakable. Single locales (`nationid/i18n/es`, `/en`, `/pt`) ship as <200B bundles.

## Coverage (34 countries)

| Country | Personal | Tax |
|---------|----------|-----|
| 🇸🇻 El Salvador | DUI | NIT |
| 🇲🇽 México | CURP, Clave de Elector | RFC (PF + PM) |
| 🇨🇴 Colombia | CC, CE, TI, Pasaporte, PEP, PPT | NIT |
| 🇧🇷 Brasil | CPF, CNH, Título de Eleitor | CNPJ, PIS |
| 🇵🇪 Perú | DNI, CE | RUC |
| 🇦🇷 Argentina | DNI, CUIL | CUIT, CDI |
| 🇨🇱 Chile | RUT/RUN | RUT/RUN |
| 🇩🇴 Rep. Dominicana | Cédula | RNC |
| 🇬🇹 Guatemala | DPI | NIT |
| 🇭🇳 Honduras | DNI | RTN |
| 🇨🇷 Costa Rica | Cédula física, DIMEX | Cédula jurídica |
| 🇪🇸 España | DNI, NIE | NIF (CIF), NUSS |
| 🇺🇸 United States | SSN, ITIN | EIN |
| 🇧🇴 Bolivia *(v0.4)* | CI | NIT |
| 🇪🇨 Ecuador *(v0.4)* | Cédula | RUC |
| 🇵🇾 Paraguay *(v0.4)* | CI | RUC |
| 🇳🇮 Nicaragua *(v0.4)* | Cédula | RUC |
| 🇵🇦 Panamá *(v0.4)* | Cédula | RUC |
| 🇺🇾 Uruguay *(v0.4)* | CI | RUT |
| 🇨🇦 Canadá *(v0.4)* | SIN | BN |
| 🇵🇹 Portugal *(v0.4)* | CC | NIF |
| 🇻🇪 Venezuela *(v0.4)* | Cédula | RIF |
| 🇬🇧 United Kingdom *(v0.6)* | NINO, NHS Number | UTR, VAT |
| 🇫🇷 France *(v0.6)* | NIR | SIREN, SIRET, TVA |
| 🇩🇪 Germany *(v0.6)* | Steuer-ID | Steuernummer, USt-IdNr |
| 🇮🇹 Italy *(v0.6)* | Codice Fiscale | Partita IVA |
| 🇳🇱 Netherlands *(v0.6)* | BSN | BTW |
| 🇧🇪 Belgium *(v0.6)* | NRN | BTW |
| 🇨🇭 Switzerland *(v0.6)* | AHV | UID, MWST |
| 🇵🇱 Poland *(v0.6)* | PESEL | NIP, REGON |
| 🇸🇪 Sweden *(v0.6)* | Personnummer | Organisationsnummer, Moms |
| 🇳🇴 Norway *(v0.6)* | Fødselsnummer, D-nummer | Organisasjonsnummer, MVA |
| 🇩🇰 Denmark *(v0.6)* | CPR | CVR, Moms |
| 🇫🇮 Finland *(v0.6)* | HETU | Y-tunnus, ALV |

Full per-country docs with algorithms and sources cited live in [`docs/countries/`](./docs/countries).

## Confidence flag

Each spec carries a `confidence` value reflecting how well-verified its algorithm is:

- `high` — official source AND mature library agree.
- `moderate` — one official source OR mature library agrees; the other missing.
- `low` — only community / reverse-engineered. Format-only validation.
- `unconfirmed` — no algorithm verified. Format-only validation.

UIs can choose to surface a warning when a low-confidence document validates only by format.

## Comparison

| | nationid | validator.js | cpf-cnpj-validator | rut.js |
|---|---|---|---|---|
| LATAM countries | **22** | 6 | 1 | 1 |
| European countries | **12** | 8 | 0 | 0 |
| El Salvador | ✅ | ❌ | ❌ | ❌ |
| Guatemala | ✅ | ❌ | ❌ | ❌ |
| Honduras | ✅ | ❌ | ❌ | ❌ |
| Costa Rica | ✅ | ❌ | ❌ | ❌ |
| Bundle size (1 country) | ~3-5KB | ~40KB full | ~5KB | ~5KB |
| TypeScript types | First-class | Yes | Limited | Limited |
| Tree-shakable subpaths | ✅ | ❌ | N/A | N/A |
| Zero deps | ✅ | ✅ | ✅ | ✅ |

## Roadmap

- **v0.1** — 13 countries: SV, MX, CO, BR, PE, AR, CL, DO, GT, HN, CR, ES, US ✅
- **v0.2** — 8 additional codes in covered countries ✅
- **v0.3** — `extract` + `pii` + `i18n` + `catalog` subpaths ✅
- **v0.4** — 9 new countries: UY, VE, PA, EC, BO, PY, NI, CA, PT ✅
- **v0.5** — Passport family + ICAO 9303 algorithm + BR_CNPJ alphanum + MX_NSS + audit fixes ✅
- **v0.6** — Europe principal: GB, FR, DE, IT, NL, BE, CH, PL, SE, NO, DK, FI ✅
- **v1.0** — API stability declared. Every `high`-confidence spec backed by a first-party citation (CI-enforced). 76% smaller tarball. Type inference narrowing for `parse` / `getSpec` / `extract*`. ✅
- **v1.1+** — Asia (IN, CN, JP, KR, SG, HK, TW + AU, NZ, ZA, IL), `@nationid/react` companion with `<DocumentInput>`, additional i18n locales, mutation testing, lazy REGISTRY for full root-import tree-shaking.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Country submissions are welcomed — every country added must include cited official sources and a comprehensive test fixture set.

## License

MIT — see [LICENSE](./LICENSE).
