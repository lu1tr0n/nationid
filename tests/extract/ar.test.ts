/**
 * Extractor tests — Argentina (CUIT, CUIL, CDI).
 *
 * Test vectors built from real Argentine prefixes + synthetic bodies whose
 * mod-11 verifier we compute inline (using the same `[5,4,3,2,7,6,5,4,3,2]`
 * weights as `src/countries/ar/shared.ts`). The bodies themselves are
 * synthetic; no real PII.
 */

import { describe, expect, it } from "vitest";

import { extractDOB, extractRegion, extractSex, supports } from "../../src/extract/index.ts";

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** Compose an 11-digit CUIT/CUIL/CDI given prefix + 8-digit body. */
function withDV(prefix2: string, body8: string): string {
  const body10 = prefix2 + body8;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += (body10.charCodeAt(i) - 48) * (WEIGHTS[i] ?? 0);
  }
  const r = sum % 11;
  let dv = 11 - r;
  if (dv === 11) dv = 0;
  if (dv === 10) {
    // Choose a different body to avoid the AFIP-illegal dv == 10. Bump the
    // last digit and recurse — guaranteed to terminate within 10 iterations.
    const last = (Number(body8.charAt(7)) + 1) % 10;
    return withDV(prefix2, body8.slice(0, 7) + String(last));
  }
  return body10 + String(dv);
}

describe("extract — AR_CUIT", () => {
  describe("supports()", () => {
    it("declares sex only", () => {
      expect(supports("AR_CUIT", "sex")).toBe(true);
      expect(supports("AR_CUIT", "dob")).toBe(false);
      expect(supports("AR_CUIT", "region")).toBe(false);
    });
  });

  describe("extractSex", () => {
    it("returns M for prefixes 20, 23, 24, 25, 26", () => {
      for (const prefix of ["20", "23", "24", "25", "26"]) {
        const cuit = withDV(prefix, "12345678");
        expect(extractSex("AR_CUIT", cuit)).toBe("M");
      }
    });

    it("returns F for prefix 27", () => {
      const cuit = withDV("27", "12345678");
      expect(extractSex("AR_CUIT", cuit)).toBe("F");
    });

    it("returns X for jurídica prefixes 30, 33, 34", () => {
      for (const prefix of ["30", "33", "34"]) {
        const cuit = withDV(prefix, "12345678");
        expect(extractSex("AR_CUIT", cuit)).toBe("X");
      }
    });

    it("returns null on invalid input", () => {
      expect(extractSex("AR_CUIT", "00000000000")).toBeNull();
      expect(extractSex("AR_CUIT", "")).toBeNull();
      // Wrong checksum.
      expect(extractSex("AR_CUIT", "20123456789")).toBeNull();
    });
  });

  describe("extractDOB / extractRegion", () => {
    it("returns null for unsupported kinds", () => {
      const cuit = withDV("20", "12345678");
      expect(extractDOB("AR_CUIT", cuit)).toBeNull();
      expect(extractRegion("AR_CUIT", cuit)).toBeNull();
    });
  });
});

describe("extract — AR_CUIL", () => {
  it("uses the same prefix → sex mapping as CUIT", () => {
    const m = withDV("20", "11223344");
    const f = withDV("27", "11223344");
    expect(extractSex("AR_CUIL", m)).toBe("M");
    expect(extractSex("AR_CUIL", f)).toBe("F");
  });

  it("returns null for invalid input", () => {
    expect(extractSex("AR_CUIL", "")).toBeNull();
  });
});

describe("extract — AR_CDI", () => {
  describe("supports()", () => {
    it("declares sex only", () => {
      expect(supports("AR_CDI", "sex")).toBe(true);
      expect(supports("AR_CDI", "dob")).toBe(false);
      expect(supports("AR_CDI", "region")).toBe(false);
    });
  });

  it("returns null because CDI prefix 50 carries no documented sex", () => {
    // CDI uses prefix 50 only. The spec validates it; the extractor returns
    // null because 50 isn't M/F/X under the AFIP convention.
    const cdi = withDV("50", "11223344");
    expect(extractSex("AR_CDI", cdi)).toBeNull();
  });
});
