# nationid

> TypeScript-first, zero-dependency validator for national identity and tax documents from every country.

[![npm version](https://img.shields.io/npm/v/nationid?color=blue)](https://www.npmjs.com/package/nationid)
[![bundle size](https://img.shields.io/bundlephobia/minzip/nationid?label=bundle)](https://bundlephobia.com/package/nationid)
[![types](https://img.shields.io/npm/types/nationid)](https://www.npmjs.com/package/nationid)
[![license](https://img.shields.io/npm/l/nationid)](./LICENSE)
[![CI](https://github.com/lu1tr0n/nationid/actions/workflows/ci.yml/badge.svg)](https://github.com/lu1tr0n/nationid/actions)

📖 **API Reference**: https://lu1tr0n.github.io/nationid/
📊 **Benchmarks**: see [BENCHMARKS.md](./BENCHMARKS.md)

`nationid` is a focused, comprehensive library for validating national identity documents and tax IDs. It ships with checksum verification (not just regex shape), proper formatting and normalization, and works in Node, browsers, Bun, Deno and edge runtimes.

## Why

Existing tools cover a fraction of the world. `validator.js` only validates 6 LATAM tax IDs. `cpf-cnpj-validator` covers Brazil. `rut.js` covers Chile. None ship El Salvador, Guatemala, Honduras, Dominican Republic, or Costa Rica with checksum verification.

`nationid` fills that gap. As of v0.4 it ships **22 countries with ~58 document codes**, all with proper algorithms documented from official sources.

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

## v0.3 — Developer Experience helpers

Four new tree-shakable modules for common app needs:

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
```

Each subpath is independently tree-shakable. Single locales (`nationid/i18n/es`, `/en`, `/pt`) ship as <200B bundles.

## Coverage (22 countries)

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
| LATAM countries | **13** | 6 | 1 | 1 |
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
- **v0.2** — 8 additional codes in covered countries: `BR_CNH`, `BR_TITULO_ELEITOR`, `BR_PIS`, `AR_CDI`, `ES_NUSS`, `MX_CLAVE_ELECTOR`, `CO_PEP`, `CO_PPT` ✅
- **v0.3** — `extract` (DOB, sex, region) + `pii` (mask, hash, lastN) + `i18n` (es/en/pt error messages) + `catalog` (queryable document metadata) ✅
- **v0.4** — 9 new countries: UY, VE, PA, EC, BO, PY, NI, CA, PT ✅
- **v0.5** — Europe principal: GB, FR, DE, IT, NL, BE, CH, SE, NO, DK, FI, PL + additional i18n locales
- **v0.6** — Asia: IN, CN, JP, KR, SG, HK, TW + AU, NZ, ZA, IL
- **v0.7** — `@nationid/react` companion with `<DocumentInput>`
- **v1.0** — API stability, all current countries at High confidence

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Country submissions are welcomed — every country added must include cited official sources and a comprehensive test fixture set.

## License

MIT — see [LICENSE](./LICENSE).
