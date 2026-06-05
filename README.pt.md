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

`nationid` preenche essa lacuna. A partir da v2.2 traz **54 países com ~145 códigos de documento**, todos com algoritmos documentados de fontes oficiais — e promete estabilidade de API mais um teste de governança no CI que exige que cada spec com `confidence: "high"` cite uma fonte de primeira mão do emissor.

## Novidades na v2.2

- 🇸🇬 **Singapura** — segundo país da Ásia fase 2. Três novos specs sob `nationid/sg`: `SG_NRIC` (número de identidade de 9 caracteres para cidadãos e residentes permanentes, letra de verificação mod-11 ponderada, ICA) e `SG_FIN` (número de identidade de 9 caracteres para estrangeiros, incluindo a série M de 2022, ICA/MOM), ambos `personal`; e `SG_UEN` (Número Único de Entidade, três formatos por categoria, cada um com sua própria letra de verificação, ACRA), `tax`. Os três em `confidence: "high"`.
- **Letras de verificação do UEN** — `SG_UEN` passa de validação apenas de formato para validação completa da letra de verificação nas três categorias (Negócio, Empresa Local, Outra Entidade), com a lista branca de 38 códigos de tipo de entidade. As constantes vêm literalmente de `python-stdnum/stdnum/sg/uen.py`; os quatro fixtures de doctest (`00192200M`, `197401143C`, `S16FC0121D`, `T01FC6132D`) ancoram a suíte, junto com os UEN reais de categoria B `196800306E` (DBS) e `199201624D` (Singtel).
- **Tests de oracle-agreement** — cada spec SG roda um property test contra uma reimplementação independente do algoritmo publicado (NRIC/FIN mod-11 ponderado, mais as três categorias do UEN). Todas as URLs oficiais de Singapura estão em hosts `*.gov.sg`, então o teste de governança passa sem alterar a lista de hosts.

## Novidades na v2.1 (2026-05-24)

- 🇯🇵 **Japão** — primeiro país da Ásia fase 2. Dois novos specs sob `nationid/jp`: `JP_MY_NUMBER` (Número Individual de 12 dígitos, mod-11 ponderado, Portaria MIC 85/2014) e `JP_CORPORATE_NUMBER` (Número Corporativo de 13 dígitos, mod-9 ponderado, NTA). Ambos em `confidence: "high"`. O número corporativo `7000012050002` da própria NTA é verificável no registro público e é usado como anchor canônico nos tests.
- **Tests de oracle-agreement** — cada spec JP roda um property test de 10k amostras contra um port inline de `python-stdnum/stdnum/jp/in_.py` (My Number) e `python-stdnum/stdnum/jp/cn.py` (Corporate Number). Cross-validação independente built-in no CI.
- 6970+ → 7000+ tests, 53 países × ~147 códigos.

## Novidades na v2.0 (2026-05-24)

- 🇪🇺 **EU-VAT completo** — 16 membros UE + 1 participante EEA enviam validadores de IVA em um release batched: `IE_VAT`, `AT_UID`, `LU_VAT`, `GR_VAT`, `CZ_DIC`, `HU_VAT`, `RO_VAT`, `BG_VAT`, `HR_OIB`, `SK_VAT`, `SI_VAT`, `LT_VAT`, `LV_VAT`, `EE_VAT`, `MT_VAT`, `CY_VAT`, `IS_VSK`. Desbloqueia **paridade EU VIES** como um único tagline.
- **Primitiva ISO/IEC 7064 MOD 11,10** — `mod11_10CheckDigit` + `mod11_10Valid` exportados de `nationid/algorithms`. Length-generic; usada por HR_OIB, DE_USTID, DE_STEUER_ID.
- **Tratamento do prefixo grego `EL`/`GR`** built-in — aceita ambos na entrada, normaliza para `EL` (forma canônica VIES). Fecha o #1 bug histórico de EU-VAT.
- **Toda URL em todo JSDoc v2.0+ verificada ao vivo** via `browser_fetch` (firefox133 TLS impersonation) antes do publish — corrige 5 URLs quebradas em India v1.2 e 3 em v2.0. Snapshots de `web.archive.org` aceitos como citação suplementar onde o cert do emissor bloqueia checks programáticos. Specs anteriores à v2.0 estão sendo back-filled ao mesmo padrão país por país como parte da auditoria arquitetônica pós-v2.1.

