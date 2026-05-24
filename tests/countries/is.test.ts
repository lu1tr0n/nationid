/**
 * Iceland VSK (IS_VSK) tests — format-only moderate confidence.
 *
 * EEA but NOT in EU VIES. No checksum published by RSK.
 */

import { describe, expect, it } from "vitest";

import { normalize, parse, validate } from "../../src/countries/is/index.ts";

describe("IS_VSK — format-only 5 or 6 digits", () => {
  it.each(["12345", "123456", "54321", "999999", "11111", "100000"])("validates %s", (v) => {
    expect(validate("VSK", v)).toBe(true);
    expect(validate("IS_VSK", v)).toBe(true);
  });

  it("rejects 4 digits", () => {
    expect(validate("VSK", "1234")).toBe(false);
  });

  it("rejects 7 digits", () => {
    expect(validate("VSK", "1234567")).toBe(false);
  });

  it("normalize strips trailing letter (stripNonDigits)", () => {
    // VSK is format-only digits; non-digit chars are stripped before validating.
    expect(normalize("VSK", "12345A")).toBe("12345");
    expect(validate("VSK", "12345A")).toBe(true);
  });

  it("normalize strips separators", () => {
    expect(normalize("VSK", "123 456")).toBe("123456");
  });

  it("parse returns moderate confidence (no checksum)", () => {
    const r = parse("VSK", "123456");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("moderate");
  });

  it("parse returns too_short for 4 digits", () => {
    const r = parse("VSK", "1234");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_short");
  });
});
