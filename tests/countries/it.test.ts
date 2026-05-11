import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/it/index.ts";

describe("IT — Codice Fiscale (CF)", () => {
  // Synthetic valid 16-char CFs computed via the DM 23-DEC-1976 check-char table.
  const VALID = [
    "RSSMRA85T10A562S", // Mario Rossi (canonical Agenzia delle Entrate example)
    "BNCMRA70A41F205F", // F variant — donna born jan 1970, Milano
    "VRDLGI50C15F839S",
    "NRARSS90E50H501L",
  ];

  describe("validate", () => {
    it("accepts valid CFs", () => {
      for (const v of VALID) expect(validate("CF", v)).toBe(true);
    });

    it("rejects invalid check character", () => {
      expect(validate("CF", "RSSMRA85T10A562A")).toBe(false);
      expect(validate("CF", "AAAAAA00A00A000A")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CF", "")).toBe(false);
      expect(validate("CF", "RSSMRA85T10A562")).toBe(false); // 15 chars
      expect(validate("CF", "RSSMRA85T10A562SS")).toBe(false); // 17 chars
      expect(validate("CF", "1234567890123456")).toBe(false);
    });

    it("rejects invalid month code (not in A-E,H,L,M,P,R,S,T)", () => {
      expect(validate("CF", "RSSMRA85F10A562Z")).toBe(false);
      expect(validate("CF", "RSSMRA85N10A562Z")).toBe(false);
    });

    it("rejects invalid day component (00 or 99)", () => {
      expect(validate("CF", "RSSMRA85T00A562Z")).toBe(false);
      expect(validate("CF", "RSSMRA85T99A562Z")).toBe(false);
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("CF", "rssmra85t10a562s")).toBe(true);
    });

    it("accepts the IT_CF code and the CODICE_FISCALE alias", () => {
      expect(validate("IT_CF", "RSSMRA85T10A562S")).toBe(true);
      expect(validate("CODICE_FISCALE", "RSSMRA85T10A562S")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns the 16-char form unchanged (no separators)", () => {
      expect(format("CF", "RSSMRA85T10A562S")).toBe("RSSMRA85T10A562S");
      expect(format("CF", "rssmra85t10a562s")).toBe("RSSMRA85T10A562S");
    });
  });

  describe("normalize", () => {
    it("strips spaces and uppercases", () => {
      expect(normalize("CF", "rss mra 85t 10a 562s")).toBe("RSSMRA85T10A562S");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted", () => {
      const r = parse("CF", "rssmra85t10a562s");
      expect(r).toEqual({
        ok: true,
        code: "IT_CF",
        normalized: "RSSMRA85T10A562S",
        formatted: "RSSMRA85T10A562S",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CF", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=invalid_checksum for bad check char", () => {
      const r = parse("CF", "RSSMRA85T10A562A");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });

    it("returns kind=too_short for short input", () => {
      const r = parse("CF", "RSSMRA85");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });
  });
});

describe("IT — Partita IVA", () => {
  describe("validate", () => {
    it("accepts valid P.IVAs (Luhn over 11)", () => {
      expect(validate("PIVA", "12345678903")).toBe(true);
      expect(validate("PIVA", "00799960158")).toBe(true);
      expect(validate("PIVA", "00488410010")).toBe(true);
    });

    it("accepts the EU-form `IT12345678903`", () => {
      expect(validate("PIVA", "IT12345678903")).toBe(true);
    });

    it("rejects invalid Luhn", () => {
      expect(validate("PIVA", "12345678901")).toBe(false);
      expect(validate("PIVA", "12345678902")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("PIVA", "")).toBe(false);
      expect(validate("PIVA", "1234567")).toBe(false);
      expect(validate("PIVA", "123456789012")).toBe(false);
      expect(validate("PIVA", "ABCDEFGHIJK")).toBe(false);
    });

    it("accepts PIVA, P_IVA, VAT aliases and the IT_PIVA code", () => {
      expect(validate("P_IVA", "12345678903")).toBe(true);
      expect(validate("VAT", "12345678903")).toBe(true);
      expect(validate("IT_PIVA", "12345678903")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns the 11-digit form unchanged", () => {
      expect(format("PIVA", "12345678903")).toBe("12345678903");
    });
  });

  describe("normalize", () => {
    it("strips the IT prefix and separators", () => {
      expect(normalize("PIVA", "IT 12345678903")).toBe("12345678903");
    });
    it("is idempotent", () => {
      const a = normalize("PIVA", "IT 12345678903");
      expect(normalize("PIVA", a)).toBe(a);
    });
  });

  describe("parse", () => {
    it("returns ok", () => {
      const r = parse("PIVA", "12345678903");
      expect(r).toEqual({
        ok: true,
        code: "IT_PIVA",
        normalized: "12345678903",
        formatted: "12345678903",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("PIVA", "12345678901");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