## Novidades na v1.2 (2026-05-23)

- 🇮🇳 **Suporte à Índia** — primeiro país da Ásia. Cinco specs novos sob `nationid/in`: `IN_AADHAAR` (Verhoeff + rejeição de palíndromos, UIDAI), `IN_VID` (alias de 16 dígitos para Aadhaar), `IN_PAN` (whitelist por tipo de entidade, Income Tax Department), `IN_GSTIN` (Luhn mod-36 + PAN embutido + código de estado, CBIC), `IN_EPIC` (somente formato, ECI).
- **Primitiva Verhoeff** — `verhoeffValid` e `verhoeffCheckDigit` exportados de `nationid/algorithms`. Tabelas canônicas D₅ + permutações tiradas literalmente de Verhoeff (1969).
- 6488 → 6606 tests, 35 países × ~125 códigos. Tarball 2,9 MB unpacked (+200 KB).

## Novidades na v1.1 (2026-05-22)

- **Catálogo de países sob `nationid/catalog`** — `getCountryInfo`, `listCountries`, `countryName`, `flagEmoji`. Usa `Intl.DisplayNames` (CLDR), portanto qualquer locale que o runtime suporte funciona out-of-the-box — não apenas `es / en / pt`.

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

- ✅ `validate / parse / format / normalize` para cada país suportado
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

