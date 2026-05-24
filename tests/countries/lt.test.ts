/**
 * Lithuania PVM (LT_VAT) tests — 9-digit + 12-digit forms.
 *
 * Canonical anchor `LT100001110` from VERIFICATION.md §LT.
 */

import { describe, expect, it } from "vitest";

import { parse, validate } from "../../src/countries/lt/index.ts";

describe("LT_VAT — primary + fallback weights mod-11", () => {
  it.each([
    "LT100001110",
    "LT130201152",
    "LT720659164",
    "LT827367110",
    "LT707567138",
    "LT932865124",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("LT_VAT", v)).toBe(true);
    expect(validate("PVM", v)).toBe(true);
  });

  it("rejects 9-digit body when position 7 (idx 6) is not 1", () => {
    expect(validate("VAT", "LT123456789")).toBe(false);
  });

  it("rejects flipped check", () => {
    expect(validate("VAT", "LT100001111")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("VAT", "LT100001119");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "LT100001110");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
