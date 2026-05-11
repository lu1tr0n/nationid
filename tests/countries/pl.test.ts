import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/pl/index.ts";

describe("PL — PESEL", () => {
  describe("validate", () => {
    it("accepts valid PESELs", () => {
      // Computed: 1990-05-15 ord 0001 dv=7
      expect(validate("PESEL", "90051500017")).toBe(true);
      // 2010-05-15 ord 0001 (mm+20=25 for 2000-2099) dv=1
      expect(validate("PESEL", "10251500011")).toBe(true);
      // 1985-12-31 ord 1234 dv=6
      expect(validate("PESEL", "85123112346")).toBe(true);
      // 1980-08-08 ord 5550 dv=1
      expect(validate("PESEL", "80080855501")).toBe(true);
    });

    it("rejects bad checksums", () => {
      expect(validate("PESEL", "90051500010")).toBe(false);
      expect(validate("PESEL", "10251500019")).toBe(false);
    });

    it("rejects implausible months and days", () => {
      // Month 13 (no century shift produces 1..12) → reject
      expect(validate("PESEL", "85133112340")).toBe(false);
      // Day 99 → reject
      expect(validate("PESEL", "85129912340")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("PESEL", "")).toBe(false);
      expect(validate("PESEL", "1234")).toBe(false);
      expect(validate("PESEL", "900515000170")).toBe(false);
      expect(validate("PESEL", "abcdefghijk")).toBe(false);
    });

    it("accepts the PL_PESEL fully-qualified code", () => {
      expect(validate("PL_PESEL", "90051500017")).toBe(true);
    });
  });

  describe("normalize / format / parse", () => {
    it("strips non-digits", () => {
      expect(normalize("PESEL", "900-515-00017")).toBe("90051500017");
    });

    it("returns ok with confidence high", () => {
      const r = parse("PESEL", "90051500017");
      expect(r).toEqual({
        ok: true,
        code: "PL_PESEL",
        normalized: "90051500017",
        formatted: "90051500017",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("PESEL", "90051500010");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });

    it("returns kind=too_short for fewer digits", () => {
      const r = parse("PESEL", "9005150");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });
  });
});

describe("PL — NIP", () => {
  describe("validate", () => {
    it("accepts valid NIPs", () => {
      // 526312446 dv=9 → 5263124469
      expect(validate("NIP", "5263124469")).toBe(true);
      expect(validate("NIP", "526-312-44-69")).toBe(true);
      // 770000007 dv=5 → 7700000075
      expect(validate("NIP", "7700000075")).toBe(true);
      // 100000000 dv=6 → 1000000006
      expect(validate("NIP", "1000000006")).toBe(true);
    });

    it("rejects body where checksum would be 10", () => {
      // 123456789 → r=10, would be reissued → reject
      expect(validate("NIP", "1234567890")).toBe(false);
    });

    it("rejects bad checksums", () => {
      expect(validate("NIP", "5263124460")).toBe(false);
      expect(validate("NIP", "7700000070")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("NIP", "")).toBe(false);
      expect(validate("NIP", "12345")).toBe(false);
      expect(validate("NIP", "12345678901")).toBe(false);
      expect(validate("NIP", "abcdefghij")).toBe(false);
    });
  });

  describe("format", () => {
    it("formats canonical form", () => {
      expect(format("NIP", "5263124469")).toBe("526-312-44-69");
      expect(format("NIP", "526-312-44-69")).toBe("526-312-44-69");
    });
  });

  describe("parse", () => {
    it("returns ok with confidence high", () => {
      const r = parse("NIP", "526-312-44-69");
      expect(r).toEqual({
        ok: true,
        code: "PL_NIP",
        normalized: "5263124469",
        formatted: "526-312-44-69",
        confidence: "high",
      });
    });
  });
});

describe("PL — REGON", () => {
  describe("validate", () => {
    it("accepts valid 9-digit REGONs", () => {
      // 12345678 dv=5 → 123456785
      expect(validate("REGON", "123456785")).toBe(true);
    });

    it("accepts valid 14-digit REGONs", () => {
      // 123456785 + 1234 + dv14=7 → 12345678512347
      expect(validate("REGON", "12345678512347")).toBe(true);
    });

    it("rejects 14-digit REGON with invalid principal", () => {
      // 9-digit principal must independently pass mod-11
      expect(validate("REGON", "12345678012347")).toBe(false);
    });

    it("rejects bad checksums", () => {
      expect(validate("REGON", "123456789")).toBe(false);
      expect(validate("REGON", "12345678512340")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("REGON", "")).toBe(false);
      expect(validate("REGON", "12345")).toBe(false);
      expect(validate("REGON", "1234567891234")).toBe(false); // 13 digits — not valid length
      expect(validate("REGON", "abcdefghi")).toBe(false);
    });
  });

  describe("parse", () => {
    it("returns ok for 9-digit", () => {
      const r = parse("REGON", "123456785");
      expect(r).toEqual({
        ok: true,
        code: "PL_REGON",
        normalized: "123456785",
        formatted: "123456785",
        confidence: "high",
      });
    });

    it("returns kind=invalid_format for 13-digit (in the 10..13 gap)", () => {
      const r = parse("REGON", "1234567891234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=too_long for >14 digits", () => {
      const r = parse("REGON", "123456785123470");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
