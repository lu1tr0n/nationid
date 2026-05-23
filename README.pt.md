# nationid

**[English](./README.md) · [Español](./README.es.md) · [Português](./README.pt.md)**

> Validador TypeScript-first e zero-dependency para documentos de identidade e fiscais de qualquer país.

[![npm version](https://img.shields.io/npm/v/nationid?color=blue)](https://www.npmjs.com/package/nationid)
[![bundle size](https://img.shields.io/bundlephobia/minzip/nationid?label=bundle)](https://bundlephobia.com/package/nationid)
[![types](https://img.shields.io/npm/types/nationid)](https://www.npmjs.com/package/nationid)
[![license](https://img.shields.io/npm/l/nationid)](./LICENSE)
[![CI](https://github.com/lu1tr0n/nationid/actions/workflows/ci.yml/badge.svg)](https://github.com/lu1tr0n/nationid/actions)

🎮 **Demo ao vivo**: https://lu1tr0n.github.io/nationid_example/ — teste todos os países e helpers em 3 idiomas.
📖 **Referência da API**: https://lu1tr0n.github.io/nationid/
📊 **Benchmarks**: ver [BENCHMARKS.md](./BENCHMARKS.md)

`nationid` é uma biblioteca focada e abrangente para validar documentos de identidade e CPF/CNPJ. Vem com verificação de checksum (não apenas regex), formatação e normalização adequadas, e funciona em Node, browsers, Bun, Deno e edge runtimes.

## Por quê

As ferramentas existentes cobrem uma fração do mundo. `validator.js` valida apenas 6 tax IDs de LATAM. `cpf-cnpj-validator` cobre o Brasil. `rut.js` cobre o Chile. Nenhuma traz El Salvador, Guatemala, Honduras, República Dominicana ou Costa Rica com verificação de checksum.

`nationid` preenche essa lacuna. A partir da v1.0 traz **34 países com ~120 códigos de documento**, todos com algoritmos documentados de fontes oficiais — e promete estabilidade de API mais um teste de governança no CI que exige que cada spec com `confidence: "high"` cite uma fonte de primeira mão do emissor.

## Novidades na v1.0

- **Inferência de TypeScript aprimorada.** `parse("BR_CPF", x).code` agora infere o literal `"BR_CPF"`, não a união de 124 membros. `extractDOB / extractSex / extractRegion` restringem o primeiro argumento aos códigos que realmente codificam cada campo. Os bundles por país expõem tipos literais para `country` / `defaultPersonal` / `defaultTax`.
- **Tarball npm 76% menor.** De 1,7 MB → 414 KB ao remover sourcemaps do tarball e quebrar a dependência de `extract`/`pii`/`catalog` com o REGISTRY raiz. `nationid/extract` sozinho cai -90% em raw.
- **Três breaking changes pequenos**, documentados em [`MIGRATION.md`](./MIGRATION.md) §0: `pii.mask` agora lança erro em códigos desconhecidos (simétrico com `hash`/`lastN`); o campo `exports` do `package.json` nega subpaths não documentados; `CA_PASAPORTE` e `ES_PASAPORTE` baixam de `high` para `moderate` (sem spec oficial do emissor para citar).
- **Teste de governança.** Novo `tests/governance/confidence-citations.test.ts` falha o CI se algum spec com `confidence: "high"` não citar uma URL no TLD do emissor ou um estatuto legal reconhecido no JSDoc.

Leia [MIGRATION.md §0](./MIGRATION.md#0-migrating-from-v0x-to-v10) antes de atualizar a partir da v0.x.

## Instalar

```sh
npm i nationid
# ou
pnpm add nationid
# ou
yarn add nationid
```

Requer Node 20+.

## Início rápido

```ts
import { validate, format, normalize, parse } from "nationid";

validate("BR_CPF", "529.982.247-25");      // true
validate("BR_CNPJ", "11.222.333/0001-81"); // true
validate("PT_NIF", "123456789");           // true (com checksum)
validate("MX_CURP", "GOMC850315HDFRRR07"); // true

format("BR_CPF", "52998224725");           // "529.982.247-25"
normalize("BR_CNPJ", "11.222.333/0001-81"); // "11222333000181"

const result = parse("BR_CNPJ", "11.222.333/0001-81");
if (result.ok) {
  console.log(result.normalized);          // "11222333000181"
  console.log(result.formatted);           // "11.222.333/0001-81"
  console.log(result.confidence);          // "high"
}
```

`parse()` retorna uma união discriminada — a API pública nunca lança exceções. Em caso de falha traz um `reason.kind` tipado:

```ts
const r = parse("BR_CPF", "");
if (!r.ok) r.reason.kind; // "empty" | "too_short" | "too_long" | "invalid_format" | "invalid_checksum"
```

## Playground ao vivo

Teste todos os países e helpers sem instalar nada: **https://lu1tr0n.github.io/nationid_example/**

O playground cobre:

- ✅ `validate / parse / format / normalize` para os 34 países
- 🎯 `extract` (data de nascimento, sexo, região) quando o documento codifica
- 🔒 `pii` mascaramento + hash SHA-256 para exibição e armazenamento seguros
- 🌍 `i18n` mensagens de erro em `es`, `en`, `pt`
- 📚 `catalog` — metadados de documentos consultáveis para dropdowns
- 6 exemplos prontos para produção (formulários React, validação server-side, KYC, etc.)

Código-fonte do showcase: https://github.com/lu1tr0n/nationid_example

## Imports tree-shakable por subpath

Um único país, ~3-5 KB gzip:

```ts
import { validate } from "nationid/br";
validate("CPF", "52998224725");
validate("CNPJ", "11222333000181");
```

Primitivas de algoritmos:

```ts
import { luhnValid, mod11WeightedSum } from "nationid/algorithms";
```

## Helpers DX — extract / pii / i18n / catalog

Quatro módulos tree-shakable para necessidades comuns (disponíveis desde v0.3):

```ts
// Extrair dados estruturados de documentos válidos
import { extractDOB, extractSex, extractRegion } from "nationid/extract";
extractDOB("MX_CURP", "GOMC850315HDFRRR07");  // { year: 1985, month: 3, day: 15 }
extractSex("AR_CUIT", "20-12345678-3");        // "M"

// Mascarar + hash para exibição e armazenamento seguros
import { mask, hash, lastN } from "nationid/pii";
mask("BR_CPF", "12345678901");                          // "***.***.**9-01"
await hash("BR_CPF", "12345678901", { salt: "tenant" }); // SHA-256 em hex

// Mensagens de erro localizadas (es, en, pt)
import { getErrorMessage } from "nationid/i18n";
getErrorMessage({ kind: "too_short" }, "pt", "CPF");  // "O CPF é muito curto."

// Catálogo de documentos com nomes localizados — para dropdowns
import { listDocuments } from "nationid/catalog";
listDocuments("BR", "pt");
// [{ code: "BR_CPF", displayName: "CPF",
//    longName: "Cadastro de Pessoas Físicas",
//    purpose: "identity", confidence: "high", ... }, ...]

// Catálogo de países (v1.1) — nomes + bandeiras para os 34 países.
// Usa Intl.DisplayNames (CLDR), portanto qualquer locale do runtime funciona.
import { getCountryInfo, listCountries, flagEmoji } from "nationid/catalog";
getCountryInfo("BR", "pt");
// { code: "BR", alpha3: "BRA", name: "Brasil", flag: "🇧🇷" }
flagEmoji("MX");          // "🇲🇽"
listCountries("pt").length; // 34
```

Cada subpath é tree-shakable de forma independente. Locales soltos (`nationid/i18n/es`, `/en`, `/pt`) pesam menos de 200 B cada.

## Cobertura (34 países)

| País | Pessoal | Fiscal |
|------|---------|--------|
| 🇸🇻 El Salvador | DUI | NIT |
| 🇲🇽 México | CURP, Clave de Elector | RFC (PF + PM) |
| 🇨🇴 Colômbia | CC, CE, TI, Passaporte, PEP, PPT | NIT |
| 🇧🇷 Brasil | CPF, CNH, Título de Eleitor | CNPJ, PIS |
| 🇵🇪 Peru | DNI, CE | RUC |
| 🇦🇷 Argentina | DNI, CUIL | CUIT, CDI |
| 🇨🇱 Chile | RUT/RUN | RUT/RUN |
| 🇩🇴 Rep. Dominicana | Cédula | RNC |
| 🇬🇹 Guatemala | DPI | NIT |
| 🇭🇳 Honduras | DNI | RTN |
| 🇨🇷 Costa Rica | Cédula física, DIMEX | Cédula jurídica |
| 🇪🇸 Espanha | DNI, NIE | NIF (CIF), NUSS |
| 🇺🇸 Estados Unidos | SSN, ITIN | EIN |
| 🇧🇴 Bolívia | CI | NIT |
| 🇪🇨 Equador | Cédula | RUC |
| 🇵🇾 Paraguai | CI | RUC |
| 🇳🇮 Nicarágua | Cédula | RUC |
| 🇵🇦 Panamá | Cédula | RUC |
| 🇺🇾 Uruguai | CI | RUT |
| 🇨🇦 Canadá | SIN | BN |
| 🇵🇹 Portugal | CC | NIF |
| 🇻🇪 Venezuela | Cédula | RIF |
| 🇬🇧 Reino Unido | NINO, NHS Number | UTR, VAT |
| 🇫🇷 França | NIR | SIREN, SIRET, TVA |
| 🇩🇪 Alemanha | Steuer-ID | Steuernummer, USt-IdNr |
| 🇮🇹 Itália | Codice Fiscale | Partita IVA |
| 🇳🇱 Países Baixos | BSN | BTW |
| 🇧🇪 Bélgica | NRN | BTW |
| 🇨🇭 Suíça | AHV | UID, MWST |
| 🇵🇱 Polônia | PESEL | NIP, REGON |
| 🇸🇪 Suécia | Personnummer | Organisationsnummer, Moms |
| 🇳🇴 Noruega | Fødselsnummer, D-nummer | Organisasjonsnummer, MVA |
| 🇩🇰 Dinamarca | CPR | CVR, Moms |
| 🇫🇮 Finlândia | HETU | Y-tunnus, ALV |

Documentação completa por país com algoritmos e fontes citadas em [`docs/countries/`](./docs/countries).

## Flag de confiança

Cada spec carrega um valor `confidence` que reflete o quão verificado está seu algoritmo:

- `high` — fonte oficial E biblioteca madura concordam (na v1.0, também exige cita first-party verificada pelo CI).
- `moderate` — uma fonte oficial OU biblioteca madura concorda; a outra está ausente.
- `low` — apenas community / engenharia reversa. Validação só de formato.
- `unconfirmed` — nenhum algoritmo verificado. Validação só de formato.

A UI pode optar por exibir um aviso quando um documento de baixa confiança valida apenas por formato.

## Usado por

`nationid` é usado em produção pelos seguintes SaaS operados pelo mantenedor:

- **[Marcly](https://marcly.com)** — agendamento e gestão de equipes para salões de beleza/unhas na LATAM. Usa `nationid` para captura de identidade de clientes e validação tributária da equipe em SV / GT / HN / MX / CR / DO.
- **[Emiso](https://panel.emiso.app)** — plataforma multi-tenant de notas fiscais eletrônicas para a América Central. Usa `nationid` para validação de DUI / NIT / RUC do receptor e mascaramento KYC.
- **[JustSV](https://dashboard.justenlinea.com)** — emissão DTE para varejo em El Salvador. Usa `nationid` para validação SV_DUI / SV_NIT e autopreenchimento de formulários.
- **[MH Reminder](https://github.com/lu1tr0n/mh-reminder)** — lembrete de prazos fiscais via WhatsApp para contribuintes salvadorenhos. Usa `nationid` para normalizar e validar NIT antes de agendar lembretes.

Se seu produto usa `nationid` e quer aparecer aqui, abra um PR adicionando uma entrada de uma linha acima.

## Comparação

| | nationid | validator.js | cpf-cnpj-validator | rut.js |
|---|---|---|---|---|
| Países LATAM | **22** | 6 | 1 | 1 |
| Países europeus | **12** | 8 | 0 | 0 |
| El Salvador | ✅ | ❌ | ❌ | ❌ |
| Guatemala | ✅ | ❌ | ❌ | ❌ |
| Honduras | ✅ | ❌ | ❌ | ❌ |
| Costa Rica | ✅ | ❌ | ❌ | ❌ |
| Tamanho bundle (1 país) | ~3-5 KB | ~40 KB full | ~5 KB | ~5 KB |
| Tipos TypeScript | First-class | Sim | Limitados | Limitados |
| Subpaths tree-shakable | ✅ | ❌ | N/A | N/A |
| Zero dependências | ✅ | ✅ | ✅ | ✅ |

## Roadmap

- **v0.1** — 13 países: SV, MX, CO, BR, PE, AR, CL, DO, GT, HN, CR, ES, US ✅
- **v0.2** — 8 códigos adicionais em países cobertos ✅
- **v0.3** — subpaths `extract` + `pii` + `i18n` + `catalog` ✅
- **v0.4** — 9 países novos: UY, VE, PA, EC, BO, PY, NI, CA, PT ✅
- **v0.5** — Família passaporte + algoritmo ICAO 9303 + BR_CNPJ alfanumérico + MX_NSS + correções do audit ✅
- **v0.6** — Europa principal: GB, FR, DE, IT, NL, BE, CH, PL, SE, NO, DK, FI ✅
- **v1.0** — API estabilizada. Cada spec com `confidence: "high"` respaldado por uma cita first-party (verificado no CI). Tarball -76%. Inferência com narrowing para `parse` / `getSpec` / `extract*`. ✅
- **v1.1+** — Ásia (IN, CN, JP, KR, SG, HK, TW + AU, NZ, ZA, IL), `@nationid/react` com `<DocumentInput>`, mais locales i18n, mutation testing, REGISTRY lazy para tree-shaking completo a partir do root.

## Contribuir

Veja [CONTRIBUTING.md](./CONTRIBUTING.md). PRs de novos países são bem-vindos — cada país adicionado deve incluir fontes oficiais citadas e um conjunto completo de fixtures de teste.

## Licença

MIT — veja [LICENSE](./LICENSE).
