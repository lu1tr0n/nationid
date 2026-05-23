# nationid

**[English](./README.md) · [Español](./README.es.md) · [Português](./README.pt.md)**

> Validador zero-dependency y TypeScript-first para documentos de identidad e impositivos de cualquier país.

[![npm version](https://img.shields.io/npm/v/nationid?color=blue)](https://www.npmjs.com/package/nationid)
[![bundle size](https://img.shields.io/bundlephobia/minzip/nationid?label=bundle)](https://bundlephobia.com/package/nationid)
[![types](https://img.shields.io/npm/types/nationid)](https://www.npmjs.com/package/nationid)
[![license](https://img.shields.io/npm/l/nationid)](./LICENSE)
[![CI](https://github.com/lu1tr0n/nationid/actions/workflows/ci.yml/badge.svg)](https://github.com/lu1tr0n/nationid/actions)

🎮 **Demo en vivo**: https://lu1tr0n.github.io/nationid_example/ — probá todos los países y helpers en 3 idiomas.
📖 **Referencia de API**: https://lu1tr0n.github.io/nationid/
📊 **Benchmarks**: ver [BENCHMARKS.md](./BENCHMARKS.md)

`nationid` es una librería enfocada y completa para validar documentos de identidad y números tributarios. Trae verificación de checksum (no solo regex), formateo y normalización correctos, y funciona en Node, navegadores, Bun, Deno y edge runtimes.

## Por qué

Las herramientas existentes cubren una fracción del mundo. `validator.js` solo valida 6 tax IDs de LATAM. `cpf-cnpj-validator` cubre Brasil. `rut.js` cubre Chile. Ninguna trae El Salvador, Guatemala, Honduras, República Dominicana o Costa Rica con verificación de checksum.

`nationid` llena ese vacío. A partir de v1.0 trae **34 países con ~120 códigos de documento**, todos con algoritmos documentados desde fuentes oficiales — y promete estabilidad de API más un test de gobernanza en CI que exige a cada spec con `confidence: "high"` que cite una fuente del emisor de primera mano.

## Novedades en v1.0

- **Inferencia de TypeScript mejorada.** `parse("MX_CURP", x).code` ahora infiere el literal `"MX_CURP"`, no la unión de 124 miembros. `extractDOB / extractSex / extractRegion` restringen su primer argumento a los códigos que realmente codifican cada campo. Los bundles por país exponen tipos literales para `country` / `defaultPersonal` / `defaultTax`.
- **Tarball de npm 76% más chico.** De 1.7 MB → 414 KB al sacar los sourcemaps del tarball y romper la dependencia de `extract`/`pii`/`catalog` con el REGISTRY raíz. `nationid/extract` solo cae -90% en raw.
- **Tres breaking changes pequeños**, documentados en [`MIGRATION.md`](./MIGRATION.md) §0: `pii.mask` ahora lanza error en códigos desconocidos (simetría con `hash`/`lastN`); el campo `exports` de `package.json` niega subpaths no documentados; `CA_PASAPORTE` y `ES_PASAPORTE` bajan de `high` a `moderate` (no hay spec oficial del emisor para citar).
- **Test de gobernanza.** Nuevo `tests/governance/confidence-citations.test.ts` falla CI si algún spec con `confidence: "high"` no cita una URL en TLD del emisor o un estatuto legal reconocido en su JSDoc.

Leé [MIGRATION.md §0](./MIGRATION.md#0-migrating-from-v0x-to-v10) antes de actualizar desde v0.x.

## Instalar

```sh
npm i nationid
# o
pnpm add nationid
# o
yarn add nationid
```

Requiere Node 20+.

## Inicio rápido

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

`parse()` retorna una unión discriminada — la API pública nunca lanza excepciones. En caso de fallo trae un `reason.kind` tipado:

```ts
const r = parse("SV_DUI", "");
if (!r.ok) r.reason.kind; // "empty" | "too_short" | "too_long" | "invalid_format" | "invalid_checksum"
```

## Playground en vivo

Probá todos los países y todos los helpers sin instalar nada: **https://lu1tr0n.github.io/nationid_example/**

El playground cubre:

- ✅ `validate / parse / format / normalize` para los 34 países
- 🎯 `extract` (fecha de nacimiento, sexo, región) cuando el documento lo codifica
- 🔒 `pii` enmascarado + hash SHA-256 para display y almacenamiento seguro
- 🌍 `i18n` mensajes de error en `es`, `en`, `pt`
- 📚 `catalog` — metadata de documentos consultable para dropdowns
- 6 ejemplos production-ready (formularios React, validación en servidor, KYC, etc.)

Código fuente del showcase: https://github.com/lu1tr0n/nationid_example

## Imports tree-shakable por subpath

Un solo país, ~3-5 KB gzip:

```ts
import { validate } from "nationid/sv";
validate("DUI", "045678903");
```

Primitivos de algoritmos:

```ts
import { luhnValid, mod11WeightedSum } from "nationid/algorithms";
```

## Helpers DX — extract / pii / i18n / catalog

Cuatro módulos tree-shakable para necesidades comunes (disponibles desde v0.3):

```ts
// Extraer datos estructurados de documentos válidos
import { extractDOB, extractSex, extractRegion } from "nationid/extract";
extractDOB("MX_CURP", "GOMC850315HDFRRR07");  // { year: 1985, month: 3, day: 15 }
extractSex("AR_CUIT", "20-12345678-3");        // "M"

// Enmascarar + hashear para display y almacenamiento seguros
import { mask, hash, lastN } from "nationid/pii";
mask("BR_CPF", "12345678901");                          // "***.***.**9-01"
await hash("BR_CPF", "12345678901", { salt: "tenant" }); // SHA-256 en hex

// Mensajes de error localizados (es, en, pt)
import { getErrorMessage } from "nationid/i18n";
getErrorMessage({ kind: "too_short" }, "es", "DUI");  // "El DUI es demasiado corto."

// Catálogo de documentos con nombres localizados — para dropdowns
import { listDocuments } from "nationid/catalog";
listDocuments("MX", "es");
// [{ code: "MX_CURP", displayName: "CURP",
//    longName: "Clave Única de Registro de Población",
//    purpose: "identity", confidence: "high", ... }, ...]

// Catálogo de países (v1.1) — nombres + banderas para los 34 países.
// Usa Intl.DisplayNames (CLDR), así que cualquier locale del runtime sirve.
import { getCountryInfo, listCountries, flagEmoji } from "nationid/catalog";
getCountryInfo("MX", "es");
// { code: "MX", alpha3: "MEX", name: "México", flag: "🇲🇽" }
flagEmoji("BR");          // "🇧🇷"
listCountries("pt").length; // 34
```

Cada subpath se tree-shakea independiente. Los locales sueltos (`nationid/i18n/es`, `/en`, `/pt`) pesan menos de 200 B cada uno.

## Cobertura (34 países)

| País | Personal | Tributario |
|------|----------|-----|
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
| 🇺🇸 Estados Unidos | SSN, ITIN | EIN |
| 🇧🇴 Bolivia | CI | NIT |
| 🇪🇨 Ecuador | Cédula | RUC |
| 🇵🇾 Paraguay | CI | RUC |
| 🇳🇮 Nicaragua | Cédula | RUC |
| 🇵🇦 Panamá | Cédula | RUC |
| 🇺🇾 Uruguay | CI | RUT |
| 🇨🇦 Canadá | SIN | BN |
| 🇵🇹 Portugal | CC | NIF |
| 🇻🇪 Venezuela | Cédula | RIF |
| 🇬🇧 Reino Unido | NINO, NHS Number | UTR, VAT |
| 🇫🇷 Francia | NIR | SIREN, SIRET, TVA |
| 🇩🇪 Alemania | Steuer-ID | Steuernummer, USt-IdNr |
| 🇮🇹 Italia | Codice Fiscale | Partita IVA |
| 🇳🇱 Países Bajos | BSN | BTW |
| 🇧🇪 Bélgica | NRN | BTW |
| 🇨🇭 Suiza | AHV | UID, MWST |
| 🇵🇱 Polonia | PESEL | NIP, REGON |
| 🇸🇪 Suecia | Personnummer | Organisationsnummer, Moms |
| 🇳🇴 Noruega | Fødselsnummer, D-nummer | Organisasjonsnummer, MVA |
| 🇩🇰 Dinamarca | CPR | CVR, Moms |
| 🇫🇮 Finlandia | HETU | Y-tunnus, ALV |
| 🇮🇳 India *(v1.2)* | Aadhaar, VID, EPIC (electoral) | PAN, GSTIN |

La documentación per-país completa con algoritmos y fuentes citadas vive en [`docs/countries/`](./docs/countries).

## Bandera de confianza

Cada spec carga un valor `confidence` que refleja cuán verificado está su algoritmo:

- `high` — fuente oficial Y librería madura concuerdan (en v1.0, además requiere cita first-party verificada por CI).
- `moderate` — una fuente oficial O librería madura concuerda; falta la otra.
- `low` — solo community / ingeniería reversa. Validación solo de formato.
- `unconfirmed` — sin algoritmo verificado. Validación solo de formato.

La UI puede mostrar una advertencia cuando un documento de baja confianza valida solo por formato.

## Usado por

- **[Emiso](https://panel.emiso.app)** — plataforma multi-tenant de facturación electrónica para Centroamérica. Usa `nationid` para validación de DUI / NIT / RUC del receptor y enmascarado KYC.

Si tu producto usa `nationid` y querés aparecer acá, abrí un PR con una entrada de una línea arriba.

## Comparación

| | nationid | validator.js | cpf-cnpj-validator | rut.js |
|---|---|---|---|---|
| Países LATAM | **22** | 6 | 1 | 1 |
| Países europeos | **12** | 8 | 0 | 0 |
| El Salvador | ✅ | ❌ | ❌ | ❌ |
| Guatemala | ✅ | ❌ | ❌ | ❌ |
| Honduras | ✅ | ❌ | ❌ | ❌ |
| Costa Rica | ✅ | ❌ | ❌ | ❌ |
| Tamaño bundle (1 país) | ~3-5 KB | ~40 KB full | ~5 KB | ~5 KB |
| Tipos TypeScript | First-class | Sí | Limitados | Limitados |
| Subpaths tree-shakable | ✅ | ❌ | N/A | N/A |
| Cero dependencias | ✅ | ✅ | ✅ | ✅ |

## Roadmap

- **v0.1** — 13 países: SV, MX, CO, BR, PE, AR, CL, DO, GT, HN, CR, ES, US ✅
- **v0.2** — 8 códigos adicionales en países cubiertos ✅
- **v0.3** — subpaths `extract` + `pii` + `i18n` + `catalog` ✅
- **v0.4** — 9 países nuevos: UY, VE, PA, EC, BO, PY, NI, CA, PT ✅
- **v0.5** — Familia pasaporte + algoritmo ICAO 9303 + BR_CNPJ alfanumérico + MX_NSS + correcciones del audit ✅
- **v0.6** — Europa principal: GB, FR, DE, IT, NL, BE, CH, PL, SE, NO, DK, FI ✅
- **v1.0** — API estabilizada. Cada spec con `confidence: "high"` respaldado por una cita first-party (verificado en CI). Tarball -76%. Inferencia con narrowing para `parse` / `getSpec` / `extract*`. ✅
- **v1.1+** — Asia (IN, CN, JP, KR, SG, HK, TW + AU, NZ, ZA, IL), `@nationid/react` con `<DocumentInput>`, más locales i18n, mutation testing, REGISTRY lazy para tree-shaking completo desde el root.

## Contribuir

Ver [CONTRIBUTING.md](./CONTRIBUTING.md). Se reciben PRs de países nuevos — cada país agregado debe incluir fuentes oficiales citadas y un set completo de fixtures de prueba.

## Licencia

MIT — ver [LICENSE](./LICENSE).
