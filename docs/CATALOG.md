# Catalog Sub-feature

## Why this exists

`nationid` ships stable machine codes (`MX_CURP`, `CO_CC`, …) but UIs need
human-friendly labels in the user's language. Hard-coding strings like `"CURP"`
or `"Cédula de Ciudadanía"` in every consuming app duplicates work and breaks
when locales drift. The catalog centralizes that metadata so a "select your
document" dropdown can be built in one line:

```ts
import { listDocuments } from "nationid/catalog";

const options = listDocuments("CO", "es");
// [{ code: "CO_CC", displayName: "Cédula de Ciudadanía", … }, …]
```

## Public API

```ts
import {
  listDocuments,
  getDocumentInfo,
  listDocumentsByPurpose,
  type DocumentInfo,
  type DocumentPurpose,
  type Locale,
} from "nationid/catalog";
```

### `listDocuments(country, locale = "en"): readonly DocumentInfo[]`

Returns all registered documents for a given country, in the requested locale.

### `getDocumentInfo(code, locale = "en"): DocumentInfo | null`

Returns one document's catalog entry. `null` if the code is not registered
(useful when a stored `DocumentTypeCode` was widened to `string` in transit).

### `listDocumentsByPurpose(purpose, locale = "en"): readonly DocumentInfo[]`

Filters across all countries by `DocumentPurpose`. Use this for global
"all tax IDs" or "all voter documents" pickers.

### `DocumentInfo` shape

| Field         | Type              | Source                                     |
| ------------- | ----------------- | ------------------------------------------ |
| `code`        | `DocumentTypeCode`| Stable code from `core/types.ts`           |
| `country`     | `CountryCode`     | Derived from `getSpec(code).country`       |
| `displayName` | `string`          | Locale data — short native acronym         |
| `longName`    | `string`          | Locale data — full official name           |
| `knownAs`     | `readonly string[]` | Common data — colloquial aliases         |
| `description` | `string`          | Locale data — one-sentence description     |
| `purpose`     | `DocumentPurpose` | Common data — `identity` / `tax` / `voter` / `social_security` / `migratory` / `driver_license` |
| `confidence`  | `Confidence`      | Derived from `getSpec(code).confidence`    |

## Per-locale coverage (v0.3)

| Locale | Coverage |
| ------ | -------- |
| `es`   | 100% — every registered `DocumentTypeCode` |
| `en`   | 100% — every registered `DocumentTypeCode` |
| `pt`   | 100% — every registered `DocumentTypeCode` |

Coverage is enforced by `tests/catalog/listing.test.ts` (drift guard).

## How to add a new locale

This is the path forward for the v0.5 EU expansion. Steps:

1. Extend the `Locale` union in `src/catalog/types.ts`.
2. Create `src/catalog/data/<locale>.ts` exporting a
   `Record<DocumentTypeCode, LocaleStrings>`. TypeScript will fail the build
   until every code is covered.
3. Wire the new table into the `LOCALE_TABLES` map in
   `src/catalog/index.ts`.
4. Run `pnpm test tests/catalog` — the coverage test will assert the new
   locale resolves for every registered code.

The `Record<DocumentTypeCode, LocaleStrings>` shape is the locking
mechanism — any spec missing a translation is a type error.

## Marcly-style usage

```ts
import { listDocuments, type Locale } from "nationid/catalog";

function buildDropdown(country: "SV" | "MX" | "CO", locale: Locale) {
  return listDocuments(country, locale).map((d) => ({
    value: d.code,
    label: d.displayName,
    hint: d.description,
    aliases: d.knownAs,
  }));
}

// React example: render a localized <select>
<select>
  {buildDropdown("MX", userLocale).map((o) => (
    <option key={o.value} value={o.value} title={o.hint}>
      {o.label}
    </option>
  ))}
</select>
```

## Implementation layout

- `src/catalog/types.ts` — public types (`Locale`, `DocumentInfo`, `DocumentPurpose`).
- `src/catalog/data/common.ts` — locale-agnostic data (`purpose`, `knownAs`).
- `src/catalog/data/<locale>.ts` — one file per locale with localized strings.
- `src/catalog/index.ts` — public API, merges common + locale strings on demand.
- `tests/catalog/listing.test.ts` — coverage and orthography guards.
