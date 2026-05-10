import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/fi/index.ts";

// FI HETU fixtures — derived from `(int(DDMMYY||NNN) mod 31)` mapped to the
// alphabet "0123456789ABCDEFHJKLMNPRSTUVWXY".
//   - 010180-1232  — 1980-01-01, indiv 123, mod=2 → "2"
//   - 150670-4569  — 1970-06-15, indiv 456, mod=9 → "9"
//   - 200201A7897  — 2002-01-20, indiv 789, mod=7 → "7"
//   - 010101A001R  — 2001-01-01, indiv 001, mod=23 → "R"
//   - 311299-876F  — 1999-12-31, indiv 876, mod=15 → "F"
//   - 050555+2340  — 1855-05-05, indiv 234, mod=0 → "0"

describe("FI — HETU", () => {
  describe("validate", () => {
    it("accepts valid HETUs across centuries", () => {
      expect(validate("HETU", "010180-1232")).toBe(true);
      expect(validate("HETU", "150670-4569")).toBe(true);
      expect(validate("HETU", "200201A7897")).toBe(true);
      expect(validate("HETU", "010101A001R")).toBe(true);
      expect(validate("HETU", "311299-876F")).toBe(true);
      expect(validate("HETU", "050555+2340")).toBe(true);
    });

    it("normalizes lowercase letters", () => {
      expect(validate("HETU", "010101a001r")).toBe(true);
    });

    it("strips whitespace but preserves separator", () => {
      expect(validate("HETU", "  010180-1232  ")).toBe(true);
    });

    it("rejects bad century separators (G, I, O, Q, Z, etc.)", () => {
      expect(validate("HETU", "010180G1232")).toBe(false);
      expect(validate("HETU", "010180I1232")).toBe(false);
      expect(validate("HETU", "010180Z1232")).toBe(false);
    });

    it("rejects invalid check character", () => {
      expect(validate("HETU", "010180-1230")).toBe(false);
      expect(validate("HETU", "010180-1239")).toBe(false);
      expect(validate("HETU", "010180-123A")).toBe(false);
    });

    it("rejects forbidden check chars (G, I, O, Q, Z)", () => {
      expect(validate("HETU", "010180-123G")).toBe(false);
      expect(validate("HETU", "010180-123I")).toBe(false);
      expect(validate("HETU", "010180-123O")).toBe(false);
    });

    it("rejects invalid month / day", () => {
      expect(validate("HETU", "320180-1234")).toBe(false); // day 32
      expect(validate("HETU", "011380-1234")).toBe(false); // month 13
    });

    it("rejects malformed input", () => {
      expect(validate("HETU", "")).toBe(false);
      expect(validate("HETU", "1234")).toBe(false);
      expect(validate("HETU", "010180-123")).toBe(false); // 10 chars
      expect(validate("HETU", "010180-12345")).toBe(false); // 12 chars
    });

    it("accepts the FI_HETU fully-qualified code", () => {
      expect(validate("FI_HETU", "010180-1232")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns the canonical normalized form", () => {
      expect(format("HETU", "010180-1232")).toBe("010180-1232");
      expect(format("HETU", "010180 -1232")).toBe("010180-1232");
      expect(format("HETU", "010101a001r")).toBe("010101A001R");
    });

    it("returns input unchanged when invalid", () => {
      expect(format("HETU", "12345")).toBe("12345");
    });

    it("preserves round-trip: format(normalize(x)) === format(x)", () => {
      const inputs = ["010180-1232", "010101A001R", "050555+2340"];
      for (const x of inputs) {
        expect(format("HETU", normalize("HETU", x))).toBe(format("HETU", x));
      }
    });
  });

  describe("normalize", () => {
    it("strips whitespace and uppercases", () => {
      expect(normalize("HETU", "010101a001r")).toBe("010101A001R");
      expect(normalize("HETU", " 010180-1232 ")).toBe("010180-1232");
    });

    it("is idempotent", () => {
      const n = normalize("HETU", "010101a001r");
      expect(normalize("HETU", n)).toBe(n);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("HETU", "010180-1232");
      expect(r).toEqual({
        ok: true,
        code: "FI_HETU",
        normalized: "010180-1232",
        formatted: "010180-1232",
        confidence: "high",
      });
    });

    it("uppercases the century separator and check char", () => {
      const r = parse("HETU", "010101a001r");
      expect(r.ok).toBe(true);
      if (r.ok) {
        expect(r.normalized).toBe("010101A001R");
        expect(r.formatted).toBe("010101A001R");
      }
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("HETU", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short on short input", () => {
      const r = parse("HETU", "010180");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long on long input", () => {
      const r = parse("HETU", "010180-12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for invalid century separator", () => {
      const r = parse("HETU", "010180G1232");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for wrong check char", () => {
      const r = parse("HETU", "010180-1230");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// FI Y-tunnus fixtures — mod-11 with weights [7,9,10,5,8,4,2].
//   - 1234567-1
//   - 9876543-0
//   - 2345678-0
//   - 1572860-0
//   - 4567890-7
//   - 0737546-2
describe("FI — Y-tunnus", () => {
  describe("validate", () => {
    it("accepts valid Y-tunnus (raw and formatted)", () => {
      expect(validate("YTUNNUS", "12345671")).toBe(true);
      expect(validate("YTUNNUS", "1234567-1")).toBe(true);
      expect(validate("Y", "9876543-0")).toBe(true);
      expect(validate("YTUNNUS", "23456780")).toBe(true);
      expect(validate("YTUNNUS", "15728600")).toBe(true);
      expect(validate("YTUNNUS", "4567890-7")).toBe(true);
      expect(validate("YTUNNUS", "0737546-2")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("YTUNNUS", "12345670")).toBe(false);
      expect(validate("YTUNNUS", "1234567-0")).toBe(false);
      expect(validate("YTUNNUS", "9876543-1")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("YTUNNUS", "")).toBe(false);
      expect(validate("YTUNNUS", "1234567")).toBe(false);
      expect(validate("YTUNNUS", "123456789")).toBe(false);
      expect(validate("YTUNNUS", "ABCDEFGH")).toBe(false);
    });

    it("accepts the FI_YTUNNUS fully-qualified code", () => {
      expect(validate("FI_YTUNNUS", "12345671")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen at the canonical position", () => {
      expect(format("YTUNNUS", "12345671")).toBe("1234567-1");
      expect(format("YTUNNUS", "1234567-1")).toBe("1234567-1");
    });

    it("returns input unchanged when invalid length", () => {
      expect(format("YTUNNUS", "12345")).toBe("12345");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("YTUNNUS", "1234567-1");
      expect(r).toEqual({
        ok: true,
        code: "FI_YTUNNUS",
        normalized: "12345671",
        formatted: "1234567-1",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum on bad DV", () => {
      const r = parse("YTUNNUS", "1234567-0");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("FI — VAT (ALV)", () => {
  describe("validate", () => {
    it("accepts valid FI VAT numbers", () => {
      expect(validate("VAT", "FI12345671")).toBe(true);
      expect(validate("ALV", "fi 1234567 1")).toBe(true);
      expect(validate("VAT", "FI98765430")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("VAT", "")).toBe(false);
      expect(validate("VAT", "FI1234567")).toBe(false);
      expect(validate("VAT", "FR12345671")).toBe(false);
    });

    it("rejects when Y-tunnus body is invalid", () => {
      expect(validate("VAT", "FI12345670")).toBe(false);
    });

    it("accepts the FI_VAT fully-qualified code", () => {
      expect(validate("FI_VAT", "FI12345671")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("VAT", "fi 1234567 1");
      expect(r).toEqual({
        ok: true,
        code: "FI_VAT",
        normalized: "FI12345671",
        formatted: "FI12345671",
        confidence: "high",
      });
    });

    it("returns kind=invalid_checksum when body fails Y-tunnus check", () => {
      const r = parse("VAT", "FI12345670");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
