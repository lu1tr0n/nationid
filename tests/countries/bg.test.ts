/**
 * Bulgaria VAT (BG_VAT) tests — 9-digit legal-entity branch only.
 *
 * Canonical anchor `BG100000001` from VERIFICATION.md §BG.
 * Scope narrowed for v1.7; 10-digit (EGN/PNF) branch deferred to v1.8.
 */

import { describe, expect, it } from "vitest";

import { parse, validate } from "../../src/countries/bg/index.ts";

describe("BG_VAT — primary mod-11 with fallback weights", () => {
  it.each([
    "BG100000001",
    "BG177279873",
    "BG114425763",
    "BG604070571",
    "BG788837196",
    "BG607522220",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("BG_VAT", v)).toBe(true);
  });

  it("rejects 10-digit (sole proprietor — defer v1.8)", () => {
    expect(validate("VAT", "BG1234567890")).toBe(false);
  });

  it("rejects flipped check", () => {
    expect(validate("VAT", "BG100000002")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("VAT", "BG100000003");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "BG100000001");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
