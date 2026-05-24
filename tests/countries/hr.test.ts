/**
 * Croatia OIB (HR_OIB) tests — ISO/IEC 7064 MOD 11,10.
 *
 * Canonical anchor `HR33392005961` from VERIFICATION.md §HR.
 * Statute Zakon o OIB-u (NN 60/2008) explicitly cites ISO/IEC 7064.
 * Algorithm uses hoisted `mod11_10CheckDigit` from `algorithms/iso7064.ts`.
 */

import { describe, expect, it } from "vitest";

import { format, normalize, parse, validate } from "../../src/countries/hr/index.ts";

describe("HR_OIB — ISO/IEC 7064 MOD 11,10 over 10 body digits", () => {
  it.each([
    "HR33392005961",
    "HR61842315249",
    "HR45662720770",
    "HR55982066989",
    "HR11870506298",
    "HR79469327360",
  ])("validates %s", (v) => {
    expect(validate("OIB", v)).toBe(true);
    expect(validate("HR_OIB", v)).toBe(true);
    expect(validate("VAT", v)).toBe(true);
  });

  it("normalize tolerates separators + bare 11 digits", () => {
    expect(normalize("OIB", "hr 33392 005961")).toBe("HR33392005961");
    expect(normalize("OIB", "33392005961")).toBe("HR33392005961");
  });

  it("format adds space after HR", () => {
    expect(format("OIB", "HR33392005961")).toBe("HR 33392005961");
  });

  it("rejects flipped check", () => {
    expect(validate("OIB", "HR33392005962")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("OIB", "HR33392005960");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("OIB", "HR33392005961");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
