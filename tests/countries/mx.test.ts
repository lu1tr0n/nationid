import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/mx/index.ts";

// CURP test vectors with check digits computed via RENAPO DOF 18-OCT-2014
// algorithm (mod-10 over 17 chars, alphabet `0..9 A..N Ñ O..Z`, weights 18..2).
// All bodies are SYNTHETIC — surnames are fictional and dates fall in the
// valid AAMMDD range.
//   - GOMC850315HDFRRR07 — masculino, DF, born 1985-03-15
//   - MARP800101MDFRTR03 — femenino, DF, born 1980-01-01
//   - LOPB920715HJCRRR05 — masculino, Jalisco, born 1992-07-15
//   - GAVA751231MNERRR07 — femenino, NE (extranjero), born 1975-12-31
//   - SANC000229HBCNNN06 — masculino, BC, born 2000-02-29 (bisiesto)
//   - XEXX010101HNEXXXA4 — CURP genérica extranjero (RENAPO oficial)

describe("MX — CURP", () => {
  describe("validate", () => {
    it("accepts valid CURPs (synthetic)", () => {
      expect(validate("CURP", "GOMC850315HDFRRR07")).toBe(true);
      expect(validate("CURP", "MARP800101MDFRTR03")).toBe(true);
      expect(validate("CURP", "LOPB920715HJCRRR05")).toBe(true);
      expect(validate("CURP", "GAVA751231MNERRR07")).toBe(true);
      expect(validate("CURP", "SANC000229HBCNNN06")).toBe(true);
    });

    it("accepts the RENAPO genérica extranjero (XEXX010101HNEXXXA4)", () => {
      expect(validate("CURP", "XEXX010101HNEXXXA4")).toBe(true);
    });

    it("normalizes lowercase and surrounding whitespace", () => {
      expect(validate("CURP", "  gomc850315hdfrrr07  ")).toBe(true);
      expect(validate("CURP", "GOMC 850315 HDF RRR 07")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CURP", "GOMC850315HDFRRR00")).toBe(false);
      expect(validate("CURP", "MARP800101MDFRTR09")).toBe(false);
      expect(validate("CURP", "LOPB920715HJCRRR01")).toBe(false);
    });

    it("rejects malformed input (length, charset, structure)", () => {
      expect(validate("CURP", "")).toBe(false);
      expect(validate("CURP", "GOMC850315HDFRRR0")).toBe(false); // 17 chars
      expect(validate("CURP", "GOMC850315HDFRRR007")).toBe(false); // 19 chars
      expect(validate("CURP", "0123456789012345AB")).toBe(false); // wrong structure
      expect(validate("CURP", "GOMC851315HDFRRR07")).toBe(false); // mes 13 inválido
      expect(validate("CURP", "GOMC850000HDFRRR07")).toBe(false); // día 00 inválido
    });

    it("rejects unknown entidad federativa code", () => {
      // ZZ is not a real entidad. DV happens to recompute as expected for body
      // GOMC850315HZZRRR0 + dv — but ENTIDADES set rejects it before checksum.
      expect(validate("CURP", "GOMC850315HZZRRR07")).toBe(false);
    });

    it("accepts the MX_CURP fully-qualified code", () => {
      expect(validate("MX_CURP", "GOMC850315HDFRRR07")).toBe(true);
    });
  });

  describe("format", () => {
    it("normalizes to uppercase contiguous form (no separators)", () => {
      expect(format("CURP", "gomc850315hdfrrr07")).toBe("GOMC850315HDFRRR07");
      expect(format("CURP", "GOMC 850315 HDF RRR 07")).toBe("GOMC850315HDFRRR07");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CURP", "GOMC")).toBe("GOMC");
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases", () => {
      expect(normalize("CURP", "GOMC-850315-HDFRRR-07")).toBe("GOMC850315HDFRRR07");
      expect(normalize("CURP", "gomc850315hdfrrr07")).toBe("GOMC850315HDFRRR07");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CURP", "GOMC850315HDFRRR07");
      expect(r).toEqual({
        ok: true,
        code: "MX_CURP",
        normalized: "GOMC850315HDFRRR07",
        formatted: "GOMC850315HDFRRR07",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CURP", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CURP", "GOMC850315HDFRRR0");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CURP", "GOMC850315HDFRRR007");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for bad month/day", () => {
      const r = parse("CURP", "GOMC851315HDFRRR07");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for unknown entidad", () => {
      const r = parse("CURP", "GOMC850315HZZRRR07");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("CURP", "GOMC850315HDFRRR00");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// RFC PF test vectors with homoclave DVs computed via SAT Anexo 19
// algorithm (mod-11 over first 12 chars, table per SAT Anexo 19:
// `0`->0, ..., `9`->9, `A`->10, ..., `N`->23, `&`->24, `O`->25, ..., `Z`->36,
// ` `->37, `Ñ`->38; weights 13..2). All bodies are SYNTHETIC. DVs were
// recomputed after the v0.1 RFC table off-by-one fix (see
// `docs/CROSS_VALIDATION.md` § B2) and cross-validated against
// `python-stdnum.stdnum.mx.rfc` with `validate_check_digits=True`.
//   - MELO850315H70 — body MELO850315H7 + DV 0
//   - GAJA920101AB7 — body GAJA920101AB + DV 7
//   - PEMA751231X17 — body PEMA751231X1 + DV 7
//   - RUDR000115AA3 — body RUDR000115AA + DV 3
//   - TOPA800615X92 — body TOPA800615X9 + DV 2
//   - XAXX010101000 — SAT genérico (operación con público en general).
//   - XEXX010101000 — SAT genérico (extranjero sin RFC).

describe("MX — RFC Persona Física", () => {
  describe("validate", () => {
    it("accepts valid RFCs (synthetic)", () => {
      expect(validate("RFC_PF", "MELO850315H70")).toBe(true);
      expect(validate("RFC_PF", "GAJA920101AB7")).toBe(true);
      expect(validate("RFC_PF", "PEMA751231X17")).toBe(true);
      expect(validate("RFC_PF", "RUDR000115AA3")).toBe(true);
      expect(validate("RFC_PF", "TOPA800615X92")).toBe(true);
    });

    it("accepts SAT genéricos (XAXX/XEXX)", () => {
      expect(validate("RFC_PF", "XAXX010101000")).toBe(true);
      expect(validate("RFC_PF", "XEXX010101000")).toBe(true);
    });

    it("normalizes lowercase and whitespace", () => {
      expect(validate("RFC_PF", " melo850315h70 ")).toBe(true);
      expect(validate("RFC_PF", "MELO-850315-H70")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("RFC_PF", "MELO850315H79")).toBe(false);
      expect(validate("RFC_PF", "GAJA920101AB0")).toBe(false);
      expect(validate("RFC_PF", "PEMA751231X19")).toBe(false);
    });

    it("rejects malformed input (length, charset)", () => {
      expect(validate("RFC_PF", "")).toBe(false);
      expect(validate("RFC_PF", "MELO850315H7")).toBe(false); // 12 chars (PM length)
      expect(validate("RFC_PF", "MELO850315H701")).toBe(false); // 14 chars
      expect(validate("RFC_PF", "1234850315H70")).toBe(false); // first 4 must be letters
      expect(validate("RFC_PF", "MELOABCDEFH70")).toBe(false); // chars 4-9 must be digits
    });

    it("rejects forbidden 4-letter prefixes (palabras altisonantes)", () => {
      // PUTO is in the SAT-published forbidden list; SAT replaces 4th letter with X.
      expect(validate("RFC_PF", "PUTO850315ABC")).toBe(false);
      expect(validate("RFC_PF", "BUEY900101AAA")).toBe(false);
    });

    it("rejects implausible birth dates", () => {
      expect(validate("RFC_PF", "MELO851315H79")).toBe(false); // mes 13
      expect(validate("RFC_PF", "MELO850032H79")).toBe(false); // día 00
    });

    it("accepts the MX_RFC_PF fully-qualified code", () => {
      expect(validate("MX_RFC_PF", "MELO850315H70")).toBe(true);
    });
  });

  describe("format", () => {
    it("uppercases and strips separators", () => {
      expect(format("RFC_PF", "melo850315h70")).toBe("MELO850315H70");
      expect(format("RFC_PF", "MELO-850315-H70")).toBe("MELO850315H70");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("RFC_PF", "MELO")).toBe("MELO");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("RFC_PF", "MELO850315H70");
      expect(r).toEqual({
        ok: true,
        code: "MX_RFC_PF",
        normalized: "MELO850315H70",
        formatted: "MELO850315H70",
        confidence: "moderate",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("RFC_PF", "MELO850315H7");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("RFC_PF", "MELO850315H701");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for forbidden prefix", () => {
      const r = parse("RFC_PF", "PUTO850315ABC");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("RFC_PF", "MELO850315H79");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// RFC PM test vectors with homoclave DVs computed via the SAT Anexo 19
// algorithm with the 11-char body padded by a leading space to align to the
// 13-char weight vector. All bodies are SYNTHETIC. DVs were recomputed after
// the v0.1 RFC table off-by-one fix (see `docs/CROSS_VALIDATION.md` § B2)
// and cross-validated against `python-stdnum.stdnum.mx.rfc` with
// `validate_check_digits=True`.
//   - ABC901231J48  — body ABC901231J4 + DV 8
//   - XYZ850615PQ8  — body XYZ850615PQ + DV 8
//   - MEX120831RTA  — body MEX120831RT + DV A (mod-11 result 10)
//   - GHI001215AB8  — body GHI001215AB + DV 8
//   - BBB991231X90  — body BBB991231X9 + DV 0

describe("MX — RFC Persona Moral", () => {
  describe("validate", () => {
    it("accepts valid RFCs (synthetic)", () => {
      expect(validate("RFC_PM", "ABC901231J48")).toBe(true);
      expect(validate("RFC_PM", "XYZ850615PQ8")).toBe(true);
      expect(validate("RFC_PM", "MEX120831RTA")).toBe(true);
      expect(validate("RFC_PM", "GHI001215AB8")).toBe(true);
      expect(validate("RFC_PM", "BBB991231X90")).toBe(true);
    });

    it("normalizes lowercase and whitespace", () => {
      expect(validate("RFC_PM", " abc901231j48 ")).toBe(true);
      expect(validate("RFC_PM", "ABC-901231-J48")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("RFC_PM", "ABC901231J40")).toBe(false);
      expect(validate("RFC_PM", "XYZ850615PQ0")).toBe(false);
      expect(validate("RFC_PM", "MEX120831RT0")).toBe(false);
    });

    it("rejects malformed input (length, charset)", () => {
      expect(validate("RFC_PM", "")).toBe(false);
      expect(validate("RFC_PM", "ABC901231J4")).toBe(false); // 11 chars
      expect(validate("RFC_PM", "ABC901231J481")).toBe(false); // 13 chars (PF length)
      expect(validate("RFC_PM", "1234901231J48")).toBe(false); // numeric prefix
      expect(validate("RFC_PM", "ABCXXXXXXJ48")).toBe(false); // chars 3-8 must be digits
    });

    it("rejects implausible constitution dates", () => {
      expect(validate("RFC_PM", "ABC901331J48")).toBe(false); // mes 13
      expect(validate("RFC_PM", "ABC900032J48")).toBe(false); // día 00
    });

    it("accepts the MX_RFC_PM fully-qualified code", () => {
      expect(validate("MX_RFC_PM", "ABC901231J48")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("RFC_PM", "ABC901231J48");
      expect(r).toEqual({
        ok: true,
        code: "MX_RFC_PM",
        normalized: "ABC901231J48",
        formatted: "ABC901231J48",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("RFC_PM", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("RFC_PM", "ABC901231J4");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("RFC_PM", "ABC901231J481");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("RFC_PM", "ABC901231J40");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// MX_CLAVE_ELECTOR — 18 chars: 6 letters + YY + entidad numeric (01..32) + MM
// + DD + sex (H/M) + 3 digits (correlativo). Format-only with structural
// rules; INE does not publish a check digit. All vectors below are SYNTHETIC.
// Canonical layout `LLLLLLYYEEMMDDS###`:
//   - GMRPRZ85091015H123 → 1985, ent 09 (CDMX), 10/15, H, corr 123
//   - LPZNVR92151225M407 → 1992, ent 15 (Edo. Méx.), 12/25, M, corr 407
//   - SNCHGL00140628H012 → 2000, ent 14 (Jalisco), 06/28, H, corr 012
//   - GVRRRZ75320101M999 → 1975, ent 32 (Zacatecas — boundary), 01/01, M
//   - HRNNDZ05010715H088 → 2005, ent 01 (Aguascalientes — boundary), 07/15
//   - PRZGRR68071231H501 → 1968, ent 07 (Chiapas), 12/31, H (day boundary)

describe("MX — Clave de Elector", () => {
  describe("validate", () => {
    it("accepts valid synthetic Claves de Elector", () => {
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85091015H123")).toBe(true);
      expect(validate("CLAVE_ELECTOR", "LPZNVR92151225M407")).toBe(true);
      expect(validate("CLAVE_ELECTOR", "SNCHGL00140628H012")).toBe(true);
      expect(validate("CLAVE_ELECTOR", "GVRRRZ75320101M999")).toBe(true);
      expect(validate("CLAVE_ELECTOR", "HRNNDZ05010715H088")).toBe(true);
      expect(validate("CLAVE_ELECTOR", "PRZGRR68071231H501")).toBe(true);
    });

    it("accepts the alternate alias `INE`", () => {
      expect(validate("INE", "GMRPRZ85091015H123")).toBe(true);
    });

    it("normalizes lowercase and surrounding whitespace", () => {
      expect(validate("CLAVE_ELECTOR", "  gmrprz85091015h123  ")).toBe(true);
      expect(validate("CLAVE_ELECTOR", "GMRPRZ 85091015 H123")).toBe(true);
    });

    it("rejects malformed input (length, charset, layout)", () => {
      expect(validate("CLAVE_ELECTOR", "")).toBe(false);
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85091015H12")).toBe(false); // 17 chars
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85091015H1234")).toBe(false); // 19 chars
      expect(validate("CLAVE_ELECTOR", "GMR1RZ85091015H123")).toBe(false); // letter slot has digit
      expect(validate("CLAVE_ELECTOR", "GMRPRZ8509101AH123")).toBe(false); // digit slot has letter
      expect(validate("CLAVE_ELECTOR", "gmrprz85091015h123-X")).toBe(false); // non-alnum trailing breaks length
    });

    it("rejects invalid sex letter", () => {
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85091015X123")).toBe(false); // X not H/M
    });

    it("rejects entidad federativa numeric out of range (00 / >32)", () => {
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85001015H123")).toBe(false); // EE=00
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85331015H123")).toBe(false); // EE=33
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85991015H123")).toBe(false); // EE=99
    });

    it("rejects implausible month/day", () => {
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85091315H123")).toBe(false); // MM=13
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85090015H123")).toBe(false); // MM=00
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85091000H123")).toBe(false); // DD=00
      expect(validate("CLAVE_ELECTOR", "GMRPRZ85091032H123")).toBe(false); // DD=32
    });

    it("accepts the MX_CLAVE_ELECTOR fully-qualified code", () => {
      expect(validate("MX_CLAVE_ELECTOR", "GMRPRZ85091015H123")).toBe(true);
    });
  });

  describe("format", () => {
    it("uppercases and strips separators (always 18 contiguous chars)", () => {
      expect(format("CLAVE_ELECTOR", "gmrprz85091015h123")).toBe("GMRPRZ85091015H123");
      expect(format("CLAVE_ELECTOR", "GMRPRZ-85091015-H123")).toBe("GMRPRZ85091015H123");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CLAVE_ELECTOR", "GMRPRZ")).toBe("GMRPRZ");
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases", () => {
      expect(normalize("CLAVE_ELECTOR", "gmrprz 85091015 h123")).toBe("GMRPRZ85091015H123");
      expect(normalize("CLAVE_ELECTOR", "GMRPRZ-85091015-H123")).toBe("GMRPRZ85091015H123");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CLAVE_ELECTOR", "GMRPRZ85091015H123");
      expect(r).toEqual({
        ok: true,
        code: "MX_CLAVE_ELECTOR",
        normalized: "GMRPRZ85091015H123",
        formatted: "GMRPRZ85091015H123",
        confidence: "low",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CLAVE_ELECTOR", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CLAVE_ELECTOR", "GMRPRZ85091015H12");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CLAVE_ELECTOR", "GMRPRZ85091015H1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for bad layout (letter/digit slots)", () => {
      const r = parse("CLAVE_ELECTOR", "GMR1RZ85091015H123");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for entidad out of range", () => {
      const r = parse("CLAVE_ELECTOR", "GMRPRZ85331015H123");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for implausible month/day", () => {
      const r1 = parse("CLAVE_ELECTOR", "GMRPRZ85091315H123");
      expect(r1.ok).toBe(false);
      if (!r1.ok) expect(r1.reason.kind).toBe("invalid_format");
      const r2 = parse("CLAVE_ELECTOR", "GMRPRZ85091032H123");
      expect(r2.ok).toBe(false);
      if (!r2.ok) expect(r2.reason.kind).toBe("invalid_format");
    });

    it("never returns invalid_checksum (no DV in the spec)", () => {
      // Smoke check: even for completely wrong input the result reason.kind
      // must not be `invalid_checksum`, since `hasCheckDigit: false`.
      const cases = ["", "ABCDEF", "GMRPRZ85091015X123", "GMRPRZ85331015H123"];
      for (const input of cases) {
        const r = parse("CLAVE_ELECTOR", input);
        if (!r.ok) {
          expect(r.reason.kind).not.toBe("invalid_checksum");
        }
      }
    });
  });
});

// MX_NSS — IMSS-issued Número de Seguridad Social. 11 digits with a Luhn /
// mod-10 check digit on the trailing position. Vectors below are SYNTHETIC
// and computed against the standard Luhn algorithm used by the IMSS portal.
//
// Valid Luhn cases (body + DV):
//   - 12345678903  body 1234567890, sum 50, DV 3
//   - 01234567897  body 0123456789, sum 50, DV 7
//   - 09876543217  body 0987654321, sum 50, DV 7
//
// Invalid (bad DV): same bodies with any other final digit fail.

describe("MX — NSS", () => {
  describe("validate", () => {
    it("accepts valid NSSs (synthetic, Luhn-checked)", () => {
      expect(validate("NSS", "12345678903")).toBe(true);
      expect(validate("NSS", "01234567897")).toBe(true);
      expect(validate("NSS", "09876543217")).toBe(true);
    });

    it("strips IMSS-printed grouping separators (`XX-XX-XX-XXXX-X`)", () => {
      expect(validate("NSS", "12-34-56-7890-3")).toBe(true);
      expect(validate("NSS", "12 34 56 7890 3")).toBe(true);
      expect(validate("NSS", "  01234567897  ")).toBe(true);
    });

    it("rejects invalid Luhn check digits", () => {
      // body 1234567890 — only DV=3 passes.
      for (const dv of ["0", "1", "2", "4", "5", "6", "7", "8", "9"]) {
        expect(validate("NSS", `1234567890${dv}`)).toBe(false);
      }
      // body 0987654321 — only DV=7 passes.
      for (const dv of ["0", "1", "2", "3", "4", "5", "6", "8", "9"]) {
        expect(validate("NSS", `0987654321${dv}`)).toBe(false);
      }
    });

    it("rejects all-same-digit placeholders", () => {
      // Some all-same-digit values are coincidentally Luhn-valid (e.g.
      // 00000000000), but they are universally treated as placeholders.
      expect(validate("NSS", "00000000000")).toBe(false);
      expect(validate("NSS", "11111111111")).toBe(false);
      expect(validate("NSS", "99999999999")).toBe(false);
    });

    it("rejects malformed input (length, charset)", () => {
      expect(validate("NSS", "")).toBe(false);
      expect(validate("NSS", "1234567890")).toBe(false); // 10 digits
      expect(validate("NSS", "123456789034")).toBe(false); // 12 digits
      expect(validate("NSS", "ABCDEFGHIJK")).toBe(false);
      expect(validate("NSS", "12345A67903")).toBe(false);
    });

    it("accepts the MX_NSS fully-qualified code", () => {
      expect(validate("MX_NSS", "12345678903")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns the canonical contiguous 11-digit form", () => {
      expect(format("NSS", "12345678903")).toBe("12345678903");
      expect(format("NSS", "12-34-56-7890-3")).toBe("12345678903");
      expect(format("NSS", "12 34 56 7890 3")).toBe("12345678903");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("NSS", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("NSS", "12-34-56-7890-3")).toBe("12345678903");
      expect(normalize("NSS", "12 34 56 7890 3")).toBe("12345678903");
    });

    it("is idempotent", () => {
      const n1 = normalize("NSS", "12-34-56-7890-3");
      expect(normalize("NSS", n1)).toBe(n1);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("NSS", "12-34-56-7890-3");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.normalized).toBe("12345678903");
        expect(r.formatted).toBe("12345678903");
        expect(r.confidence).toBe("high");
      }
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("NSS", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("NSS", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("NSS", "123456789034");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for all-same-digit placeholder", () => {
      const r = parse("NSS", "00000000000");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("NSS", "12345678900");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("MX — Pasaporte (MX_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (1 letter + 8 digits)", () => {
      expect(validate("PASAPORTE", "G12345678")).toBe(true);
      expect(validate("PASAPORTE", "N98765432")).toBe(true);
      expect(validate("PASAPORTE", "A00000001")).toBe(true);
      expect(validate("PASAPORTE", "Z99999999")).toBe(true);
      expect(validate("PASAPORTE", " G12345678 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "G1234567")).toBe(false); // too short
      expect(validate("PASAPORTE", "G123456789")).toBe(false); // too long
      expect(validate("PASAPORTE", "12345678G")).toBe(false); // letter at end
      expect(validate("PASAPORTE", "GG1234567")).toBe(false); // 2 letters
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "g12345678")).toBe(true);
    });

    it("accepts the MX_PASAPORTE fully-qualified code", () => {
      expect(validate("MX_PASAPORTE", "G12345678")).toBe(true);
    });
  });

  describe("normalize", () => {
    it("is idempotent", () => {
      const a = normalize("PASAPORTE", "g12345678");
      expect(normalize("PASAPORTE", a)).toBe(a);
      expect(a).toBe("G12345678");
    });
  });

  describe("format", () => {
    it("round-trips through normalize → format", () => {
      const raw = "g12345678";
      const n = normalize("PASAPORTE", raw);
      expect(format("PASAPORTE", n)).toBe(n);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "g12345678");
      expect(r).toEqual({
        ok: true,
        code: "MX_PASAPORTE",
        normalized: "G12345678",
        formatted: "G12345678",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("PASAPORTE", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for fewer than 9 chars", () => {
      const r = parse("PASAPORTE", "G1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for more than 9 chars", () => {
      const r = parse("PASAPORTE", "G123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
