/**
 * Czechia DIČ (CZ_DIC) tests — legal-entity 8-digit branch only.
 *
 * Canonical anchor `CZ25123891` from VERIFICATION.md §CZ.
 * Scope narrowed for v1.7 per VERIFICATION; RČ branches deferred to v1.8.
 */

import { describe, expect, it } from "vitest";

import { normalize, parse, validate } from "../../src/countries/cz/index.ts";

describe("CZ_DIC — weighted mod-11 with 0→1, 1→0 substitution", () => {
  it.each([
    "CZ25123891",
    "CZ67028101",
    "CZ34160001",
    "CZ80013619",
    "CZ03379469",
    "CZ08969485",
  ])("validates %s", (v) => {
    expect(validate("DIC", v)).toBe(true);
    expect(validate("CZ_DIC", v)).toBe(true);
    expect(validate("VAT", v)).toBe(true);
  });

  it("normalize uppercases + adds CZ prefix on bare 8 digits", () => {
    expect(normalize("DIC", "cz25123891")).toBe("CZ25123891");
    expect(normalize("DIC", "25123891")).toBe("CZ25123891");
  });

  it("rejects first body digit 9 (reserved)", () => {
    expect(validate("DIC", "CZ91234567")).toBe(false);
  });

  it("rejects flipped check", () => {
    expect(validate("DIC", "CZ25123890")).toBe(false);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("DIC", "CZ25123892");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("DIC", "CZ25123891");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
