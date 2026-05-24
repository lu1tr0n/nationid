/**
 * Estonia KMKR (EE_VAT) tests.
 *
 * Canonical anchor `EE100594102` from VERIFICATION.md §EE.
 * Algorithm: weights [3,7,1,3,7,1,3,7,1] over 9 digits, sum mod 10 = 0.
 */

import { describe, expect, it } from "vitest";

import { normalize, parse, validate } from "../../src/countries/ee/index.ts";

describe("EE_VAT — weighted mod-10", () => {
  it.each([
    "EE100594102",
    "EE107952365",
    "EE413734170",
    "EE752491679",
    "EE275280529",
    "EE946353523",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("EE_VAT", v)).toBe(true);
    expect(validate("KMKR", v)).toBe(true);
  });

  it("normalize bare 9 digits adds EE prefix", () => {
    expect(normalize("VAT", "100594102")).toBe("EE100594102");
  });

  it("rejects flipped check", () => {
    expect(validate("VAT", "EE100594103")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("VAT", "EE100594100");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "EE100594102");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
