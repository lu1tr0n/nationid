---
"nationid": minor
---

v0.4.0 — 9 new countries: Bolivia, Ecuador, Paraguay, Nicaragua, Panamá, Uruguay, Canadá, Portugal, Venezuela.

Total coverage: **22 countries × 58 document codes**, all with the same APIs (validate, format, normalize, parse, extract, pii, catalog, i18n).

### New countries and specs

| Country | Code | Type | Algorithm | Confidence |
|---------|------|------|-----------|------------|
| 🇧🇴 Bolivia | `BO_CI` | identity | format-only (length + departmental suffix) | moderate |
| 🇧🇴 Bolivia | `BO_NIT` | tax | format-only (7-13 digits) | low |
| 🇪🇨 Ecuador | `EC_CEDULA` | identity | Luhn-variant + provincia + 3rd-digit < 6 | high |
| 🇪🇨 Ecuador | `EC_RUC` | tax | mod-11 / Luhn (3 branches: natural / pública / jurídica) + establecimiento | high |
| 🇵🇾 Paraguay | `PY_CI` | identity | format-only (6-9 digits) | moderate |
| 🇵🇾 Paraguay | `PY_RUC` | tax | mod-11 ascending weights right-to-left (Ley 125/91) | moderate |
| 🇳🇮 Nicaragua | `NI_CEDULA` | identity | format-only (depto + DOB + correlative + DV letter) | low |
| 🇳🇮 Nicaragua | `NI_RUC` | tax | format-only (natural + jurídica shapes) | low |
| 🇵🇦 Panamá | `PA_CEDULA` | identity | format-only (provincial prefix) | moderate |
| 🇵🇦 Panamá | `PA_RUC` | tax | format-only | low |
| 🇺🇾 Uruguay | `UY_CI` | identity | mod-10 weighted DV | high |
| 🇺🇾 Uruguay | `UY_RUT` | tax | mod-11 right-to-left | moderate |
| 🇨🇦 Canada | `CA_SIN` | both | Luhn mod-10 (Service Canada) | high |
| 🇨🇦 Canada | `CA_BN` | tax | format-only (CRA does not publish DV) | low |
| 🇵🇹 Portugal | `PT_NIF` | tax | mod-11 weights `[9..2]` (Autoridade Tributária) | high |
| 🇵🇹 Portugal | `PT_CC` | identity | format-only (IRN does not publish full ISO/IEC 7064 verifier publicly) | low |
| 🇻🇪 Venezuela | `VE_CEDULA` | identity | format-only (V/E + 7-8 digits) | low |
| 🇻🇪 Venezuela | `VE_RIF` | tax | mod-11 with letter coefficient (V/E/J/P/G/C prefix) | moderate |

### New subpath imports

```ts
import { validate } from "nationid/uy"; validate("CI", "1.234.567-2");
import { validate } from "nationid/pt"; validate("NIF", "501964843");
import { validate } from "nationid/ca"; validate("SIN", "046-454-286");
// ...same pattern for /bo, /ec, /py, /ni, /pa, /ve
```

### Catalog + i18n integration

All 18 new specs ship with full localized metadata in the existing catalog (es, en, pt) — `listDocuments("UY", "es")`, `getDocumentInfo("CA_SIN", "en")`, etc. work out of the box. Spanish + Portuguese strings hand-written with correct orthography (tildes, ç, ã).

### Quality

- 5,050 tests passing (+546 from v0.3.0)
- Lint clean (178 files), typecheck clean, build clean
- All 9 new countries follow the established `DocumentSpec` contract
- Cross-validation: PT_NIF agrees with `validator.js isTaxID('pt-PT')` and `python-stdnum stdnum.pt.nif` on the algorithm; CA_SIN matches `validator.js isIdentityCard('en-CA')`
- Bundle size: full registry now 9.67 KB gzip (was 7.14 KB v0.3) — well under the 30 KB budget. Per-country bundles all under 3 KB

### Bugs caught against research

While implementing, agents caught and fixed three discrepancies in the original research file (corrected fixtures shipped, marked in country docs):

- **UY_CI**: research synthetic `1.234.567-3` did not satisfy the documented mod-10 algorithm (correct DV = 2). Library follows the algorithm and ships re-derived fixtures.
- **UY_RUT**: research weights ambiguous LTR/RTL — RTL chosen because it matches the synthetic in the research entry.
- **VE_RIF**: research synthetic `J-12345678-9` did not satisfy the documented mod-11 (correct DV = 4). Library follows the algorithm.

### Migration

No breaking changes. Existing v0.3.0 consumers keep working. The 9 new countries are additive — `listSupportedCodes()` simply returns 18 more codes.

For Marcly and similar SaaS that already wrap `COUNTRY_SPECS`: extending coverage to the new countries is a one-line change per country in the wrapper's `COUNTRY_SPECS` map.
