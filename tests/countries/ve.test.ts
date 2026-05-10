import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/ve/index.ts";
import { rifHolderType } from "../../src/countries/ve/rif.ts";

// VE Cédula vectors (format-only).
//   - V-12345678 (venezolano, 8 digits)
//   - V-1234567  (venezolano, 7 digits)
//   - E-87654321 (extranjero residente)

describe("VE — Cédula", () => {
  describe("validate", () => {
    it("accepts valid Cédulas with V and E prefixes", () => {
      expect(validate("CEDULA", "V-12345678")).toBe(true);
      expect(validate("CEDULA", "V12345678")).toBe(true);
      expect(validate("CEDULA", "V-1234567")).toBe(true);
      expect(validate("CEDULA", "E-87654321")).toBe(true);
      expect(validate("CEDULA", "E-1234567")).toBe(true);
    });

    it("strips whitespace and lowercases prefix", () => {
      expect(validate("CEDULA", "  V-12345678  ")).toBe(true);
      expect(validate("CEDULA", "v-12345678")).toBe(true);
      expect(validate("CEDULA", "v 12345678")).toBe(true);
      expect(validate("CEDULA", "e-12345678")).toBe(true);
    });

    it("rejects unsupported prefixes", () => {
      expect(validate("CEDULA", "J-12345678")).toBe(false);
      expect(validate("CEDULA", "X-12345678")).toBe(false);
      expect(validate("CEDULA", "P-12345678")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CEDULA", "")).toBe(false);
      expect(validate("CEDULA", "V-123")).toBe(false); // too short
      expect(validate("CEDULA", "V-123456789")).toBe(false); // too long
      expect(validate("CEDULA", "12345678")).toBe(false); // missing prefix
      expect(validate("CEDULA", "V-ABCDEFGH")).toBe(false);
    });

    it("accepts the VE_CEDULA fully-qualified code", () => {
      expect(validate("VE_CEDULA", "V-12345678")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen between prefix and digits", () => {
      expect(format("CEDULA", "V12345678")).toBe("V-12345678");
      expect(format("CEDULA", "V-12345678")).toBe("V-12345678");
      expect(format("CEDULA", "v12345678")).toBe("V-12345678");
      expect(format("CEDULA", "E1234567")).toBe("E-1234567");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CEDULA", "V-123")).toBe("V-123");
    });

    it("preserves round-trip: format(normalize(x)) === format(x)", () => {
      const inputs = ["V-12345678", "V12345678", "v 12345678"];
      for (const x of inputs) {
        expect(format("CEDULA", normalize("CEDULA", x))).toBe(format("CEDULA", x));
      }
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases", () => {
      expect(normalize("CEDULA", "V-12345678")).toBe("V12345678");
      expect(normalize("CEDULA", "v 12345678")).toBe("V12345678");
    });

    it("is idempotent", () => {
      const n1 = normalize("CEDULA", "V-12345678");
      expect(normalize("CEDULA", n1)).toBe(n1);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CEDULA", "V-12345678");
      expect(r).toEqual({
        ok: true,
        code: "VE_CEDULA",
        normalized: "V12345678",
        formatted: "V-12345678",
        confidence: "low",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CEDULA", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CEDULA", "V-12");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CEDULA", "V-123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for unsupported prefix", () => {
      const r = parse("CEDULA", "X-12345678");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

// VE RIF vectors. Algorithm: weights [3,2,7,6,5,4,3,2] over correlative digits 1-8;
// letter values: V=4, E=8, J=12, P=16, G=20, C=24.
// r = (sum_digits + letter_value) mod 11; dv = 11 - r; if dv >= 10 then dv = 0.
//
//   - V-12345678-1: sum_digits=138, letter=4,  r=10, dv=1.
//   - E-12345678-8: sum_digits=138, letter=8,  r=3,  dv=8.
//   - J-12345678-4: sum_digits=138, letter=12, r=7,  dv=4.
//   - P-12345678-0: sum_digits=138, letter=16, r=0,  dv=11→0.
//   - G-12345678-7: sum_digits=138, letter=20, r=4,  dv=7.
//   - C-12345678-3: sum_digits=138, letter=24, r=8,  dv=3.
//   - J-00000000-0: sum_digits=0,   letter=12, r=1,  dv=10→0.
//   - V-00000000-7: sum_digits=0,   letter=4,  r=4,  dv=7.
//   - J-31415926-7: sum_digits=124, letter=12, r=4,  dv=7.

describe("VE — RIF", () => {
  describe("validate", () => {
    it("accepts valid RIFs across all letter prefixes", () => {
      expect(validate("RIF", "V-12345678-1")).toBe(true);
      expect(validate("RIF", "E-12345678-8")).toBe(true);
      expect(validate("RIF", "J-12345678-4")).toBe(true);
      expect(validate("RIF", "P-12345678-0")).toBe(true);
      expect(validate("RIF", "G-12345678-7")).toBe(true);
      expect(validate("RIF", "C-12345678-3")).toBe(true);
    });

    it("accepts both formatted and unformatted forms", () => {
      expect(validate("RIF", "J123456784")).toBe(true);
      expect(validate("RIF", "J-12345678-4")).toBe(true);
      expect(validate("RIF", "j-12345678-4")).toBe(true);
      expect(validate("RIF", "  J-12345678-4  ")).toBe(true);
    });

    it("accepts edge-case DVs (11→0 wrap)", () => {
      expect(validate("RIF", "P-12345678-0")).toBe(true);
      expect(validate("RIF", "J-00000000-0")).toBe(true);
    });

    it("accepts additional independent vectors", () => {
      expect(validate("RIF", "V-00000000-7")).toBe(true);
      expect(validate("RIF", "J-31415926-7")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("RIF", "J-12345678-0")).toBe(false);
      expect(validate("RIF", "J-12345678-9")).toBe(false);
      expect(validate("RIF", "V-12345678-0")).toBe(false);
      expect(validate("RIF", "E-12345678-0")).toBe(false);
      expect(validate("RIF", "P-12345678-1")).toBe(false);
    });

    it("rejects unsupported prefixes", () => {
      expect(validate("RIF", "X-12345678-0")).toBe(false);
      expect(validate("RIF", "Z-12345678-0")).toBe(false);
      expect(validate("RIF", "1-12345678-0")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("RIF", "")).toBe(false);
      expect(validate("RIF", "J-1234-5")).toBe(false);
      expect(validate("RIF", "J-123456789-0")).toBe(false);
      expect(validate("RIF", "J-ABCDEFGH-4")).toBe(false);
      expect(validate("RIF", "12345678901")).toBe(false);
    });

    it("accepts the VE_RIF fully-qualified code", () => {
      expect(validate("VE_RIF", "J-12345678-4")).toBe(true);
    });

    it("ships the SENIAT mod-11 with confidence moderate (audit decision v0.5)", () => {
      // The algorithm matches three independent community references
      // (rif.js, validador-rif, mantrax314/verificador-rif-seniat) but
      // SENIAT does not publish the formula in writing. Per the project's
      // confidence policy, `high` requires "official source AND mature
      // library", so we hold at `moderate`.
      const r = parse("RIF", "J-12345678-4");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.confidence).toBe("moderate");
    });
  });

  describe("format", () => {
    it("inserts hyphens at the canonical positions", () => {
      expect(format("RIF", "J123456784")).toBe("J-12345678-4");
      expect(format("RIF", "J-12345678-4")).toBe("J-12345678-4");
      expect(format("RIF", "j123456784")).toBe("J-12345678-4");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("RIF", "J-1234")).toBe("J-1234");
    });

    it("preserves round-trip: format(normalize(x)) === format(x)", () => {
      const inputs = ["J-12345678-4", "J123456784", "j 12345678 4"];
      for (const x of inputs) {
        expect(format("RIF", normalize("RIF", x))).toBe(format("RIF", x));
      }
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases", () => {
      expect(normalize("RIF", "J-12345678-4")).toBe("J123456784");
      expect(normalize("RIF", "j 12345678 4")).toBe("J123456784");
    });

    it("is idempotent", () => {
      const n1 = normalize("RIF", "J-12345678-4");
      expect(normalize("RIF", n1)).toBe(n1);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("RIF", "J-12345678-4");
      expect(r).toEqual({
        ok: true,
        code: "VE_RIF",
        normalized: "J123456784",
        formatted: "J-12345678-4",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("RIF", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("RIF", "J-1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("RIF", "J-123456789-0");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for unsupported prefix", () => {
      const r = parse("RIF", "X-12345678-0");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("RIF", "J-12345678-0");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });

  describe("rifHolderType (prefix-based discrimination)", () => {
    it("maps each prefix to its holder type", () => {
      expect(rifHolderType("V-12345678-1")).toBe("natural_venezolano");
      expect(rifHolderType("E-12345678-8")).toBe("extranjero");
      expect(rifHolderType("J-12345678-4")).toBe("juridica");
      expect(rifHolderType("P-12345678-0")).toBe("pasaporte");
      expect(rifHolderType("G-12345678-7")).toBe("gubernamental");
      expect(rifHolderType("C-12345678-3")).toBe("consejo_comunal");
    });

    it("returns unknown for malformed input", () => {
      expect(rifHolderType("")).toBe("unknown");
      expect(rifHolderType("X-12345678-0")).toBe("unknown");
      expect(rifHolderType("J-12345")).toBe("unknown");
    });
  });
});

describe("VE — Pasaporte (VE_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (8-9 digits)", () => {
      expect(validate("PASAPORTE", "12345678")).toBe(true);
      expect(validate("PASAPORTE", "123456789")).toBe(true);
      expect(validate("PASAPORTE", "00000001")).toBe(true);
      expect(validate("PASAPORTE", "999999999")).toBe(true);
      expect(validate("PASAPORTE", " 123456789 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "1234567")).toBe(false); // too short
      expect(validate("PASAPORTE", "1234567890")).toBe(false); // too long
      expect(validate("PASAPORTE", "A12345678")).toBe(false); // letter not allowed
      expect(validate("PASAPORTE", "@@@@@@@@")).toBe(false);
    });

    it("accepts the VE_PASAPORTE fully-qualified code", () => {
      expect(validate("VE_PASAPORTE", "12345678")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "12345678");
      expect(r).toEqual({
        ok: true,
        code: "VE_PASAPORTE",
        normalized: "12345678",
        formatted: "12345678",
        confidence: "low",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PASAPORTE", "1234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PASAPORTE", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
