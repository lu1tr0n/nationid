import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/co/index.ts";

describe("CO — CC (Cédula de Ciudadanía)", () => {
  describe("validate", () => {
    it("accepts valid CC numbers (6-10 digits, raw and formatted)", () => {
      expect(validate("CC", "1020304050")).toBe(true);
      expect(validate("CC", "1.020.304.050")).toBe(true);
      expect(validate("CC", "12345678")).toBe(true);
      expect(validate("CC", "123456")).toBe(true); // min length
      expect(validate("CC", "9999999999")).toBe(true); // max length
      expect(validate("CC", " 1020304050 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("CC", "")).toBe(false);
      expect(validate("CC", "12345")).toBe(false); // too short
      expect(validate("CC", "12345678901")).toBe(false); // too long
      expect(validate("CC", "abcdef")).toBe(false); // all letters strip to empty
      expect(validate("CC", "abc")).toBe(false);
    });

    it("accepts the CO_CC fully-qualified code", () => {
      expect(validate("CO_CC", "1020304050")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts thousands separators", () => {
      expect(format("CC", "1020304050")).toBe("1.020.304.050");
      expect(format("CC", "12345678")).toBe("12.345.678");
      expect(format("CC", "123456")).toBe("123.456");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CC", "12")).toBe("12");
    });

    it("mask reflects the dotted display form (regression for F-PROP-001)", async () => {
      // CO_CC's `format()` always emits thousands-separated digits; the
      // `mask` field used to advertise plain digits, which contradicted the
      // formatter and broke property test P10. The fix aligns mask with
      // format output.
      const { ccSpec } = await import("../../src/countries/co/cc.ts");
      expect(ccSpec.mask).toBe("0.000.000.000");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("CC", "1.020.304.050")).toBe("1020304050");
      expect(normalize("CC", "12 345 678")).toBe("12345678");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CC", "1.020.304.050");
      expect(r).toEqual({
        ok: true,
        code: "CO_CC",
        normalized: "1020304050",
        formatted: "1.020.304.050",
        confidence: "low",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CC", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CC", "12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CC", "12345678901");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

describe("CO — CE (Cédula de Extranjería)", () => {
  describe("validate", () => {
    it("accepts valid CE numbers (6-8 digits)", () => {
      expect(validate("CE", "123456")).toBe(true);
      expect(validate("CE", "1234567")).toBe(true);
      expect(validate("CE", "12345678")).toBe(true);
      expect(validate("CE", "234567")).toBe(true);
      expect(validate("CE", " 12345678 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("CE", "")).toBe(false);
      expect(validate("CE", "12345")).toBe(false); // too short
      expect(validate("CE", "123456789")).toBe(false); // too long
      expect(validate("CE", "abcdefgh")).toBe(false); // all letters strip to empty
    });

    it("accepts the CO_CE fully-qualified code", () => {
      expect(validate("CO_CE", "12345678")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("CE", "12345678");
      expect(r).toEqual({
        ok: true,
        code: "CO_CE",
        normalized: "12345678",
        formatted: "12345678",
        confidence: "low",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CE", "12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CE", "123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

describe("CO — TI (Tarjeta de Identidad)", () => {
  describe("validate", () => {
    it("accepts valid TI numbers (10-11 digits)", () => {
      expect(validate("TI", "1020304050")).toBe(true);
      expect(validate("TI", "10203040506")).toBe(true);
      expect(validate("TI", "1234567890")).toBe(true);
      expect(validate("TI", "12345678901")).toBe(true);
      expect(validate("TI", " 1020304050 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("TI", "")).toBe(false);
      expect(validate("TI", "123456789")).toBe(false); // 9 digits — too short for TI
      expect(validate("TI", "123456789012")).toBe(false); // too long
      expect(validate("TI", "abcdefghij")).toBe(false); // all letters strip to empty
    });

    it("accepts the CO_TI fully-qualified code", () => {
      expect(validate("CO_TI", "1020304050")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("TI", "1020304050");
      expect(r).toEqual({
        ok: true,
        code: "CO_TI",
        normalized: "1020304050",
        formatted: "1020304050",
        confidence: "low",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("TI", "123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("TI", "123456789012");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

describe("CO — Pasaporte", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (alphanumeric, 6-12 chars)", () => {
      expect(validate("PASAPORTE", "AB123456")).toBe(true);
      expect(validate("PASAPORTE", "PA1234567")).toBe(true);
      expect(validate("PASAPORTE", "12345678")).toBe(true);
      expect(validate("PASAPORTE", "ABC123XYZ456")).toBe(true);
      expect(validate("PASAPORTE", "abcdef")).toBe(true); // normalizes to upper
      expect(validate("PASAPORTE", " AB-123-456 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "AB12")).toBe(false); // too short
      expect(validate("PASAPORTE", "AB12345678901234")).toBe(false); // too long
      expect(validate("PASAPORTE", "AB$%^")).toBe(false); // special chars stripped, residual too short
      expect(validate("PASAPORTE", "@@@@@@")).toBe(false); // all stripped
    });

    it("accepts the CO_PASAPORTE fully-qualified code", () => {
      expect(validate("CO_PASAPORTE", "AB123456")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success with normalized form", () => {
      const r = parse("PASAPORTE", "ab123456");
      expect(r).toEqual({
        ok: true,
        code: "CO_PASAPORTE",
        normalized: "AB123456",
        formatted: "AB123456",
        confidence: "unconfirmed",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PASAPORTE", "AB12");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PASAPORTE", "AB1234567890123");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

// CO_NIT test vectors with DVs computed via DIAN Concepto 015766 algorithm
// (mod-11, weights [3,7,13,17,19,23,29,37,41,43] right-to-left; r<2 → r,
// otherwise 11-r). All bodies SYNTHETIC.
//   - 900123456-8  — body 900123456 + DV 8
//   - 800100123-9  — body 800100123 + DV 9
//   - 830015425-3  — body 830015425 + DV 3
//   - 1020304050-8 — 10-digit body + DV 8
//   - 987654321-7  — body 987654321 + DV 7
//   - 100200300-6  — body 100200300 + DV 6

describe("CO — NIT", () => {
  describe("validate", () => {
    it("accepts valid NITs (raw and formatted)", () => {
      expect(validate("NIT", "9001234568")).toBe(true);
      expect(validate("NIT", "900123456-8")).toBe(true);
      expect(validate("NIT", "8001001239")).toBe(true);
      expect(validate("NIT", "800100123-9")).toBe(true);
      expect(validate("NIT", "8300154253")).toBe(true);
      expect(validate("NIT", "10203040508")).toBe(true); // 10-digit body
      expect(validate("NIT", "1020304050-8")).toBe(true);
      expect(validate("NIT", "9876543217")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("NIT", "9001234560")).toBe(false);
      expect(validate("NIT", "8001001230")).toBe(false);
      expect(validate("NIT", "8300154259")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("NIT", "")).toBe(false);
      expect(validate("NIT", "1234")).toBe(false); // too short
      expect(validate("NIT", "123456789012")).toBe(false); // too long
      expect(validate("NIT", "ABCDEFGHIJ")).toBe(false); // letters
      expect(validate("NIT", "900-123-456")).toBe(false); // 9 digits after stripping is too short
    });

    it("rejects all-same-digit sequences (placeholders)", () => {
      // 0000000000 sums to 0 → DV 0, technically passes mod-11 — rejected by convention.
      expect(validate("NIT", "0000000000")).toBe(false);
      expect(validate("NIT", "1111111111")).toBe(false);
    });

    it("accepts the CO_NIT fully-qualified code", () => {
      expect(validate("CO_NIT", "9001234568")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen before the DV", () => {
      expect(format("NIT", "9001234568")).toBe("900123456-8");
      expect(format("NIT", "10203040508")).toBe("1020304050-8");
      expect(format("NIT", "900123456-8")).toBe("900123456-8");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("NIT", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("NIT", "900123456-8")).toBe("9001234568");
      expect(normalize("NIT", "900.123.456-8")).toBe("9001234568");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("NIT", "900123456-8");
      expect(r).toEqual({
        ok: true,
        code: "CO_NIT",
        normalized: "9001234568",
        formatted: "900123456-8",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("NIT", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("NIT", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("NIT", "123456789012");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for all-same-digit", () => {
      const r = parse("NIT", "0000000000");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("NIT", "9001234560");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
