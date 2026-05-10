import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/sv/index.ts";

describe("SV — DUI", () => {
  describe("validate", () => {
    it("accepts valid DUIs (raw and formatted)", () => {
      expect(validate("DUI", "045678903")).toBe(true);
      expect(validate("DUI", "04567890-3")).toBe(true);
      expect(validate("DUI", "123456784")).toBe(true);
      expect(validate("DUI", "12345678-4")).toBe(true);
      expect(validate("DUI", "000000000")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("DUI", "045678900")).toBe(false);
      expect(validate("DUI", "123456780")).toBe(false);
      expect(validate("DUI", "987654321")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("DUI", "")).toBe(false);
      expect(validate("DUI", "1234")).toBe(false);
      expect(validate("DUI", "1234567890")).toBe(false);
      expect(validate("DUI", "abcdefghi")).toBe(false);
    });

    it("accepts the SV_DUI fully-qualified code", () => {
      expect(validate("SV_DUI", "045678903")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen at position 8", () => {
      expect(format("DUI", "045678903")).toBe("04567890-3");
      expect(format("DUI", "04567890-3")).toBe("04567890-3");
      expect(format("DUI", "0456 7890 3")).toBe("04567890-3");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("DUI", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("DUI", "04567890-3")).toBe("045678903");
      expect(normalize("DUI", "0456 7890 3")).toBe("045678903");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("DUI", "04567890-3");
      expect(r).toEqual({
        ok: true,
        code: "SV_DUI",
        normalized: "045678903",
        formatted: "04567890-3",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("DUI", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("DUI", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("DUI", "12345678901");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("DUI", "045678900");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("SV — NIT", () => {
  describe("validate", () => {
    it("accepts valid NITs (raw and formatted)", () => {
      // 4 muni + 6 ddmmyy + 3 corr + 1 dv. Computed manually with weights 14..2.
      expect(validate("NIT", "06141505851015")).toBe(true);
      expect(validate("NIT", "0614-150585-101-5")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("NIT", "06141505851010")).toBe(false);
      expect(validate("NIT", "06141505851014")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("NIT", "")).toBe(false);
      expect(validate("NIT", "1234")).toBe(false);
      expect(validate("NIT", "061415058510155")).toBe(false);
      expect(validate("NIT", "ABCDEFGHIJKLMN")).toBe(false);
    });

    it("accepts the SV_NIT fully-qualified code", () => {
      expect(validate("SV_NIT", "06141505851015")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at the canonical positions", () => {
      expect(format("NIT", "06141505851015")).toBe("0614-150585-101-5");
      expect(format("NIT", "0614-150585-101-5")).toBe("0614-150585-101-5");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("NIT", "1234")).toBe("1234");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("NIT", "0614-150585-101-5");
      expect(r).toEqual({
        ok: true,
        code: "SV_NIT",
        normalized: "06141505851015",
        formatted: "0614-150585-101-5",
        confidence: "moderate",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("NIT", "06141505851010");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("SV — Pasaporte (SV_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (8-9 digits, optional letter prefix)", () => {
      expect(validate("PASAPORTE", "12345678")).toBe(true);
      expect(validate("PASAPORTE", "123456789")).toBe(true);
      expect(validate("PASAPORTE", "A1234567")).toBe(true);
      expect(validate("PASAPORTE", "B12345678")).toBe(true);
      expect(validate("PASAPORTE", " 12345678 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "123456")).toBe(false); // too short
      expect(validate("PASAPORTE", "1234567890A")).toBe(false); // too long
      expect(validate("PASAPORTE", "AB12345")).toBe(false); // 2 letters not allowed
      expect(validate("PASAPORTE", "@@@@@@@")).toBe(false); // strips to empty
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "a1234567")).toBe(true);
    });

    it("accepts the SV_PASAPORTE fully-qualified code", () => {
      expect(validate("SV_PASAPORTE", "12345678")).toBe(true);
    });
  });

  describe("normalize", () => {
    it("is idempotent", () => {
      const a = normalize("PASAPORTE", "a1234567");
      expect(normalize("PASAPORTE", a)).toBe(a);
      expect(a).toBe("A1234567");
    });
  });

  describe("format", () => {
    it("round-trips through normalize → format", () => {
      const raw = "a1234567";
      const n = normalize("PASAPORTE", raw);
      expect(format("PASAPORTE", n)).toBe(n);
    });

    it("returns input unchanged for invalid input", () => {
      expect(format("PASAPORTE", "1")).toBe("1");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("PASAPORTE", "a1234567");
      expect(r).toEqual({
        ok: true,
        code: "SV_PASAPORTE",
        normalized: "A1234567",
        formatted: "A1234567",
        confidence: "low",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("PASAPORTE", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for fewer than 7 chars", () => {
      const r = parse("PASAPORTE", "12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for more than 10 chars", () => {
      const r = parse("PASAPORTE", "12345678901");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("never returns invalid_checksum (no DV in spec)", () => {
      for (const input of ["", "AB", "@@@@@@@@"]) {
        const r = parse("PASAPORTE", input);
        if (!r.ok) {
          expect(r.reason.kind).not.toBe("invalid_checksum");
        }
      }
    });
  });
});
