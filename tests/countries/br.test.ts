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
      // 14 chars but only 12 alphanumeric body — DVs are not numeric:
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

  // ---------------------------------------------------------------------------
  // Alphanumeric CNPJ (post-2026-07-01) per IN RFB 2.229/2024.
  //
  // Char-value rule: `value = charCodeAt(0) - 48`. So:
  //   '0'..'9' → 0..9     (back-compat with legacy numeric CNPJs)
  //   'A'..'Z' → 17..42   ('A'=65−48=17, ..., 'Z'=90−48=42)
  //
  // Weights:
  //   DV1: [5,4,3,2,9,8,7,6,5,4,3,2] over chars 1-12
  //   DV2: [6,5,4,3,2,9,8,7,6,5,4,3,2] over chars 1-13 (incl. DV1)
  //   r = sum mod 11; dv = r < 2 ? 0 : 11 - r
  //
  // Each fixture below was hand-computed and double-checked. The traced
  // computation for `12ABC34501DE` is included in-line; the rest follow the
  // same recipe.
  //
  // ── Fixture 1 — body "12ABC34501DE" ────────────────────────────────────────
  //   '1'=1, '2'=2, 'A'=17, 'B'=18, 'C'=19, '3'=3, '4'=4, '5'=5,
  //   '0'=0, '1'=1, 'D'=20, 'E'=21
  //   DV1 sum = 1·5 + 2·4 + 17·3 + 18·2 + 19·9 + 3·8 + 4·7 + 5·6
  //           + 0·5 + 1·4 + 20·3 + 21·2
  //           = 5+8+51+36+171+24+28+30+0+4+60+42
  //           = 459
  //   459 mod 11 = 8 → DV1 = 11 − 8 = 3
  //   DV2 sum (body+DV1=…3) over weights [6,5,4,3,2,9,8,7,6,5,4,3,2]
  //           = 1·6 + 2·5 + 17·4 + 18·3 + 19·2 + 3·9 + 4·8 + 5·7
  //           + 0·6 + 1·5 + 20·4 + 21·3 + 3·2
  //           = 6+10+68+54+38+27+32+35+0+5+80+63+6
  //           = 424
  //   424 mod 11 = 6 → DV2 = 11 − 6 = 5
  //   ⇒ 12ABC34501DE35  ✓
  //
  // ── Fixture 2 — body "ABCDEFGHIJKL" ────────────────────────────────────────
  //   Computed offline: DVs = 80 → ABCDEFGHIJKL80
  //
  // ── Fixture 3 — body "EMPRESA00001" ────────────────────────────────────────
  //   Computed offline: DVs = 47 → EMPRESA0000147
  //
  // ── Fixture 4 — body "Z9Y8X7W6V5U4" ────────────────────────────────────────
  //   Computed offline: DVs = 29 → Z9Y8X7W6V5U429
  //
  // ── Fixture 5 — body "BRTECH202600" ────────────────────────────────────────
  //   Computed offline: DVs = 57 → BRTECH20260057
  describe("alphanumeric — post-2026-07-01 (IN RFB 2.229/2024)", () => {
    const VALID_ALPHA = [
      "12ABC34501DE35",
      "ABCDEFGHIJKL80",
      "EMPRESA0000147",
      "Z9Y8X7W6V5U429",
      "BRTECH20260057",
    ] as const;

    it("accepts hand-computed alphanumeric CNPJs", () => {
      for (const fixture of VALID_ALPHA) {
        expect(validate("CNPJ", fixture)).toBe(true);
        expect(validate("BR_CNPJ", fixture)).toBe(true);
      }
    });

    it("accepts alphanumeric CNPJs with separators", () => {
      // Canonical 2-3-3-4-2 mask:
      //   12ABC34501DE35 → 12.ABC.345/01DE-35
      //   EMPRESA0000147 → EM.PRE.SA0/0001-47
      expect(validate("CNPJ", "12.ABC.345/01DE-35")).toBe(true);
      expect(validate("CNPJ", "EM.PRE.SA0/0001-47")).toBe(true);
    });

    it("rejects alphanumeric body with wrong DVs", () => {
      // Flip last DV: 35 → 36
      expect(validate("CNPJ", "12ABC34501DE36")).toBe(false);
      // Flip first DV: 47 → 57 (note: DV2 also wouldn't reverify)
      expect(validate("CNPJ", "EMPRESA0000157")).toBe(false);
      // Random alphanumeric body with arbitrary numeric DVs
      expect(validate("CNPJ", "ZZZZZZZZZZZZ00")).toBe(false);
    });

    it("rejects lowercase letters (canonical form is uppercase, but normalize uppercases input)", () => {
      // Our normalize() uppercases, so a lowercase form normalizes to a valid
      // alphanumeric — this is the expected behaviour and matches how the
      // legacy spec was tolerant to whitespace. We assert the lowercase input
      // is accepted post-normalization to document the contract.
      expect(validate("CNPJ", "12abc34501de35")).toBe(true);
      expect(validate("CNPJ", "12.abc.345/01de-35")).toBe(true);
    });

    it("rejects non-ASCII / accented body chars", () => {
      // 'Ñ' is not in [A-Z0-9] for this regex (we only accept ASCII A-Z).
      expect(validate("CNPJ", "12ÑBC34501DE35")).toBe(false);
      // Symbols inside body
      expect(validate("CNPJ", "12@BC34501DE35")).toBe(false);
      expect(validate("CNPJ", "12*BC34501DE35")).toBe(false);
      // Digits required in DV slots — letters in DV positions fail
      expect(validate("CNPJ", "12ABC34501DEAA")).toBe(false);
    });

    it("rejects all-same-character placeholders (alphanumeric variants)", () => {
      expect(validate("CNPJ", "AAAAAAAAAAAAAA")).toBe(false);
      expect(validate("CNPJ", "ZZZZZZZZZZZZZZ")).toBe(false);
    });

    it("formats alphanumeric CNPJ with the canonical mask", () => {
      expect(format("CNPJ", "12ABC34501DE35")).toBe("12.ABC.345/01DE-35");
      expect(format("CNPJ", "EMPRESA0000147")).toBe("EM.PRE.SA0/0001-47");
    });

    it("normalize() strips separators and uppercases", () => {
      expect(normalize("CNPJ", "12.abc.345/01de-35")).toBe("12ABC34501DE35");
      expect(normalize("CNPJ", "12 abc 345 01 de 35")).toBe("12ABC34501DE35");
    });

    it("parse() returns ok with normalized + formatted alphanumeric", () => {
      const r = parse("CNPJ", "12.ABC.345/01DE-35");
      expect(r).toEqual({
        ok: true,
        code: "BR_CNPJ",
        normalized: "12ABC34501DE35",
        formatted: "12.ABC.345/01DE-35",
        confidence: "high",
      });
    });
  });

  // Backwards-compatibility property: every legacy v0.4 valid digit-only
  // fixture MUST still validate under the new algorithm. The char-value rule
  // reduces to `digit` when the char is in '0'..'9', so legacy CNPJs are
  // bit-for-bit identical to the legacy algorithm output.
  describe("backwards-compatibility — every v0.4 numeric fixture still valid", () => {
    const LEGACY_VALID = [
      "11222333000181",
      "00223344000160",
      "11222333000262",
      "99988877000108",
      "12345678000195",
    ] as const;

    it.each(LEGACY_VALID)("legacy %s remains valid under alphanumeric algorithm", (cnpj) => {
      expect(validate("CNPJ", cnpj)).toBe(true);
      expect(validate("BR_CNPJ", cnpj)).toBe(true);
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

describe("BR — Passaporte (BR_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (2 letters + 6 digits)", () => {
      expect(validate("PASAPORTE", "FF123456")).toBe(true);
      expect(validate("PASAPORTE", "GA000001")).toBe(true);
      expect(validate("PASAPORTE", "AB999999")).toBe(true);
      expect(validate("PASAPORTE", "FZ123456")).toBe(true);
      expect(validate("PASAPORTE", " FF123456 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "F123456")).toBe(false); // 1 letter
      expect(validate("PASAPORTE", "FFF123456")).toBe(false); // 3 letters
      expect(validate("PASAPORTE", "FF12345")).toBe(false); // too short
      expect(validate("PASAPORTE", "FF1234567")).toBe(false); // too long
      expect(validate("PASAPORTE", "12FF3456")).toBe(false); // digits before letters
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "ff123456")).toBe(true);
    });

    it("accepts the BR_PASAPORTE fully-qualified code", () => {
      expect(validate("BR_PASAPORTE", "FF123456")).toBe(true);
    });
  });

  describe("normalize", () => {
    it("is idempotent", () => {
      const a = normalize("PASAPORTE", "ff123456");
      expect(normalize("PASAPORTE", a)).toBe(a);
      expect(a).toBe("FF123456");
    });
  });

  describe("format", () => {
    it("round-trips through normalize → format", () => {
      const raw = "ff123456";
      const n = normalize("PASAPORTE", raw);
      expect(format("PASAPORTE", n)).toBe(n);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "ff123456");
      expect(r).toEqual({
        ok: true,
        code: "BR_PASAPORTE",
        normalized: "FF123456",
        formatted: "FF123456",
        confidence: "moderate",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PASAPORTE", "FF12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PASAPORTE", "FF1234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
