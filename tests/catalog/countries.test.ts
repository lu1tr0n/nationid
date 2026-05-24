/**
 * Tests for the country catalog (`nationid/catalog` country helpers).
 *
 * Three things to pin:
 *
 *   1. The hand-maintained ALPHA3 table matches the `CountryCode` union
 *      exactly (no missing entries, no orphan entries).
 *   2. `flagEmoji` is a pure function of the ISO code — same code, same
 *      bytes — and produces the correct Regional Indicator pair.
 *   3. `Intl.DisplayNames` returns sensible localized names across `es`,
 *      `en`, `pt`, and a non-bundled locale (`fr`) to confirm CLDR
 *      coverage extends beyond the document catalog's hand-maintained set.
 */

import { describe, expect, it } from "vitest";

import {
  countryName,
  flagEmoji,
  getCountryInfo,
  listCountries,
} from "../../src/catalog/countries.ts";
import { listSupportedCountries } from "../../src/index.ts";

/**
 * Hand-listed expected ISO 3166-1 alpha-3 values for every supported
 * country. Authoritative for the parity test — a coding mistake in
 * `COUNTRY_ALPHA3` shows up here as a value mismatch.
 */
const EXPECTED_ALPHA3: ReadonlyArray<readonly [string, string]> = [
  ["SV", "SLV"],
  ["MX", "MEX"],
  ["CO", "COL"],
  ["BR", "BRA"],
  ["PE", "PER"],
  ["AR", "ARG"],
  ["CL", "CHL"],
  ["DO", "DOM"],
  ["GT", "GTM"],
  ["HN", "HND"],
  ["CR", "CRI"],
  ["BO", "BOL"],
  ["EC", "ECU"],
  ["PY", "PRY"],
  ["NI", "NIC"],
  ["PA", "PAN"],
  ["UY", "URY"],
  ["VE", "VEN"],
  ["US", "USA"],
  ["CA", "CAN"],
  ["ES", "ESP"],
  ["PT", "PRT"],
  ["GB", "GBR"],
  ["FR", "FRA"],
  ["DE", "DEU"],
  ["IT", "ITA"],
  ["NL", "NLD"],
  ["BE", "BEL"],
  ["CH", "CHE"],
  ["PL", "POL"],
  ["SE", "SWE"],
  ["NO", "NOR"],
  ["DK", "DNK"],
  ["FI", "FIN"],
  ["IN", "IND"],
  // v2.1.0 — Asia phase 2: Japan
  ["JP", "JPN"],
  // v1.7.0 — EU-VAT complete
  ["IE", "IRL"],
  ["AT", "AUT"],
  ["LU", "LUX"],
  ["GR", "GRC"],
  ["CZ", "CZE"],
  ["HU", "HUN"],
  ["RO", "ROU"],
  ["BG", "BGR"],
  ["HR", "HRV"],
  ["SK", "SVK"],
  ["SI", "SVN"],
  ["LT", "LTU"],
  ["LV", "LVA"],
  ["EE", "EST"],
  ["MT", "MLT"],
  ["CY", "CYP"],
  ["IS", "ISL"],
];

describe("flagEmoji — Regional Indicator Symbol composition", () => {
  it("MX → 🇲🇽", () => {
    expect(flagEmoji("MX")).toBe("🇲🇽");
  });

  it("BR → 🇧🇷", () => {
    expect(flagEmoji("BR")).toBe("🇧🇷");
  });

  it("GB → 🇬🇧", () => {
    expect(flagEmoji("GB")).toBe("🇬🇧");
  });

  it("US → 🇺🇸", () => {
    expect(flagEmoji("US")).toBe("🇺🇸");
  });

  it("accepts lowercase and normalizes to uppercase", () => {
    expect(flagEmoji("mx")).toBe("🇲🇽");
  });

  it("works for non-supported ISO codes (pure function)", () => {
    // JP is not in CountryCode yet but the function must still produce the
    // flag — that's how downstream consumers can use this for non-nationid
    // workflows.
    expect(flagEmoji("JP")).toBe("🇯🇵");
    expect(flagEmoji("AU")).toBe("🇦🇺");
  });

  it("throws on non-2-letter input", () => {
    expect(() => flagEmoji("USA")).toThrow(/2-letter ISO/);
    expect(() => flagEmoji("M")).toThrow(/2-letter ISO/);
    expect(() => flagEmoji("")).toThrow(/2-letter ISO/);
  });

  it("flag emoji is exactly 4 UTF-16 code units (2 surrogate pairs)", () => {
    expect(flagEmoji("MX").length).toBe(4);
  });
});

