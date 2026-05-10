import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/br/index.ts";

// Test vectors with checksums computed by the algorithm in cpf.ts (cross-checked
// against `cpf-cnpj-validator` reference values).
//   - 52998224725: well-known valid synthetic CPF used across Brazilian fintech tests.
//   - 12949176259: random body 129491762 + computed DV 59.
//   - 12345678909: sequential body + computed DV 09.
//   - 00000000191: edge-case low body + DV 91 (not all-same-digit).
//   - 98765432100: descending body + DV 00.

describe("BR — CPF", () => {
  describe("validate", () => {
    it("accepts valid CPFs (raw and formatted)", () => {
      expect(validate("CPF", "52998224725")).toBe(true);
      expect(validate("CPF", "529.982.247-25")).toBe(true);
      expect(validate("CPF", "12949176259")).toBe(true);
      expect(validate("CPF", "129.491.762-59")).toBe(true);
      expect(validate("CPF", "12345678909")).toBe(true);
      expect(validate("CPF", "00000000191")).toBe(true);
      expect(validate("CPF", "98765432100")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CPF", "52998224724")).toBe(false);
      expect(validate("CPF", "12949176232")).toBe(false);
      expect(validate("CPF", "12345678900")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CPF", "")).toBe(false);
      expect(validate("CPF", "1234")).toBe(false);
      expect(validate("CPF", "529982247256")).toBe(false);
      expect(validate("CPF", "ABCDEFGHIJK")).toBe(false);
    });

    it("rejects all-same-digit sequences (placeholders)", () => {
      expect(validate("CPF", "11111111111")).toBe(false);
      expect(validate("CPF", "00000000000")).toBe(false);
      expect(validate("CPF", "999.999.999-99")).toBe(false);
    });

    it("accepts the BR_CPF fully-qualified code", () => {
      expect(validate("BR_CPF", "52998224725")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts dots and hyphen at canonical positions", () => {
      expect(format("CPF", "52998224725")).toBe("529.982.247-25");
      expect(format("CPF", "529.982.247-25")).toBe("529.982.247-25");
      expect(format("CPF", "529 982 247 25")).toBe("529.982.247-25");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CPF", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("CPF", "529.982.247-25")).toBe("52998224725");
      expect(normalize("CPF", "529 982 247 25")).toBe("52998224725");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CPF", "529.982.247-25");
      expect(r).toEqual({
        ok: true,
        code: "BR_CPF",
        normalized: "52998224725",
        formatted: "529.982.247-25",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CPF", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CPF", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CPF", "529982247256");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for all-same-digit", () => {
      const r = parse("CPF", "11111111111");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("CPF", "52998224724");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// Test vectors with checksums computed by the algorithm in cnpj.ts.
//   - 11222333000181: well-known valid synthetic CNPJ.
//   - 00223344000160: low-prefix body + computed DVs.
//   - 11222333000262: same root with different filial (0002) + DV 62.
//   - 99988877000108: random body + DV 08.
//   - 12345678000195: sequential body + DV 95.

describe("BR — CNPJ", () => {
  describe("validate", () => {
    it("accepts valid CNPJs (raw and formatted)", () => {
      expect(validate("CNPJ", "11222333000181")).toBe(true);
      expect(validate("CNPJ", "11.222.333/0001-81")).toBe(true);
      expect(validate("CNPJ", "00223344000160")).toBe(true);
      expect(validate("CNPJ", "11222333000262")).toBe(true);
      expect(validate("CNPJ", "99988877000108")).toBe(true);
      expect(validate("CNPJ", "12345678000195")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CNPJ", "11222333000180")).toBe(false);
      expect(validate("CNPJ", "11222333000182")).toBe(false);
      expect(validate("CNPJ", "12345678000100")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CNPJ", "")).toBe(false);
      expect(validate("CNPJ", "1234")).toBe(false);
      expect(validate("CNPJ", "112223330001811")).toBe(false);
      expect(validate("CNPJ", "ABCDEFGHIJKLMN")).toBe(false);
    });

    it("rejects all-same-digit sequences (placeholders)", () => {
      expect(validate("CNPJ", "00000000000000")).toBe(false);
      expect(validate("CNPJ", "11111111111111")).toBe(false);
    });

    it("accepts the BR_CNPJ fully-qualified code", () => {
      expect(validate("BR_CNPJ", "11222333000181")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts dots, slash, and hyphen at canonical positions", () => {
      expect(format("CNPJ", "11222333000181")).toBe("11.222.333/0001-81");
      expect(format("CNPJ", "11.222.333/0001-81")).toBe("11.222.333/0001-81");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CNPJ", "1234")).toBe("1234");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CNPJ", "11.222.333/0001-81");
      expect(r).toEqual({
        ok: true,
        code: "BR_CNPJ",
        normalized: "11222333000181",
        formatted: "11.222.333/0001-81",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("CNPJ", "11222333000180");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });

    it("returns kind=invalid_format for all-same-digit", () => {
      const r = parse("CNPJ", "00000000000000");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

// Test vectors for CNH. Algorithm: mod-11 dual DV per CONTRAN/DENATRAN.
// All vectors below were cross-validated against `@brazilian-utils@2.x`
// (`isValidCnh`) and recomputed locally; numbers are deterministic synthetic
// outputs of the brazilian-utils generator (PRNG-seeded), never real CNHs.
//   - 12345678900: sequential body 123456789 + DVs 0/0 (canonical doc fixture).
//   - 16849160612: synthetic body + DVs 1/2.
//   - 94463782940: synthetic body + DVs 4/0.
//   - 81692160650: synthetic body + DVs 5/0.
//   - 05324298344: synthetic body + DVs 4/4.
//   - 75232622258: synthetic body + DVs 5/8.

describe("BR — CNH", () => {
  describe("validate", () => {
    it("accepts valid CNHs (raw and formatted)", () => {
      expect(validate("CNH", "12345678900")).toBe(true);
      expect(validate("CNH", "123456789-00")).toBe(true);
      expect(validate("CNH", "16849160612")).toBe(true);
      expect(validate("CNH", "94463782940")).toBe(true);
      expect(validate("CNH", "81692160650")).toBe(true);
      expect(validate("CNH", "05324298344")).toBe(true);
      expect(validate("CNH", "75232622258")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CNH", "12345678901")).toBe(false);
      expect(validate("CNH", "16849160613")).toBe(false);
      expect(validate("CNH", "94463782900")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CNH", "")).toBe(false);
      expect(validate("CNH", "1234")).toBe(false);
      expect(validate("CNH", "123456789000")).toBe(false);
      expect(validate("CNH", "ABCDEFGHIJK")).toBe(false);
    });

    it("rejects all-same-digit sequences (placeholders)", () => {
      expect(validate("CNH", "11111111111")).toBe(false);
      expect(validate("CNH", "00000000000")).toBe(false);
      expect(validate("CNH", "999-999-999-99")).toBe(false);
    });

    it("accepts the BR_CNH fully-qualified code", () => {
      expect(validate("BR_CNH", "12345678900")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen before the two DVs", () => {
      expect(format("CNH", "12345678900")).toBe("123456789-00");
      expect(format("CNH", "123456789-00")).toBe("123456789-00");
      expect(format("CNH", "123 456 789 00")).toBe("123456789-00");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CNH", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("CNH", "123456789-00")).toBe("12345678900");
      expect(normalize("CNH", "123 456 789 00")).toBe("12345678900");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CNH", "123456789-00");
      expect(r).toEqual({
        ok: true,
        code: "BR_CNH",
        normalized: "12345678900",
        formatted: "123456789-00",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CNH", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CNH", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CNH", "123456789000");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for all-same-digit", () => {
      const r = parse("CNH", "11111111111");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("CNH", "12345678901");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// Test vectors for Título de Eleitor. Algorithm: TSE mod-11 dual DV with
// SP/MG (UF=01,02) override and UF range 01..28. All vectors cross-validated
// against `@brazilian-utils@2.x` (`isValidVoterId`).
//   - 123456780191: body 12345678, UF=01 (SP), DVs 9/1.
//   - 123456780299: body 12345678, UF=02 (MG), DVs 9/9.
//   - 123456780396: body 12345678, UF=03 (RJ), DVs 9/6.
//   - 123456782097: body 12345678, UF=20 (DF legacy), DVs 9/7.
//   - 123456782895: body 12345678, UF=28 (Exterior), DVs 9/5.
//   - 301006712879: brazilian-utils generator sample (UF=28).
//   - 000000110167: triggers DV1 SP override (r1==0 → DV1=1).

describe("BR — Título de Eleitor", () => {
  describe("validate", () => {
    it("accepts valid Títulos across UF range (raw and formatted)", () => {
      expect(validate("TITULO_ELEITOR", "123456780191")).toBe(true);
      expect(validate("TITULO_ELEITOR", "1234 5678 01 91")).toBe(true);
      expect(validate("TITULO_ELEITOR", "123456780299")).toBe(true);
      expect(validate("TITULO_ELEITOR", "123456780396")).toBe(true);
      expect(validate("TITULO_ELEITOR", "123456782097")).toBe(true);
      expect(validate("TITULO_ELEITOR", "123456782895")).toBe(true);
      expect(validate("TITULO_ELEITOR", "301006712879")).toBe(true);
    });

    it("accepts SP override fixture (DV1 forced from 0 to 1)", () => {
      // body 00000011 → DV1 raw r1=0; UF=01 (SP) → override DV1=1.
      expect(validate("TITULO_ELEITOR", "000000110167")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("TITULO_ELEITOR", "123456780190")).toBe(false);
      expect(validate("TITULO_ELEITOR", "123456780298")).toBe(false);
      expect(validate("TITULO_ELEITOR", "301006712870")).toBe(false);
    });

    it("rejects out-of-range UF codes", () => {
      // UF=00 and UF=29..99 are unallocated by TSE.
      expect(validate("TITULO_ELEITOR", "123456780098")).toBe(false);
      expect(validate("TITULO_ELEITOR", "123456782992")).toBe(false);
      expect(validate("TITULO_ELEITOR", "123456789997")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("TITULO_ELEITOR", "")).toBe(false);
      expect(validate("TITULO_ELEITOR", "1234")).toBe(false);
      expect(validate("TITULO_ELEITOR", "1234567801911")).toBe(false);
      expect(validate("TITULO_ELEITOR", "ABCDEFGHIJKL")).toBe(false);
    });

    it("rejects all-same-digit sequences (placeholders)", () => {
      expect(validate("TITULO_ELEITOR", "111111111111")).toBe(false);
      expect(validate("TITULO_ELEITOR", "000000000000")).toBe(false);
    });

    it("accepts the BR_TITULO_ELEITOR fully-qualified code", () => {
      expect(validate("BR_TITULO_ELEITOR", "123456780191")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts space groups 4-4-2-2", () => {
      expect(format("TITULO_ELEITOR", "123456780191")).toBe("1234 5678 01 91");
      expect(format("TITULO_ELEITOR", "1234 5678 01 91")).toBe("1234 5678 01 91");
      expect(format("TITULO_ELEITOR", "1234.5678.01.91")).toBe("1234 5678 01 91");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("TITULO_ELEITOR", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips spaces and punctuation", () => {
      expect(normalize("TITULO_ELEITOR", "1234 5678 01 91")).toBe("123456780191");
      expect(normalize("TITULO_ELEITOR", "1234.5678.01.91")).toBe("123456780191");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("TITULO_ELEITOR", "1234 5678 01 91");
      expect(r).toEqual({
        ok: true,
        code: "BR_TITULO_ELEITOR",
        normalized: "123456780191",
        formatted: "1234 5678 01 91",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("TITULO_ELEITOR", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("TITULO_ELEITOR", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("TITULO_ELEITOR", "1234567801911");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for all-same-digit", () => {
      const r = parse("TITULO_ELEITOR", "111111111111");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for out-of-range UF", () => {
      const r = parse("TITULO_ELEITOR", "123456780098");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("TITULO_ELEITOR", "123456780190");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// Test vectors for PIS/PASEP/NIT/NIS. Algorithm: single mod-11 DV with weights
// [3,2,9,8,7,6,5,4,3,2]. All cross-validated against `@brazilian-utils@2.x`
// (`isValidPis`).
//   - 12345678919: sequential body 1234567891 + DV 9 (canonical doc fixture).
//   - 48184124632: synthetic body + DV 2.
//   - 30721873512: synthetic body + DV 2.
//   - 31180980890: synthetic body + DV 0 (r < 2 branch).
//   - 50997796193: synthetic body + DV 3.
//   - 95098188166: synthetic body + DV 6.

describe("BR — PIS", () => {
  describe("validate", () => {
    it("accepts valid PIS numbers (raw and formatted)", () => {
      expect(validate("PIS", "12345678919")).toBe(true);
      expect(validate("PIS", "123.45678.91-9")).toBe(true);
      expect(validate("PIS", "48184124632")).toBe(true);
      expect(validate("PIS", "30721873512")).toBe(true);
      expect(validate("PIS", "31180980890")).toBe(true);
      expect(validate("PIS", "50997796193")).toBe(true);
      expect(validate("PIS", "95098188166")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("PIS", "12345678910")).toBe(false);
      expect(validate("PIS", "48184124631")).toBe(false);
      expect(validate("PIS", "31180980891")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("PIS", "")).toBe(false);
      expect(validate("PIS", "1234")).toBe(false);
      expect(validate("PIS", "123456789190")).toBe(false);
      expect(validate("PIS", "ABCDEFGHIJK")).toBe(false);
    });

    it("rejects all-same-digit sequences (placeholders)", () => {
      expect(validate("PIS", "11111111111")).toBe(false);
      expect(validate("PIS", "00000000000")).toBe(false);
      expect(validate("PIS", "999.99999.99-9")).toBe(false);
    });

    it("accepts the BR_PIS fully-qualified code", () => {
      expect(validate("BR_PIS", "12345678919")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts dots and hyphen at canonical Caixa positions (3-5-2-1)", () => {
      expect(format("PIS", "12345678919")).toBe("123.45678.91-9");
      expect(format("PIS", "123.45678.91-9")).toBe("123.45678.91-9");
      expect(format("PIS", "123 45678 91 9")).toBe("123.45678.91-9");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("PIS", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("PIS", "123.45678.91-9")).toBe("12345678919");
      expect(normalize("PIS", "123 45678 91 9")).toBe("12345678919");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("PIS", "123.45678.91-9");
      expect(r).toEqual({
        ok: true,
        code: "BR_PIS",
        normalized: "12345678919",
        formatted: "123.45678.91-9",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("PIS", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PIS", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PIS", "123456789190");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for all-same-digit", () => {
      const r = parse("PIS", "11111111111");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("PIS", "12345678910");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
