import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/pe/index.ts";

describe("PE — DNI", () => {
  describe("validate", () => {
    it("accepts valid DNIs (8 digits, raw and trimmed)", () => {
      expect(validate("DNI", "12345678")).toBe(true);
      expect(validate("DNI", "47852136")).toBe(true);
      expect(validate("DNI", "00000001")).toBe(true);
      expect(validate("DNI", "99999999")).toBe(true);
      expect(validate("DNI", " 12345678 ")).toBe(true);
      expect(validate("DNI", "12-345-678")).toBe(true); // non-digits stripped
    });

    it("rejects malformed input", () => {
      expect(validate("DNI", "")).toBe(false);
      expect(validate("DNI", "1234567")).toBe(false); // 7 digits
      expect(validate("DNI", "123456789")).toBe(false); // 9 digits
      expect(validate("DNI", "abcdefgh")).toBe(false); // strips to empty
      expect(validate("DNI", "1234")).toBe(false);
    });

    it("accepts the PE_DNI fully-qualified code", () => {
      expect(validate("PE_DNI", "12345678")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns the 8-digit form (no separators)", () => {
      expect(format("DNI", "12345678")).toBe("12345678");
      expect(format("DNI", "12-345-678")).toBe("12345678");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("DNI", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("DNI", "12-345-678")).toBe("12345678");
      expect(normalize("DNI", " 12345678 ")).toBe("12345678");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("DNI", "12345678");
      expect(r).toEqual({
        ok: true,
        code: "PE_DNI",
        normalized: "12345678",
        formatted: "12345678",
        confidence: "low",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("DNI", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("DNI", "1234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("DNI", "123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

describe("PE — CE (Carné de Extranjería)", () => {
  describe("validate", () => {
    it("accepts valid CEs (9-12 digits)", () => {
      expect(validate("CE", "123456789")).toBe(true); // 9
      expect(validate("CE", "1234567890")).toBe(true); // 10
      expect(validate("CE", "12345678901")).toBe(true); // 11
      expect(validate("CE", "123456789012")).toBe(true); // 12
      expect(validate("CE", "001020304")).toBe(true);
      expect(validate("CE", " 123456789 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("CE", "")).toBe(false);
      expect(validate("CE", "12345678")).toBe(false); // 8 (too short)
      expect(validate("CE", "1234567890123")).toBe(false); // 13 (too long)
      expect(validate("CE", "abcdefghi")).toBe(false); // strips to empty
      expect(validate("CE", "1234")).toBe(false);
    });

    it("accepts the PE_CE fully-qualified code", () => {
      expect(validate("PE_CE", "123456789")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("CE", "123456789");
      expect(r).toEqual({
        ok: true,
        code: "PE_CE",
        normalized: "123456789",
        formatted: "123456789",
        confidence: "low",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CE", "12345678");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CE", "1234567890123");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

// PE_RUC test vectors with DVs computed via SUNAT mod-11 algorithm
// (weights [5,4,3,2,7,6,5,4,3,2] over first 10 digits; r=sum%11; dv=11-r;
// dv==11 → 0; dv==10 → 1).  All bodies SYNTHETIC.
//   - 20100070971 — prefix 20 (jurídica) + body 10007097 + DV 1
//   - 20123456786 — prefix 20 + body 12345678 + DV 6
//   - 10123456780 — prefix 10 (natural con negocio) + body + DV 0
//   - 15123456782 — prefix 15 (sucesión indivisa) + body + DV 2
//   - 16010203043 — prefix 16 (no domiciliado especial) + body + DV 3
//   - 17123456785 — prefix 17 (no domiciliado) + body + DV 5
//   - 20998877661 — prefix 20 + body + DV 1

describe("PE — RUC", () => {
  describe("validate", () => {
    it("accepts valid RUCs (jurídica prefix 20)", () => {
      expect(validate("RUC", "20100070971")).toBe(true);
      expect(validate("RUC", "20123456786")).toBe(true);
      expect(validate("RUC", "20998877661")).toBe(true);
    });

    it("accepts valid RUCs (persona natural prefix 10)", () => {
      expect(validate("RUC", "10123456780")).toBe(true);
    });

    it("accepts valid RUCs (other prefixes 15/16/17)", () => {
      expect(validate("RUC", "15123456782")).toBe(true);
      expect(validate("RUC", "16010203043")).toBe(true);
      expect(validate("RUC", "17123456785")).toBe(true);
    });

    it("normalizes whitespace and separators", () => {
      expect(validate("RUC", " 20100070971 ")).toBe(true);
      expect(validate("RUC", "20-10007097-1")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("RUC", "20100070970")).toBe(false);
      expect(validate("RUC", "20123456780")).toBe(false);
      expect(validate("RUC", "10123456789")).toBe(false);
    });

    it("rejects invalid prefixes (not in 10/15/16/17/20)", () => {
      // Any DV; prefix 30 is invalid for RUC.
      expect(validate("RUC", "30123456780")).toBe(false);
      expect(validate("RUC", "11123456789")).toBe(false);
      expect(validate("RUC", "00123456789")).toBe(false);
    });

    it("rejects malformed input (length, charset)", () => {
      expect(validate("RUC", "")).toBe(false);
      expect(validate("RUC", "2010007097")).toBe(false); // 10 digits (too short)
      expect(validate("RUC", "201000709712")).toBe(false); // 12 digits (too long)
      expect(validate("RUC", "ABCDEFGHIJK")).toBe(false); // letters strip to empty
    });

    it("rejects all-same-digit sequences (placeholders)", () => {
      expect(validate("RUC", "11111111111")).toBe(false);
      expect(validate("RUC", "00000000000")).toBe(false);
    });

    it("accepts the PE_RUC fully-qualified code", () => {
      expect(validate("PE_RUC", "20100070971")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns the 11-digit form (no separators)", () => {
      expect(format("RUC", "20100070971")).toBe("20100070971");
      expect(format("RUC", "20-10007097-1")).toBe("20100070971");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("RUC", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("RUC", "20-10007097-1")).toBe("20100070971");
      expect(normalize("RUC", "20.10007097.1")).toBe("20100070971");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("RUC", "20-10007097-1");
      expect(r).toEqual({
        ok: true,
        code: "PE_RUC",
        normalized: "20100070971",
        formatted: "20100070971",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("RUC", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("RUC", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("RUC", "201000709712");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for forbidden prefix (DV correct)", () => {
      // Prefix 11 is invalid; the regex rejects it as invalid_format.
      const r = parse("RUC", "11123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for all-same-digit", () => {
      const r = parse("RUC", "11111111111");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("RUC", "20100070970");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("PE — Pasaporte (PE_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (lenient: optional letter + 8-9 digits)", () => {
      expect(validate("PASAPORTE", "A12345678")).toBe(true);
      expect(validate("PASAPORTE", "12345678")).toBe(true);
      expect(validate("PASAPORTE", "123456789")).toBe(true);
      expect(validate("PASAPORTE", "B23456789")).toBe(true);
      expect(validate("PASAPORTE", " A12345678 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "1234567")).toBe(false); // 7 digits — too short
      expect(validate("PASAPORTE", "A1234567890")).toBe(false); // 11 chars — too long
      expect(validate("PASAPORTE", "AB12345678")).toBe(false); // 2 letters
      expect(validate("PASAPORTE", "@@@@@@@@")).toBe(false);
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "a12345678")).toBe(true);
    });

    it("accepts the PE_PASAPORTE fully-qualified code", () => {
      expect(validate("PE_PASAPORTE", "A12345678")).toBe(true);
    });
  });

  describe("normalize", () => {
    it("is idempotent", () => {
      const a = normalize("PASAPORTE", "a12345678");
      expect(normalize("PASAPORTE", a)).toBe(a);
      expect(a).toBe("A12345678");
    });
  });

  describe("format", () => {
    it("round-trips through normalize → format", () => {
      const raw = "a12345678";
      const n = normalize("PASAPORTE", raw);
      expect(format("PASAPORTE", n)).toBe(n);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "a12345678");
      expect(r).toEqual({
        ok: true,
        code: "PE_PASAPORTE",
        normalized: "A12345678",
        formatted: "A12345678",
        confidence: "low",
      });
    });

    it("returns kind=too_short for fewer than 8 chars", () => {
      const r = parse("PASAPORTE", "1234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for more than 10 chars", () => {
      const r = parse("PASAPORTE", "AB123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
