import { describe, expect, it } from "vitest";
import { cprMod11Legacy } from "../../src/countries/dk/cpr.ts";
import { format, normalize, parse, validate } from "../../src/countries/dk/index.ts";

// DK CPR — legacy mod-11 fixtures (computed against the [4,3,2,7,6,5,4,3,2,1] weights).
//   - 0101801233 — 1980-01-01, mod-11 valid
//   - 1506704568 — 1970-06-15, mod-11 valid
//   - 0101010015 — 2001-01-01, mod-11 valid
//   - 2002834564 — 1983-02-20, mod-11 valid
//   - 3112998763 — 1999-12-31, mod-11 valid
// Per CPR Office post-2007 policy, the library's `validate()` is FORMAT-ONLY.

describe("DK — CPR", () => {
  describe("validate", () => {
    it("accepts well-formed CPRs (legacy mod-11 valid)", () => {
      expect(validate("CPR", "0101801233")).toBe(true);
      expect(validate("CPR", "010180-1233")).toBe(true);
      expect(validate("CPR", "1506704568")).toBe(true);
      expect(validate("CPR", "0101010015")).toBe(true);
    });

    it("accepts well-formed CPRs that fail legacy mod-11 (post-2007 policy)", () => {
      // Modern CPRs are not required to satisfy mod-11. The library accepts
      // any 10-digit CPR with a plausible date.
      expect(validate("CPR", "0101801234")).toBe(true);
      expect(validate("CPR", "1506704561")).toBe(true);
    });

    it("strips whitespace and other separators", () => {
      expect(validate("CPR", "  010180-1233  ")).toBe(true);
      expect(validate("CPR", "010180 1233")).toBe(true);
    });

    it("rejects invalid month / day", () => {
      expect(validate("CPR", "3201801233")).toBe(false); // day 32
      expect(validate("CPR", "0113801233")).toBe(false); // month 13
    });

    it("rejects malformed input", () => {
      expect(validate("CPR", "")).toBe(false);
      expect(validate("CPR", "1234")).toBe(false);
      expect(validate("CPR", "ABCDEFGHIJ")).toBe(false);
      expect(validate("CPR", "010180123")).toBe(false); // 9 digits
      expect(validate("CPR", "01018012345")).toBe(false); // 11 digits
    });

    it("accepts the DK_CPR fully-qualified code", () => {
      expect(validate("DK_CPR", "0101801233")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen at the canonical position", () => {
      expect(format("CPR", "0101801233")).toBe("010180-1233");
      expect(format("CPR", "010180-1233")).toBe("010180-1233");
      expect(format("CPR", "010180 1233")).toBe("010180-1233");
    });

    it("returns input unchanged when invalid length", () => {
      expect(format("CPR", "12345")).toBe("12345");
    });

    it("preserves round-trip: format(normalize(x)) === format(x)", () => {
      const inputs = ["0101801233", "010180-1233", "010180 1233"];
      for (const x of inputs) {
        expect(format("CPR", normalize("CPR", x))).toBe(format("CPR", x));
      }
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("CPR", "010180-1233")).toBe("0101801233");
      expect(normalize("CPR", "010180 1233")).toBe("0101801233");
    });

    it("is idempotent", () => {
      const n = normalize("CPR", "010180-1233");
      expect(normalize("CPR", n)).toBe(n);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success (moderate confidence)", () => {
      const r = parse("CPR", "010180-1233");
      expect(r).toEqual({
        ok: true,
        code: "DK_CPR",
        normalized: "0101801233",
        formatted: "010180-1233",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CPR", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short on short input", () => {
      const r = parse("CPR", "12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long on long input", () => {
      const r = parse("CPR", "01018012345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format on bad date", () => {
      const r = parse("CPR", "3201801233");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });

  describe("cprMod11Legacy", () => {
    it("returns true for pre-2007 mod-11 valid CPRs", () => {
      expect(cprMod11Legacy("0101801233")).toBe(true);
      expect(cprMod11Legacy("1506704568")).toBe(true);
      expect(cprMod11Legacy("0101010015")).toBe(true);
    });

    it("returns false for CPRs that fail mod-11", () => {
      expect(cprMod11Legacy("0101801234")).toBe(false);
      expect(cprMod11Legacy("1234567890")).toBe(false);
    });

    it("returns false for malformed input", () => {
      expect(cprMod11Legacy("")).toBe(false);
      expect(cprMod11Legacy("12345")).toBe(false);
    });
  });
});

// DK CVR fixtures — mod-11 with weights [2,7,6,5,4,3,2,1], sum mod 11 == 0.
//   - 12345674
//   - 11111114
//   - 98765433
//   - 23456788
describe("DK — CVR", () => {
  describe("validate", () => {
    it("accepts valid CVR numbers", () => {
      expect(validate("CVR", "12345674")).toBe(true);
      expect(validate("CVR", "11111114")).toBe(true);
      expect(validate("CVR", "98765433")).toBe(true);
      expect(validate("CVR", "23456788")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CVR", "12345670")).toBe(false);
      expect(validate("CVR", "12345671")).toBe(false);
      expect(validate("CVR", "98765430")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CVR", "")).toBe(false);
      expect(validate("CVR", "1234")).toBe(false);
      expect(validate("CVR", "123456789")).toBe(false);
      expect(validate("CVR", "ABCDEFGH")).toBe(false);
    });

    it("accepts the DK_CVR fully-qualified code", () => {
      expect(validate("DK_CVR", "12345674")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns digits unchanged (no canonical separator)", () => {
      expect(format("CVR", "12345674")).toBe("12345674");
      expect(format("CVR", "12 34 56 74")).toBe("12345674");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CVR", "12 34 56 74");
      expect(r).toEqual({
        ok: true,
        code: "DK_CVR",
        normalized: "12345674",
        formatted: "12345674",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum on bad DV", () => {
      const r = parse("CVR", "12345670");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("DK — VAT (Moms)", () => {
  describe("validate", () => {
    it("accepts valid DK VAT numbers", () => {
      expect(validate("VAT", "DK12345674")).toBe(true);
      expect(validate("VAT", "dk 12 34 56 74")).toBe(true);
      expect(validate("MOMS", "DK98765433")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("VAT", "")).toBe(false);
      expect(validate("VAT", "DK1234567")).toBe(false);
      expect(validate("VAT", "FR12345674")).toBe(false);
    });

    it("rejects when CVR body is invalid", () => {
      expect(validate("VAT", "DK12345670")).toBe(false);
    });

    it("accepts the DK_VAT fully-qualified code", () => {
      expect(validate("DK_VAT", "DK12345674")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("VAT", "dk 12 34 56 74");
      expect(r).toEqual({
        ok: true,
        code: "DK_VAT",
        normalized: "DK12345674",
        formatted: "DK12345674",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum when body fails CVR check", () => {
      const r = parse("VAT", "DK12345670");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
