import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/no/index.ts";

// Synthetic NO Fødselsnummer fixtures — algorithm-derived from random dates.
// Format: DDMMYY + 3 individnummer + 2 DV (DV1 + DV2).
//   - 01018012371 — 1980-01-01, ind 123
//   - 15067045618 — 1970-06-15, ind 456
//   - 20020078953 — 2002-02-20, ind 789
//   - 01010100131 — 2001-01-01, ind 001
//   - 15038523462 — 1985-03-15, ind 234
// D-number fixtures (day + 40):
//   - 41018012365 — D-number for 1980-01-01, ind 123
//   - 55067045601 — D-number for 1970-06-15, ind 456
describe("NO — Fødselsnummer (FNR)", () => {
  describe("validate", () => {
    it("accepts valid FNRs", () => {
      expect(validate("FNR", "01018012371")).toBe(true);
      expect(validate("FNR", "15067045618")).toBe(true);
      expect(validate("FNR", "20020078953")).toBe(true);
      expect(validate("FNR", "01010100131")).toBe(true);
      expect(validate("FNR", "15038523462")).toBe(true);
    });

    it("strips whitespace", () => {
      expect(validate("FNR", "  010180 12371  ")).toBe(true);
      expect(validate("FNR", "010180-12371")).toBe(true);
    });

    it("rejects D-numbers (day > 31)", () => {
      expect(validate("FNR", "41018012365")).toBe(false);
      expect(validate("FNR", "55067045601")).toBe(false);
    });

    it("rejects invalid Luhn-like check digits", () => {
      expect(validate("FNR", "01018012370")).toBe(false);
      expect(validate("FNR", "01018012372")).toBe(false);
      expect(validate("FNR", "15067045619")).toBe(false);
    });

    it("rejects invalid month / day", () => {
      expect(validate("FNR", "32018012371")).toBe(false); // day 32
      expect(validate("FNR", "01138012371")).toBe(false); // month 13
    });

    it("rejects malformed input", () => {
      expect(validate("FNR", "")).toBe(false);
      expect(validate("FNR", "1234")).toBe(false);
      expect(validate("FNR", "ABCDEFGHIJK")).toBe(false);
      expect(validate("FNR", "010180123")).toBe(false); // 9 digits
    });

    it("accepts the NO_FNR fully-qualified code", () => {
      expect(validate("NO_FNR", "01018012371")).toBe(true);
    });

    it("accepts the FODSELSNUMMER alias", () => {
      expect(validate("FODSELSNUMMER", "01018012371")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("FNR", "01018012371");
      expect(r).toEqual({
        ok: true,
        code: "NO_FNR",
        normalized: "01018012371",
        formatted: "01018012371",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("FNR", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short on short input", () => {
      const r = parse("FNR", "0101801237");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long on long input", () => {
      const r = parse("FNR", "010180123710");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format on bad date", () => {
      const r = parse("FNR", "32018012371");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum on bad DV", () => {
      const r = parse("FNR", "01018012372");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });

  describe("normalize / format", () => {
    it("strips separators", () => {
      expect(normalize("FNR", "010180-12371")).toBe("01018012371");
      expect(normalize("FNR", "010180 12371")).toBe("01018012371");
    });

    it("normalize is idempotent", () => {
      const n = normalize("FNR", "010180 12371");
      expect(normalize("FNR", n)).toBe(n);
    });

    it("format returns digits-only canonical form", () => {
      expect(format("FNR", "010180-12371")).toBe("01018012371");
      expect(format("FNR", "01018012371")).toBe("01018012371");
    });
  });
});

describe("NO — D-nummer (DNR)", () => {
  describe("validate", () => {
    it("accepts valid D-numbers (day in [41, 71])", () => {
      expect(validate("DNR", "41018012365")).toBe(true);
      expect(validate("DNR", "55067045601")).toBe(true);
    });

    it("rejects FNRs (day < 41)", () => {
      expect(validate("DNR", "01018012371")).toBe(false);
      expect(validate("DNR", "15067045618")).toBe(false);
    });

    it("rejects day > 71 (out of D-number range)", () => {
      expect(validate("DNR", "72018012371")).toBe(false);
    });

    it("rejects invalid checksum", () => {
      expect(validate("DNR", "41018012360")).toBe(false);
    });

    it("accepts the NO_DNR fully-qualified code", () => {
      expect(validate("NO_DNR", "41018012365")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("DNR", "41018012365");
      expect(r).toEqual({
        ok: true,
        code: "NO_DNR",
        normalized: "41018012365",
        formatted: "41018012365",
        confidence: "high",
      });
    });

    it("returns kind=invalid_format when day < 41 (not a D-number)", () => {
      const r = parse("DNR", "01018012371");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });
  });
});

// NO Orgnr fixtures — mod-11 with weights [3,2,7,6,5,4,3,2].
//   - 976012348
//   - 812345672
//   - 999888771
//   - 987654325
describe("NO — Organisasjonsnummer (ORGNR)", () => {
  describe("validate", () => {
    it("accepts valid orgnr (raw and formatted)", () => {
      expect(validate("ORGNR", "976012348")).toBe(true);
      expect(validate("ORGNR", "976 012 348")).toBe(true);
      expect(validate("ORG", "812345672")).toBe(true);
      expect(validate("ORGNR", "999888771")).toBe(true);
      expect(validate("ORGNR", "987654325")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("ORGNR", "976012340")).toBe(false);
      expect(validate("ORGNR", "987654320")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("ORGNR", "")).toBe(false);
      expect(validate("ORGNR", "12345")).toBe(false);
      expect(validate("ORGNR", "1234567890")).toBe(false);
      expect(validate("ORGNR", "ABCDEFGHI")).toBe(false);
    });

    it("accepts the NO_ORGNR fully-qualified code", () => {
      expect(validate("NO_ORGNR", "976012348")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts spaces in groups of 3", () => {
      expect(format("ORGNR", "976012348")).toBe("976 012 348");
      expect(format("ORGNR", "976 012 348")).toBe("976 012 348");
    });

    it("returns input unchanged when invalid length", () => {
      expect(format("ORGNR", "12345")).toBe("12345");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("ORGNR", "976012348");
      expect(r).toEqual({
        ok: true,
        code: "NO_ORGNR",
        normalized: "976012348",
        formatted: "976 012 348",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum on bad DV", () => {
      const r = parse("ORGNR", "976012340");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("NO — MVA (VAT)", () => {
  describe("validate", () => {
    it("accepts valid MVA numbers", () => {
      expect(validate("MVA", "NO976012348MVA")).toBe(true);
      expect(validate("MVA", "no 976 012 348 mva")).toBe(true);
      expect(validate("VAT", "NO987654325MVA")).toBe(true);
    });

    it("rejects when orgnr body is invalid", () => {
      expect(validate("MVA", "NO976012340MVA")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("MVA", "")).toBe(false);
      expect(validate("MVA", "NO976012348")).toBe(false);
      expect(validate("MVA", "FR976012348MVA")).toBe(false);
    });

    it("accepts the NO_MVA fully-qualified code", () => {
      expect(validate("NO_MVA", "NO976012348MVA")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("MVA", "no 976 012 348 mva");
      expect(r).toEqual({
        ok: true,
        code: "NO_MVA",
        normalized: "NO976012348MVA",
        formatted: "NO976012348MVA",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum when orgnr body is invalid", () => {
      const r = parse("MVA", "NO976012340MVA");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
