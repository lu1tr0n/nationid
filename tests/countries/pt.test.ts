import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/pt/index.ts";
import { nifHolderType } from "../../src/countries/pt/nif.ts";

// PT NIF vectors. Algorithm: weights [9,8,7,6,5,4,3,2] over first 8 digits LTR;
// r = sum mod 11; DV = (r ∈ {0,1}) ? 0 : 11 - r.
//   - 123456789: prefix 1 (singular residente).  sum=156, r=2,  DV=9.
//   - 211111112: prefix 2 (singular residente).  sum=53,  r=9,  DV=2.
//   - 300000006: prefix 3 (singular residente).  sum=27,  r=5,  DV=6.
//   - 455555559: prefix 45 (singular não-residente). sum=211, r=2, DV=9.
//   - 503504564: prefix 5 (coletiva — AT itself). sum=139, r=7, DV=4.
//   - 500000000: prefix 5. sum=45, r=1, DV=0 (r==1 rule).
//   - 600000001: prefix 6 (administração pública). sum=54, r=10, DV=1.
//   - 699999995: prefix 6. sum=369, r=6, DV=5.
//   - 800000005: prefix 8 (empresário individual legacy). sum=72, r=6, DV=5.
//   - 980000009: prefix 9 (coletiva irregular). sum=145, r=2, DV=9.

