/**
 * Slovakia IČ DPH (SK_VAT) tests — divisibility by 11.
 *
 * Canonical anchor `SK1020000003` from VERIFICATION.md §SK.
 */

import { describe, expect, it } from "vitest";

import { parse, validate } from "../../src/countries/sk/index.ts";

describe("SK_VAT — 10-digit divisible by 11", () => {
  it.each([
    "SK1020000003",
    "SK8948301362",
    "SK2843665264",
    "SK5479495835",
    "SK8039959147",
    "SK5698525778",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("SK_VAT", v)).toBe(true);
    expect(validate("DPH", v)).toBe(true);
  });

  it("rejects third-digit not in {2,3,4,7,8,9}", () => {
    expect(validate("VAT", "SK1010000001")).toBe(false);
    expect(validate("VAT", "SK1050000001")).toBe(false);
  });

  it("rejects non-divisible body", () => {
    expect(validate("VAT", "SK1020000004")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("VAT", "SK1020000005");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "SK1020000003");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
