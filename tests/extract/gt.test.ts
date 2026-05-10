/**
 * Extractor tests — Guatemala (DPI).
 *
 * Vectors built using the GT_DPI generator pattern in `_arbitraries.ts`:
 * 8-digit body → mod-11 DV (≠ 10) → 2-digit dept (01..22) → 2-digit muni.
 */

import { describe, expect, it } from "vitest";

import { extractDOB, extractRegion, extractSex, supports } from "../../src/extract/index.ts";

const WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9];

function buildDpi(body8: string, dept: string, muni: string): string | null {
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += (body8.charCodeAt(i) - 48) * (WEIGHTS[i] ?? 0);
  const dv = sum % 11;
  if (dv === 10) return null;
  return `${body8}${dv}${dept}${muni}`;
}

describe("extract — GT_DPI", () => {
  describe("supports()", () => {
    it("declares region only", () => {
      expect(supports("GT_DPI", "region")).toBe(true);
      expect(supports("GT_DPI", "dob")).toBe(false);
      expect(supports("GT_DPI", "sex")).toBe(false);
    });
  });

  describe("extractRegion", () => {
    it("returns the 2-digit departamento with kind 'department'", () => {
      // 12345678 → mod-11 of 2*1+3*2+4*3+5*4+6*5+7*6+8*7+9*8 = 240. 240%11=9.
      const dpi = buildDpi("12345678", "01", "01");
      expect(dpi).not.toBeNull();
      const region = extractRegion("GT_DPI", dpi as string);
      expect(region).toEqual({ code: "01", kind: "department" });
    });

    it("preserves leading zeros in dept code", () => {
      const dpi = buildDpi("12345678", "07", "23");
      const region = extractRegion("GT_DPI", dpi as string);
      expect(region?.code).toBe("07");
    });

    it("returns null on invalid input", () => {
      expect(extractRegion("GT_DPI", "")).toBeNull();
      expect(extractRegion("GT_DPI", "0000000000000")).toBeNull();
    });

    it("handles formatted input via parse() normalization", () => {
      const dpi = buildDpi("12345678", "22", "01");
      const formatted = `${dpi?.slice(0, 4)} ${dpi?.slice(4, 9)} ${dpi?.slice(9)}`;
      const region = extractRegion("GT_DPI", formatted);
      expect(region?.code).toBe("22");
    });
  });

  describe("extractDOB / extractSex", () => {
    it("returns null for unsupported kinds", () => {
      const dpi = buildDpi("12345678", "01", "01");
      expect(extractDOB("GT_DPI", dpi as string)).toBeNull();
      expect(extractSex("GT_DPI", dpi as string)).toBeNull();
    });
  });
});
