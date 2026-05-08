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
});

describe("dist — country subpath", () => {
  it("exports country-scoped API from `nationid/sv`", async () => {
    const mod = await import("nationid/sv");
    expect(typeof mod.validate).toBe("function");
    expect(mod.validate("DUI", "045678903")).toBe(true);
    expect(mod.validate("NIT", "06141505851015")).toBe(true);
  });
});

describe("dist — algorithms subpath", () => {
  it("exports algorithm primitives from `nationid/algorithms`", async () => {
    const { luhnValid, mod11WeightedSum } = await import("nationid/algorithms");
    expect(luhnValid("79927398713")).toBe(true);
    expect(typeof mod11WeightedSum).toBe("function");
  });
});
