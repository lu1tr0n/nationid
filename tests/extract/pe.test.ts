/**
 * Extractor tests — Perú (RUC).
 *
 * RUC vectors: 2-digit prefix (10/15/16/17/20) + 8-digit body + mod-11 DV.
 */

import { describe, expect, it } from "vitest";

import { extractDOB, extractRegion, extractSex, supports } from "../../src/extract/index.ts";

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function buildRuc(prefix: string, body8: string): string {
  const body10 = prefix + body8;
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += (body10.charCodeAt(i) - 48) * (WEIGHTS[i] ?? 0);
  const r = sum % 11;
  let dv = 11 - r;
  if (dv === 11) dv = 0;
  else if (dv === 10) dv = 1;
  return body10 + String(dv);
}

describe("extract — PE_RUC", () => {
  describe("supports()", () => {
    it("declares region only", () => {
      expect(supports("PE_RUC", "region")).toBe(true);
      expect(supports("PE_RUC", "dob")).toBe(false);
      expect(supports("PE_RUC", "sex")).toBe(false);
    });
  });

  describe("extractRegion", () => {
    it("returns 'natural' for prefix 10", () => {
      const ruc = buildRuc("10", "12345678");
      expect(extractRegion("PE_RUC", ruc)).toEqual({ code: "natural", kind: "tax_region" });
    });

    it("returns 'natural' for prefixes 15, 16, 17", () => {
      for (const prefix of ["15", "16", "17"]) {
        const ruc = buildRuc(prefix, "12345678");
        expect(extractRegion("PE_RUC", ruc)).toEqual({
          code: "natural",
          kind: "tax_region",
        });
      }
    });

    it("returns 'juridica' for prefix 20", () => {
      const ruc = buildRuc("20", "12345678");
      expect(extractRegion("PE_RUC", ruc)).toEqual({
        code: "juridica",
        kind: "tax_region",
      });
    });

    it("returns null on invalid input", () => {
      expect(extractRegion("PE_RUC", "")).toBeNull();
      expect(extractRegion("PE_RUC", "garbage")).toBeNull();
      // All-same-digit body is rejected by parse().
      expect(extractRegion("PE_RUC", "11111111111")).toBeNull();
    });
  });

  describe("extractDOB / extractSex", () => {
    it("rejects unsupported kinds at compile time", () => {
      const ruc = buildRuc("10", "12345678");
      // PE_RUC only encodes region; the narrowed signatures now reject it
      // for DOB / sex. Runtime safety net still returns null.
      // @ts-expect-error PE_RUC does not encode DOB
      expect(extractDOB("PE_RUC", ruc)).toBeNull();
      // @ts-expect-error PE_RUC does not encode sex
      expect(extractSex("PE_RUC", ruc)).toBeNull();
    });
  });
});

describe("extract — unsupported codes", () => {
  it("returns false for codes with no extract support", () => {
    expect(supports("SV_DUI", "dob")).toBe(false);
    expect(supports("SV_DUI", "sex")).toBe(false);
    expect(supports("SV_DUI", "region")).toBe(false);
    expect(supports("BR_CPF", "dob")).toBe(false);
    expect(supports("CL_RUT", "sex")).toBe(false);
  });

  it("rejects unsupported codes at compile time", () => {
    // These calls used to compile and return null at runtime; v1.0 narrows
    // the typed signature to the support matrix, so they're now type errors.
    // The runtime guard remains as a defensive backstop.
    // @ts-expect-error SV_DUI is not in CodesSupporting<"dob">
    expect(extractDOB("SV_DUI", "045678903")).toBeNull();
    // @ts-expect-error BR_CPF is not in CodesSupporting<"sex">
    expect(extractSex("BR_CPF", "39053344705")).toBeNull();
    // @ts-expect-error CL_RUT is not in CodesSupporting<"region">
    expect(extractRegion("CL_RUT", "76086428-5")).toBeNull();
  });
});
