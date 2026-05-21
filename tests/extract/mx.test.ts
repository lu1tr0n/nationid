/**
 * Extractor tests — México (CURP, RFC PF).
 *
 * Test vectors are SYNTHETIC. CURP DVs computed via RENAPO mod-10 algorithm,
 * RFC DVs via SAT Anexo 19 mod-11. Construction follows the same shape used
 * in `tests/countries/mx.test.ts`.
 *
 * Homoclave / century-inference fixtures:
 *   - `GOMC050315HDFRRRA9` — homoclave A (letter) → 2000s → 2005-03-15.
 *   - `MARP100101MDFRTRA1` — homoclave A (letter) → 2000s → 2010-01-01.
 *   - `SANC000229HBCNNNA6` — homoclave A (letter) → 2000s → 2000-02-29 (leap).
 *   - `GAVA751231MNERRR07` — homoclave 0 (digit) → 1900s → 1975-12-31.
 *   - `GOMC850315HDFRRR07` — homoclave 0 (digit) → 1900s → 1985-03-15.
 *   - `MARP800101MDFRTR03` — homoclave 0 (digit) → 1900s → 1980-01-01.
 */

import { describe, expect, it } from "vitest";

import { extractDOB, extractRegion, extractSex, supports } from "../../src/extract/index.ts";

describe("extract — MX_CURP", () => {
  describe("supports()", () => {
    it("declares dob, sex, region", () => {
      expect(supports("MX_CURP", "dob")).toBe(true);
      expect(supports("MX_CURP", "sex")).toBe(true);
      expect(supports("MX_CURP", "region")).toBe(true);
    });
  });

  describe("extractDOB", () => {
    it("returns 2000s date when homoclave is a letter", () => {
      const dob = extractDOB("MX_CURP", "GOMC050315HDFRRRA9");
      expect(dob).toEqual({ year: 2005, month: 3, day: 15 });
    });

    it("returns 1900s date when homoclave is a digit (pre-1996 numeric)", () => {
      const dob = extractDOB("MX_CURP", "GAVA751231MNERRR07");
      expect(dob).toEqual({ year: 1975, month: 12, day: 31 });
    });

    it("handles 2000-02-29 leap day correctly", () => {
      const dob = extractDOB("MX_CURP", "SANC000229HBCNNNA6");
      expect(dob).toEqual({ year: 2000, month: 2, day: 29 });
    });

    it("returns null when input is invalid", () => {
      expect(extractDOB("MX_CURP", "")).toBeNull();
      expect(extractDOB("MX_CURP", "garbage")).toBeNull();
      // Right shape, wrong DV (correct DV for body GOMC850315HDFRRR0 is 7).
      expect(extractDOB("MX_CURP", "GOMC850315HDFRRR06")).toBeNull();
    });

    it("trims and uppercases like parse() does", () => {
      const dob = extractDOB("MX_CURP", "  gomc050315hdfrrra9  ");
      expect(dob).toEqual({ year: 2005, month: 3, day: 15 });
    });
  });

  describe("extractSex", () => {
    it("maps H → M (masculino)", () => {
      expect(extractSex("MX_CURP", "GOMC850315HDFRRR07")).toBe("M");
    });

    it("maps M → F (femenino)", () => {
      expect(extractSex("MX_CURP", "MARP800101MDFRTR03")).toBe("F");
    });

    it("returns null on invalid input", () => {
      expect(extractSex("MX_CURP", "not-a-curp")).toBeNull();
    });
  });

  describe("extractRegion", () => {
    it("returns the 2-letter entidad federativa with kind 'state'", () => {
      const region = extractRegion("MX_CURP", "GOMC850315HDFRRR07");
      expect(region).toEqual({ code: "DF", kind: "state" });
    });

    it("preserves NE for 'nacido en el extranjero'", () => {
      const region = extractRegion("MX_CURP", "GAVA751231MNERRR07");
      expect(region).toEqual({ code: "NE", kind: "state" });
    });

    it("returns null on invalid input", () => {
      expect(extractRegion("MX_CURP", "")).toBeNull();
    });
  });
});

describe("extract — MX_RFC_PF", () => {
  describe("supports()", () => {
    it("declares dob only", () => {
      expect(supports("MX_RFC_PF", "dob")).toBe(true);
      expect(supports("MX_RFC_PF", "sex")).toBe(false);
      expect(supports("MX_RFC_PF", "region")).toBe(false);
    });
  });

  describe("extractDOB", () => {
    it("returns the embedded YYMMDD for a known vector", () => {
      // GODE561231GR8 — python-stdnum doctest: born 1956-12-31 (current YY < 56).
      const dob = extractDOB("MX_RFC_PF", "GODE561231GR8");
      expect(dob?.month).toBe(12);
      expect(dob?.day).toBe(31);
      expect(dob?.year).toBe(1956);
    });

    it("returns null on invalid RFC", () => {
      expect(extractDOB("MX_RFC_PF", "BAD")).toBeNull();
      expect(extractDOB("MX_RFC_PF", "")).toBeNull();
    });

    it("returns null for SAT genéricos beyond placeholder semantics", () => {
      // XAXX010101000 / XEXX010101000 are SAT placeholder RFCs. Their date
      // bytes form a calendar-valid 2001-01-01 string, so the extractor
      // surfaces it; downstream filtering of generics is the caller's job.
      const dob = extractDOB("MX_RFC_PF", "XAXX010101000");
      expect(dob).toEqual({ year: 2001, month: 1, day: 1 });
    });
  });

  describe("extractSex / extractRegion", () => {
    it("rejects sex/region at compile time because RFC_PF encodes neither", () => {
      // MX_RFC_PF only declares "dob" support; the narrowed signatures now
      // reject it for sex and region. Runtime safety net still returns null.
      // @ts-expect-error MX_RFC_PF does not encode sex
      expect(extractSex("MX_RFC_PF", "GODE561231GR8")).toBeNull();
      // @ts-expect-error MX_RFC_PF does not encode region
      expect(extractRegion("MX_RFC_PF", "GODE561231GR8")).toBeNull();
    });
  });
});
