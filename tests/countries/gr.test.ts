/**
 * Greece VAT (GR_VAT) tests — VIES prefix EL.
 *
 * Canonical anchor `EL094259216` from VERIFICATION.md §GR.
 * EL/GR prefix handling: accept both on input, normalize to EL.
 */

import { describe, expect, it } from "vitest";

import { format, normalize, parse, validate } from "../../src/countries/gr/index.ts";

describe("GR_VAT — iterative mod-11 check, EL VIES prefix", () => {
  it.each([
    "EL094259216",
    "EL911323229",
    "EL850616505",
    "EL844206040",
    "EL927415481",
    "EL833037221",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("GR_VAT", v)).toBe(true);
    expect(validate("AFM", v)).toBe(true);
  });

  it("normalize rewrites GR-prefix to EL", () => {
    expect(normalize("VAT", "GR094259216")).toBe("EL094259216");
  });

  it("normalize accepts bare 9-digit body", () => {
    expect(normalize("VAT", "094259216")).toBe("EL094259216");
  });

  it("format returns canonical EL form", () => {
    expect(format("VAT", "GR094259216")).toBe("EL 094259216");
  });

  it("rejects flipped check", () => {
    expect(validate("VAT", "EL094259217")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("VAT", "EL094259210");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "EL094259216");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
