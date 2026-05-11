import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/nl/index.ts";

describe("NL — BSN", () => {
  describe("validate", () => {
    it("accepts valid BSNs (eleven-test passes)", () => {
      expect(validate("BSN", "123456782")).toBe(true);
      expect(validate("BSN", "111222333")).toBe(true);
      expect(validate("BSN", "010101019")).toBe(true);
    });

    it("left-pads 8-digit input with a leading zero", () => {
      expect(normalize("BSN", "10101019")).toBe("010101019");
      expect(validate("BSN", "10101019")).toBe(true);
    });

    it("rejects invalid checksums", () => {
      expect(validate("BSN", "123456789")).toBe(false);
      expect(validate("BSN", "111111111")).toBe(false);
    });

    it("rejects all-zeros placeholder", () => {
      expect(validate("BSN", "000000000")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("BSN", "")).toBe(false);
      expect(validate("BSN", "1234")).toBe(false);
      expect(validate("BSN", "1234567890")).toBe(false);
      expect(validate("BSN", "abcdefghi")).toBe(false);
    });

    it("accepts the NL_BSN fully-qualified code", () => {
      expect(validate("NL_BSN", "123456782")).toBe(true);
    });
  });

  describe("normalize", () => {
    it("strips separators and pads 8-digit", () => {
      expect(normalize("BSN", "12.34.56.782")).toBe("123456782");
    });

    it("is idempotent", () => {
      const a = normalize("BSN", "12-34-567-82");
      expect(normalize("BSN", a)).toBe(a);
    });
  });

  describe("format / parse", () => {
    it("round-trips through normalize → format", () => {
      const n = normalize("BSN", "123 456 782");
      expect(format("BSN", n)).toBe("123456782");
    });

    it("returns ok with confidence high", () => {
      const r = parse("BSN", "123456782");
      expect(r).toEqual({
        ok: true,
        code: "NL_BSN",
        normalized: "123456782",
        formatted: "123456782",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("BSN", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("BSN", "123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("NL — BTW", () => {
  describe("validate", () => {
    it("accepts BTW with BSN-style core (eleven-test passes)", () => {
      expect(validate("BTW", "NL123456782B01")).toBe(true);
      expect(validate("VAT", "NL123456782B01")).toBe(true);
    });

    it("accepts BTW with MOD 97-10 only core (post-2020 sole proprietor)", () => {
      // 100000017 mod 97 == 1, but eleven-test fails (sum=4 ≠ 0).
      expect(validate("BTW", "NL100000017B01")).toBe(true);
    });

    it("rejects bad checksums", () => {
      expect(validate("BTW", "NL123456789B01")).toBe(false);
    });

    it("rejects B00 sub-number and all-zero core", () => {
      expect(validate("BTW", "NL123456782B00")).toBe(false);
      expect(validate("BTW", "NL000000000B01")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("BTW", "")).toBe(false);
      expect(validate("BTW", "DE123456782B01")).toBe(false);
      expect(validate("BTW", "NL123456782X01")).toBe(false);
      expect(validate("BTW", "NL12345678B01")).toBe(false);
    });
  });

  describe("normalize / format", () => {
    it("uppercases input", () => {
      expect(normalize("BTW", "nl123456782b01")).toBe("NL123456782B01");
    });

    it("round-trips", () => {
      const n = normalize("BTW", "nl 123.456.782 b 01");
      expect(format("BTW", n)).toBe("NL123456782B01");
    });
  });

  describe("parse", () => {
    it("returns ok with confidence moderate", () => {
      const r = parse("BTW", "nl123456782b01");
      expect(r).toEqual({
        ok: true,
        code: "NL_BTW",
        normalized: "NL123456782B01",
        formatted: "NL123456782B01",
        confidence: "moderate",
      });
    });

    it("returns kind=invalid_checksum for bad core", () => {
      const r = parse("BTW", "NL123456789B01");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("BTW", "NL123");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });
  });
});
