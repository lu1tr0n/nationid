import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/do/index.ts";

// DO Cédula vectors. DV computed via standard Luhn (ISO/IEC 7812-1) over all
// 11 digits — the convention used by validator.js `isIdentityCard('es-DO')`
// and DGII e-CF community implementations.
//   - 00112345673: body 0011234567 + Luhn DV 3.
//   - 40212345678: body 4021234567 + Luhn DV 8.
//   - 22356789010: body 2235678901 + Luhn DV 0.
//   - 10310203046: body 1031020304 + Luhn DV 6.
//   - 00199999913: body 0019999991 + Luhn DV 3.

describe("DO — Cédula", () => {
  describe("validate", () => {
    it("accepts valid Cédulas (raw and formatted)", () => {
      expect(validate("CEDULA", "00112345673")).toBe(true);
      expect(validate("CEDULA", "001-1234567-3")).toBe(true);
      expect(validate("CEDULA", "40212345678")).toBe(true);
      expect(validate("CEDULA", "402-1234567-8")).toBe(true);
      expect(validate("CEDULA", "22356789010")).toBe(true);
      expect(validate("CEDULA", "10310203046")).toBe(true);
      expect(validate("CEDULA", "00199999913")).toBe(true);
    });

    it("strips whitespace and other separators", () => {
      expect(validate("CEDULA", "001 1234567 3")).toBe(true);
      expect(validate("CEDULA", "  001-1234567-3  ")).toBe(true);
      expect(validate("CEDULA", "001.1234567.3")).toBe(true);
    });

    it("rejects invalid Luhn check digits", () => {
      expect(validate("CEDULA", "00112345670")).toBe(false);
      expect(validate("CEDULA", "00112345674")).toBe(false);
      expect(validate("CEDULA", "40212345670")).toBe(false);
      expect(validate("CEDULA", "22356789011")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CEDULA", "")).toBe(false);
      expect(validate("CEDULA", "1234")).toBe(false);
      expect(validate("CEDULA", "001123456733")).toBe(false);
      expect(validate("CEDULA", "ABCDEFGHIJK")).toBe(false);
      expect(validate("CEDULA", "001-1234567-K")).toBe(false);
    });

    it("accepts the DO_CEDULA fully-qualified code", () => {
      expect(validate("DO_CEDULA", "00112345673")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at the canonical positions", () => {
      expect(format("CEDULA", "00112345673")).toBe("001-1234567-3");
      expect(format("CEDULA", "001-1234567-3")).toBe("001-1234567-3");
      expect(format("CEDULA", "001 1234567 3")).toBe("001-1234567-3");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CEDULA", "1234")).toBe("1234");
    });

    it("preserves round-trip: format(normalize(x)) === format(x)", () => {
      const inputs = ["00112345673", "001-1234567-3", "001 1234567 3"];
      for (const x of inputs) {
        expect(format("CEDULA", normalize("CEDULA", x))).toBe(format("CEDULA", x));
      }
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("CEDULA", "001-1234567-3")).toBe("00112345673");
      expect(normalize("CEDULA", "001 1234567 3")).toBe("00112345673");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CEDULA", "001-1234567-3");
      expect(r).toEqual({
        ok: true,
        code: "DO_CEDULA",
        normalized: "00112345673",
        formatted: "001-1234567-3",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CEDULA", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CEDULA", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CEDULA", "001123456733");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("CEDULA", "00112345670");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// DO RNC vectors. Algorithm: weights [7,9,8,6,5,4,3,2] over first 8 digits
// LTR; r = sum mod 11; DV = (r==0 ? 2 : r==1 ? 1 : 11 - r).
//   - 131234569: body 13123456, sum=112, r=2, DV=9.
//   - 101000007: body 10100000, sum=15,  r=4, DV=7.
//   - 001123458: body 00112345, sum=58,  r=3, DV=8.
//   - 123456786: body 12345678, sum=159, r=5, DV=6.
//   - 987654325: body 98765432, sum=215, r=6, DV=5.
//   - 134123455: body 13412345, DV 5.
//   - 137000009: body 13700000, DV 9.

describe("DO — RNC", () => {
  describe("validate", () => {
    it("accepts valid RNCs", () => {
      expect(validate("RNC", "131234569")).toBe(true);
      expect(validate("RNC", "101000007")).toBe(true);
      expect(validate("RNC", "001123458")).toBe(true);
      expect(validate("RNC", "123456786")).toBe(true);
      expect(validate("RNC", "987654325")).toBe(true);
      expect(validate("RNC", "134123455")).toBe(true);
      expect(validate("RNC", "137000009")).toBe(true);
    });

    it("strips whitespace and other separators", () => {
      expect(validate("RNC", "  131234569  ")).toBe(true);
      expect(validate("RNC", "131-23-45-69")).toBe(true);
      expect(validate("RNC", "13 1234569")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("RNC", "131234560")).toBe(false);
      expect(validate("RNC", "101000000")).toBe(false);
      expect(validate("RNC", "123456780")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("RNC", "")).toBe(false);
      expect(validate("RNC", "12345")).toBe(false);
      expect(validate("RNC", "1234567890")).toBe(false);
      expect(validate("RNC", "ABCDEFGHI")).toBe(false);
      expect(validate("RNC", "131234ABC")).toBe(false);
    });

    it("rejects all-same-digit placeholders", () => {
      expect(validate("RNC", "000000000")).toBe(false);
      expect(validate("RNC", "111111111")).toBe(false);
      expect(validate("RNC", "999999999")).toBe(false);
    });

    it("accepts the DO_RNC fully-qualified code", () => {
      expect(validate("DO_RNC", "131234569")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns the canonical 9-digit form", () => {
      expect(format("RNC", "131234569")).toBe("131234569");
      expect(format("RNC", "131-234-569")).toBe("131234569");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("RNC", "12345")).toBe("12345");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("RNC", "131-23-45-69")).toBe("131234569");
      expect(normalize("RNC", "131 234 569")).toBe("131234569");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("RNC", "131234569");
      expect(r).toEqual({
        ok: true,
        code: "DO_RNC",
        normalized: "131234569",
        formatted: "131234569",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("RNC", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("RNC", "12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("RNC", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for all-same-digit", () => {
      const r = parse("RNC", "000000000");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("RNC", "131234560");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("DO — Pasaporte (DO_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (2-letter office prefix + 7 digits)", () => {
      expect(validate("PASAPORTE", "SD1234567")).toBe(true);
      expect(validate("PASAPORTE", "PP1234567")).toBe(true);
      expect(validate("PASAPORTE", "AB0000001")).toBe(true);
      expect(validate("PASAPORTE", "ZZ9999999")).toBe(true);
      expect(validate("PASAPORTE", " SD1234567 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "S1234567")).toBe(false); // 1 letter
      expect(validate("PASAPORTE", "SDD1234567")).toBe(false); // 3 letters
      expect(validate("PASAPORTE", "SD123456")).toBe(false); // 6 digits — too short
      expect(validate("PASAPORTE", "SD12345678")).toBe(false); // 8 digits — too long
      expect(validate("PASAPORTE", "1SD234567")).toBe(false); // digit before letters
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "sd1234567")).toBe(true);
    });

    it("accepts the DO_PASAPORTE fully-qualified code", () => {
      expect(validate("DO_PASAPORTE", "SD1234567")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "sd1234567");
      expect(r).toEqual({
        ok: true,
        code: "DO_PASAPORTE",
        normalized: "SD1234567",
        formatted: "SD1234567",
        confidence: "moderate",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PASAPORTE", "SD12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PASAPORTE", "SD12345678");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
