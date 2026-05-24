/**
 * Cyprus VAT (CY_VAT) tests.
 *
 * Canonical anchor `CY10259033P` from VERIFICATION.md §CY.
 * Algorithm: positional translation table, mod 26 → letter A..Z.
 * Reserved prefix `12` rejected.
 */

import { describe, expect, it } from "vitest";

import { normalize, parse, validate } from "../../src/countries/cy/index.ts";

describe("CY_VAT — translation table + mod-26 letter check", () => {
  it.each([
    "CY10259033P",
    "CY13059150S",
    "CY90628765G",
    "CY71251268B",
    "CY04176022I",
    "CY87402967T",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("CY_VAT", v)).toBe(true);
  });

  it("rejects reserved prefix 12", () => {
    expect(validate("VAT", "CY12345678X")).toBe(false);
  });

  it("rejects flipped check letter", () => {
    expect(validate("VAT", "CY10259033A")).toBe(false);
  });

  it("normalize uppercases letter", () => {
    expect(normalize("VAT", "cy10259033p")).toBe("CY10259033P");
  });

  it("parse returns invalid_checksum on flipped letter", () => {
    const r = parse("VAT", "CY10259033Z");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "CY10259033P");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
