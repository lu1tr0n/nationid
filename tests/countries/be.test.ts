import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/be/index.ts";

describe("BE — NRN (Rijksregisternummer)", () => {
  describe("validate", () => {
    it("accepts pre-2000 NRNs", () => {
      // 1985-04-12 ord 001 → 850412001 mod 97 = 3, dv = 94
      expect(validate("NRN", "85041200194")).toBe(true);
      expect(validate("NRN", "85.04.12-001.94")).toBe(true);
    });

    it("accepts post-2000 NRNs (prepend-2 algorithm)", () => {
      // 2010-05-15 ord 003 → "2100515003" mod 97 = 82, dv = 15
      expect(validate("NRN", "10051500315")).toBe(true);
      // 2005-01-01 ord 001 → "2050101001" mod 97 = 84, dv = 13
      expect(validate("NRN", "05010100113")).toBe(true);
    });

    it("rejects bad checksums", () => {
      expect(validate("NRN", "85041200100")).toBe(false);
      expect(validate("NRN", "10051500300")).toBe(false);
    });

    it("rejects implausible months and days", () => {
      // month 99 (not bis-shifted to 1..12) → reject
      expect(validate("NRN", "85991200194")).toBe(false);
      // day 99 → reject
      expect(validate("NRN", "85049900194")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("NRN", "")).toBe(false);
      expect(validate("NRN", "1234")).toBe(false);
      expect(validate("NRN", "850412001940")).toBe(false);
      expect(validate("NRN", "ABCDEFGHIJK")).toBe(false);
    });

    it("accepts the BE_NRN fully-qualified code", () => {
      expect(validate("BE_NRN", "85041200194")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts canonical separators", () => {
      expect(format("NRN", "85041200194")).toBe("85.04.12-001.94");
      expect(format("NRN", "85.04.12-001.94")).toBe("85.04.12-001.94");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("NRN", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("NRN", "85.04.12-001.94")).toBe("85041200194");
    });

    it("is idempotent", () => {
      const a = normalize("NRN", "85.04.12-001.94");
      expect(normalize("NRN", a)).toBe(a);
    });
  });

  describe("parse", () => {
    it("returns ok with formatted form", () => {
      const r = parse("NRN", "85.04.12-001.94");
      expect(r).toEqual({
        ok: true,
        code: "BE_NRN",
        normalized: "85041200194",
        formatted: "85.04.12-001.94",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("NRN", "85041200100");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });

    it("returns kind=too_short for too few digits", () => {
      const r = parse("NRN", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });
  });
});

describe("BE — BTW (Numéro d'entreprise)", () => {
  describe("validate", () => {
    it("accepts valid BTW with leading 0", () => {
      // first8 = 01234567 = 1234567 mod 97 = 48, dv = 49
      expect(validate("BTW", "BE0123456749")).toBe(true);
      expect(validate("BTW", "BE 0123.456.749")).toBe(true);
      expect(validate("VAT", "BE0123456749")).toBe(true);
      expect(validate("TVA", "BE0123456749")).toBe(true);
    });

    it("left-pads pre-2008 9-digit numbers with leading zero", () => {
      // Same number without leading zero
      expect(validate("BTW", "BE123456749")).toBe(true);
      expect(normalize("BTW", "BE123456749")).toBe("BE0123456749");
    });

    it("rejects bad checksums", () => {
      expect(validate("BTW", "BE0123456700")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("BTW", "")).toBe(false);
      expect(validate("BTW", "BE9123456749")).toBe(false); // leading must be 0 or 1
      expect(validate("BTW", "FR0123456749")).toBe(false);
      expect(validate("BTW", "BE01234567490")).toBe(false);
    });
  });

  describe("format", () => {
    it("formats canonical form", () => {
      expect(format("BTW", "BE0123456749")).toBe("BE0123.456.749");
      expect(format("BTW", "BE123456749")).toBe("BE0123.456.749");
    });
  });

  describe("parse", () => {
    it("returns ok with confidence high", () => {
      const r = parse("BTW", "BE 0123.456.749");
      expect(r).toEqual({
        ok: true,
        code: "BE_BTW",
        normalized: "BE0123456749",
        formatted: "BE0123.456.749",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("BTW", "BE0123456700");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
