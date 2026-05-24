/**
 * Hungary VAT (HU_VAT) tests.
 *
 * Canonical anchor `HU12892312` from VERIFICATION.md §HU.
 * Algorithm: weights [9,7,3,1,9,7,3,1] over 8 digits, sum mod 10 = 0.
 */

import { describe, expect, it } from "vitest";

import { format, normalize, parse, validate } from "../../src/countries/hu/index.ts";

describe("HU_VAT — weighted mod-10", () => {
  it.each([
    "HU12892312",
    "HU81270060",
    "HU37598118",
    "HU95159926",
    "HU78968415",
    "HU27956825",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("HU_VAT", v)).toBe(true);
    expect(validate("ADOSZAM", v)).toBe(true);
  });

  it("normalize handles separators", () => {
    expect(normalize("VAT", "hu 12892312")).toBe("HU12892312");
  });

  it("format adds space after HU", () => {
    expect(format("VAT", "HU12892312")).toBe("HU 12892312");
  });

  it("rejects flipped check", () => {
    expect(validate("VAT", "HU12892311")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("VAT", "HU12892310");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "HU12892312");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
