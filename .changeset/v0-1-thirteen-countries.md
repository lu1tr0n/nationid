---
"nationid": minor
---

Ship v0.1.0 — 13 countries with comprehensive document validation.

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
