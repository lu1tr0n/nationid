/**
 * Country catalog — locale-aware names and flag emojis for the 34 countries
 * shipped by `nationid`.
 *
 * Design notes:
 *
 *   - **Localized names use `Intl.DisplayNames` (CLDR data).** The runtime
 *     ships names for hundreds of locales, maintained by the Unicode
 *     Consortium. We do not hand-maintain `nameEs / nameEn / namePt` tables
 *     because that duplicates CLDR and ages badly (Eswatini, North Macedonia,
 *     Czechia renames have all been picked up by CLDR upstream).
 *
 *   - **Flag emoji is a pure function of the ISO 3166-1 alpha-2 code.** Each
 *     code letter maps to a Regional Indicator Symbol via a fixed offset
 *     (`0x1F1A5`). No data file needed.
 *
 *   - **`alpha3` is the only hand-maintained field** (ISO 3166-1 alpha-3),
 *     plus a parity-check 34-entry table to keep this module honest with the
 *     {@link CountryCode} union.
 *
 *   - **Locale parameter accepts any BCP 47 tag.** Unlike the document
 *     catalog (which hand-maintains `es/en/pt`), country names work for
 *     every locale the runtime supports — `"fr"`, `"de"`, `"zh-CN"`, `"ja"`,
 *     `"ar"`, etc.
 *
 * @packageDocumentation
 */

import type { CountryCode } from "../core/types.ts";
import type { CountryInfo } from "./types.ts";

/**
 * Default locale when none is provided. Matches the document catalog.
 */
const DEFAULT_LOCALE = "en";

/**
 * ISO 3166-1 alpha-3 codes for each supported country. Hand-maintained — the
 * coverage test asserts this map matches the `CountryCode` union exactly.
 *
 * Source: ISO 3166-1 (https://www.iso.org/iso-3166-country-codes.html). The
 * alpha-3 form is what ICAO 9303 MRZ encodes, so the value is useful for
 * passport workflows in addition to display.
 */
const COUNTRY_ALPHA3: Readonly<Record<CountryCode, string>> = {
  // LATAM (v0.1 + v0.4)
  SV: "SLV",
  MX: "MEX",
  CO: "COL",
  BR: "BRA",
  PE: "PER",
  AR: "ARG",
  CL: "CHL",
  DO: "DOM",
  GT: "GTM",
  HN: "HND",
  CR: "CRI",
  BO: "BOL",
  EC: "ECU",
  PY: "PRY",
  NI: "NIC",
  PA: "PAN",
  UY: "URY",
  VE: "VEN",
  // North America (v0.1 + v0.4)
  US: "USA",
  CA: "CAN",
  // Iberia (v0.1 + v0.4)
  ES: "ESP",
  PT: "PRT",
  // Europe principal (v0.6)
  GB: "GBR",
  FR: "FRA",
  DE: "DEU",
  IT: "ITA",
  NL: "NLD",
  BE: "BEL",
  CH: "CHE",
  PL: "POL",
  SE: "SWE",
  NO: "NOR",
  DK: "DNK",
  FI: "FIN",
  // Asia phase 1 (v1.2.0)
  IN: "IND",
};

/**
 * Offset between an ASCII uppercase letter and its Regional Indicator Symbol
 * code point. `'A'` (`0x41`) + `0x1F1A5` = `🇦` (`0x1F1E6`). Same for every
 * letter, so flag emojis are deterministic from any ISO 3166-1 alpha-2 code.
 */
const REGIONAL_INDICATOR_OFFSET = 0x1f1a5;

/**
 * Returns the flag emoji for a country code.
 *
 * Pure function — no data table, no I/O. Works for any ISO 3166-1 alpha-2
 * code, not just the 34 supported here, so callers can pass e.g. `"JP"` and
 * still get `"🇯🇵"` even though `JP` is not in {@link CountryCode} yet.
 *
 * @param code - ISO 3166-1 alpha-2 code (2 uppercase ASCII letters).
 * @returns The flag emoji as a string (composed of two regional indicator
 *   symbols, 8 bytes UTF-8 / 4 chars UTF-16).
 * @example
 * ```ts
 * import { flagEmoji } from "nationid/catalog";
 *
 * flagEmoji("MX"); // "🇲🇽"
 * flagEmoji("BR"); // "🇧🇷"
 * flagEmoji("GB"); // "🇬🇧"
 * ```
 */
