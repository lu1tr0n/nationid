/**
 * Direct tests for the ISO/IEC 7064 MOD 11,10 primitive.
 *
 * Actually used (per `grep -l mod11_10 src/countries/`) by:
 *   - HR_OIB        (10-digit body)
 *   - DE_USTID      (8-digit body, prefixed `DE`)
 *   - DE_STEUER_ID  (10-digit body)
 *
 * Country specs cover the primitive transitively, but a refactor of
 * `src/algorithms/iso7064.ts` could regress without breaking country tests
 * if a country happened to also hand-roll a parallel check. These direct
 * tests anchor the primitive to its public contract.
 *
 * Canonical anchors (each is a real-world valid identifier):
 *   - HR_OIB:       `33392005961` (body `3339200596`, check `1`)
 *   - DE_USTID:     `123456788` after the `DE` prefix (body `12345678`, check `8`)
 *   - DE_STEUER_ID: `47036892816` (body `4703689281`, check `6`)
 *
 * The MOD 11,10 algorithm is length-generic, so the same primitive is
 * exercised at body lengths 8 and 10 below.
 */

import { describe, expect, it } from "vitest";
import { mod11_10CheckDigit, mod11_10Valid } from "../../src/algorithms/iso7064.ts";

describe("mod11_10CheckDigit", () => {
  it("computes the check digit for canonical DE_USTID body (length 8)", () => {
    expect(mod11_10CheckDigit("12345678")).toBe(8);
  });

  it("computes the check digit for canonical HR_OIB body (length 10)", () => {
    expect(mod11_10CheckDigit("3339200596")).toBe(1);
  });

  it("computes the check digit for canonical DE_STEUER_ID body (length 10)", () => {
    expect(mod11_10CheckDigit("4703689281")).toBe(6);
  });

  it("is length-generic — round-trips any positive-length digit body", () => {
    const bases = [
      "1", // length 1
      "12", // length 2
      "12345", // length 5
      "12345678", // length 8 (DE_USTID)
      "3339200596", // length 10 (HR_OIB)
      "4703689281", // length 10 (DE_STEUER_ID)
      "12345678901", // length 11
      "1234567890123456", // length 16
    ];
    for (const base of bases) {
      const check = mod11_10CheckDigit(base);
      expect(check).toBeGreaterThanOrEqual(0);
      expect(check).toBeLessThanOrEqual(9);
      expect(mod11_10Valid(base + String(check))).toBe(true);
    }
  });

  it("throws on empty body", () => {
    expect(() => mod11_10CheckDigit("")).toThrow();
  });

  it("throws on non-digit input", () => {
    expect(() => mod11_10CheckDigit("123A56")).toThrow();
    expect(() => mod11_10CheckDigit("abc")).toThrow();
    expect(() => mod11_10CheckDigit("12 34")).toThrow();
  });
});

describe("mod11_10Valid", () => {
  it("validates the canonical DE_USTID anchor", () => {
    expect(mod11_10Valid("123456788")).toBe(true);
  });

  it("validates the canonical HR_OIB anchor", () => {
    expect(mod11_10Valid("33392005961")).toBe(true);
  });

  it("validates the canonical DE_STEUER_ID anchor", () => {
    expect(mod11_10Valid("47036892816")).toBe(true);
  });

  it("rejects checksum-flipped anchors", () => {
    expect(mod11_10Valid("123456789")).toBe(false); // DE_USTID off-by-one
    expect(mod11_10Valid("33392005960")).toBe(false); // HR_OIB
    expect(mod11_10Valid("47036892817")).toBe(false); // DE_STEUER_ID
  });

  it("rejects too-short / non-digit / empty input", () => {
    expect(mod11_10Valid("")).toBe(false);
    expect(mod11_10Valid("1")).toBe(false);
    expect(mod11_10Valid("abcde")).toBe(false);
    expect(mod11_10Valid("12345A")).toBe(false);
  });

  it("detects every single-digit substitution in a closed HR_OIB body", () => {
    const base = "3339200596";
    const closed = base + String(mod11_10CheckDigit(base));
    expect(mod11_10Valid(closed)).toBe(true);

    for (let i = 0; i < closed.length; i++) {
      const original = closed[i] as string;
      for (let d = 0; d < 10; d++) {
        if (String(d) === original) continue;
        const mutated = closed.slice(0, i) + String(d) + closed.slice(i + 1);
        expect(
          mod11_10Valid(mutated),
          `expected rejection for ${mutated} (pos ${i}: ${original}→${d})`,
        ).toBe(false);
      }
    }
  });
});
