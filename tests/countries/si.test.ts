/**
 * Slovenia DDV (SI_VAT) tests.
 *
 * Canonical anchor `SI50223054` from VERIFICATION.md §SI.
 * Body `9876543` → check `4` (per VERIFICATION fixture-correction note).
 */

import { describe, expect, it } from "vitest";

import { parse, validate } from "../../src/countries/si/index.ts";

describe("SI_VAT — weighted mod-11 with 10→0", () => {
  it.each([
    "SI50223054",
    "SI60474416",
    "SI73065153",
    "SI64440541",
    "SI15300160",
    "SI34671978",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("SI_VAT", v)).toBe(true);
    expect(validate("DDV", v)).toBe(true);
  });

  it("validates the 9876543→4 worked example from VERIFICATION", () => {
    expect(validate("VAT", "SI98765434")).toBe(true);
  });

  it("rejects flipped check", () => {
    expect(validate("VAT", "SI50223055")).toBe(false);
  });

  it("rejects body starting with 0", () => {
    expect(validate("VAT", "SI00223054")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("VAT", "SI50223050");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "SI50223054");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
