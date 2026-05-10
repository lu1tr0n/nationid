import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/us/index.ts";

// US SSN: 9 digits, format `AAA-GG-SSSS`. No check digit; structural rules:
// areas 000/666/9xx invalid, group 00 invalid, serial 0000 invalid.
//
// Test fixtures are synthetic. Since SSA randomizes assignments, no 9-digit
// number can be conclusively identified as "issued"; the rules below check
// only that the number passes the published structural exclusions.
//   - 123-45-6789: area 123, group 45, serial 6789 (commonly used in IRS samples).
//   - 001-01-0001: minimum-area, minimum-group, minimum-serial.
//   - 555-12-3456: midrange area.
//   - 100-50-9999: serial maxed.
//   - 699-67-8901: area just past 666.

describe("US — SSN", () => {
  describe("validate", () => {
    it("accepts valid SSNs (raw and formatted)", () => {
      expect(validate("SSN", "123456789")).toBe(true);
      expect(validate("SSN", "123-45-6789")).toBe(true);
      expect(validate("SSN", "001010001")).toBe(true);
      expect(validate("SSN", "001-01-0001")).toBe(true);
      expect(validate("SSN", "555123456")).toBe(true);
      expect(validate("SSN", "100509999")).toBe(true);
      expect(validate("SSN", "699678901")).toBe(true);
    });

    it("ignores whitespace in raw input", () => {
      expect(validate("SSN", " 123 45 6789 ")).toBe(true);
    });

    it("rejects area 000", () => {
      expect(validate("SSN", "000123456")).toBe(false);
      expect(validate("SSN", "000-12-3456")).toBe(false);
    });

    it("rejects area 666", () => {
      expect(validate("SSN", "666123456")).toBe(false);
      expect(validate("SSN", "666-12-3456")).toBe(false);
    });

    it("rejects area 9xx (ITIN namespace)", () => {
      expect(validate("SSN", "900123456")).toBe(false);
      expect(validate("SSN", "950123456")).toBe(false);
      expect(validate("SSN", "999123456")).toBe(false);
    });

    it("rejects group 00", () => {
      expect(validate("SSN", "123001234")).toBe(false);
      expect(validate("SSN", "123-00-1234")).toBe(false);
    });

    it("rejects serial 0000", () => {
      expect(validate("SSN", "123450000")).toBe(false);
      expect(validate("SSN", "123-45-0000")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("SSN", "")).toBe(false);
      expect(validate("SSN", "12345")).toBe(false);
      expect(validate("SSN", "1234567890")).toBe(false);
      expect(validate("SSN", "ABCDEFGHI")).toBe(false);
    });

    it("accepts the US_SSN fully-qualified code", () => {
      expect(validate("US_SSN", "123456789")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at canonical positions", () => {
      expect(format("SSN", "123456789")).toBe("123-45-6789");
      expect(format("SSN", "123-45-6789")).toBe("123-45-6789");
      expect(format("SSN", "123 45 6789")).toBe("123-45-6789");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("SSN", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("SSN", "123-45-6789")).toBe("123456789");
      expect(normalize("SSN", "123 45 6789")).toBe("123456789");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("SSN", "123-45-6789");
      expect(r).toEqual({
        ok: true,
        code: "US_SSN",
        normalized: "123456789",
        formatted: "123-45-6789",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("SSN", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("SSN", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("SSN", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for reserved area 9xx", () => {
      const r = parse("SSN", "900-12-3456");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for group 00", () => {
      const r = parse("SSN", "123-00-1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("round-trips: format(normalize(x)) == format(x)", () => {
      const valid = "123-45-6789";
      expect(format("SSN", normalize("SSN", valid))).toBe(format("SSN", valid));
    });
  });
});

// US ITIN: 9 digits starting with `9`, group in {50-65, 70-88, 90-92, 94-99}.
//   - 912-50-1234: group 50 (lowest valid).
//   - 988-88-7777: group 88 (highest in 70-88 range).
//   - 999-92-0001: group 92 (last in 90-92 range).
//   - 901-65-4321: group 65 (last in 50-65 range).
//   - 950-99-0000: group 99 (highest valid).

describe("US — ITIN", () => {
  describe("validate", () => {
    it("accepts valid ITINs (raw and formatted)", () => {
      expect(validate("ITIN", "912501234")).toBe(true);
      expect(validate("ITIN", "912-50-1234")).toBe(true);
      expect(validate("ITIN", "988887777")).toBe(true);
      expect(validate("ITIN", "988-88-7777")).toBe(true);
      expect(validate("ITIN", "999920001")).toBe(true);
      expect(validate("ITIN", "901654321")).toBe(true);
      expect(validate("ITIN", "950990000")).toBe(true);
    });

    it("rejects non-9 area prefix", () => {
      expect(validate("ITIN", "812501234")).toBe(false);
      expect(validate("ITIN", "012501234")).toBe(false);
      expect(validate("ITIN", "112501234")).toBe(false);
    });

    it("rejects groups outside published ranges", () => {
      expect(validate("ITIN", "912001234")).toBe(false); // group 00
      expect(validate("ITIN", "912491234")).toBe(false); // group 49 (just below 50)
      expect(validate("ITIN", "912661234")).toBe(false); // group 66 (gap 66-69)
      expect(validate("ITIN", "912691234")).toBe(false); // group 69
      expect(validate("ITIN", "912891234")).toBe(false); // group 89 (gap)
      expect(validate("ITIN", "912931234")).toBe(false); // group 93 (never assigned)
    });

    it("rejects malformed input", () => {
      expect(validate("ITIN", "")).toBe(false);
      expect(validate("ITIN", "91250")).toBe(false);
      expect(validate("ITIN", "9125012345")).toBe(false);
      expect(validate("ITIN", "ABCDEFGHI")).toBe(false);
    });

    it("accepts the US_ITIN fully-qualified code", () => {
      expect(validate("US_ITIN", "912501234")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at canonical positions", () => {
      expect(format("ITIN", "912501234")).toBe("912-50-1234");
      expect(format("ITIN", "912-50-1234")).toBe("912-50-1234");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("ITIN", "1234")).toBe("1234");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("ITIN", "912-50-1234");
      expect(r).toEqual({
        ok: true,
        code: "US_ITIN",
        normalized: "912501234",
        formatted: "912-50-1234",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("ITIN", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("ITIN", "91250");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("ITIN", "9125012345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for non-9 area", () => {
      const r = parse("ITIN", "812501234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for group outside ranges", () => {
      const r = parse("ITIN", "912661234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for unassigned group 93", () => {
      const r = parse("ITIN", "912931234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

// US EIN: 9 digits, format `NN-NNNNNNN`. Valid 2-digit prefixes:
// 01-06, 10-16, 20-27, 30-48, 50-77, 80-88, 90-99.
//   - 12-3456789: prefix 12 (Andover-ish).
//   - 06-1234567: minimum prefix in 01-06 range.
//   - 99-9876543: maximum prefix in 90-99 range.
//   - 80-1111111: prefix 80.
//   - 30-0000001: prefix 30 with low serial.

describe("US — EIN", () => {
  describe("validate", () => {
    it("accepts valid EINs (raw and formatted)", () => {
      expect(validate("EIN", "123456789")).toBe(true);
      expect(validate("EIN", "12-3456789")).toBe(true);
      expect(validate("EIN", "061234567")).toBe(true);
      expect(validate("EIN", "06-1234567")).toBe(true);
      expect(validate("EIN", "999876543")).toBe(true);
      expect(validate("EIN", "801111111")).toBe(true);
      expect(validate("EIN", "300000001")).toBe(true);
    });

    it("rejects unassigned prefixes", () => {
      expect(validate("EIN", "001234567")).toBe(false); // 00 reserved
      expect(validate("EIN", "071234567")).toBe(false); // 07 unassigned
      expect(validate("EIN", "081234567")).toBe(false); // 08 unassigned
      expect(validate("EIN", "171234567")).toBe(false); // 17 unassigned
      expect(validate("EIN", "281234567")).toBe(false); // 28 unassigned
      expect(validate("EIN", "491234567")).toBe(false); // 49 unassigned
      expect(validate("EIN", "781234567")).toBe(false); // 78 unassigned
      expect(validate("EIN", "891234567")).toBe(false); // 89 unassigned
    });

    it("rejects malformed input", () => {
      expect(validate("EIN", "")).toBe(false);
      expect(validate("EIN", "1234")).toBe(false);
      expect(validate("EIN", "1234567890")).toBe(false);
      expect(validate("EIN", "ABCDEFGHI")).toBe(false);
    });

    it("accepts the US_EIN fully-qualified code", () => {
      expect(validate("US_EIN", "123456789")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen at position 2", () => {
      expect(format("EIN", "123456789")).toBe("12-3456789");
      expect(format("EIN", "12-3456789")).toBe("12-3456789");
      expect(format("EIN", "12 3456789")).toBe("12-3456789");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("EIN", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("EIN", "12-3456789")).toBe("123456789");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("EIN", "12-3456789");
      expect(r).toEqual({
        ok: true,
        code: "US_EIN",
        normalized: "123456789",
        formatted: "12-3456789",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("EIN", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("EIN", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("EIN", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for unassigned prefix", () => {
      const r = parse("EIN", "071234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

describe("US — Passport (US_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts NGP format (1 letter + 8 digits)", () => {
      expect(validate("PASAPORTE", "A12345678")).toBe(true);
      expect(validate("PASAPORTE", "Z99999999")).toBe(true);
    });

    it("accepts legacy 9-digit format", () => {
      expect(validate("PASAPORTE", "123456789")).toBe(true);
      expect(validate("PASAPORTE", "000000001")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "A1234567")).toBe(false); // too short
      expect(validate("PASAPORTE", "A123456789")).toBe(false); // too long
      expect(validate("PASAPORTE", "12345678A")).toBe(false); // letter at end
      expect(validate("PASAPORTE", "AB1234567")).toBe(false); // 2 letters
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "a12345678")).toBe(true);
    });

    it("accepts both fully-qualified and short codes", () => {
      expect(validate("US_PASAPORTE", "A12345678")).toBe(true);
      expect(validate("PASSPORT", "A12345678")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "a12345678");
      expect(r).toEqual({
        ok: true,
        code: "US_PASAPORTE",
        normalized: "A12345678",
        formatted: "A12345678",
        confidence: "moderate",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PASAPORTE", "12345678");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PASAPORTE", "A123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
