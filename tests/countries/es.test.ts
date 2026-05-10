import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/es/index.ts";
import { DNI_LETTERS } from "../../src/countries/es/shared.ts";

// ES DNI: 8 digits + letter from `TRWAGMYFPDXBNJZSQVHLCKE` (index = digits mod 23).
//   - 12345678Z: 12345678 mod 23 = 14 -> 'Z'.
//   - 00000000T: 0 mod 23 = 0 -> 'T'.
//   - 87654321X: 87654321 mod 23 = 10 -> 'X'.
//   - 11111111H: 11111111 mod 23 = 21 -> 'H'.
//   - 99999999R: 99999999 mod 23 = 1 -> 'R'.

describe("ES — DNI", () => {
  describe("validate", () => {
    it("accepts valid DNIs", () => {
      expect(validate("DNI", "12345678Z")).toBe(true);
      expect(validate("DNI", "00000000T")).toBe(true);
      expect(validate("DNI", "87654321X")).toBe(true);
      expect(validate("DNI", "11111111H")).toBe(true);
      expect(validate("DNI", "99999999R")).toBe(true);
    });

    it("accepts lowercase letter (normalized to uppercase)", () => {
      expect(validate("DNI", "12345678z")).toBe(true);
      expect(validate("DNI", "00000000t")).toBe(true);
    });

    it("ignores whitespace in raw input", () => {
      expect(validate("DNI", " 12345678Z ")).toBe(true);
      expect(validate("DNI", "12 345 678 Z")).toBe(true);
    });

    it("rejects invalid check letters", () => {
      expect(validate("DNI", "12345678A")).toBe(false);
      expect(validate("DNI", "12345678B")).toBe(false);
      expect(validate("DNI", "00000000A")).toBe(false);
      expect(validate("DNI", "99999999X")).toBe(false);
    });

    it("rejects forbidden letters (I, Ñ, O, U) — never appear in the table", () => {
      // The body that would index the letter at slot N (12) is body % 23 = 12.
      // We pick body 12 -> letter 'N'; replacing 'N' with 'I' must fail.
      expect(validate("DNI", "00000012N")).toBe(true);
      expect(validate("DNI", "00000012I")).toBe(false);
      expect(validate("DNI", "00000012O")).toBe(false);
      expect(validate("DNI", "00000012U")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("DNI", "")).toBe(false);
      expect(validate("DNI", "1234567Z")).toBe(false); // 7 digits
      expect(validate("DNI", "123456789Z")).toBe(false); // 9 digits
      expect(validate("DNI", "12345678ZZ")).toBe(false); // 2 letters
      expect(validate("DNI", "ABCDEFGH1")).toBe(false); // letters first
      expect(validate("DNI", "X1234567L")).toBe(false); // NIE shape
    });

    it("accepts the ES_DNI fully-qualified code", () => {
      expect(validate("ES_DNI", "12345678Z")).toBe(true);
    });

    // Table coverage: hidden bugs hide in untested rows. Iterate every index
    // and assert the letter the algorithm produces matches the published table.
    it("covers all 23 letters of the DNI table", () => {
      expect(DNI_LETTERS).toBe("TRWAGMYFPDXBNJZSQVHLCKE");
      for (let i = 0; i < 23; i++) {
        const body = String(i).padStart(8, "0");
        const letter = DNI_LETTERS[i];
        if (letter === undefined) throw new Error(`missing letter at ${i}`);
        expect(validate("DNI", `${body}${letter}`)).toBe(true);
        // Any other letter at the same index must fail.
        const wrongIndex = (i + 1) % 23;
        const wrongLetter = DNI_LETTERS[wrongIndex];
        if (wrongLetter !== undefined && wrongLetter !== letter) {
          expect(validate("DNI", `${body}${wrongLetter}`)).toBe(false);
        }
      }
    });
  });

  describe("format", () => {
    it("returns canonical uppercase form", () => {
      expect(format("DNI", "12345678Z")).toBe("12345678Z");
      expect(format("DNI", "12345678z")).toBe("12345678Z");
      expect(format("DNI", " 12 345 678 Z ")).toBe("12345678Z");
    });

    it("returns input unchanged for invalid form", () => {
      expect(format("DNI", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases", () => {
      expect(normalize("DNI", "12345678z")).toBe("12345678Z");
      expect(normalize("DNI", "12-345-678-Z")).toBe("12345678Z");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("DNI", "12345678z");
      expect(r).toEqual({
        ok: true,
        code: "ES_DNI",
        normalized: "12345678Z",
        formatted: "12345678Z",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("DNI", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("DNI", "1234567Z");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("DNI", "123456789ZZ");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for NIE-shaped input", () => {
      const r = parse("DNI", "X1234567L");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for wrong letter", () => {
      const r = parse("DNI", "12345678A");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// ES NIE: prefix X/Y/Z + 7 digits + letter. Substitute X->0, Y->1, Z->2 then
// run DNI letter table.
//   - X1234567L: 01234567 mod 23 = 19 -> 'L'.
//   - Y1234567X: 11234567 mod 23 = 10 -> 'X'.
//   - Z1234567R: 21234567 mod 23 = 1 -> 'R'.
//   - X0000000T: 00000000 mod 23 = 0 -> 'T'.
//   - Z9999999K: 29999999 mod 23 = ?
//       23 * 1304347 = 29999981; 29999999 - 29999981 = 18 -> 'L'? recompute:
//       29999999 / 23 = 1304347.78...; 23*1304347 = 29999981; diff = 18 -> idx 18 -> 'H'.

describe("ES — NIE", () => {
  describe("validate", () => {
    it("accepts valid NIEs (X/Y/Z prefixes)", () => {
      expect(validate("NIE", "X1234567L")).toBe(true);
      expect(validate("NIE", "Y1234567X")).toBe(true);
      expect(validate("NIE", "Z1234567R")).toBe(true);
      expect(validate("NIE", "X0000000T")).toBe(true);
      expect(validate("NIE", "Z9999999H")).toBe(true);
    });

    it("accepts lowercase prefix and check letter", () => {
      expect(validate("NIE", "x1234567l")).toBe(true);
      expect(validate("NIE", "z9999999h")).toBe(true);
    });

    it("rejects invalid check letters", () => {
      expect(validate("NIE", "X1234567A")).toBe(false);
      expect(validate("NIE", "Y1234567A")).toBe(false);
      expect(validate("NIE", "Z9999999A")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("NIE", "")).toBe(false);
      expect(validate("NIE", "X123456L")).toBe(false); // 6 digits
      expect(validate("NIE", "X12345678L")).toBe(false); // 8 digits
      expect(validate("NIE", "A1234567L")).toBe(false); // bad prefix
      expect(validate("NIE", "12345678Z")).toBe(false); // DNI shape
    });

    it("accepts the ES_NIE fully-qualified code", () => {
      expect(validate("ES_NIE", "X1234567L")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns canonical uppercase form", () => {
      expect(format("NIE", "x1234567l")).toBe("X1234567L");
      expect(format("NIE", "X-1234567-L")).toBe("X1234567L");
    });

    it("returns input unchanged for invalid form", () => {
      expect(format("NIE", "1234")).toBe("1234");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("NIE", "x1234567l");
      expect(r).toEqual({
        ok: true,
        code: "ES_NIE",
        normalized: "X1234567L",
        formatted: "X1234567L",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum for wrong letter", () => {
      const r = parse("NIE", "X1234567A");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });

    it("returns kind=invalid_format for bad prefix", () => {
      const r = parse("NIE", "A1234567L");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("NIE", "X12345L");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("NIE", "X123456789L");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

// ES NIF Persona Jurídica (legacy CIF):
// Body=1234567 -> sum=2+2+6+4+1+6+5=26; (10-(26%10))%10 = 4. So:
//   - A12345674: digit-DV prefix (A SA), DV digit '4'.
//   - B12345674: digit-DV prefix (B SL), same body.
//   - E12345674: digit-DV (Comunidad de bienes).
//   - H12345674: digit-DV (Comunidad de propietarios).
//   - P1234567D: letter-DV prefix (P Corporación local), DV letter 'JABCDEFGHI'[4]='D'.
//   - Q1234567D: letter-DV (Organismo público).
//   - R1234567D: letter-DV (Religiosa).
//   - S1234567D: letter-DV (Órgano administración).
//   - N1234567D: letter-DV (Extranjera).
//   - W1234567D: letter-DV (Establecimiento permanente).
//   - C12345674: either-DV (Comanditaria) — accepts digit form.
//   - C1234567D: either-DV — accepts letter form.
// Body=0000000 -> r=0:
//   - A00000000: digit-DV r=0 -> '0'.
//   - P0000000J: letter-DV r=0 -> 'JABCDEFGHI'[0]='J'.

// ES NUSS test vectors. Algorithm: 12 digits = 2 provincia + 8 correlativo + 2 DV.
// DV = (provincia · 10^8 + correlativo) mod 97, rendered as zero-padded 2 digits.
//   - 28/12345678/40: 2812345678 mod 97 = 40
//   - 01/00000001/82:  100000001 mod 97 = 82 (provincia leading zero)
//   - 28/00000000/37: 2800000000 mod 97 = 37
//   - 08/12345678/69:  812345678 mod 97 = 69
//   - 12/34567890/02: 1234567890 mod 97 = 02 (DV requires zero-padding)

describe("ES — NUSS", () => {
  describe("validate", () => {
    it("accepts valid NUSS (raw 12-digit form)", () => {
      expect(validate("NUSS", "281234567840")).toBe(true);
      expect(validate("NUSS", "010000000182")).toBe(true);
      expect(validate("NUSS", "280000000037")).toBe(true);
      expect(validate("NUSS", "081234567869")).toBe(true);
      expect(validate("NUSS", "123456789002")).toBe(true);
    });

    it("accepts canonical formatted form (XX/XXXXXXXX/DD)", () => {
      expect(validate("NUSS", "28/12345678/40")).toBe(true);
      expect(validate("NUSS", "01/00000001/82")).toBe(true);
      expect(validate("NUSS", "12/34567890/02")).toBe(true);
    });

    it("accepts hyphen-separated and whitespace-decorated input", () => {
      expect(validate("NUSS", "28-12345678-40")).toBe(true);
      expect(validate("NUSS", " 28 12345678 40 ")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("NUSS", "281234567841")).toBe(false);
      expect(validate("NUSS", "281234567800")).toBe(false);
      expect(validate("NUSS", "010000000183")).toBe(false);
      expect(validate("NUSS", "081234567870")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("NUSS", "")).toBe(false);
      expect(validate("NUSS", "28123456784")).toBe(false); // 11 digits — too short
      expect(validate("NUSS", "2812345678400")).toBe(false); // 13 digits — too long
      expect(validate("NUSS", "AB1234567840")).toBe(false); // letters at start
      expect(validate("NUSS", "28123456784X")).toBe(false); // letter in DV
    });

    it("rejects DNI/NIE/NIF_PJ shapes", () => {
      expect(validate("NUSS", "12345678Z")).toBe(false); // DNI
      expect(validate("NUSS", "X1234567L")).toBe(false); // NIE
      expect(validate("NUSS", "A12345674")).toBe(false); // CIF
    });

    it("accepts the ES_NUSS fully-qualified code", () => {
      expect(validate("ES_NUSS", "281234567840")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts slashes at canonical positions", () => {
      expect(format("NUSS", "281234567840")).toBe("28/12345678/40");
      expect(format("NUSS", "28/12345678/40")).toBe("28/12345678/40");
      expect(format("NUSS", "010000000182")).toBe("01/00000001/82");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("NUSS", "28")).toBe("28");
    });
  });

  describe("normalize", () => {
    it("strips slashes, hyphens, and whitespace", () => {
      expect(normalize("NUSS", "28/12345678/40")).toBe("281234567840");
      expect(normalize("NUSS", "28-12345678-40")).toBe("281234567840");
      expect(normalize("NUSS", " 28 12345678 40 ")).toBe("281234567840");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("NUSS", "28/12345678/40");
      expect(r).toEqual({
        ok: true,
        code: "ES_NUSS",
        normalized: "281234567840",
        formatted: "28/12345678/40",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("NUSS", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("NUSS", "28123456784");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("NUSS", "2812345678400");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=too_short when non-digit characters reduce stripped length", () => {
      // After stripNonDigits, "28123456784X" is 11 digits and trips too_short
      // before any format check. Documenting the observable behaviour.
      const r = parse("NUSS", "28123456784X");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=invalid_checksum for wrong DV", () => {
      const r = parse("NUSS", "281234567841");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("ES — NIF Persona Jurídica (CIF)", () => {
  describe("validate", () => {
    it("accepts valid digit-DV prefixes (A, B, E, H)", () => {
      expect(validate("CIF", "A12345674")).toBe(true);
      expect(validate("CIF", "B12345674")).toBe(true);
      expect(validate("CIF", "E12345674")).toBe(true);
      expect(validate("CIF", "H12345674")).toBe(true);
      expect(validate("CIF", "A00000000")).toBe(true);
    });

    it("accepts valid letter-DV prefixes (N, P, Q, R, S, W)", () => {
      expect(validate("CIF", "P1234567D")).toBe(true);
      expect(validate("CIF", "Q1234567D")).toBe(true);
      expect(validate("CIF", "R1234567D")).toBe(true);
      expect(validate("CIF", "S1234567D")).toBe(true);
      expect(validate("CIF", "N1234567D")).toBe(true);
      expect(validate("CIF", "W1234567D")).toBe(true);
      expect(validate("CIF", "P0000000J")).toBe(true);
    });

    it("accepts either form for residual prefixes (C, D, F, G, J, U, V)", () => {
      expect(validate("CIF", "C12345674")).toBe(true);
      expect(validate("CIF", "C1234567D")).toBe(true);
      expect(validate("CIF", "F12345674")).toBe(true);
      expect(validate("CIF", "F1234567D")).toBe(true);
      expect(validate("CIF", "J1234567D")).toBe(true);
    });

    it("rejects letter-DV when prefix demands digit (and vice versa)", () => {
      // A is digit-DV: letter form must fail even though D is the right letter.
      expect(validate("CIF", "A1234567D")).toBe(false);
      // P is letter-DV: digit form must fail even though 4 is the right digit.
      expect(validate("CIF", "P12345674")).toBe(false);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CIF", "A12345670")).toBe(false);
      expect(validate("CIF", "A12345678")).toBe(false);
      expect(validate("CIF", "P1234567A")).toBe(false);
      expect(validate("CIF", "B12345671")).toBe(false);
    });

    it("rejects forbidden prefix letters", () => {
      expect(validate("CIF", "I12345674")).toBe(false);
      expect(validate("CIF", "K12345674")).toBe(false);
      expect(validate("CIF", "L12345674")).toBe(false);
      expect(validate("CIF", "M12345674")).toBe(false);
      expect(validate("CIF", "O12345674")).toBe(false);
      expect(validate("CIF", "T12345674")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CIF", "")).toBe(false);
      expect(validate("CIF", "A123456")).toBe(false);
      expect(validate("CIF", "A123456789")).toBe(false);
      expect(validate("CIF", "12345678Z")).toBe(false); // DNI shape
    });

    it("accepts both NIF_PJ and CIF aliases", () => {
      expect(validate("NIF_PJ", "A12345674")).toBe(true);
      expect(validate("CIF", "A12345674")).toBe(true);
      expect(validate("ES_NIF_PJ", "A12345674")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns canonical uppercase form", () => {
      expect(format("CIF", "a12345674")).toBe("A12345674");
      expect(format("CIF", "p1234567d")).toBe("P1234567D");
      expect(format("CIF", "A-1234567-4")).toBe("A12345674");
    });

    it("returns input unchanged for invalid form", () => {
      expect(format("CIF", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases", () => {
      expect(normalize("CIF", "a-12345674")).toBe("A12345674");
      expect(normalize("CIF", "p 1234567 d")).toBe("P1234567D");
    });
  });

  describe("parse", () => {
    it("returns ok for digit-DV CIF", () => {
      const r = parse("CIF", "A12345674");
      expect(r).toEqual({
        ok: true,
        code: "ES_NIF_PJ",
        normalized: "A12345674",
        formatted: "A12345674",
        confidence: "high",
      });
    });

    it("returns ok for letter-DV CIF", () => {
      const r = parse("CIF", "P1234567D");
      expect(r).toEqual({
        ok: true,
        code: "ES_NIF_PJ",
        normalized: "P1234567D",
        formatted: "P1234567D",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CIF", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CIF", "A12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CIF", "A123456745");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for forbidden prefix", () => {
      const r = parse("CIF", "I12345674");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for wrong DV", () => {
      const r = parse("CIF", "A12345678");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });

    it("returns kind=invalid_checksum for digit form on letter-DV prefix", () => {
      const r = parse("CIF", "P12345674");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
