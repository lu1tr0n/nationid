import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/pa/index.ts";

describe("PA — Cédula", () => {
  describe("validate", () => {
    it("accepts numeric provincia prefixes 1-13", () => {
      expect(validate("CEDULA", "1-23-456")).toBe(true);
      expect(validate("CEDULA", "8-123-456")).toBe(true);
      expect(validate("CEDULA", "13-1234-567890")).toBe(true);
      expect(validate("CEDULA", "9-1-1")).toBe(true);
    });

    it("accepts alphabetic prefixes PE, E, N", () => {
      expect(validate("CEDULA", "PE-12-345")).toBe(true);
      expect(validate("CEDULA", "E-12-345")).toBe(true);
      expect(validate("CEDULA", "N-12-345")).toBe(true);
      expect(validate("CEDULA", "pe-12-345")).toBe(true); // case-insensitive
    });

    it("accepts the PA_CEDULA fully-qualified code", () => {
      expect(validate("PA_CEDULA", "8-123-456")).toBe(true);
    });

    it("strips internal whitespace", () => {
      expect(validate("CEDULA", "8 - 123 - 456")).toBe(true);
    });

    it("rejects out-of-range numeric provincia", () => {
      expect(validate("CEDULA", "0-123-456")).toBe(false);
      expect(validate("CEDULA", "14-123-456")).toBe(false);
      expect(validate("CEDULA", "99-123-456")).toBe(false);
    });

    it("rejects unknown alphabetic prefixes", () => {
      expect(validate("CEDULA", "X-12-345")).toBe(false);
      expect(validate("CEDULA", "AB-12-345")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CEDULA", "")).toBe(false);
      expect(validate("CEDULA", "8")).toBe(false);
      expect(validate("CEDULA", "8-")).toBe(false);
      expect(validate("CEDULA", "8-123")).toBe(false); // missing asiento
      expect(validate("CEDULA", "8-12345-678901")).toBe(false); // tomo too long
      expect(validate("CEDULA", "8-123-1234567")).toBe(false); // asiento too long
      expect(validate("CEDULA", "8 123 456")).toBe(false); // space-separated
    });
  });

  describe("format", () => {
    it("returns the canonical hyphenated form", () => {
      expect(format("CEDULA", "8-123-456")).toBe("8-123-456");
      expect(format("CEDULA", "8 - 123 - 456")).toBe("8-123-456");
      expect(format("CEDULA", "pe-12-345")).toBe("PE-12-345");
    });

    it("returns input unchanged for invalid form", () => {
      expect(format("CEDULA", "abc")).toBe("abc");
    });
  });

  describe("normalize", () => {
    it("strips whitespace and uppercases", () => {
      expect(normalize("CEDULA", "  pe - 12 - 345  ")).toBe("PE-12-345");
    });

    it("is idempotent", () => {
      const once = normalize("CEDULA", "8-123-456");
      expect(normalize("CEDULA", once)).toBe(once);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CEDULA", "8-123-456");
      expect(r).toEqual({
        ok: true,
        code: "PA_CEDULA",
        normalized: "8-123-456",
        formatted: "8-123-456",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CEDULA", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short on tiny input", () => {
      const r = parse("CEDULA", "8");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=invalid_format for unknown prefix", () => {
      const r = parse("CEDULA", "X-12-345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

describe("PA — RUC", () => {
  describe("validate", () => {
    it("accepts natural RUC (cédula-style)", () => {
      expect(validate("RUC", "8-123-456")).toBe(true);
      expect(validate("RUC", "PE-12-345")).toBe(true);
    });

    it("accepts jurídica RUC (Tomo-Folio-Asiento)", () => {
      expect(validate("RUC", "1234-5678-901234")).toBe(true);
      expect(validate("RUC", "155-634-586")).toBe(true);
    });

    it("strips ' DV NN' suffix during normalize", () => {
      expect(validate("RUC", "1234-5678-901234 DV 32")).toBe(true);
      expect(validate("RUC", "1234-5678-901234-DV-32")).toBe(true);
      expect(validate("RUC", "8-123-456 DV 5")).toBe(true);
    });

    it("does NOT enforce DV consistency (format-only, audit decision v0.5)", () => {
      // The audit flagged DGI's DV calculator at dgi.mef.gob.pa/Dv but no
      // first-party algorithm is published; community reference impls
      // diverge in edge cases. We deliberately keep format-only validation
      // so an incorrect DV in the suffix is silently stripped rather than
      // raising a false-positive `invalid_checksum`. If/when DGI publishes
      // the formula, this test should be updated to expect `false` for
      // mismatched DVs and `confidence: "moderate"`.
      expect(validate("RUC", "1234-5678-901234 DV 99")).toBe(true);
      expect(validate("RUC", "1234-5678-901234 DV 00")).toBe(true);
    });

    it("accepts PA_RUC fully-qualified code", () => {
      expect(validate("PA_RUC", "1234-5678-901234")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("RUC", "")).toBe(false);
      expect(validate("RUC", "ab")).toBe(false);
      expect(validate("RUC", "1234-5678-901234567")).toBe(false); // asiento too long
      expect(validate("RUC", "12345-5678-901234")).toBe(false); // tomo too long
    });
  });

  describe("format", () => {
    it("strips DV suffix and returns hyphenated form", () => {
      expect(format("RUC", "1234-5678-901234 DV 32")).toBe("1234-5678-901234");
      expect(format("RUC", "8-123-456")).toBe("8-123-456");
    });
  });

  describe("normalize", () => {
    it("strips DV and whitespace", () => {
      expect(normalize("RUC", "1234-5678-901234 DV 32")).toBe("1234-5678-901234");
    });

    it("is idempotent", () => {
      const once = normalize("RUC", "1234-5678-901234");
      expect(normalize("RUC", once)).toBe(once);
    });
  });

  describe("parse", () => {
    it("returns ok for jurídica", () => {
      const r = parse("RUC", "1234-5678-901234");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.code).toBe("PA_RUC");
        expect(r.confidence).toBe("low");
      }
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("RUC", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=invalid_format for malformed input", () => {
      const r = parse("RUC", "ABC-DEF-GHI");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

describe("PA — Pasaporte (PA_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (0-2 letters + 6-8 digits)", () => {
      expect(validate("PASAPORTE", "12345678")).toBe(true);
      expect(validate("PASAPORTE", "PA123456")).toBe(true);
      expect(validate("PASAPORTE", "123456")).toBe(true);
      expect(validate("PASAPORTE", "PA12345678")).toBe(true);
      expect(validate("PASAPORTE", " PA123456 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "12345")).toBe(false); // too short
      expect(validate("PASAPORTE", "PAB12345678")).toBe(false); // 3 letters
      expect(validate("PASAPORTE", "PA123456789")).toBe(false); // too many digits
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "pa123456")).toBe(true);
    });

    it("accepts the PA_PASAPORTE fully-qualified code", () => {
      expect(validate("PA_PASAPORTE", "12345678")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "pa123456");
      expect(r).toEqual({
        ok: true,
        code: "PA_PASAPORTE",
        normalized: "PA123456",
        formatted: "PA123456",
        confidence: "low",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PASAPORTE", "12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PASAPORTE", "PA123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
