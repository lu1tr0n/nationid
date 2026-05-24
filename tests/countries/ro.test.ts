/**
 * Romania VAT (RO_VAT) tests — variable length 2-10 digits.
 *
 * Canonical anchors `RO18547290`, `RO123453` from VERIFICATION.md §RO.
 */

import { describe, expect, it } from "vitest";

import { normalize, parse, validate } from "../../src/countries/ro/index.ts";

describe("RO_VAT — pad-to-9 mod-11", () => {
  it.each([
    "RO18547290",
    "RO123453",
    "RO390112472",
    "RO3843700",
    "RO992073",
    "RO396",
  ])("validates %s", (v) => {
    expect(validate("VAT", v)).toBe(true);
    expect(validate("RO_VAT", v)).toBe(true);
    expect(validate("CUI", v)).toBe(true);
    expect(validate("CIF", v)).toBe(true);
  });

  it("normalize handles separators + bare digits", () => {
    expect(normalize("VAT", "ro 1854 7290")).toBe("RO18547290");
    expect(normalize("VAT", "18547290")).toBe("RO18547290");
  });

  it("rejects leading zero in body", () => {
    expect(validate("VAT", "RO0123456")).toBe(false);
  });

  it("rejects flipped check", () => {
    expect(validate("VAT", "RO18547291")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("VAT", "RO18547299");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("VAT", "RO18547290");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
