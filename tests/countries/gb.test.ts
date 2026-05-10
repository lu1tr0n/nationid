import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/gb/index.ts";

describe("GB — NINO", () => {
  describe("validate", () => {
    it("accepts valid NINO formats", () => {
      expect(validate("NINO", "AB123456C")).toBe(true);
      expect(validate("NINO", "AB 12 34 56 C")).toBe(true);
      expect(validate("NINO", "JT123456A")).toBe(true);
      expect(validate("NINO", "ZB123456D")).toBe(true);
      expect(validate("NINO", "WP123456C")).toBe(true);
    });

    it("rejects excluded prefixes", () => {
      expect(validate("NINO", "BG123456C")).toBe(false);
      expect(validate("NINO", "GB123456C")).toBe(false);
      expect(validate("NINO", "NK123456C")).toBe(false);
      expect(validate("NINO", "KN123456C")).toBe(false);
      expect(validate("NINO", "TN123456C")).toBe(false);
      expect(validate("NINO", "NT123456C")).toBe(false);
      expect(validate("NINO", "ZZ123456C")).toBe(false);
    });

    it("rejects forbidden first letters (D, F, I, Q, U, V)", () => {
      expect(validate("NINO", "DA123456C")).toBe(false);
      expect(validate("NINO", "FA123456C")).toBe(false);
      expect(validate("NINO", "IA123456C")).toBe(false);
      expect(validate("NINO", "QA123456C")).toBe(false);
      expect(validate("NINO", "UA123456C")).toBe(false);
      expect(validate("NINO", "VA123456C")).toBe(false);
    });

    it("rejects forbidden second letters (D, F, I, O, Q, U, V)", () => {
      expect(validate("NINO", "AD123456C")).toBe(false);
      expect(validate("NINO", "AF123456C")).toBe(false);
      expect(validate("NINO", "AI123456C")).toBe(false);
      expect(validate("NINO", "AO123456C")).toBe(false);
      expect(validate("NINO", "AQ123456C")).toBe(false);
      expect(validate("NINO", "AU123456C")).toBe(false);
      expect(validate("NINO", "AV123456C")).toBe(false);
    });

    it("rejects suffix letters outside [A-D]", () => {
      expect(validate("NINO", "AB123456E")).toBe(false);
      expect(validate("NINO", "AB123456Z")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("NINO", "")).toBe(false);
      expect(validate("NINO", "AB12345C")).toBe(false); // 5 digits
      expect(validate("NINO", "AB1234567C")).toBe(false); // 7 digits
      expect(validate("NINO", "ABCDEFGHI")).toBe(false);
    });

    it("normalizes case before validating", () => {
      expect(validate("NINO", "ab 12 34 56 c")).toBe(true);
    });

    it("accepts the GB_NINO fully-qualified code", () => {
      expect(validate("GB_NINO", "AB123456C")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts spaces at canonical positions", () => {
      expect(format("NINO", "AB123456C")).toBe("AB 12 34 56 C");
      expect(format("NINO", "ab123456c")).toBe("AB 12 34 56 C");
      expect(format("NINO", "AB 12 34 56 C")).toBe("AB 12 34 56 C");
    });

    it("returns input unchanged for invalid input", () => {
      expect(format("NINO", "AB12345")).toBe("AB12345");
    });
  });

  describe("normalize", () => {
    it("strips spaces and uppercases", () => {
      expect(normalize("NINO", "ab 12 34 56 c")).toBe("AB123456C");
    });
    it("is idempotent", () => {
      const a = normalize("NINO", "ab 12 34 56 c");
      expect(normalize("NINO", a)).toBe(a);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("NINO", "ab 12 34 56 c");
      expect(r).toEqual({
        ok: true,
        code: "GB_NINO",
        normalized: "AB123456C",
        formatted: "AB 12 34 56 C",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("NINO", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for short input", () => {
      const r = parse("NINO", "AB1");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for long input", () => {
      const r = parse("NINO", "AB12345678C");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for excluded prefix", () => {
      const r = parse("NINO", "BG123456C");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("never returns invalid_checksum (no DV in spec)", () => {
      for (const input of ["", "AB", "BG123456C", "AB12345"]) {
        const r = parse("NINO", input);
        if (!r.ok) {
          expect(r.reason.kind).not.toBe("invalid_checksum");
        }
      }
    });
  });
});

describe("GB — UTR", () => {
  // Synthetic valid UTRs computed from research algorithm (see docs/countries/gb.md).
  const VALID = ["1123456789", "9987654321", "0234567890", "9000000001"];

  describe("validate", () => {
    it("accepts valid UTRs", () => {
      for (const v of VALID) expect(validate("UTR", v)).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("UTR", "0123456789")).toBe(false);
      expect(validate("UTR", "1234567890")).toBe(false);
      expect(validate("UTR", "9123456789")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("UTR", "")).toBe(false);
      expect(validate("UTR", "12345")).toBe(false);
      expect(validate("UTR", "12345678901")).toBe(false);
      expect(validate("UTR", "ABCDEFGHIJ")).toBe(false);
    });

    it("strips spaces and the legacy `K` suffix", () => {
      expect(validate("UTR", "1 1234 56789")).toBe(true);
      expect(validate("UTR", "1123456789K")).toBe(true);
    });

    it("accepts the GB_UTR fully-qualified code", () => {
      expect(validate("GB_UTR", "1123456789")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("UTR", "1123456789");
      expect(r).toEqual({
        ok: true,
        code: "GB_UTR",
        normalized: "1123456789",
        formatted: "1123456789",
        confidence: "moderate",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("UTR", "0123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });

    it("returns kind=too_short for short input", () => {
      const r = parse("UTR", "12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });
  });

  describe("normalize", () => {
    it("is idempotent", () => {
      const a = normalize("UTR", "1 1234 56789");
      expect(normalize("UTR", a)).toBe(a);
      expect(a).toBe("1123456789");
    });
  });
});

describe("GB — VAT", () => {
  describe("validate", () => {
    it("accepts valid VAT numbers (HMRC mod-97)", () => {
      // 123456782: pre-2010 algorithm (sum + dv ≡ 0 mod 97).
      expect(validate("VAT", "123456782")).toBe(true);
      expect(validate("VAT", "GB123456782")).toBe(true);
      expect(validate("VAT", "GB 123 4567 82")).toBe(true);
    });

    it("accepts the 12-digit branch trader form", () => {
      expect(validate("VAT", "GB123456782001")).toBe(true);
      expect(validate("VAT", "GB 123 4567 82 001")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("VAT", "GB123456789")).toBe(false);
      expect(validate("VAT", "GB000000001")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("VAT", "")).toBe(false);
      expect(validate("VAT", "GB12345")).toBe(false);
      expect(validate("VAT", "GBABCDEFGHI")).toBe(false);
    });

    it("normalizes case", () => {
      expect(validate("VAT", "gb123456782")).toBe(true);
    });

    it("accepts the GB_VAT fully-qualified code", () => {
      expect(validate("GB_VAT", "123456782")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts spaces in canonical positions", () => {
      expect(format("VAT", "123456782")).toBe("GB 123 4567 82");
      expect(format("VAT", "GB123456782")).toBe("GB 123 4567 82");
      expect(format("VAT", "GB123456782001")).toBe("GB 123 4567 82 001");
    });

    it("returns input unchanged for invalid input", () => {
      expect(format("VAT", "12345")).toBe("12345");
    });
  });

  describe("parse", () => {
    it("returns ok with prefixed normalized form", () => {
      const r = parse("VAT", "123456782");
      expect(r).toEqual({
        ok: true,
        code: "GB_VAT",
        normalized: "GB123456782",
        formatted: "GB 123 4567 82",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("VAT", "GB123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });

    it("returns kind=too_long when more than 14 chars", () => {
      const r = parse("VAT", "GB1234567820011234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

describe("GB — NHS", () => {
  describe("validate", () => {
    it("accepts valid NHS numbers (mod-11)", () => {
      // 9434765919 is the canonical NHS test number.
      expect(validate("NHS", "9434765919")).toBe(true);
      expect(validate("NHS", "943 476 5919")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("NHS", "9434765910")).toBe(false);
      expect(validate("NHS", "1234567890")).toBe(false); // dv would be 10 -> invalid
    });

    it("rejects malformed input", () => {
      expect(validate("NHS", "")).toBe(false);
      expect(validate("NHS", "12345")).toBe(false);
      expect(validate("NHS", "12345678901")).toBe(false);
      expect(validate("NHS", "ABCDEFGHIJ")).toBe(false);
    });

    it("accepts the GB_NHS fully-qualified code", () => {
      expect(validate("GB_NHS", "9434765919")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts spaces 3-3-4", () => {
      expect(format("NHS", "9434765919")).toBe("943 476 5919");
      expect(format("NHS", "943 476 5919")).toBe("943 476 5919");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted", () => {
      const r = parse("NHS", "943 476 5919");
      expect(r).toEqual({
        ok: true,
        code: "GB_NHS",
        normalized: "9434765919",
        formatted: "943 476 5919",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("NHS", "9434765910");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
