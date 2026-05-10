import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/ca/index.ts";
import { isTemporaryResidentSIN } from "../../src/countries/ca/sin.ts";

// CA SIN vectors. DV computed via standard Luhn (ISO/IEC 7812-1) over all 9 digits.
//   - 046454286: well-known Service Canada test SIN (1-region prefix).
//   - 123456782: body 12345678 + Luhn DV 2.
//   - 200000008: body 20000000 + Luhn DV 8 (Quebec range).
//   - 100000009: body 10000000 + Luhn DV 9 (Atlantic range).
//   - 999999998: body 99999999 + Luhn DV 8 (temporary resident range).

describe("CA — SIN", () => {
  describe("validate", () => {
    it("accepts valid SINs (raw and formatted)", () => {
      expect(validate("SIN", "046454286")).toBe(true);
      expect(validate("SIN", "046-454-286")).toBe(true);
      expect(validate("SIN", "123456782")).toBe(true);
      expect(validate("SIN", "123-456-782")).toBe(true);
      expect(validate("SIN", "200000008")).toBe(true);
      expect(validate("SIN", "100000009")).toBe(true);
      expect(validate("SIN", "999999998")).toBe(true);
    });

    it("strips whitespace and other separators", () => {
      expect(validate("SIN", "  046-454-286  ")).toBe(true);
      expect(validate("SIN", "046 454 286")).toBe(true);
      expect(validate("SIN", "046.454.286")).toBe(true);
    });

    it("accepts SINs in the 0-prefix range (Service Canada test SIN starts with 0)", () => {
      // 046454286 is the documented Service Canada test SIN; it Luhn-validates.
      // 000000000 is also Luhn-valid (vacuously) and is accepted by this library;
      // callers wanting to enforce strict assignment ranges can layer their own check.
      expect(validate("SIN", "046454286")).toBe(true);
      expect(validate("SIN", "000000000")).toBe(true);
    });

    it("rejects invalid Luhn check digits", () => {
      expect(validate("SIN", "046454280")).toBe(false);
      expect(validate("SIN", "046454281")).toBe(false);
      expect(validate("SIN", "123456780")).toBe(false);
      expect(validate("SIN", "999999990")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("SIN", "")).toBe(false);
      expect(validate("SIN", "1234")).toBe(false);
      expect(validate("SIN", "1234567890")).toBe(false);
      expect(validate("SIN", "ABCDEFGHI")).toBe(false);
      expect(validate("SIN", "046-454-28A")).toBe(false);
    });

    it("accepts the CA_SIN fully-qualified code", () => {
      expect(validate("CA_SIN", "046454286")).toBe(true);
    });

    it("accepts the French alias NAS", () => {
      expect(validate("NAS", "046454286")).toBe(true);
      expect(validate("NAS", "999999998")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at the canonical positions", () => {
      expect(format("SIN", "046454286")).toBe("046-454-286");
      expect(format("SIN", "046-454-286")).toBe("046-454-286");
      expect(format("SIN", "046 454 286")).toBe("046-454-286");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("SIN", "1234")).toBe("1234");
    });

    it("preserves round-trip: format(normalize(x)) === format(x)", () => {
      const inputs = ["046454286", "046-454-286", "046 454 286"];
      for (const x of inputs) {
        expect(format("SIN", normalize("SIN", x))).toBe(format("SIN", x));
      }
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("SIN", "046-454-286")).toBe("046454286");
      expect(normalize("SIN", "046 454 286")).toBe("046454286");
    });

    it("is idempotent", () => {
      const n1 = normalize("SIN", "046-454-286");
      const n2 = normalize("SIN", n1);
      expect(n2).toBe(n1);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("SIN", "046-454-286");
      expect(r).toEqual({
        ok: true,
        code: "CA_SIN",
        normalized: "046454286",
        formatted: "046-454-286",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("SIN", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("SIN", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("SIN", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("SIN", "046454280");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });

  describe("isTemporaryResidentSIN", () => {
    it("returns true for SINs starting with 9", () => {
      expect(isTemporaryResidentSIN("999999998")).toBe(true);
      expect(isTemporaryResidentSIN("999-999-998")).toBe(true);
    });

    it("returns false for permanent-resident ranges", () => {
      expect(isTemporaryResidentSIN("046454286")).toBe(false);
      expect(isTemporaryResidentSIN("123456782")).toBe(false);
      expect(isTemporaryResidentSIN("200000008")).toBe(false);
    });

    it("returns false for malformed input", () => {
      expect(isTemporaryResidentSIN("")).toBe(false);
      expect(isTemporaryResidentSIN("999999")).toBe(false);
    });
  });
});

// CA BN vectors (format-only validation).
//   - 123456789: minimum 9-digit root.
//   - 123456789RT0001: GST/HST account.
//   - 987654321RP0002: Payroll account.
//   - 555555555RC0001: Corporation income.
//   - 111222333RM0001: Importer/Exporter.

describe("CA — BN", () => {
  describe("validate", () => {
    it("accepts valid 9-digit roots", () => {
      expect(validate("BN", "123456789")).toBe(true);
      expect(validate("BN", "987654321")).toBe(true);
      expect(validate("BN", "000000000")).toBe(true);
    });

    it("accepts root + program identifier + reference", () => {
      expect(validate("BN", "123456789RT0001")).toBe(true);
      expect(validate("BN", "123456789 RT0001")).toBe(true);
      expect(validate("BN", "987654321RP0002")).toBe(true);
      expect(validate("BN", "555555555RC0001")).toBe(true);
      expect(validate("BN", "111222333RM0001")).toBe(true);
      expect(validate("BN", "111222333RR0001")).toBe(true);
      expect(validate("BN", "111222333RZ0001")).toBe(true);
    });

    it("rejects unknown program identifiers", () => {
      expect(validate("BN", "123456789AA0001")).toBe(false);
      expect(validate("BN", "123456789XX0001")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("BN", "")).toBe(false);
      expect(validate("BN", "12345678")).toBe(false); // 8 digits
      expect(validate("BN", "1234567890")).toBe(false); // 10 digits, no program
      expect(validate("BN", "ABCDEFGHI")).toBe(false);
      expect(validate("BN", "123456789RT001")).toBe(false); // 3-digit ref
      expect(validate("BN", "123456789RT00001")).toBe(false); // 5-digit ref
    });

    it("accepts the CA_BN fully-qualified code", () => {
      expect(validate("CA_BN", "123456789")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts space between root and program account", () => {
      expect(format("BN", "123456789RT0001")).toBe("123456789 RT0001");
      expect(format("BN", "123456789 RT0001")).toBe("123456789 RT0001");
    });

    it("returns 9-digit root unchanged", () => {
      expect(format("BN", "123456789")).toBe("123456789");
    });

    it("returns input unchanged when invalid", () => {
      expect(format("BN", "12345")).toBe("12345");
    });
  });

  describe("normalize", () => {
    it("strips spaces and uppercases", () => {
      expect(normalize("BN", "123456789 rt0001")).toBe("123456789RT0001");
      expect(normalize("BN", "123 456 789")).toBe("123456789");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("BN", "123456789 RT0001");
      expect(r).toEqual({
        ok: true,
        code: "CA_BN",
        normalized: "123456789RT0001",
        formatted: "123456789 RT0001",
        confidence: "low",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("BN", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("BN", "12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=invalid_format for unknown program code", () => {
      const r = parse("BN", "123456789AA0001");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

describe("CA — Passport (CA_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (verified: 2 letters + 6 digits)", () => {
      // Microsoft Purview SIT-validated shape for Canadian ePassport.
      expect(validate("PASAPORTE", "AB123456")).toBe(true);
      expect(validate("PASAPORTE", "GA000001")).toBe(true);
      expect(validate("PASAPORTE", "ZZ999999")).toBe(true);
      expect(validate("PASAPORTE", "QC123456")).toBe(true);
      expect(validate("PASAPORTE", " AB123456 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "A123456")).toBe(false); // 1 letter
      expect(validate("PASAPORTE", "ABC123456")).toBe(false); // 3 letters
      expect(validate("PASAPORTE", "AB12345")).toBe(false); // too short
      expect(validate("PASAPORTE", "AB1234567")).toBe(false); // too long
      expect(validate("PASAPORTE", "12345678")).toBe(false); // no letters
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "ab123456")).toBe(true);
    });

    it("accepts both fully-qualified and short codes", () => {
      expect(validate("CA_PASAPORTE", "AB123456")).toBe(true);
      expect(validate("PASSPORT", "AB123456")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success with high confidence (verified)", () => {
      const r = parse("PASAPORTE", "ab123456");
      expect(r).toEqual({
        ok: true,
        code: "CA_PASAPORTE",
        normalized: "AB123456",
        formatted: "AB123456",
        confidence: "high",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PASAPORTE", "AB12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PASAPORTE", "AB1234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
