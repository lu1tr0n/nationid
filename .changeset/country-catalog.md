---
"nationid": minor
---

# Country catalog — names, flags, and ISO 3166-1 alpha-3

`nationid/catalog` now exposes four new helpers for country metadata,
complementing the existing document catalog (`getDocumentInfo`,
`listDocuments`, etc.). Non-breaking addition.

## API

```ts
import {
  getCountryInfo,
  listCountries,
  countryName,
  flagEmoji,
} from "nationid/catalog";

getCountryInfo("MX", "es");
// { code: "MX", alpha3: "MEX", name: "México", flag: "🇲🇽" }

listCountries("pt").length;   // 34
flagEmoji("BR");              // "🇧🇷"
countryName("DE", "fr");      // "Allemagne"
```

## Locale handling — any BCP 47 tag works

The country catalog uses `Intl.DisplayNames` (CLDR data shipped with the
runtime), so any locale the runtime supports works out of the box —
not just `es / en / pt` like the document catalog.

```ts
countryName("MX", "zh-CN"); // "墨西哥"
countryName("MX", "ja");    // "メキシコ"
countryName("MX", "ar");    // "المكسيك"
```

No new locale data is hand-maintained for country names. CLDR upstream
changes (Eswatini, North Macedonia, Czechia renames) are picked up
automatically when the runtime is upgraded.

## Why now

The country catalog was an obvious gap: consumers had access to
`CountryCode` (a 2-letter union of 34 codes) but no way to render
"México" or "🇲🇽" without maintaining their own table. Several downstream
projects (including this repo's own `nationid_example`) were
hand-rolling `COUNTRY_META` tables that drifted out of sync.

The library now ships:

- `code` — the existing ISO 3166-1 alpha-2 (unchanged).
- `alpha3` — ISO 3166-1 alpha-3 (`"MEX"`, `"BRA"`), useful for ICAO 9303
  passport workflows.
- `name` — localized via `Intl.DisplayNames` + CLDR.
- `flag` — emoji computed as a pure function of the alpha-2 code.

## Tests

25 new tests under `tests/catalog/countries.test.ts` cover flag emoji
composition, locale fallback, alpha-3 uniqueness, and coverage parity
with `listSupportedCountries()` from the root API.

Future minors may extend `CountryInfo` with optional fields (phone
prefix, currency, continent). Existing fields keep their semantics.
