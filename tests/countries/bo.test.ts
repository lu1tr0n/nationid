import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/bo/index.ts";

// Bolivia specs are format-only. SEGIP (CI) and SIN (NIT) do not publish
// verifier algorithms publicly, so tests focus on length, charset, separator
// handling, and round-trip stability of normalize() and format().

describe("BO — CI", () => {
  describe("validate", () => {
    it("accepts 6-9 digit cédulas with no dept", () => {
      expect(validate("CI", "123456")).toBe(true);
      expect(validate("CI", "1234567")).toBe(true);
      expect(validate("CI", "12345678")).toBe(true);
      expect(validate("CI", "123456789")).toBe(true);
    });

    it("accepts cédulas with dept code (space, hyphen, no separator)", () => {
      expect(validate("CI", "1234567 LP")).toBe(true);
      expect(validate("CI", "1234567-LP")).toBe(true);
      expect(validate("CI", "1234567LP")).toBe(true);
      expect(validate("CI", "12345678 SC")).toBe(true);
    });

    it("accepts all 9 valid departmental codes", () => {
      const depts = ["LP", "CB", "SC", "OR", "PT", "CH", "TJ", "BE", "PA"];
      for (const dept of depts) {
        expect(validate("CI", `1234567 ${dept}`)).toBe(true);
      }
    });

    it("normalizes lowercase dept codes before matching", () => {
      expect(validate("CI", "1234567 lp")).toBe(true);
      expect(validate("CI", "1234567-cb")).toBe(true);
    });

    it("rejects unknown dept codes", () => {
      expect(validate("CI", "1234567 ZZ")).toBe(false);
      expect(validate("CI", "1234567 XX")).toBe(false);
      expect(validate("CI", "1234567 LA")).toBe(false);
    });

    it("rejects out-of-range lengths", () => {
      expect(validate("CI", "12345")).toBe(false); // 5 digits
      expect(validate("CI", "1234567890")).toBe(false); // 10 digits
    });

    it("rejects non-digit body", () => {
      expect(validate("CI", "ABCDEFG")).toBe(false);
      expect(validate("CI", "12345A6")).toBe(false);
    });

    it("rejects empty / whitespace input", () => {
      expect(validate("CI", "")).toBe(false);
      expect(validate("CI", "   ")).toBe(false);
    });

    it("accepts both BO_CI and CI codes", () => {
      expect(validate("BO_CI", "1234567")).toBe(true);
      expect(validate("CI", "1234567")).toBe(true);
    });
  });

  describe("format", () => {
    it("outputs `digits-DEPT` when dept is present", () => {
      expect(format("CI", "1234567 LP")).toBe("1234567-LP");
      expect(format("CI", "1234567LP")).toBe("1234567-LP");
      expect(format("CI", "1234567-lp")).toBe("1234567-LP");
    });

    it("outputs bare digits when no dept", () => {
      expect(format("CI", "1234567")).toBe("1234567");
    });

    it("returns input unchanged when invalid", () => {
      expect(format("CI", "X")).toBe("X");
    });

    it("is idempotent over normalize ∘ format ∘ normalize", () => {
      const a = "1234567-LP";
      const n1 = normalize("CI", a);
      const f1 = format("CI", n1);
      expect(format("CI", normalize("CI", f1))).toBe(f1);
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases dept", () => {
      expect(normalize("CI", "1234567 lp")).toBe("1234567LP");
      expect(normalize("CI", "1234567-LP")).toBe("1234567LP");
      expect(normalize("CI", "1234567")).toBe("1234567");
    });

    it("is idempotent", () => {
      const inputs = ["1234567 LP", "12345678", "1234567-cb"];
      for (const i of inputs) {
        const a = normalize("CI", i);
        const b = normalize("CI", a);
        expect(b).toBe(a);
      }
    });
  });

  describe("parse", () => {
    it("returns ok on valid 7-digit CI", () => {
      const r = parse("CI", "1234567");
      expect(r).toEqual({
        ok: true,
        code: "BO_CI",
        normalized: "1234567",
        formatted: "1234567",
        confidence: "moderate",
      });
    });

    it("returns ok on CI with dept", () => {
      const r = parse("CI", "1234567 LP");
      expect(r).toEqual({
        ok: true,
        code: "BO_CI",
        normalized: "1234567LP",
        formatted: "1234567-LP",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CI", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for <6 digits", () => {
      const r = parse("CI", "12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for 10+ digits", () => {
      const r = parse("CI", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for unknown dept", () => {
      const r = parse("CI", "1234567 XX");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

describe("BO — NIT", () => {
  describe("validate", () => {
    it("accepts legacy 7-11 digit NITs", () => {
      expect(validate("NIT", "1234567")).toBe(true);
      expect(validate("NIT", "12345678")).toBe(true);
      expect(validate("NIT", "123456789")).toBe(true);
      expect(validate("NIT", "1234567890")).toBe(true);
      expect(validate("NIT", "12345678901")).toBe(true);
    });

    it("accepts new 13-digit NITs (post-2021)", () => {
      expect(validate("NIT", "1234567890123")).toBe(true);
      expect(validate("NIT", "9876543210987")).toBe(true);
    });

    it("rejects out-of-range lengths", () => {
      expect(validate("NIT", "123456")).toBe(false); // 6 digits
      expect(validate("NIT", "12345678901234")).toBe(false); // 14 digits
    });

    it("rejects non-digit input that strips to invalid length", () => {
      expect(validate("NIT", "ABCDEFG")).toBe(false); // strips to ""
      expect(validate("NIT", "ABC123")).toBe(false); // strips to "123" (too short)
    });

    it("strips embedded non-digits and validates the digit-only remainder", () => {
      // Lenient normalization: A,B,etc. removed; remaining digits validated.
      expect(validate("NIT", "1234A678")).toBe(true); // → 1234678 (7 digits)
      expect(validate("NIT", "12-34-5678")).toBe(true);
    });

    it("rejects empty / whitespace", () => {
      expect(validate("NIT", "")).toBe(false);
      expect(validate("NIT", "   ")).toBe(false);
    });

    it("accepts both BO_NIT and NIT codes", () => {
      expect(validate("BO_NIT", "1234567")).toBe(true);
      expect(validate("NIT", "1234567")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns digits unchanged (no canonical separator)", () => {
      expect(format("NIT", "1234567")).toBe("1234567");
      expect(format("NIT", "1234567890123")).toBe("1234567890123");
    });

    it("returns input unchanged when invalid", () => {
      expect(format("NIT", "X")).toBe("X");
    });
  });

  describe("normalize", () => {
    it("strips non-digits", () => {
      expect(normalize("NIT", "12-3456-78")).toBe("12345678");
      expect(normalize("NIT", "1234567")).toBe("1234567");
    });

    it("is idempotent", () => {
      const a = normalize("NIT", "12-3456-78");
      const b = normalize("NIT", a);
      expect(b).toBe(a);
    });
  });

  describe("parse", () => {
    it("returns ok on valid NIT", () => {
      const r = parse("NIT", "1234567");
      expect(r).toEqual({
        ok: true,
        code: "BO_NIT",
        normalized: "1234567",
        formatted: "1234567",
        confidence: "low",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("NIT", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for <7 digits", () => {
      const r = parse("NIT", "123456");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for >13 digits", () => {
      const r = parse("NIT", "12345678901234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
