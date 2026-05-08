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
