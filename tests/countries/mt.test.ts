/**
 * Malta VAT (MT_VAT) tests.
 *
 * Canonical anchor `MT11679112` from VERIFICATION.md §MT.
 * Algorithm: weights [3,4,6,7,8,9,10,1] over 8 digits, sum mod 37 = 0.
 * Quirk: ~73% of random 8-digit bodies legitimately rejected.
 */

import { describe, expect, it } from "vitest";

import { normalize, parse, validate } from "../../src/countries/mt/index.ts";

describe("MT_VAT — weighted mod-37", () => {
  it.each([
    "MT11679112",
    "MT81479942",
    "MT70108677",
    "MT13345886",
    "MT84273953",
    "MT12152444",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("MT_VAT", v)).toBe(true);
  });

  it("rejects flipped check", () => {
    expect(validate("VAT", "MT11679113")).toBe(false);
  });

  it("normalize handles spaces", () => {
    expect(normalize("VAT", "mt 1167 9112")).toBe("MT11679112");
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("VAT", "MT11679110");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "MT11679112");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
