---
"nationid": minor
---

v0.3.0 — Developer Experience release.

Four new tree-shakable subpath modules for using `nationid` in real apps without writing glue code: extract, pii, i18n, and catalog.

### `nationid/extract`

Pull structured data out of valid identity documents that **encode** it.

```ts
import { extractDOB, extractSex, extractRegion } from "nationid/extract";

extractDOB("MX_CURP", "GOMC850315HDFRRR07");  // { year: 1985, month: 3, day: 15 }
extractSex("MX_CURP", "GOMC850315HDFRRR07");  // "M"
extractRegion("MX_CURP", "GOMC850315HDFRRR07"); // { code: "DF", kind: "state" }
extractSex("AR_CUIT", "20-12345678-3");        // "M" (prefix 20)
extractRegion("GT_DPI", "1234567890101");       // { code: "01", kind: "department" }
```

Supports MX_CURP (DOB+sex+state), MX_RFC_PF (DOB), AR_CUIT/CUIL/CDI (sex), GT_DPI (department), PE_RUC (taxpayer type). Returns `null` for codes that don't structurally encode the requested kind.

### `nationid/pii`

Mask documents for safe display + hash for safe storage.

```ts
import { mask, hash, lastN } from "nationid/pii";

mask("MX_CURP", "GOMC850315HDFRRR07");  // "**************RR07"
mask("BR_CPF", "12345678901");           // "***.***.**9-01"
mask("BR_CNPJ", "12345678000190");       // "**.***.***/**01-90"

await hash("BR_CPF", "12345678901", { salt: "tenant-42" });  // hex SHA-256
lastN("BR_CPF", "12345678901", 4);                            // "8901"
```

Hash uses the Web Crypto API (Node 20+, Deno, Bun, browsers, edge runtimes — zero-dep). `mask` reveals the last `n = min(4, ⌊len/3⌋)` chars per spec, preserving separators.

### `nationid/i18n`

Localized error messages in Spanish, English, and Portuguese. Each locale ships as its own subpath for surgical bundling.

```ts
import { getErrorMessage } from "nationid/i18n";

getErrorMessage({ kind: "too_short" }, "es", "DUI");
// "El DUI es demasiado corto."

getErrorMessage({ kind: "invalid_checksum" }, "pt", "CPF");
// "O CPF não é válido (dígito verificador incorreto)."

// Bundle only one locale:
import { errors } from "nationid/i18n/es";  // ~200 bytes
```

### `nationid/catalog`

Queryable document catalog for building UIs. Exposes localized `displayName`, `longName`, `knownAs` aliases, `description`, `purpose`, and `confidence` per spec.

```ts
import { listDocuments, getDocumentInfo, listDocumentsByPurpose } from "nationid/catalog";

listDocuments("MX", "es");
// [{ code: "MX_CURP", displayName: "CURP",
//    longName: "Clave Única de Registro de Población",
//    description: "Identificador personal único para residentes mexicanos.",
//    knownAs: ["CURP"], purpose: "identity", confidence: "high" }, ...]

getDocumentInfo("ES_NUSS", "en");
// { code: "ES_NUSS", displayName: "NUSS",
//   longName: "Spanish Social Security Number",
//   description: "Spanish social security affiliation number.",
//   purpose: "social_security", confidence: "high", ... }

listDocumentsByPurpose("tax", "es");
// every tax doc across the 13 countries — useful for global tax-ID dropdowns
```

Coverage: all 42 codes × 3 locales (`es`, `en`, `pt`) = 126 hand-curated entries. Drift-guarded by tests so every registered spec must have a catalog entry.

### Quality

- 4,504 tests passing (+331 from v0.2.0)
- Spanish + Portuguese strings reviewed for orthography (tildes, ñ, ç, ã)
- Cross-validated extraction rules against RENAPO (CURP), AFIP/ARCA (CUIT/CUIL/CDI), SUNAT (RUC)
- Bundle budgets: i18n locale < 200 B; extract/pii ≤ 10 KB (each pulls full registry for `getSpec`); catalog ~11 KB (all locales bundled)
- All four subpaths are independently tree-shakable; the core `nationid` package is unchanged in size

### Migration

No breaking changes. Existing consumers of `nationid` (validate/format/parse) keep working. The four new features are opt-in via subpath imports.
