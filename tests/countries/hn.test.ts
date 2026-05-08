import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/hn/index.ts";

// HN DNI vectors. SAR / RNP do not publish a check-digit algorithm; this spec
// validates structural constraints only:
//   - 13 digits.
//   - Departamento (positions 1-2) = 01-18 (Honduras has 18 departamentos).
//   - Año de nacimiento (positions 5-8) = 1900-2099.
//
//   Synthetic vectors:
//     0801-1990-12345  (Francisco Morazán + 1990)
//     0501-1985-00001  (Atlántida + 1985)
//     1801-2000-99999  (Gracias a Dios + 2000)
//     1001-1955-01234  (La Paz + 1955)
//     0301-1945-00005  (Comayagua + 1945)
//     0701-2010-99999  (El Paraíso + 2010)

describe("HN — DNI", () => {
  describe("validate", () => {
    it("accepts well-formed DNIs (raw and formatted)", () => {
      expect(validate("DNI", "0801199012345")).toBe(true);
      expect(validate("DNI", "0801-1990-12345")).toBe(true);
      expect(validate("DNI", "0501198500001")).toBe(true);
      expect(validate("DNI", "1801200099999")).toBe(true);
      expect(validate("DNI", "1001195501234")).toBe(true);
      expect(validate("DNI", "0301-1945-00005")).toBe(true);
      expect(validate("DNI", "0701-2010-99999")).toBe(true);
    });

    it("strips whitespace and other separators", () => {
      expect(validate("DNI", "  0801-1990-12345  ")).toBe(true);
      expect(validate("DNI", "0801 1990 12345")).toBe(true);
      expect(validate("DNI", "0801.1990.12345")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("DNI", "")).toBe(false);
      expect(validate("DNI", "1234")).toBe(false);
      expect(validate("DNI", "08011990123456")).toBe(false); // 14 digits
      expect(validate("DNI", "ABCD-EFGH-IJKLM")).toBe(false);
      expect(validate("DNI", "0801-1990-1234")).toBe(false); // 12 digits
    });

    it("rejects invalid departamento codes", () => {
      // Departamento 00, 19-99 are not assigned.
      expect(validate("DNI", "0001199012345")).toBe(false);
      expect(validate("DNI", "1901199012345")).toBe(false);
      expect(validate("DNI", "9901199012345")).toBe(false);
    });

    it("rejects implausible birth years", () => {
      // year 0000 and 1899 are out of range. Year 2100+ is also rejected.
      expect(validate("DNI", "0801000012345")).toBe(false);
      expect(validate("DNI", "0801189912345")).toBe(false);
    });

    it("accepts the HN_DNI fully-qualified code", () => {
      expect(validate("HN_DNI", "0801199012345")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at canonical positions", () => {
      expect(format("DNI", "0801199012345")).toBe("0801-1990-12345");
      expect(format("DNI", "0801-1990-12345")).toBe("0801-1990-12345");
      expect(format("DNI", "0801 1990 12345")).toBe("0801-1990-12345");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("DNI", "1234")).toBe("1234");
    });

    it("preserves round-trip: format(normalize(x)) === format(x)", () => {
      const inputs = ["0801199012345", "0801-1990-12345", "0801 1990 12345"];
      for (const x of inputs) {
        expect(format("DNI", normalize("DNI", x))).toBe(format("DNI", x));
      }
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("DNI", "0801-1990-12345")).toBe("0801199012345");
      expect(normalize("DNI", "0801 1990 12345")).toBe("0801199012345");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("DNI", "0801-1990-12345");
      expect(r).toEqual({
        ok: true,
        code: "HN_DNI",
        normalized: "0801199012345",
        formatted: "0801-1990-12345",
        confidence: "low",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("DNI", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("DNI", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("DNI", "08011990123456");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for invalid departamento", () => {
      const r = parse("DNI", "9901199012345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for implausible year", () => {
      const r = parse("DNI", "0801189912345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

// HN RTN vectors. SAR does not publish a check-digit algorithm; this spec
// validates length only, plus an all-same-digit placeholder rejection.
//
//   Synthetic vectors (clearly synthetic structural patterns):
//     08019990123456
//     12345678901234
//     99887766554433
//     08011990000001
//     05011985123456

describe("HN — RTN", () => {
  describe("validate", () => {
    it("accepts well-formed 14-digit RTNs", () => {
      expect(validate("RTN", "08019990123456")).toBe(true);
      expect(validate("RTN", "12345678901234")).toBe(true);
      expect(validate("RTN", "99887766554433")).toBe(true);
      expect(validate("RTN", "08011990000001")).toBe(true);
      expect(validate("RTN", "05011985123456")).toBe(true);
    });

    it("strips whitespace and other separators", () => {
      expect(validate("RTN", "  08019990123456  ")).toBe(true);
      expect(validate("RTN", "0801-9990-123456")).toBe(true);
      expect(validate("RTN", "0801 9990 123456")).toBe(true);
      expect(validate("RTN", "0801.9990.123456")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("RTN", "")).toBe(false);
      expect(validate("RTN", "1234")).toBe(false);
      expect(validate("RTN", "080199901234567")).toBe(false); // 15 digits
      expect(validate("RTN", "0801999012345")).toBe(false); // 13 digits
      expect(validate("RTN", "ABCDEFGHIJKLMN")).toBe(false);
      expect(validate("RTN", "0801-ABCD-123456")).toBe(false);
    });

    it("rejects all-same-digit placeholders", () => {
      expect(validate("RTN", "00000000000000")).toBe(false);
      expect(validate("RTN", "11111111111111")).toBe(false);
      expect(validate("RTN", "99999999999999")).toBe(false);
    });

    it("accepts the HN_RTN fully-qualified code", () => {
      expect(validate("HN_RTN", "08019990123456")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at the SAR-form positions", () => {
      expect(format("RTN", "08019990123456")).toBe("0801-9990-123456");
      expect(format("RTN", "0801-9990-123456")).toBe("0801-9990-123456");
      expect(format("RTN", "0801 9990 123456")).toBe("0801-9990-123456");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("RTN", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("RTN", "0801-9990-123456")).toBe("08019990123456");
      expect(normalize("RTN", "0801 9990 123456")).toBe("08019990123456");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("RTN", "0801-9990-123456");
      expect(r).toEqual({
        ok: true,
        code: "HN_RTN",
        normalized: "08019990123456",
        formatted: "0801-9990-123456",
        confidence: "unconfirmed",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("RTN", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("RTN", "0801999012345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("RTN", "080199901234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for all-same-digit", () => {
      const r = parse("RTN", "00000000000000");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});
