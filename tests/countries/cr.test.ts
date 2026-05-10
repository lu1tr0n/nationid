import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/cr/index.ts";

// CR Cédula Física: 9 digits, format `0-0000-0000`. No check digit.
// Provincia (1st digit) must be 1-9 per Código Electoral.
//   - 1-1234-5678: provincia 1 (San José).
//   - 5-9876-5432: provincia 5 (Guanacaste).
//   - 7-0000-0001: provincia 7 (Limón) low correlative.
//   - 8-1111-2222: provincia 8 (naturalizados).
//   - 9-9999-9999: provincia 9 (special), upper bound.

describe("CR — Cédula Física", () => {
  describe("validate", () => {
    it("accepts valid cédulas (raw and formatted)", () => {
      expect(validate("CEDULA_FISICA", "112345678")).toBe(true);
      expect(validate("CEDULA_FISICA", "1-1234-5678")).toBe(true);
      expect(validate("CEDULA_FISICA", "598765432")).toBe(true);
      expect(validate("CEDULA_FISICA", "5-9876-5432")).toBe(true);
      expect(validate("CEDULA_FISICA", "700000001")).toBe(true);
      expect(validate("CEDULA_FISICA", "811112222")).toBe(true);
      expect(validate("CEDULA_FISICA", "999999999")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("CEDULA_FISICA", "")).toBe(false);
      expect(validate("CEDULA_FISICA", "1234")).toBe(false);
      expect(validate("CEDULA_FISICA", "1234567890")).toBe(false); // 10 digits
      expect(validate("CEDULA_FISICA", "ABCDEFGHI")).toBe(false);
      expect(validate("CEDULA_FISICA", "12-34-5678")).toBe(false); // 8 digits after stripping
    });

    it("rejects provincia 0 (out of spec)", () => {
      expect(validate("CEDULA_FISICA", "012345678")).toBe(false);
      expect(validate("CEDULA_FISICA", "0-1234-5678")).toBe(false);
      expect(validate("CEDULA_FISICA", "000000000")).toBe(false);
    });

    it("accepts the CR_CEDULA_FISICA fully-qualified code", () => {
      expect(validate("CR_CEDULA_FISICA", "112345678")).toBe(true);
    });

    it("ignores whitespace in raw input", () => {
      expect(validate("CEDULA_FISICA", " 1 1234 5678 ")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at provincia + tomo + asiento boundaries", () => {
      expect(format("CEDULA_FISICA", "112345678")).toBe("1-1234-5678");
      expect(format("CEDULA_FISICA", "1-1234-5678")).toBe("1-1234-5678");
      expect(format("CEDULA_FISICA", "1 1234 5678")).toBe("1-1234-5678");
    });

    it("returns input unchanged for invalid form", () => {
      expect(format("CEDULA_FISICA", "1234")).toBe("1234");
      expect(format("CEDULA_FISICA", "012345678")).toBe("012345678"); // provincia 0
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("CEDULA_FISICA", "1-1234-5678")).toBe("112345678");
      expect(normalize("CEDULA_FISICA", "1 1234 5678")).toBe("112345678");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CEDULA_FISICA", "1-1234-5678");
      expect(r).toEqual({
        ok: true,
        code: "CR_CEDULA_FISICA",
        normalized: "112345678",
        formatted: "1-1234-5678",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CEDULA_FISICA", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CEDULA_FISICA", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CEDULA_FISICA", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for provincia 0", () => {
      const r = parse("CEDULA_FISICA", "012345678");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("round-trips: format(normalize(x)) == format(x)", () => {
      const valid = "1-1234-5678";
      expect(format("CEDULA_FISICA", normalize("CEDULA_FISICA", valid))).toBe(
        format("CEDULA_FISICA", valid),
      );
    });
  });
});

// CR DIMEX: 11 or 12 digits, no separators on the physical card.
//   - 11 digits: 122334455667
//   - 12 digits: 155667788990
// No check digit.

describe("CR — DIMEX", () => {
  describe("validate", () => {
    it("accepts valid 11-digit DIMEX", () => {
      expect(validate("DIMEX", "12233445566")).toBe(true);
      expect(validate("DIMEX", "10000000001")).toBe(true);
      expect(validate("DIMEX", "19999999999")).toBe(true);
    });

    it("accepts valid 12-digit DIMEX", () => {
      expect(validate("DIMEX", "155667788990")).toBe(true);
      expect(validate("DIMEX", "100000000001")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("DIMEX", "")).toBe(false);
      expect(validate("DIMEX", "1234567890")).toBe(false); // 10 digits
      expect(validate("DIMEX", "1234567890123")).toBe(false); // 13 digits
      expect(validate("DIMEX", "ABCDEFGHIJK")).toBe(false);
      expect(validate("DIMEX", "12 34 56 78")).toBe(false); // 8 digits after stripping
    });

    it("accepts the CR_DIMEX fully-qualified code", () => {
      expect(validate("CR_DIMEX", "12233445566")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns digits unchanged (no separator on the physical card)", () => {
      expect(format("DIMEX", "12233445566")).toBe("12233445566");
      expect(format("DIMEX", "155667788990")).toBe("155667788990");
    });

    it("strips separators from input", () => {
      expect(format("DIMEX", "1 2233 4455 66")).toBe("12233445566");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("DIMEX", "1234")).toBe("1234");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("DIMEX", "12233445566");
      expect(r).toEqual({
        ok: true,
        code: "CR_DIMEX",
        normalized: "12233445566",
        formatted: "12233445566",
        confidence: "moderate",
      });
    });

    it("returns kind=too_short for <11 digits", () => {
      const r = parse("DIMEX", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for >12 digits", () => {
      const r = parse("DIMEX", "1234567890123");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

// CR Cédula Jurídica: 10 digits, prefix 3, format `3-000-000000`.
//   - 3-101-123456: SA típica.
//   - 3-102-987654: SRL.
//   - 3-110-000001: minimum correlativo.
//   - 3-999-999999: upper bound.
//   - 3-002-000000: low tipo entidad.

describe("CR — Cédula Jurídica", () => {
  describe("validate", () => {
    it("accepts valid jurídicas (raw and formatted)", () => {
      expect(validate("CEDULA_JURIDICA", "3101123456")).toBe(true);
      expect(validate("CEDULA_JURIDICA", "3-101-123456")).toBe(true);
      expect(validate("CEDULA_JURIDICA", "3102987654")).toBe(true);
      expect(validate("CEDULA_JURIDICA", "3-102-987654")).toBe(true);
      expect(validate("CEDULA_JURIDICA", "3110000001")).toBe(true);
      expect(validate("CEDULA_JURIDICA", "3999999999")).toBe(true);
      expect(validate("CEDULA_JURIDICA", "3002000000")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("CEDULA_JURIDICA", "")).toBe(false);
      expect(validate("CEDULA_JURIDICA", "1234")).toBe(false);
      expect(validate("CEDULA_JURIDICA", "31011234567")).toBe(false); // 11 digits
      expect(validate("CEDULA_JURIDICA", "ABCDEFGHIJ")).toBe(false);
      expect(validate("CEDULA_JURIDICA", "31011-2345678")).toBe(false); // 11 digits after stripping
    });

    it("rejects non-3 prefix", () => {
      expect(validate("CEDULA_JURIDICA", "2101123456")).toBe(false);
      expect(validate("CEDULA_JURIDICA", "5101123456")).toBe(false);
      expect(validate("CEDULA_JURIDICA", "0101123456")).toBe(false);
    });

    it("accepts the CR_CEDULA_JURIDICA fully-qualified code", () => {
      expect(validate("CR_CEDULA_JURIDICA", "3101123456")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at prefix + tipo + correlativo boundaries", () => {
      expect(format("CEDULA_JURIDICA", "3101123456")).toBe("3-101-123456");
      expect(format("CEDULA_JURIDICA", "3-101-123456")).toBe("3-101-123456");
      expect(format("CEDULA_JURIDICA", "3 101 123456")).toBe("3-101-123456");
    });

    it("returns input unchanged for invalid form (wrong prefix)", () => {
      expect(format("CEDULA_JURIDICA", "2101123456")).toBe("2101123456");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CEDULA_JURIDICA", "3-101-123456");
      expect(r).toEqual({
        ok: true,
        code: "CR_CEDULA_JURIDICA",
        normalized: "3101123456",
        formatted: "3-101-123456",
        confidence: "high",
      });
    });

    it("returns kind=invalid_format for non-3 prefix at correct length", () => {
      const r = parse("CEDULA_JURIDICA", "2101123456");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=too_short for <10 digits", () => {
      const r = parse("CEDULA_JURIDICA", "310112345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for >10 digits", () => {
      const r = parse("CEDULA_JURIDICA", "31011234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CEDULA_JURIDICA", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });
  });
});

describe("CR — Pasaporte (CR_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (9 alphanumeric)", () => {
      expect(validate("PASAPORTE", "C12345678")).toBe(true);
      expect(validate("PASAPORTE", "123456789")).toBe(true);
      expect(validate("PASAPORTE", "ABCDEF123")).toBe(true);
      expect(validate("PASAPORTE", "AAA000001")).toBe(true);
      expect(validate("PASAPORTE", " C12345678 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "C1234567")).toBe(false); // too short
      expect(validate("PASAPORTE", "C123456789")).toBe(false); // too long
      expect(validate("PASAPORTE", "@@@@@@@@@")).toBe(false);
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "c12345678")).toBe(true);
    });

    it("accepts the CR_PASAPORTE fully-qualified code", () => {
      expect(validate("CR_PASAPORTE", "C12345678")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "c12345678");
      expect(r).toEqual({
        ok: true,
        code: "CR_PASAPORTE",
        normalized: "C12345678",
        formatted: "C12345678",
        confidence: "low",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PASAPORTE", "C1234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PASAPORTE", "C123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
