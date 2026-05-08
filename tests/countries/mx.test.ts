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

// RFC PF test vectors with homoclave DVs computed via SAT Anexo 1-A
// algorithm (mod-11 over first 12 chars, table including space=0, &=25,
// weights 13..2). All bodies are SYNTHETIC.
//   - MELO850315H79 — 4 letras + 850315 + homoclave H7 + DV 9
//   - GAJA920101AB5 — body GAJA920101AB + DV 5
//   - PEMA751231X15 — body PEMA751231X1 + DV 5
//   - RUDR000115AA1 — body RUDR000115AA + DV 1
//   - TOPA800615X90 — body TOPA800615X9 + DV 0
//   - XAXX010101000 — SAT genérico (operación con público en general).
//   - XEXX010101000 — SAT genérico (extranjero sin RFC).

describe("MX — RFC Persona Física", () => {
  describe("validate", () => {
    it("accepts valid RFCs (synthetic)", () => {
      expect(validate("RFC_PF", "MELO850315H79")).toBe(true);
      expect(validate("RFC_PF", "GAJA920101AB5")).toBe(true);
      expect(validate("RFC_PF", "PEMA751231X15")).toBe(true);
      expect(validate("RFC_PF", "RUDR000115AA1")).toBe(true);
      expect(validate("RFC_PF", "TOPA800615X90")).toBe(true);
    });

    it("accepts SAT genéricos (XAXX/XEXX)", () => {
      expect(validate("RFC_PF", "XAXX010101000")).toBe(true);
      expect(validate("RFC_PF", "XEXX010101000")).toBe(true);
    });

    it("normalizes lowercase and whitespace", () => {
      expect(validate("RFC_PF", " melo850315h79 ")).toBe(true);
      expect(validate("RFC_PF", "MELO-850315-H79")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("RFC_PF", "MELO850315H70")).toBe(false);
      expect(validate("RFC_PF", "GAJA920101AB0")).toBe(false);
      expect(validate("RFC_PF", "PEMA751231X19")).toBe(false);
    });

    it("rejects malformed input (length, charset)", () => {
      expect(validate("RFC_PF", "")).toBe(false);
      expect(validate("RFC_PF", "MELO850315H7")).toBe(false); // 12 chars (PM length)
      expect(validate("RFC_PF", "MELO850315H791")).toBe(false); // 14 chars
      expect(validate("RFC_PF", "1234850315H79")).toBe(false); // first 4 must be letters
      expect(validate("RFC_PF", "MELOABCDEFH79")).toBe(false); // chars 4-9 must be digits
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
      expect(validate("MX_RFC_PF", "MELO850315H79")).toBe(true);
    });
  });

  describe("format", () => {
    it("uppercases and strips separators", () => {
      expect(format("RFC_PF", "melo850315h79")).toBe("MELO850315H79");
      expect(format("RFC_PF", "MELO-850315-H79")).toBe("MELO850315H79");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("RFC_PF", "MELO")).toBe("MELO");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("RFC_PF", "MELO850315H79");
      expect(r).toEqual({
        ok: true,
        code: "MX_RFC_PF",
        normalized: "MELO850315H79",
        formatted: "MELO850315H79",
        confidence: "moderate",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("RFC_PF", "MELO850315H7");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("RFC_PF", "MELO850315H791");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for forbidden prefix", () => {
      const r = parse("RFC_PF", "PUTO850315ABC");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("RFC_PF", "MELO850315H70");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// RFC PM test vectors with homoclave DVs computed via the SAT algorithm with
// the 12-char body padded by a leading space to align to the 13-char weight
// vector. All bodies are SYNTHETIC.
//   - ABC901231J45  — body ABC901231J4 + DV 5
//   - XYZ850615PQ5  — body XYZ850615PQ + DV 5
//   - MEX120831RT7  — body MEX120831RT + DV 7
//   - GHI001215AB5  — body GHI001215AB + DV 5
//   - BBB991231X98  — body BBB991231X9 + DV 8

describe("MX — RFC Persona Moral", () => {
  describe("validate", () => {
    it("accepts valid RFCs (synthetic)", () => {
      expect(validate("RFC_PM", "ABC901231J45")).toBe(true);
      expect(validate("RFC_PM", "XYZ850615PQ5")).toBe(true);
      expect(validate("RFC_PM", "MEX120831RT7")).toBe(true);
      expect(validate("RFC_PM", "GHI001215AB5")).toBe(true);
      expect(validate("RFC_PM", "BBB991231X98")).toBe(true);
    });

    it("normalizes lowercase and whitespace", () => {
      expect(validate("RFC_PM", " abc901231j45 ")).toBe(true);
      expect(validate("RFC_PM", "ABC-901231-J45")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("RFC_PM", "ABC901231J40")).toBe(false);
      expect(validate("RFC_PM", "XYZ850615PQ0")).toBe(false);
      expect(validate("RFC_PM", "MEX120831RT0")).toBe(false);
    });

    it("rejects malformed input (length, charset)", () => {
      expect(validate("RFC_PM", "")).toBe(false);
      expect(validate("RFC_PM", "ABC901231J4")).toBe(false); // 11 chars
      expect(validate("RFC_PM", "ABC901231J451")).toBe(false); // 13 chars (PF length)
      expect(validate("RFC_PM", "1234901231J45")).toBe(false); // numeric prefix
      expect(validate("RFC_PM", "ABCXXXXXXJ45")).toBe(false); // chars 3-8 must be digits
    });

    it("rejects implausible constitution dates", () => {
      expect(validate("RFC_PM", "ABC901331J45")).toBe(false); // mes 13
      expect(validate("RFC_PM", "ABC900032J45")).toBe(false); // día 00
    });

    it("accepts the MX_RFC_PM fully-qualified code", () => {
      expect(validate("MX_RFC_PM", "ABC901231J45")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("RFC_PM", "ABC901231J45");
      expect(r).toEqual({
        ok: true,
        code: "MX_RFC_PM",
        normalized: "ABC901231J45",
        formatted: "ABC901231J45",
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
      const r = parse("RFC_PM", "ABC901231J451");
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
