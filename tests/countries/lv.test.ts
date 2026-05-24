/**
 * Latvia PVN (LV_VAT) tests — moderate confidence.
 *
 * Canonical anchor `LV40003009497` from VERIFICATION.md §LV (legal-entity).
 * Natural-person branch ships as `moderate` per python-stdnum source comment.
 */

import { describe, expect, it } from "vitest";

import { parse, validate } from "../../src/countries/lv/index.ts";

describe("LV_VAT — legal-entity weighted mod-11", () => {
  it.each([
    "LV40003009497",
    "LV55333007359",
    "LV75595060446",
    "LV06023977921",
    "LV31124080374",
    "LV60653064422",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("LV_VAT", v)).toBe(true);
    expect(validate("PVN", v)).toBe(true);
  });

  it("rejects flipped check on legal-entity body", () => {
    expect(validate("VAT", "LV40003009498")).toBe(false);
  });

  it("parse returns moderate confidence (per VERIFICATION §LV)", () => {
    const r = parse("VAT", "LV40003009497");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("moderate");
  });

  it("parse returns invalid_checksum on broken legal entity", () => {
    const r = parse("VAT", "LV40003009490");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });
});
