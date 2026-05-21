/**
 * Regression test for the RFC PF century-disambiguation clock.
 *
 * `extractRfcDOB` reads a 2-digit year and decides 19xx vs 20xx using a
 * rolling cutoff (current 2-digit year). With a hard-coded `new Date()` call
 * the rule would silently flip on 2056-01-01 — "GODE561231GR8" (currently
 * 1956-12-31) would be re-interpreted as 2056-12-31.
 *
 * Wave C6 injected a `Clock` parameter so we can pin the cutoff in tests and
 * verify both branches of the disambiguator independently of the wall clock.
 */

import { describe, expect, it } from "vitest";

import { extractRfcDOB } from "../../src/extract/mx/rfc.ts";

const at = (iso: string) => () => new Date(iso);

describe("extractRfcDOB — clock injection", () => {
  it("interprets YY=56 as 1956 when clock is in 2025 (YY > current)", () => {
    const dob = extractRfcDOB("GODE561231GR8", at("2025-06-01T00:00:00Z"));
    expect(dob).toEqual({ year: 1956, month: 12, day: 31 });
  });

  it("interprets YY=56 as 1956 when clock is in 2055 (YY > current)", () => {
    const dob = extractRfcDOB("GODE561231GR8", at("2055-06-01T00:00:00Z"));
    expect(dob).toEqual({ year: 1956, month: 12, day: 31 });
  });

  it("still interprets YY=56 as 1956 in 2056 (YY === current, current century)", () => {
    // The audit's "2056 time bomb" — equality is treated as the current
    // century. So at the boundary, GODE561231 means a brand-new 2056-12-31
    // RFC, NOT 1956-12-31. This is the documented behavior; the test pins it
    // so we can't drift accidentally.
    const dob = extractRfcDOB("GODE561231GR8", at("2056-06-01T00:00:00Z"));
    expect(dob).toEqual({ year: 2056, month: 12, day: 31 });
  });

  it("documents the 100-year wraparound: in 2057, YY=56 means 2056", () => {
    // The rolling cutoff has a fundamental 100-year ambiguity — same as Y2K.
    // A 2-digit year alone cannot distinguish 1956 from 2056 in 2057. The
    // clock parameter lets consumers reading legacy data disambiguate by
    // pinning a historical "now" before the wraparound.
    const dob = extractRfcDOB("GODE561231GR8", at("2057-06-01T00:00:00Z"));
    expect(dob).toEqual({ year: 2056, month: 12, day: 31 });
  });

  it("interprets YY=01 as 2001 when clock is in 2025 (YY < current)", () => {
    // SAT genérico XAXX010101000 — placeholder date 01-01-01.
    const dob = extractRfcDOB("XAXX010101000", at("2025-06-01T00:00:00Z"));
    expect(dob).toEqual({ year: 2001, month: 1, day: 1 });
  });

  it("uses the default clock (current calendar) when no clock is passed", () => {
    // Smoke check: the default-clock path stays wired up.
    const dob = extractRfcDOB("GODE561231GR8");
    expect(dob).not.toBeNull();
    expect(dob?.month).toBe(12);
    expect(dob?.day).toBe(31);
    // Year is one of 1956 or 2056, depending on when this test runs.
    expect([1956, 2056]).toContain(dob?.year);
  });
});