describe("PT — NIF", () => {
  describe("validate", () => {
    it("accepts valid NIFs across all holder-type prefixes", () => {
      expect(validate("NIF", "123456789")).toBe(true);
      expect(validate("NIF", "211111112")).toBe(true);
      expect(validate("NIF", "300000006")).toBe(true);
      expect(validate("NIF", "455555559")).toBe(true);
      expect(validate("NIF", "503504564")).toBe(true);
      expect(validate("NIF", "500000000")).toBe(true);
      expect(validate("NIF", "600000001")).toBe(true);
      expect(validate("NIF", "699999995")).toBe(true);
      expect(validate("NIF", "800000005")).toBe(true);
      expect(validate("NIF", "980000009")).toBe(true);
    });

    it("strips whitespace and other separators", () => {
      expect(validate("NIF", "  123456789  ")).toBe(true);
      expect(validate("NIF", "123 456 789")).toBe(true);
      expect(validate("NIF", "123-456-789")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("NIF", "123456780")).toBe(false);
      expect(validate("NIF", "123456788")).toBe(false);
      expect(validate("NIF", "503504560")).toBe(false);
      expect(validate("NIF", "211111110")).toBe(false);
    });

    it("rejects 0-prefix (no holder type assigned)", () => {
      expect(validate("NIF", "000000000")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("NIF", "")).toBe(false);
      expect(validate("NIF", "12345678")).toBe(false); // 8 digits
      expect(validate("NIF", "1234567890")).toBe(false); // 10 digits
      expect(validate("NIF", "12345678A")).toBe(false);
      expect(validate("NIF", "ABCDEFGHI")).toBe(false);
    });

    it("accepts the PT_NIF fully-qualified code and NIPC alias", () => {
      expect(validate("PT_NIF", "503504564")).toBe(true);
      expect(validate("NIPC", "503504564")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns the canonical 9-digit form", () => {
      expect(format("NIF", "123456789")).toBe("123456789");
      expect(format("NIF", "123 456 789")).toBe("123456789");
      expect(format("NIF", "123-456-789")).toBe("123456789");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("NIF", "12345")).toBe("12345");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("NIF", "123 456 789")).toBe("123456789");
      expect(normalize("NIF", "123-456-789")).toBe("123456789");
    });

    it("is idempotent", () => {
      const n1 = normalize("NIF", "123 456 789");
      expect(normalize("NIF", n1)).toBe(n1);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("NIF", "123456789");
      expect(r).toEqual({
        ok: true,
        code: "PT_NIF",
        normalized: "123456789",
        formatted: "123456789",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("NIF", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("NIF", "12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("NIF", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for 0-prefix", () => {
      const r = parse("NIF", "000000000");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("NIF", "123456780");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });

  describe("nifHolderType (prefix-based holder discrimination)", () => {
    it("identifies pessoa singular residente (1, 2, 3)", () => {
      expect(nifHolderType("123456789")).toBe("singular_residente");
      expect(nifHolderType("211111112")).toBe("singular_residente");
      expect(nifHolderType("300000006")).toBe("singular_residente");
    });

    it("identifies pessoa singular não-residente (45 prefix)", () => {
      expect(nifHolderType("455555559")).toBe("singular_nao_residente");
    });

    it("identifies pessoa coletiva (5)", () => {
      expect(nifHolderType("503504564")).toBe("coletiva");
      expect(nifHolderType("500000000")).toBe("coletiva");
    });

    it("identifies administração pública (6)", () => {
      expect(nifHolderType("600000001")).toBe("administracao_publica");
      expect(nifHolderType("699999995")).toBe("administracao_publica");
    });

    it("identifies empresário em nome individual (8)", () => {
      expect(nifHolderType("800000005")).toBe("empresario_individual");
    });

    it("identifies coletiva irregular (9)", () => {
      expect(nifHolderType("980000009")).toBe("coletiva_irregular");
    });

    it("returns unknown for malformed input", () => {
      expect(nifHolderType("")).toBe("unknown");
      expect(nifHolderType("ABC")).toBe("unknown");
      expect(nifHolderType("12345")).toBe("unknown");
    });
  });
});

// PT CC vectors (format-only validation).
//   - 123456789ZZ4: canonical illustrative example from research.
//   - 000000000AA0: minimum.
//   - 999999999ZZ9: maximum.

describe("PT — CC", () => {
  describe("validate", () => {
    it("accepts valid CC structures", () => {
      expect(validate("CC", "123456789ZZ4")).toBe(true);
      expect(validate("CC", "000000000AA0")).toBe(true);
      expect(validate("CC", "999999999ZZ9")).toBe(true);
    });

    it("strips whitespace separators", () => {
      expect(validate("CC", "12345678 9 ZZ 4")).toBe(true);
      expect(validate("CC", "  123456789ZZ4  ")).toBe(true);
      expect(validate("CC", "12345678 9 ZZ4")).toBe(true);
    });

    it("uppercases lowercase letter sections", () => {
      expect(validate("CC", "123456789zz4")).toBe(true);
      expect(validate("CC", "123456789zZ4")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("CC", "")).toBe(false);
      expect(validate("CC", "12345678ZZ4")).toBe(false); // 8+2+1 = 11 chars
      expect(validate("CC", "1234567890ZZ4")).toBe(false); // 10+2+1 = 13 chars
      expect(validate("CC", "1234567899Z4")).toBe(false); // 1 letter instead of 2
      expect(validate("CC", "12345678ZZZZ4")).toBe(false); // 4 letters
      expect(validate("CC", "ABCDEFGHIJKL")).toBe(false);
      expect(validate("CC", "123456789ZZA")).toBe(false); // letter at DV position
    });

    it("accepts the PT_CC fully-qualified code", () => {
      expect(validate("PT_CC", "123456789ZZ4")).toBe(true);
    });

    it("does NOT enforce ISO/IEC 7064 MOD 37,2 DV (format-only, audit decision v0.5)", () => {
      // The IRN PDF references ISO/IEC 7064 MOD 37,2 but the trailing DV
      // depends on a per-version constant that cannot be reproduced
      // reliably without in-country cross-validation. Per
      // `coverage-audit-2026-05-10.md` we keep confidence `low` and accept
      // arbitrary trailing-digit DVs as long as the structure matches.
      expect(validate("CC", "123456789ZZ0")).toBe(true);
      expect(validate("CC", "123456789ZZ5")).toBe(true);
      expect(validate("CC", "123456789ZZ9")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts spaces at canonical positions", () => {
      expect(format("CC", "123456789ZZ4")).toBe("12345678 9 ZZ 4");
      expect(format("CC", "12345678 9 ZZ 4")).toBe("12345678 9 ZZ 4");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CC", "1234")).toBe("1234");
    });

    it("preserves round-trip: format(normalize(x)) === format(x)", () => {
      const inputs = ["123456789ZZ4", "12345678 9 ZZ 4", "12345678 9 ZZ4"];
      for (const x of inputs) {
        expect(format("CC", normalize("CC", x))).toBe(format("CC", x));
      }
    });
  });

  describe("normalize", () => {
    it("strips spaces and uppercases", () => {
      expect(normalize("CC", "12345678 9 zz 4")).toBe("123456789ZZ4");
      expect(normalize("CC", "  123456789ZZ4  ")).toBe("123456789ZZ4");
    });

    it("is idempotent", () => {
      const n1 = normalize("CC", "12345678 9 ZZ 4");
      expect(normalize("CC", n1)).toBe(n1);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CC", "12345678 9 ZZ 4");
      expect(r).toEqual({
        ok: true,
        code: "PT_CC",
        normalized: "123456789ZZ4",
        formatted: "12345678 9 ZZ 4",
        confidence: "low",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CC", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CC", "12345678");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CC", "123456789ZZZZ4");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for letter at DV position", () => {
      const r = parse("CC", "123456789ZZA");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

describe("PT — Passaporte (PT_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (1 letter + 6 digits)", () => {
      expect(validate("PASAPORTE", "C123456")).toBe(true);
      expect(validate("PASAPORTE", "P000001")).toBe(true);
      expect(validate("PASAPORTE", "Z999999")).toBe(true);
      expect(validate("PASAPORTE", "A123456")).toBe(true);
      expect(validate("PASAPORTE", " C123456 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "C12345")).toBe(false); // too short
      expect(validate("PASAPORTE", "C1234567")).toBe(false); // too long
      expect(validate("PASAPORTE", "AB12345")).toBe(false); // 2 letters
      expect(validate("PASAPORTE", "1234567")).toBe(false); // no letter
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "c123456")).toBe(true);
    });

    it("accepts the PT_PASAPORTE fully-qualified code", () => {
      expect(validate("PT_PASAPORTE", "C123456")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "c123456");
      expect(r).toEqual({
        ok: true,
        code: "PT_PASAPORTE",
        normalized: "C123456",
        formatted: "C123456",
        confidence: "moderate",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PASAPORTE", "C12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PASAPORTE", "C1234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