// Catálogo de países (v1.1) — nomes + bandeiras para os 35 países.
// Usa Intl.DisplayNames (CLDR), portanto qualquer locale do runtime funciona.
import { getCountryInfo, listCountries, flagEmoji } from "nationid/catalog";
getCountryInfo("BR", "pt");
// { code: "BR", alpha3: "BRA", name: "Brasil", flag: "🇧🇷" }
flagEmoji("MX");          // "🇲🇽"
listCountries("pt").length; // 54
```

Cada subpath é tree-shakable de forma independente. Locales soltos (`nationid/i18n/es`, `/en`, `/pt`) pesam menos de 200 B cada.

## Cobertura (54 países)

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
| 🇮🇳 Índia *(v1.2)* | Aadhaar, VID, EPIC (eleitoral) | PAN, GSTIN |
| 🇯🇵 Japão *(v2.1)* | My Number | Corporate Number |
| 🇸🇬 Singapura *(v2.2)* | NRIC, FIN | UEN |
| 🇮🇪 Irlanda *(v2.0)* | — | IVA |
| 🇦🇹 Áustria *(v2.0)* | — | UID (USt-IdNr) |
| 🇱🇺 Luxemburgo *(v2.0)* | — | TVA |
| 🇬🇷 Grécia *(v2.0)* | — | IVA (AFM, prefixo VIES `EL`) |
| 🇨🇿 Chéquia *(v2.0)* | — | DIČ (pessoa jurídica) |
| 🇭🇺 Hungria *(v2.0)* | — | IVA (közösségi adószám) |
| 🇷🇴 Romênia *(v2.0)* | — | IVA (CUI / CIF) |
| 🇧🇬 Bulgária *(v2.0)* | — | IVA (pessoa jurídica) |
| 🇭🇷 Croácia *(v2.0)* | OIB | OIB |
| 🇸🇰 Eslováquia *(v2.0)* | — | IVA (IČ DPH) |
| 🇸🇮 Eslovênia *(v2.0)* | — | IVA (DDV) |
| 🇱🇹 Lituânia *(v2.0)* | — | IVA (PVM) |
| 🇱🇻 Letônia *(v2.0)* | — | IVA (PVN, pessoa jurídica high / pessoal moderate) |
| 🇪🇪 Estônia *(v2.0)* | — | IVA (KMKR) |
| 🇲🇹 Malta *(v2.0)* | — | IVA |
| 🇨🇾 Chipre *(v2.0)* | — | IVA |
| 🇮🇸 Islândia *(v2.0)* | — | VSK (somente formato, EEA sem VIES) |

Documentação completa por país com algoritmos e fontes citadas em [`docs/countries/`](./docs/countries).

## Flag de confiança

Cada spec carrega um valor `confidence` que reflete o quão verificado está seu algoritmo:

- `high` — fonte oficial E biblioteca madura concordam (na v1.0, também exige cita first-party verificada pelo CI).
- `moderate` — uma fonte oficial OU biblioteca madura concorda; a outra está ausente.
- `low` — apenas community / engenharia reversa. Validação só de formato.
- `unconfirmed` — nenhum algoritmo verificado. Validação só de formato.

A UI pode optar por exibir um aviso quando um documento de baixa confiança valida apenas por formato.

## Usado por

- **[Emiso](https://panel.emiso.app)** — plataforma multi-tenant de notas fiscais eletrônicas para a América Central. Usa `nationid` para validação de DUI / NIT / RUC do receptor e mascaramento KYC.

Se seu produto usa `nationid` e quer aparecer aqui, abra um PR adicionando uma entrada de uma linha acima.

## Comparação

| | nationid | validator.js | cpf-cnpj-validator | rut.js |
|---|---|---|---|---|
| Países LATAM | **22** | 6 | 1 | 1 |
| Países europeus | **31** (UE-27 VIES + UK/CH/NO/IS) | 8 | 0 | 0 |
| Cobertura EU-VIES IVA | **UE-27 completa** | parcial | 0 | 0 |
| Países da Ásia | **3** (IN, JP, SG; KR/TW seguem) | 0 | 0 | 0 |
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
- **v1.1** — Catálogo de países sob `nationid/catalog`: nomes + bandeiras + ISO alpha-3; qualquer locale BCP 47 via `Intl.DisplayNames`. ✅
- **v1.2** — Ásia fase 1: Índia (Aadhaar, VID, PAN, GSTIN, EPIC) + primitiva Verhoeff. ✅
- **v2.0** — EU-VAT completo: 16 membros UE + Islândia (EEA). Primitiva ISO/IEC 7064 MOD 11,10. Padrão de URL liveness audit. ✅
- **v2.1** — Ásia fase 2 — Japão (My Number + 法人番号). Algoritmos MIC + NTA cross-validados contra `python-stdnum`. ✅
- **v2.2** — Ásia fase 2 — Singapura (NRIC, FIN, UEN). Algoritmos ICA/ACRA, UEN cross-validado contra `python-stdnum/stdnum/sg/uen.py`. ✅
- **v2.3-v2.4** — Ásia fase 2 (research + verification completos): KR (RRN/BRN), TW (ID/Tax). Implementando em seguida.
- **v2.5** — Bálcãs via primitiva JMBG (RS/BA/MK/ME) + prefixo GB Northern Ireland `XI` + `BG_EGN` + `CZ_RC` (desbloqueia as ramificações 10-digit BG e full CZ DIC).
- **v2.x** — `@nationid/react` com `<DocumentInput>`, mais locales i18n, mutation testing (Stryker), REGISTRY lazy para tree-shaking completo a partir do root.

## Contribuir

Veja [CONTRIBUTING.md](./CONTRIBUTING.md). PRs de novos países são bem-vindos — cada país adicionado deve incluir fontes oficiais citadas e um conjunto completo de fixtures de teste.

## Licença

MIT — veja [LICENSE](./LICENSE).
