import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/ar/index.ts";

describe("AR — DNI", () => {
  describe("validate", () => {
    it("accepts valid DNIs (7 or 8 digits, raw and formatted)", () => {
      expect(validate("DNI", "12345678")).toBe(true);
      expect(validate("DNI", "12.345.678")).toBe(true);
      expect(validate("DNI", "1234567")).toBe(true); // 7-digit (older)
      expect(validate("DNI", "1.234.567")).toBe(true);
      expect(validate("DNI", "28123456")).toBe(true);
      expect(validate("DNI", "99999999")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("DNI", "")).toBe(false);
      expect(validate("DNI", "123")).toBe(false);
      expect(validate("DNI", "123456789")).toBe(false); // too long
      expect(validate("DNI", "ABCDEFGH")).toBe(false);
    });

    it("accepts the AR_DNI fully-qualified code", () => {
      expect(validate("AR_DNI", "12345678")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts thousands separators", () => {
      expect(format("DNI", "12345678")).toBe("12.345.678");
      expect(format("DNI", "1234567")).toBe("1.234.567");
      expect(format("DNI", "12.345.678")).toBe("12.345.678");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("DNI", "12")).toBe("12");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("DNI", "12.345.678")).toBe("12345678");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("DNI", "12.345.678");
      expect(r).toEqual({
        ok: true,
        code: "AR_DNI",
        normalized: "12345678",
        formatted: "12.345.678",
        confidence: "high",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("DNI", "123");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("DNI", "123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

// CUIT/CUIL test vectors with verifier digits computed using AFIP RG 10/97
// algorithm (weights [5,4,3,2,7,6,5,4,3,2], 11 - (sum mod 11)).
//   - 20-12345678-6: prefix 20 + base 12345678 + DV 6
//   - 27-11111111-7: prefix 27 + base 11111111 + DV 7
//   - 30-70123456-8: prefix 30 (jurídica) + base + DV 8
//   - 33-12345678-0: prefix 33 + base + DV 0 (from dv == 11 -> 0)
//   - 23-33333333-3: prefix 23 + base + DV 3

describe("AR — CUIL", () => {
  describe("validate", () => {
    it("accepts valid CUILs (raw and formatted, prefixes 20/23/24/27)", () => {
      expect(validate("CUIL", "20123456786")).toBe(true);
      expect(validate("CUIL", "20-12345678-6")).toBe(true);
      expect(validate("CUIL", "27111111117")).toBe(true);
      expect(validate("CUIL", "27-11111111-7")).toBe(true);
      expect(validate("CUIL", "23333333333")).toBe(true);
      expect(validate("CUIL", "24123456781")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CUIL", "20123456780")).toBe(false);
      expect(validate("CUIL", "27111111110")).toBe(false);
      expect(validate("CUIL", "20123456789")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CUIL", "")).toBe(false);
      expect(validate("CUIL", "1234")).toBe(false);
      expect(validate("CUIL", "201234567861")).toBe(false);
      expect(validate("CUIL", "ABCDEFGHIJK")).toBe(false);
    });

    it("rejects CUIT-only prefixes (30/33/34) for CUIL", () => {
      expect(validate("CUIL", "30701234568")).toBe(false);
      expect(validate("CUIL", "33123456780")).toBe(false);
    });

    it("accepts the AR_CUIL fully-qualified code", () => {
      expect(validate("AR_CUIL", "20123456786")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at canonical positions", () => {
      expect(format("CUIL", "20123456786")).toBe("20-12345678-6");
      expect(format("CUIL", "20-12345678-6")).toBe("20-12345678-6");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CUIL", "20-12345678-6");
      expect(r).toEqual({
        ok: true,
        code: "AR_CUIL",
        normalized: "20123456786",
        formatted: "20-12345678-6",
        confidence: "high",
      });
    });

    it("returns kind=invalid_format for forbidden prefix (DV correct)", () => {
      // 30-70123456-8 has correct DV but prefix 30 is CUIT-only; CUIL forbids it.
      const r = parse("CUIL", "30701234568");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("CUIL", "20123456780");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("AR — CUIT", () => {
  describe("validate", () => {
    it("accepts valid CUITs (personas físicas + jurídicas)", () => {
      expect(validate("CUIT", "20123456786")).toBe(true);
      expect(validate("CUIT", "20-12345678-6")).toBe(true);
      expect(validate("CUIT", "27111111117")).toBe(true);
      expect(validate("CUIT", "30701234568")).toBe(true);
      expect(validate("CUIT", "30-70123456-8")).toBe(true);
      expect(validate("CUIT", "33123456780")).toBe(true);
      expect(validate("CUIT", "23333333333")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CUIT", "20123456780")).toBe(false);
      expect(validate("CUIT", "30701234560")).toBe(false);
      expect(validate("CUIT", "33123456789")).toBe(false);
    });

    it("rejects forbidden prefixes (even when DV is correct)", () => {
      // Prefix 28: DV computed from 2812345678 = 7. Still rejected (forbidden).
      expect(validate("CUIT", "28123456787")).toBe(false);
      // Prefix 35: DV computed from 3512345678 = 3. Still rejected (forbidden).
      expect(validate("CUIT", "35123456783")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CUIT", "")).toBe(false);
      expect(validate("CUIT", "1234")).toBe(false);
      expect(validate("CUIT", "201234567861")).toBe(false);
      expect(validate("CUIT", "ABCDEFGHIJK")).toBe(false);
    });

    it("accepts the AR_CUIT fully-qualified code", () => {
      expect(validate("AR_CUIT", "30701234568")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at canonical positions", () => {
      expect(format("CUIT", "30701234568")).toBe("30-70123456-8");
      expect(format("CUIT", "30-70123456-8")).toBe("30-70123456-8");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CUIT", "30-70123456-8");
      expect(r).toEqual({
        ok: true,
        code: "AR_CUIT",
        normalized: "30701234568",
        formatted: "30-70123456-8",
        confidence: "high",
      });
    });

    it("returns kind=invalid_format for forbidden prefix (DV correct)", () => {
      const r = parse("CUIT", "28123456787");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("CUIT", "20123456780");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
