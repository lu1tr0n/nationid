import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/ch/index.ts";

describe("CH — AHV", () => {
  describe("validate", () => {
    it("accepts valid AHV numbers", () => {
      // EAN-13 dvs computed: 7561234567897, 7569876543217, 7561000000016
      expect(validate("AHV", "7561234567897")).toBe(true);
      expect(validate("AHV", "756.1234.5678.97")).toBe(true);
      expect(validate("AHV", "7569876543217")).toBe(true);
      expect(validate("AHV", "7561000000016")).toBe(true);
      expect(validate("AVS", "7561234567897")).toBe(true);
    });

    it("rejects bad checksums", () => {
      expect(validate("AHV", "7561234567890")).toBe(false);
      expect(validate("AHV", "7569876543210")).toBe(false);
    });

    it("rejects non-756 prefix", () => {
      // 752 is Sweden — not Switzerland.
      expect(validate("AHV", "7521234567897")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("AHV", "")).toBe(false);
      expect(validate("AHV", "756123456789")).toBe(false);
      expect(validate("AHV", "75612345678970")).toBe(false);
      expect(validate("AHV", "abcdefghijklm")).toBe(false);
    });

    it("accepts the CH_AHV fully-qualified code", () => {
      expect(validate("CH_AHV", "7561234567897")).toBe(true);
    });
  });

  describe("format / normalize", () => {
    it("formats canonical form", () => {
      expect(format("AHV", "7561234567897")).toBe("756.1234.5678.97");
      expect(format("AHV", "756.1234.5678.97")).toBe("756.1234.5678.97");
    });

    it("strips separators on normalize", () => {
      expect(normalize("AHV", "756.1234.5678.97")).toBe("7561234567897");
    });

    it("normalize is idempotent", () => {
      const a = normalize("AHV", "756.1234.5678.97");
      expect(normalize("AHV", a)).toBe(a);
    });
  });

  describe("parse", () => {
    it("returns ok with confidence high", () => {
      const r = parse("AHV", "756.1234.5678.97");
      expect(r).toEqual({
        ok: true,
        code: "CH_AHV",
        normalized: "7561234567897",
        formatted: "756.1234.5678.97",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("AHV", "7561234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("CH — UID", () => {
  describe("validate", () => {
    it("accepts valid UIDs", () => {
      // CHE + first8=12345678 → r=8 → dv=8 → CHE123456788
      expect(validate("UID", "CHE123456788")).toBe(true);
      expect(validate("UID", "CHE-123.456.788")).toBe(true);
      // first8=10565449, dv=7 → CHE105654497
      expect(validate("UID", "CHE105654497")).toBe(true);
      // first8=10000001, dv=2 → CHE100000012
      expect(validate("UID", "CHE100000012")).toBe(true);
      expect(validate("IDE", "CHE123456788")).toBe(true);
    });

    it("rejects bad checksums", () => {
      expect(validate("UID", "CHE123456780")).toBe(false);
      expect(validate("UID", "CHE100000019")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("UID", "")).toBe(false);
      expect(validate("UID", "CHE12345678")).toBe(false);
      expect(validate("UID", "CHE1234567890")).toBe(false);
      expect(validate("UID", "USA123456788")).toBe(false);
    });
  });

  describe("format / parse", () => {
    it("formats canonical form", () => {
      expect(format("UID", "CHE123456788")).toBe("CHE-123.456.788");
    });

    it("parse returns ok", () => {
      const r = parse("UID", "CHE-123.456.788");
      expect(r).toEqual({
        ok: true,
        code: "CH_UID",
        normalized: "CHE123456788",
        formatted: "CHE-123.456.788",
        confidence: "high",
      });
    });
  });
});

describe("CH — MWST/TVA/IVA", () => {
  it("accepts UID with each language suffix", () => {
    expect(validate("MWST", "CHE123456788MWST")).toBe(true);
    expect(validate("MWST", "CHE-123.456.788 TVA")).toBe(true);
    expect(validate("TVA", "CHE-123.456.788 IVA")).toBe(true);
    expect(validate("VAT", "CHE-123.456.788 MWST")).toBe(true);
  });

  it("rejects UID with bad checksum even with suffix", () => {
    expect(validate("MWST", "CHE123456780MWST")).toBe(false);
  });

  it("rejects missing or unknown suffix", () => {
    expect(validate("MWST", "CHE123456788")).toBe(false);
    expect(validate("MWST", "CHE123456788XXX")).toBe(false);
  });

  it("formats canonical form", () => {
    expect(format("MWST", "che123456788mwst")).toBe("CHE-123.456.788 MWST");
  });

  it("parse returns ok with confidence moderate", () => {
    const r = parse("MWST", "CHE-123.456.788 MWST");
    expect(r).toEqual({
      ok: true,
      code: "CH_MWST",
      normalized: "CHE123456788MWST",
      formatted: "CHE-123.456.788 MWST",
      confidence: "moderate",
    });
  });
});
