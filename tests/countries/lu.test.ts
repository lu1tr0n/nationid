/**
 * Luxembourg TVA (LU_VAT) tests.
 *
 * Canonical anchor `LU15027442` from VERIFICATION.md §LU.
 * Algorithm: positions 7-8 = body6 mod 89.
 */

import { describe, expect, it } from "vitest";

import { format, normalize, parse, validate } from "../../src/countries/lu/index.ts";

describe("LU_VAT — body6 mod 89", () => {
  it.each([
    "LU15027442",
    "LU76428643",
    "LU57490049",
    "LU21469527",
    "LU24094825",
    "LU50000503",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("LU_VAT", v)).toBe(true);
    expect(validate("TVA", v)).toBe(true);
  });

  it("normalize strips spaces + lowercase", () => {
    expect(normalize("VAT", "lu 1502 7442")).toBe("LU15027442");
  });

  it("format returns `LU 8-digit-body`", () => {
    expect(format("VAT", "LU15027442")).toBe("LU 15027442");
  });

  it("rejects flipped check", () => {
    expect(validate("VAT", "LU15027443")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("VAT", "LU15027440");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "LU15027442");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
