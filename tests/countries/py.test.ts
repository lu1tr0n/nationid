import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/py/index.ts";

// PY_CI is format-only (Policía Nacional does not publish a verifier).
//
// PY_RUC vectors derived from the SET mod-11 algorithm (ascending weights
// 2..N right-to-left over the base; dv = 11 - (sum mod 11) when r > 1
// else 0). All synthetic.
//   - 80000000-5    base=80000000, sum=72, r=6, dv=5
//   - 12345678-9    base=12345678, sum=156, r=2, dv=9
//   - 11111111-0    base=11111111, sum=44, r=0, dv=0
//   - 9999999-4     base=9999999 (7 digits), sum=315, r=7, dv=4
//   - 100000-4      base=100000 (6 digits), sum=7, r=7, dv=4

describe("PY — CI", () => {
  describe("validate", () => {
    it("accepts 6-9 digit cédulas", () => {
      expect(validate("CI", "123456")).toBe(true);
      expect(validate("CI", "1234567")).toBe(true);
      expect(validate("CI", "12345678")).toBe(true);
      expect(validate("CI", "123456789")).toBe(true);
    });

    it("rejects out-of-range lengths", () => {
      expect(validate("CI", "12345")).toBe(false); // 5 digits
      expect(validate("CI", "1234567890")).toBe(false); // 10 digits
    });

    it("rejects non-digit input that strips to invalid length", () => {
      expect(validate("CI", "ABCDEFG")).toBe(false); // strips to ""
      expect(validate("CI", "ABC12")).toBe(false); // strips to "12" (too short)
    });

    it("strips embedded non-digits and validates the digit-only remainder", () => {
      // Lenient normalization: A,B,etc. removed; remaining digits validated.
      expect(validate("CI", "12345A6")).toBe(true); // → "123456" (6 digits)
      expect(validate("CI", "1.234.567")).toBe(true);
    });

    it("rejects empty / whitespace", () => {
      expect(validate("CI", "")).toBe(false);
      expect(validate("CI", "   ")).toBe(false);
    });

    it("strips separators before validating", () => {
      expect(validate("CI", "12-34-567")).toBe(true);
      expect(validate("CI", "1.234.567")).toBe(true);
    });

    it("accepts both PY_CI and CI codes", () => {
      expect(validate("PY_CI", "1234567")).toBe(true);
      expect(validate("CI", "1234567")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns digits unchanged (no canonical separator)", () => {
      expect(format("CI", "1234567")).toBe("1234567");
      expect(format("CI", "1.234.567")).toBe("1234567");
    });

    it("returns input unchanged when invalid", () => {
      expect(format("CI", "X")).toBe("X");
    });
  });

  describe("normalize", () => {
    it("strips non-digits", () => {
      expect(normalize("CI", "1.234.567")).toBe("1234567");
    });

    it("is idempotent", () => {
      const a = normalize("CI", "1.234.567");
      const b = normalize("CI", a);
      expect(b).toBe(a);
    });
  });

  describe("parse", () => {
    it("returns ok on valid CI", () => {
      const r = parse("CI", "1234567");
      expect(r).toEqual({
        ok: true,
        code: "PY_CI",
        normalized: "1234567",
        formatted: "1234567",
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

    it("returns kind=too_long for >9 digits", () => {
      const r = parse("CI", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

describe("PY — RUC", () => {
  describe("validate", () => {
    it("accepts synthetic-valid RUCs (raw and formatted)", () => {
      expect(validate("RUC", "800000005")).toBe(true);
      expect(validate("RUC", "80000000-5")).toBe(true);
      expect(validate("RUC", "123456789")).toBe(true);
      expect(validate("RUC", "12345678-9")).toBe(true);
      expect(validate("RUC", "111111110")).toBe(true);
      expect(validate("RUC", "11111111-0")).toBe(true);
      expect(validate("RUC", "99999994")).toBe(true);
      expect(validate("RUC", "9999999-4")).toBe(true);
      expect(validate("RUC", "1000004")).toBe(true);
      expect(validate("RUC", "100000-4")).toBe(true);
    });

    it("rejects RUCs with invalid check digit", () => {
      expect(validate("RUC", "80000000-4")).toBe(false);
      expect(validate("RUC", "80000000-6")).toBe(false);
      expect(validate("RUC", "12345678-0")).toBe(false);
      expect(validate("RUC", "11111111-1")).toBe(false);
      expect(validate("RUC", "9999999-3")).toBe(false);
    });

    it("rejects out-of-range lengths", () => {
      expect(validate("RUC", "100004")).toBe(false); // 6 digits total
      expect(validate("RUC", "12345678901")).toBe(false); // 11 digits total
    });

    it("rejects non-digit body", () => {
      expect(validate("RUC", "12345A78-9")).toBe(false);
      expect(validate("RUC", "ABCDEFGH-9")).toBe(false);
    });

    it("rejects empty / whitespace", () => {
      expect(validate("RUC", "")).toBe(false);
      expect(validate("RUC", "   ")).toBe(false);
    });

    it("accepts both PY_RUC and RUC codes", () => {
      expect(validate("PY_RUC", "12345678-9")).toBe(true);
      expect(validate("RUC", "12345678-9")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen before DV", () => {
      expect(format("RUC", "800000005")).toBe("80000000-5");
      expect(format("RUC", "123456789")).toBe("12345678-9");
      expect(format("RUC", "1000004")).toBe("100000-4");
    });

    it("preserves already-formatted input", () => {
      expect(format("RUC", "80000000-5")).toBe("80000000-5");
    });

    it("returns input unchanged when invalid length", () => {
      expect(format("RUC", "X")).toBe("X");
    });

    it("round-trips via normalize", () => {
      const original = "80000000-5";
      const n = normalize("RUC", original);
      expect(format("RUC", n)).toBe(original);
    });
  });

  describe("normalize", () => {
    it("strips hyphen", () => {
      expect(normalize("RUC", "80000000-5")).toBe("800000005");
      expect(normalize("RUC", "100000-4")).toBe("1000004");
    });

    it("is idempotent", () => {
      const inputs = ["80000000-5", "12345678-9", "100000-4"];
      for (const i of inputs) {
        const a = normalize("RUC", i);
        const b = normalize("RUC", a);
        expect(b).toBe(a);
      }
    });
  });

  describe("parse", () => {
    it("returns ok on valid RUC", () => {
      const r = parse("RUC", "80000000-5");
      expect(r).toEqual({
        ok: true,
        code: "PY_RUC",
        normalized: "800000005",
        formatted: "80000000-5",
        confidence: "moderate",
      });
    });

    it("returns ok on shorter base length", () => {
      const r = parse("RUC", "100000-4");
      expect(r).toEqual({
        ok: true,
        code: "PY_RUC",
        normalized: "1000004",
        formatted: "100000-4",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("RUC", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for <7 digits", () => {
      const r = parse("RUC", "100004");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for >10 digits", () => {
      const r = parse("RUC", "12345678901");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("RUC", "80000000-6");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
