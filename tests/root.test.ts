/**
 * Root API integration tests.
 *
 * These tests exercise the public API surface in `src/index.ts`, ensuring every
 * registered country bundle is reachable through the canonical
 * `validate / format / normalize / parse / getSpec` entry points.
 *
 * The goal is to catch registry wiring bugs (forgotten bundle import, missing
 * spec entry) that country-scoped tests by definition cannot.
 */

import { describe, expect, it } from "vitest";
import {
  type CountryCode,
  type DocumentTypeCode,
  format,
  getSpec,
  listSupportedCodes,
  listSupportedCountries,
  normalize,
  parse,
  validate,
} from "../src/index.ts";

/** All countries shipped in v0.1.0. Edit when adding a new country. */
const EXPECTED_COUNTRIES: ReadonlyArray<CountryCode> = [
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
];

/**
 * Every document code shipped in v0.1.0. Each entry has a known-good synthetic
 * input that should validate. Edit when adding a new document type.
 */
const HAPPY_PATH_FIXTURES: ReadonlyArray<readonly [DocumentTypeCode, string]> = [
  // SV
  ["SV_DUI", "04567890-3"],
  ["SV_NIT", "0614-150585-101-5"],
  // BR (cpf-cnpj-validator reference)
  ["BR_CPF", "529.982.247-25"],
  // AR
  ["AR_DNI", "12345678"],
  // CL
  ["CL_RUT", "12.345.678-5"],
];

describe("root API — registry coverage", () => {
  it("registers all 13 countries planned for v0.1", () => {
    const countries = listSupportedCountries();
    for (const cc of EXPECTED_COUNTRIES) {
      expect(countries, `country ${cc} missing from registry`).toContain(cc);
    }
  });

  it("registers at least one DocumentSpec per supported country", () => {
    const codes = listSupportedCodes();
    for (const cc of EXPECTED_COUNTRIES) {
      const some = codes.some((code) => code.startsWith(`${cc}_`));
      expect(some, `no DocumentTypeCode registered for ${cc}`).toBe(true);
    }
  });

  it("exposes consistent `country` and stable `code` from getSpec", () => {
    for (const code of listSupportedCodes()) {
      const spec = getSpec(code);
      expect(spec.code, `spec.code mismatch for ${code}`).toBe(code);
      expect(code.startsWith(`${spec.country}_`)).toBe(true);
    }
  });

  it("returns a deduped country set (no duplicates)", () => {
    const countries = listSupportedCountries();
    expect(new Set(countries).size).toBe(countries.length);
  });
});

describe("root API — happy-path validation per registered code", () => {
  for (const [code, input] of HAPPY_PATH_FIXTURES) {
    it(`validates a known-good ${code}`, () => {
      expect(validate(code, input), `${code} should accept "${input}"`).toBe(true);
    });
  }
});

describe("root API — getSpec error path", () => {
  it("throws on an unknown code", () => {
    // @ts-expect-error — intentionally pass a value outside the union to test runtime guard.
    expect(() => getSpec("XX_UNKNOWN")).toThrow(/no spec registered/);
  });
});

describe("root API — format / normalize / parse routing", () => {
  it("delegates format/normalize/parse to the resolved spec", () => {
    expect(format("SV_DUI", "045678903")).toBe("04567890-3");
    expect(normalize("SV_DUI", "04567890-3")).toBe("045678903");

    const r = parse("SV_DUI", "04567890-3");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.code).toBe("SV_DUI");
      expect(r.normalized).toBe("045678903");
      expect(r.formatted).toBe("04567890-3");
    }
  });

  it("parse returns a typed reason on failure", () => {
    const r = parse("SV_DUI", "");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason.kind).toBe("empty");
      expect(r.code).toBe("SV_DUI");
    }
  });
});

describe("root API — DocumentSpec invariant", () => {
  it("every registered spec exposes the contracted methods", () => {
    for (const code of listSupportedCodes()) {
      const spec = getSpec(code);
      expect(typeof spec.validate, `${code}.validate`).toBe("function");
      expect(typeof spec.format, `${code}.format`).toBe("function");
      expect(typeof spec.normalize, `${code}.normalize`).toBe("function");
      expect(typeof spec.parse, `${code}.parse`).toBe("function");
      expect(typeof spec.confidence, `${code}.confidence`).toBe("string");
      expect(spec.rawRegex).toBeInstanceOf(RegExp);
      expect(typeof spec.mask, `${code}.mask`).toBe("string");
      expect(typeof spec.labelKey, `${code}.labelKey`).toBe("string");
    }
  });

  it("normalize is idempotent on its own output", () => {
    for (const code of listSupportedCodes()) {
      const spec = getSpec(code);
      // Use mask as a representative input shape; normalize should accept any
      // string and return a stable canonical form whose re-normalization is
      // identical.
      const sample = spec.mask.replace(/0/g, "1").replace(/A/g, "A").replace(/\*/g, "A");
      const once = spec.normalize(sample);
      const twice = spec.normalize(once);
      expect(twice, `${code} normalize not idempotent`).toBe(once);
    }
  });
});
