---
"nationid": minor
---

v0.1.1 — 8 new document codes (driven by real LATAM SaaS demand).

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
import { validate } from 'nationid';
validate('MX_CLAVE_ELECTOR', '...');  // new
validate('BR_CNH', '...');             // new
```

Or via subpath:

```ts
import { validate } from 'nationid/mx';
validate('CLAVE_ELECTOR', '...');  // new short alias
validate('INE', '...');             // alternate alias
```

No breaking changes. v0.1.0 consumers (e.g. Marcly's `document-id` wrapper) automatically gain the new codes after `pnpm update`.

See `docs/countries/{br,mx,co,ar,es}.md` for per-spec algorithm references and
sources, and `docs/PROPERTY_TESTS.md` for the property-test invariants the new
specs satisfy.
