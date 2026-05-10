import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/ni/index.ts";

describe("NI — Cédula", () => {
  describe("validate", () => {
    it("accepts valid cédulas (raw 14-char form, A-Z DV)", () => {
      // 3 muni + 6 DDMMYY + 4 corr + 1 letra
      expect(validate("CEDULA", "0011301800008X")).toBe(true);
      expect(validate("CEDULA", "0010101800001A")).toBe(true);
      expect(validate("CEDULA", "1232812900099Z")).toBe(true);
      expect(validate("CEDULA", "5550712850500K")).toBe(true);
    });

    it("accepts the formatted form `000-DDMMYY-0000A`", () => {
      expect(validate("CEDULA", "001-130180-0008X")).toBe(true);
      expect(validate("CEDULA", "555-071285-0500K")).toBe(true);
    });

    it("accepts the NI_CEDULA fully-qualified code", () => {
      expect(validate("NI_CEDULA", "0011301800008X")).toBe(true);
    });

    it("normalizes lowercase letter DV to upper", () => {
      expect(validate("CEDULA", "001-130180-0008x")).toBe(true);
    });

    it("rejects municipio = 000", () => {
      expect(validate("CEDULA", "0001301800008X")).toBe(false);
      expect(validate("CEDULA", "000-130180-0008X")).toBe(false);
    });

    it("rejects implausible day/month", () => {
      // Day 32
      expect(validate("CEDULA", "0013201800008X")).toBe(false);
      // Month 13
      expect(validate("CEDULA", "0011513800008X")).toBe(false);
      // Day 00
      expect(validate("CEDULA", "0010001800008X")).toBe(false);
      // Month 00
      expect(validate("CEDULA", "0011300800008X")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CEDULA", "")).toBe(false);
      expect(validate("CEDULA", "   ")).toBe(false);
      expect(validate("CEDULA", "1234")).toBe(false);
      expect(validate("CEDULA", "0011301800008")).toBe(false); // missing letter
      expect(validate("CEDULA", "0011301800008XY")).toBe(false); // too long
      expect(validate("CEDULA", "ABCDEFGHIJKLMN")).toBe(false); // all letters
      expect(validate("CEDULA", "0011301800008Ñ")).toBe(false); // non A-Z letter
      expect(validate("CEDULA", "0011301800008 ")).toBe(false); // trailing space char
    });
  });

  describe("format", () => {
    it("inserts hyphens at canonical positions", () => {
      expect(format("CEDULA", "0011301800008X")).toBe("001-130180-0008X");
      expect(format("CEDULA", "001-130180-0008X")).toBe("001-130180-0008X");
      expect(format("CEDULA", "0011301800008x")).toBe("001-130180-0008X");
    });

    it("returns input unchanged for invalid form", () => {
      expect(format("CEDULA", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases", () => {
      expect(normalize("CEDULA", "001-130180-0008x")).toBe("0011301800008X");
    });

    it("is idempotent", () => {
      const once = normalize("CEDULA", "001-130180-0008X");
      const twice = normalize("CEDULA", once);
      expect(twice).toBe(once);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CEDULA", "001-130180-0008X");
      expect(r).toEqual({
        ok: true,
        code: "NI_CEDULA",
        normalized: "0011301800008X",
        formatted: "001-130180-0008X",
        confidence: "low",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CEDULA", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short on short input", () => {
      const r = parse("CEDULA", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long on long input", () => {
      const r = parse("CEDULA", "0011301800008XYZ");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for impossible date", () => {
      const r = parse("CEDULA", "0013201800008X");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

describe("NI — RUC", () => {
  describe("validate", () => {
    it("accepts naturales (cédula-style 14 chars ending in letter)", () => {
      expect(validate("RUC", "0011301800008X")).toBe(true);
      expect(validate("RUC", "001-130180-0008X")).toBe(true);
    });

    it("accepts jurídicas (14 digits)", () => {
      expect(validate("RUC", "12345678901234")).toBe(true);
      expect(validate("RUC", "00010000000001")).toBe(true);
    });

    it("accepts NI_RUC fully-qualified code", () => {
      expect(validate("NI_RUC", "12345678901234")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("RUC", "")).toBe(false);
      expect(validate("RUC", "1234")).toBe(false);
      expect(validate("RUC", "ABCDEFGHIJKLMN")).toBe(false);
      // 13 digits + lowercase letter is OK (we uppercase) but check this normalizes
      expect(validate("RUC", "0011301800008x")).toBe(true);
      // 12 digits + 2 letters — not a valid form
      expect(validate("RUC", "001130180008XY")).toBe(false);
      // 15 chars — too long
      expect(validate("RUC", "001130180000008X")).toBe(false);
    });
  });

  describe("format", () => {
    it("formats naturales as cédula style", () => {
      expect(format("RUC", "0011301800008X")).toBe("001-130180-0008X");
    });

    it("formats jurídicas as 4-7-3", () => {
      expect(format("RUC", "12345678901234")).toBe("1234-5678901-234");
    });

    it("returns input unchanged for invalid form", () => {
      expect(format("RUC", "abc")).toBe("abc");
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases", () => {
      expect(normalize("RUC", "001-130180-0008x")).toBe("0011301800008X");
      expect(normalize("RUC", "1234-5678901-234")).toBe("12345678901234");
    });

    it("is idempotent", () => {
      const once = normalize("RUC", "12345678901234");
      expect(normalize("RUC", once)).toBe(once);
    });
  });

  describe("parse", () => {
    it("returns ok for jurídica", () => {
      const r = parse("RUC", "12345678901234");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.code).toBe("NI_RUC");
        expect(r.normalized).toBe("12345678901234");
        expect(r.formatted).toBe("1234-5678901-234");
        expect(r.confidence).toBe("low");
      }
    });

    it("returns ok for natural", () => {
      const r = parse("RUC", "001-130180-0008X");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.normalized).toBe("0011301800008X");
        expect(r.formatted).toBe("001-130180-0008X");
      }
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("RUC", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short on short input", () => {
      const r = parse("RUC", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long on long input", () => {
      const r = parse("RUC", "001130180000008X");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
