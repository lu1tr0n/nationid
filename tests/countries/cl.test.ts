import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/cl/index.ts";

// CL RUT vectors with DV computed via SII algorithm (cyclic weights 2..7
// right-to-left, dv = 11 - sum mod 11; 11 -> '0', 10 -> 'K').
//   - 12345678-5: well-known synthetic RUT.
//   - 8765432-K: well-known synthetic with K verifier.
//   - 11111111-1: edge case all-same-digit (algorithmically valid: 1*2+1*3+1*4+1*5+1*6+1*7+1*2+1*3 = 32; 32 mod 11 = 10; dv = 1).
//   - 22222222-2: similar structure.
//   - 1-9: shortest valid RUT (body=1, dv=9).
//   - 20875321-5: random body + DV.

describe("CL — RUT", () => {
  describe("validate", () => {
    it("accepts valid RUTs (raw and formatted, lowercase k allowed in input)", () => {
      expect(validate("RUT", "123456785")).toBe(true);
      expect(validate("RUT", "12.345.678-5")).toBe(true);
      expect(validate("RUT", "8765432K")).toBe(true);
      expect(validate("RUT", "8.765.432-K")).toBe(true);
      expect(validate("RUT", "8.765.432-k")).toBe(true); // lowercase k normalized
      expect(validate("RUT", "208753215")).toBe(true);
      expect(validate("RUT", "19")).toBe(true); // body=1, dv=9
    });

    it("accepts valid all-same-digit RUTs (no placeholder convention in CL)", () => {
      // Unlike BR CPF/CNPJ, the SII does not blacklist repeated-digit RUTs.
      expect(validate("RUT", "111111111")).toBe(true);
      expect(validate("RUT", "222222222")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("RUT", "123456780")).toBe(false);
      expect(validate("RUT", "12.345.678-0")).toBe(false);
      expect(validate("RUT", "8765432A")).toBe(false);
      expect(validate("RUT", "208753210")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("RUT", "")).toBe(false);
      expect(validate("RUT", "X")).toBe(false);
      expect(validate("RUT", "1234567890")).toBe(false); // too long (10-char body)
      expect(validate("RUT", "ABCDEFGHI")).toBe(false);
    });

    it("treats RUN and RUT as the same number space", () => {
      expect(validate("RUN", "123456785")).toBe(true);
      expect(validate("RUT", "123456785")).toBe(true);
    });

    it("accepts the CL_RUT fully-qualified code", () => {
      expect(validate("CL_RUT", "123456785")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts thousands separators and hyphen", () => {
      expect(format("RUT", "123456785")).toBe("12.345.678-5");
      expect(format("RUT", "8765432K")).toBe("8.765.432-K");
      expect(format("RUT", "12.345.678-5")).toBe("12.345.678-5");
      expect(format("RUT", "8.765.432-k")).toBe("8.765.432-K"); // uppercases K
    });

    it("returns input unchanged for invalid raw form", () => {
      expect(format("RUT", "X")).toBe("X");
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases K", () => {
      expect(normalize("RUT", "12.345.678-5")).toBe("123456785");
      expect(normalize("RUT", "8.765.432-k")).toBe("8765432K");
      expect(normalize("RUT", "8.765.432-K")).toBe("8765432K");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success (numeric DV)", () => {
      const r = parse("RUT", "12.345.678-5");
      expect(r).toEqual({
        ok: true,
        code: "CL_RUT",
        normalized: "123456785",
        formatted: "12.345.678-5",
        confidence: "high",
      });
    });

    it("returns ok with K verifier (lowercase normalized to uppercase)", () => {
      const r = parse("RUT", "8.765.432-k");
      expect(r).toEqual({
        ok: true,
        code: "CL_RUT",
        normalized: "8765432K",
        formatted: "8.765.432-K",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("RUT", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for single-character input", () => {
      const r = parse("RUT", "1");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for 10+ character input", () => {
      const r = parse("RUT", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("RUT", "12.345.678-0");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
