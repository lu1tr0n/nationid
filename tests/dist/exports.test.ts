/**
 * These tests run AGAINST THE BUILT OUTPUT via the package's `exports` map.
 *
 * They catch packaging bugs (broken exports, missing types, ESM/CJS interop)
 * that source-only tests would not.
 *
 * Run after `pnpm build`: `pnpm test:dist`.
 */

import { describe, expect, it } from "vitest";

describe("dist — root export", () => {
  it("exports the public API surface from `nationid`", async () => {
    const mod = await import("nationid");
    expect(typeof mod.validate).toBe("function");
    expect(typeof mod.format).toBe("function");
    expect(typeof mod.normalize).toBe("function");
    expect(typeof mod.parse).toBe("function");
    expect(typeof mod.getSpec).toBe("function");
    expect(typeof mod.listSupportedCodes).toBe("function");
    expect(typeof mod.listSupportedCountries).toBe("function");
  });

  it("validates SV_DUI through the root API", async () => {
    const { validate } = await import("nationid");
    expect(validate("SV_DUI", "045678903")).toBe(true);
    expect(validate("SV_DUI", "045678900")).toBe(false);
  });

  it("registers all 13 v0.1 countries via the dist registry", async () => {
    const { listSupportedCountries } = await import("nationid");
    const countries = listSupportedCountries();
    for (const cc of [
      "SV",
      "MX",
      "CO",
      "BR",
      "PE",
      "AR",
      "CL",
      "DO",
      "GT",
      "HN",
      "CR",
      "ES",
      "US",
    ] as const) {
      expect(countries, `country ${cc} missing from dist registry`).toContain(cc);
    }
  });
});

describe("dist — algorithms subpath", () => {
  it("exports algorithm primitives from `nationid/algorithms`", async () => {
    const { luhnValid, mod11WeightedSum } = await import("nationid/algorithms");
    expect(luhnValid("79927398713")).toBe(true);
    expect(typeof mod11WeightedSum).toBe("function");
  });
});

/**
 * Country subpath smoke tests — every shipped country must round-trip its
 * `validate` through the package's `exports` map.
 */
const COUNTRY_SUBPATH_FIXTURES = [
  { subpath: "nationid/sv", code: "DUI", input: "045678903" },
  { subpath: "nationid/br", code: "CPF", input: "52998224725" },
  { subpath: "nationid/ar", code: "DNI", input: "12345678" },
  { subpath: "nationid/cl", code: "RUT", input: "123456785" },
] as const;

describe("dist — country subpath smoke", () => {
  for (const { subpath, code, input } of COUNTRY_SUBPATH_FIXTURES) {
    it(`exports validate from \`${subpath}\` and accepts ${code}`, async () => {
      const mod = (await import(subpath)) as {
        validate: (c: string, v: string) => boolean;
      };
      expect(typeof mod.validate).toBe("function");
      expect(mod.validate(code, input)).toBe(true);
    });
  }
});

/**
 * Every country subpath must at least: load, expose `validate`, and expose its
 * country bundle. We don't validate fixtures here — that is the country test's
 * job — only that the package map and barrel are intact.
 */
const ALL_SUBPATHS = [
  "nationid/sv",
  "nationid/mx",
  "nationid/co",
  "nationid/br",
  "nationid/pe",
  "nationid/ar",
  "nationid/cl",
  "nationid/do",
  "nationid/gt",
  "nationid/hn",
  "nationid/cr",
  "nationid/es",
  "nationid/us",
] as const;

describe("dist — country subpath integrity", () => {
  for (const subpath of ALL_SUBPATHS) {
    it(`\`${subpath}\` loads and exposes validate + a Bundle export`, async () => {
      const mod = (await import(subpath)) as Record<string, unknown>;
      expect(typeof mod.validate).toBe("function");
      expect(typeof mod.format).toBe("function");
      expect(typeof mod.normalize).toBe("function");
      expect(typeof mod.parse).toBe("function");

      // Every country exports a `<cc>Bundle: CountryDocumentBundle`. Probe by
      // looking for any export key ending in "Bundle".
      const bundleKey = Object.keys(mod).find((k) => k.endsWith("Bundle"));
      expect(bundleKey, `${subpath} is missing a *Bundle export`).toBeDefined();
    });
  }
});