describe("countryName — Intl.DisplayNames wrapper", () => {
  it("MX in es → México", () => {
    expect(countryName("MX", "es")).toBe("México");
  });

  it("MX in en → Mexico", () => {
    expect(countryName("MX", "en")).toBe("Mexico");
  });

  it("BR in pt → Brasil", () => {
    expect(countryName("BR", "pt")).toBe("Brasil");
  });

  it("GB in en → United Kingdom", () => {
    expect(countryName("GB", "en")).toBe("United Kingdom");
  });

  it("never returns undefined for valid-shape input", () => {
    // The wrapper guarantees a string return — Intl.DisplayNames returns
    // a CLDR label for reserved codes like "ZZ" ("Unknown Region"), but
    // on minimal-ICU Node builds it could return undefined. The fallback
    // (uppercased code) guards that path.
    expect(typeof countryName("ZZ", "en")).toBe("string");
    expect(countryName("ZZ", "en").length).toBeGreaterThan(0);
  });

  it("default locale is en when not specified", () => {
    expect(countryName("MX")).toBe(countryName("MX", "en"));
  });

  it("works for runtime locales beyond es/en/pt", () => {
    // Confirms that we are not artificially limited to the document
    // catalog's three locales. CLDR coverage is much wider.
    expect(countryName("MX", "fr")).toBe("Mexique");
    expect(countryName("DE", "de")).toBe("Deutschland");
  });
});

describe("getCountryInfo — full record per country", () => {
  it("returns code, alpha3, name, flag for MX in es", () => {
    expect(getCountryInfo("MX", "es")).toEqual({
      code: "MX",
      alpha3: "MEX",
      name: "México",
      flag: "🇲🇽",
    });
  });

  it("returns code, alpha3, name, flag for BR in pt", () => {
    expect(getCountryInfo("BR", "pt")).toEqual({
      code: "BR",
      alpha3: "BRA",
      name: "Brasil",
      flag: "🇧🇷",
    });
  });

  it("defaults to en when locale omitted", () => {
    expect(getCountryInfo("GB")).toEqual({
      code: "GB",
      alpha3: "GBR",
      name: "United Kingdom",
      flag: "🇬🇧",
    });
  });
});

describe("listCountries — every supported country", () => {
  it("returns one entry per supported country", () => {
    const list = listCountries("en");
    expect(list).toHaveLength(EXPECTED_ALPHA3.length);
  });

  it("every entry has all 4 fields populated and non-empty", () => {
    for (const entry of listCountries("en")) {
      expect(entry.code).toMatch(/^[A-Z]{2}$/);
      expect(entry.alpha3).toMatch(/^[A-Z]{3}$/);
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.flag.length).toBe(4);
    }
  });

  it("locale affects name field but not code/alpha3/flag", () => {
    const en = new Map(listCountries("en").map((c) => [c.code, c]));
    const es = new Map(listCountries("es").map((c) => [c.code, c]));
    for (const [code, info] of en) {
      const esInfo = es.get(code);
      expect(esInfo?.code).toBe(info.code);
      expect(esInfo?.alpha3).toBe(info.alpha3);
      expect(esInfo?.flag).toBe(info.flag);
      // name may or may not differ depending on the country
    }
  });
});

describe("coverage — every CountryCode has an entry", () => {
  it("ALPHA3 map matches listSupportedCountries() exactly", () => {
    const supported = [...listSupportedCountries()].sort();
    const cataloged = listCountries("en")
      .map((c) => c.code)
      .toSorted();
    expect(cataloged).toEqual(supported);
  });

  it("EXPECTED_ALPHA3 fixture matches the source ALPHA3 map exactly", () => {
    const fromCatalog = listCountries("en").map((c) => [c.code, c.alpha3] as const);
    expect(fromCatalog.toSorted()).toEqual([...EXPECTED_ALPHA3].toSorted());
  });

  it("every alpha-3 is unique (no duplicates)", () => {
    const codes = listCountries("en").map((c) => c.alpha3);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("every flag emoji is unique (no duplicates)", () => {
    const flags = listCountries("en").map((c) => c.flag);
    expect(new Set(flags).size).toBe(flags.length);
  });
});
