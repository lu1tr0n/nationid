import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/de/index.ts";

describe("DE — Steuer-ID (IdNr)", () => {
  // Synthetic valid IdNrs computed via ISO/IEC 7064 MOD 11,10.
  const VALID = ["47036892816", "81872495633", "26954371827"];

  describe("validate", () => {
    it("accepts valid Steuer-ID numbers", () => {
      for (const v of VALID) expect(validate("STEUER_ID", v)).toBe(true);
      expect(validate("STEUER_ID", "47 036 892 816")).toBe(true);
    });

    it("rejects invalid checksum", () => {
      expect(validate("STEUER_ID", "47036892810")).toBe(false);
      expect(validate("STEUER_ID", "12345678901")).toBe(false);
    });

    it("rejects body that lacks the unique-repeat pattern", () => {
      // First 10 digits all unique → no repeats → invalid per § 139b AO.
      expect(validate("STEUER_ID", "12345678905")).toBe(false);
      // First 10 digits with two distinct repeating digits → invalid.
      expect(validate("STEUER_ID", "11223456787")).toBe(false);
    });

    it("rejects leading zero", () => {
      expect(validate("STEUER_ID", "01234567890")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("STEUER_ID", "")).toBe(false);
      expect(validate("STEUER_ID", "1234567890")).toBe(false);
      expect(validate("STEUER_ID", "ABCDEFGHIJK")).toBe(false);
    });

    it("accepts the IDNR alias and the DE_STEUER_ID fully-qualified code", () => {
      expect(validate("IDNR", "47036892816")).toBe(true);
      expect(validate("DE_STEUER_ID", "47036892816")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts grouping spaces 2-3-3-3", () => {
      expect(format("STEUER_ID", "47036892816")).toBe("47 036 892 816");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted", () => {
      const r = parse("STEUER_ID", "47 036 892 816");
      expect(r).toEqual({
        ok: true,
        code: "DE_STEUER_ID",
        normalized: "47036892816",
        formatted: "47 036 892 816",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("STEUER_ID", "47036892810");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });

    it("returns kind=invalid_format for missing repeat pattern", () => {
      const r = parse("STEUER_ID", "12345678905");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });

  describe("normalize", () => {
    it("strips spaces", () => {
      expect(normalize("STEUER_ID", "47 036 892 816")).toBe("47036892816");
    });
  });
});

describe("DE — Steuernummer (state-issued tax number)", () => {
  describe("validate", () => {
    it("accepts plausible 10-13 digit forms (format-only)", () => {
      expect(validate("STEUERNUMMER", "1234567890")).toBe(true);
      expect(validate("STEUERNUMMER", "123/456/78901")).toBe(true);
      expect(validate("STEUERNUMMER", "12345678901")).toBe(true);
      expect(validate("STEUERNUMMER", "1234567890123")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("STEUERNUMMER", "")).toBe(false);
      expect(validate("STEUERNUMMER", "12345")).toBe(false);
      expect(validate("STEUERNUMMER", "12345678901234")).toBe(false);
      expect(validate("STEUERNUMMER", "ABCDEFGHIJ")).toBe(false);
    });

    it("accepts the DE_STEUERNUMMER fully-qualified code", () => {
      expect(validate("DE_STEUERNUMMER", "1234567890")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok and never invalid_checksum (format-only)", () => {
      const r = parse("STEUERNUMMER", "123/456/78901");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.confidence).toBe("low");
    });
  });
});

describe("DE — USt-IdNr (VAT)", () => {
  describe("validate", () => {
    it("accepts valid VAT numbers", () => {
      expect(validate("USTID", "DE123456788")).toBe(true);
      expect(validate("USTID", "DE136695976")).toBe(true);
      expect(validate("USTID", "DE 123 456 788")).toBe(true);
    });

    it("rejects invalid checksum", () => {
      expect(validate("USTID", "DE123456789")).toBe(false);
      expect(validate("USTID", "DE000000000")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("USTID", "")).toBe(false);
      expect(validate("USTID", "DE12345")).toBe(false);
      expect(validate("USTID", "FR123456788")).toBe(false);
      expect(validate("USTID", "DE023456788")).toBe(false); // first digit 0
    });

    it("normalizes a bare 9-digit form by prepending DE", () => {
      expect(validate("USTID", "123456788")).toBe(true);
    });

    it("accepts UST_ID, VAT aliases and the DE_USTID code", () => {
      expect(validate("UST_ID", "DE123456788")).toBe(true);
      expect(validate("VAT", "DE123456788")).toBe(true);
      expect(validate("DE_USTID", "DE123456788")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts spaces DE NNN NNN NNN", () => {
      expect(format("USTID", "DE123456788")).toBe("DE 123 456 788");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted", () => {
      const r = parse("USTID", "DE 123 456 788");
      expect(r).toEqual({
        ok: true,
        code: "DE_USTID",
        normalized: "DE123456788",
        formatted: "DE 123 456 788",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("USTID", "DE123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