export function flagEmoji(code: string): string {
  if (code.length !== 2) {
    throw new Error(`flagEmoji: expected a 2-letter ISO 3166-1 alpha-2 code, got "${code}"`);
  }
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    upper.charCodeAt(0) + REGIONAL_INDICATOR_OFFSET,
    upper.charCodeAt(1) + REGIONAL_INDICATOR_OFFSET,
  );
}

/**
 * Cache of `Intl.DisplayNames` instances by locale. Reused across calls so
 * we are not paying construction cost on every `getCountryInfo` invocation.
 *
 * Eviction is intentionally absent — locales are a small finite set in
 * practice and the instances are small.
 */
const displayNamesCache = new Map<string, Intl.DisplayNames>();

function regionDisplayNames(locale: string): Intl.DisplayNames {
  let cached = displayNamesCache.get(locale);
  if (cached === undefined) {
    cached = new Intl.DisplayNames([locale], { type: "region" });
    displayNamesCache.set(locale, cached);
  }
  return cached;
}

/**
 * Resolves the localized country name for `code`.
 *
 * Falls back to the ISO code itself if the runtime cannot resolve the name
 * (e.g. an extremely minimal Node distribution with no ICU). This keeps the
 * library usable even on legacy runtimes — names just look like `"MX"` until
 * the runtime is upgraded.
 *
 * @param code - ISO 3166-1 alpha-2 code.
 * @param locale - Any BCP 47 language tag (default `"en"`).
 * @returns The country name in the requested locale, or the ISO code as fallback.
 * @example
 * ```ts
 * import { countryName } from "nationid/catalog";
 *
 * countryName("MX", "es");    // "México"
 * countryName("MX", "fr");    // "Mexique"
 * countryName("MX", "zh-CN"); // "墨西哥"
 * ```
 */
export function countryName(code: string, locale: string = DEFAULT_LOCALE): string {
  const resolved = regionDisplayNames(locale).of(code.toUpperCase());
  return resolved ?? code.toUpperCase();
}

/**
 * Returns the localized {@link CountryInfo} for `code`.
 *
 * Resolves the country name via {@link Intl.DisplayNames} (CLDR data shipped
 * with the runtime) and computes the flag emoji from the ISO code. The
 * `alpha3` field comes from a hand-maintained ISO 3166-1 alpha-3 table.
 *
 * @param code - One of the 34 supported {@link CountryCode} values.
 * @param locale - Any BCP 47 language tag (default `"en"`). Unsupported
 *   locales fall back to whatever the runtime's `Intl.DisplayNames` picks.
 * @returns A {@link CountryInfo} object. Always defined for valid
 *   {@link CountryCode} inputs since the alpha-3 table covers them all.
 * @example
 * ```ts
 * import { getCountryInfo } from "nationid/catalog";
 *
 * getCountryInfo("MX", "es");
 * // { code: "MX", alpha3: "MEX", name: "México", flag: "🇲🇽" }
 *
 * getCountryInfo("BR", "pt");
 * // { code: "BR", alpha3: "BRA", name: "Brasil", flag: "🇧🇷" }
 *
 * getCountryInfo("GB"); // default locale "en"
 * // { code: "GB", alpha3: "GBR", name: "United Kingdom", flag: "🇬🇧" }
 * ```
 */
export function getCountryInfo(code: CountryCode, locale: string = DEFAULT_LOCALE): CountryInfo {
  return {
    code,
    alpha3: COUNTRY_ALPHA3[code],
    name: countryName(code, locale),
    flag: flagEmoji(code),
  };
}

/**
 * Lists every supported country with localized names and flag emojis.
 *
 * Ordering is stable across patch releases — countries are returned in the
 * order they were added to the library (matches v0.1 → v0.4 → v0.6
 * waves), not alphabetically. UIs that want alphabetical sorting can sort
 * the result by `name` in their locale.
 *
 * @param locale - Any BCP 47 language tag (default `"en"`).
 * @returns Read-only array of {@link CountryInfo}, one per supported country.
 * @example
 * ```ts
 * import { listCountries } from "nationid/catalog";
 *
 * listCountries("es");
 * // [
 * //   { code: "SV", alpha3: "SLV", name: "El Salvador", flag: "🇸🇻" },
 * //   { code: "MX", alpha3: "MEX", name: "México", flag: "🇲🇽" },
 * //   …
 * // ]
 *
 * // Alphabetical:
 * listCountries("es").toSorted((a, b) => a.name.localeCompare(b.name, "es"));
 * ```
 */
export function listCountries(locale: string = DEFAULT_LOCALE): readonly CountryInfo[] {
  const codes = Object.keys(COUNTRY_ALPHA3) as CountryCode[];
  return codes.map((code) => getCountryInfo(code, locale));
}
