/**
 * Ireland VAT (IE_VAT) tests.
 *
 * Canonical anchor `IE8473625E` from VERIFICATION.md §IE; remaining vectors
 * machine-generated against the live spec and hand-verified mod-23.
 */

import { describe, expect, it } from "vitest";

import { format, normalize, parse, validate } from "../../src/countries/ie/index.ts";

describe("IE_VAT — mod-23 letter check, accepts old (8-char body) + new (9-char) forms", () => {
  it.each([
    "IE8473625E",
    "IE3628739UA",
    "IE8713052O",
    "IE5643486L",
    "IE1410926D",
    "IE0460777L",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("IE_VAT", v)).toBe(true);
  });

  it("normalize strips lowercase + adds IE prefix", () => {
    expect(normalize("VAT", "ie8473625e")).toBe("IE8473625E");
    expect(normalize("VAT", "8473625E")).toBe("IE8473625E");
  });

  it("format returns canonical form", () => {
    expect(format("VAT", "ie8473625e")).toBe("IE8473625E");
  });

  it("rejects invalid check letter", () => {
    expect(validate("VAT", "IE8473625A")).toBe(false);
  });

  it("rejects format with non-allowed letter", () => {
    expect(validate("VAT", "IE847362XX")).toBe(false);
  });

  it("parse returns invalid_checksum on flipped letter", () => {
    const r = parse("VAT", "IE8473625A");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse returns too_short", () => {
    const r = parse("VAT", "IE12");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_short");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "IE8473625E");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
