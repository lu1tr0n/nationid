# nationid

> TypeScript-first, zero-dependency validator for national identity and tax documents from every country.

[![npm version](https://img.shields.io/npm/v/nationid?color=blue)](https://www.npmjs.com/package/nationid)
[![bundle size](https://img.shields.io/bundlephobia/minzip/nationid?label=bundle)](https://bundlephobia.com/package/nationid)
[![types](https://img.shields.io/npm/types/nationid)](https://www.npmjs.com/package/nationid)
[![license](https://img.shields.io/npm/l/nationid)](./LICENSE)
[![CI](https://github.com/lu1tr0n/nationid/actions/workflows/ci.yml/badge.svg)](https://github.com/lu1tr0n/nationid/actions)

`nationid` is a focused, comprehensive library for validating national identity documents and tax IDs. It ships with checksum verification (not just regex shape), proper formatting and normalization, and works in Node, browsers, Bun, Deno and edge runtimes.

## Why

Existing tools cover a fraction of the world. `validator.js` only validates 6 LATAM tax IDs. `cpf-cnpj-validator` covers Brazil. `rut.js` covers Chile. None ship El Salvador, Guatemala, Honduras, Dominican Republic, or Costa Rica with checksum verification.

`nationid` fills that gap. v0.1 ships **13 countries with ~28 document codes**, all with proper algorithms documented from official sources.

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

## Coverage (v0.1)

| Country | Personal | Tax |
|---------|----------|-----|
| 🇸🇻 El Salvador | DUI | NIT |
| 🇲🇽 México | CURP | RFC (PF + PM) |
| 🇨🇴 Colombia | CC, CE, TI, Pasaporte | NIT |
| 🇧🇷 Brasil | CPF | CNPJ |
| 🇵🇪 Perú | DNI, CE | RUC |
| 🇦🇷 Argentina | DNI, CUIL | CUIT |
| 🇨🇱 Chile | RUT/RUN | RUT/RUN |
| 🇩🇴 Rep. Dominicana | Cédula | RNC |
| 🇬🇹 Guatemala | DPI | NIT |
| 🇭🇳 Honduras | DNI | RTN |
| 🇨🇷 Costa Rica | Cédula física, DIMEX | Cédula jurídica |
| 🇪🇸 España | DNI, NIE | NIF (CIF) |
| 🇺🇸 United States | SSN, ITIN | EIN |

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

- **v0.1** — 13 countries (current)
- **v0.2** — UY, VE, PA, EC, BO, PY, NI, CA, PT + `extract` (DOB, sex) + `pii` (mask, hash) helpers
- **v0.3** — Europe principal: GB, FR, DE, IT, NL, BE, CH, SE, NO, DK, FI, PL + i18n bundles
- **v0.4** — Asia: IN, CN, JP, KR, SG, HK, TW + AU, NZ, ZA, IL
- **v0.5** — `@nationid/react` companion with `<DocumentInput>`
- **v1.0** — API stability, all current countries High confidence

## Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md). Country submissions are welcomed — every country added must include cited official sources and a comprehensive test fixture set.

## License

MIT — see [LICENSE](./LICENSE).
