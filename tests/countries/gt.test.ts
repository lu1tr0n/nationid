import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/gt/index.ts";

// GT DPI vectors. Algorithm: weights [2..9] LTR over first 8 digits;
// DV (9th digit) = sum mod 11; if mod == 10 the DPI is invalid by RENAP rule.
// Trailing 4 digits encode departamento (01-22) + municipio.
//   - 1234567890101: body 12345678, sum=240, DV=9, dept=01, muni=01.
//   - 9876543220101: body 98765432, sum=222, DV=2, dept=01, muni=01.
//   - 1000000020101: body 10000000, sum=2,   DV=2, dept=01, muni=01.
//   - 0000000190101: body 00000001, sum=9,   DV=9, dept=01, muni=01.
//   - 5555555500101: body 55555555, sum=220, DV=0, dept=01, muni=01.
//   - 1122334490101: body 11223344, DV=9.
//   - 2000000040101: body 20000000, DV=4.

describe("GT — DPI", () => {
  describe("validate", () => {
    it("accepts valid DPIs (raw and formatted)", () => {
      expect(validate("DPI", "1234567890101")).toBe(true);
      expect(validate("DPI", "1234 56789 0101")).toBe(true);
      expect(validate("DPI", "9876543220101")).toBe(true);
      expect(validate("DPI", "1000000020101")).toBe(true);
      expect(validate("DPI", "0000000190101")).toBe(true);
      expect(validate("DPI", "5555555500101")).toBe(true);
      expect(validate("DPI", "1122334490101")).toBe(true);
    });

    it("strips whitespace and other separators", () => {
      expect(validate("DPI", "  1234567890101  ")).toBe(true);
      expect(validate("DPI", "1234-56789-0101")).toBe(true);
      expect(validate("DPI", "1234.56789.0101")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("DPI", "1234567800101")).toBe(false);
      expect(validate("DPI", "1234567810101")).toBe(false);
      expect(validate("DPI", "9876543200101")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("DPI", "")).toBe(false);
      expect(validate("DPI", "1234")).toBe(false);
      expect(validate("DPI", "12345678901011")).toBe(false);
      expect(validate("DPI", "ABCDEFGHIJKLM")).toBe(false);
      expect(validate("DPI", "1234K6789K101")).toBe(false);
    });

    it("rejects DPIs whose departamento is outside 01..22", () => {
      // Body 12345678 → DV=9 ✓, but dept=23 / 99 / 00 are not valid Guatemalan
      // departamentos. RENAP cannot issue these even if the verifier is correct.
      expect(validate("DPI", "1234567892301")).toBe(false); // dept=23
      expect(validate("DPI", "1234567899901")).toBe(false); // dept=99
      expect(validate("DPI", "1234567890001")).toBe(false); // dept=00
    });

    it("treats CUI as a synonym for DPI", () => {
      expect(validate("CUI", "1234567890101")).toBe(true);
    });

    it("accepts the GT_DPI fully-qualified code", () => {
      expect(validate("GT_DPI", "1234567890101")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts spaces at canonical positions", () => {
      expect(format("DPI", "1234567890101")).toBe("1234 56789 0101");
      expect(format("DPI", "1234 56789 0101")).toBe("1234 56789 0101");
      expect(format("DPI", "1234-56789-0101")).toBe("1234 56789 0101");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("DPI", "1234")).toBe("1234");
    });

    it("preserves round-trip: format(normalize(x)) === format(x)", () => {
      const inputs = ["1234567890101", "1234 56789 0101", "1234-56789-0101"];
      for (const x of inputs) {
        expect(format("DPI", normalize("DPI", x))).toBe(format("DPI", x));
      }
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("DPI", "1234 56789 0101")).toBe("1234567890101");
      expect(normalize("DPI", "1234-56789-0101")).toBe("1234567890101");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("DPI", "1234 56789 0101");
      expect(r).toEqual({
        ok: true,
        code: "GT_DPI",
        normalized: "1234567890101",
        formatted: "1234 56789 0101",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("DPI", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("DPI", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("DPI", "12345678901011");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("DPI", "1234567800101");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// GT NIT vectors. Algorithm (per python-stdnum stdnum.gt.nit and SAT FEL):
//   sum = Σ body_from_right[i] * (i + 2)  for i = 0..n-1
//   r   = (-sum) mod 11
//   dv  = "0123456789K"[r]
//
//   - 12345679:    body 1234567,  DV 9.
//   - 98765434:    body 9876543,  DV 4.
//   - 876543212:   body 87654321, DV 2.
//   - 123456789:   body 12345678, DV 9.
//   - 1007:        body 100,      DV 7.
//   - 124:         body 12,       DV 4.

describe("GT — NIT", () => {
  describe("validate", () => {
    it("accepts valid NITs (raw and formatted)", () => {
      expect(validate("NIT", "12345679")).toBe(true);
      expect(validate("NIT", "1234567-9")).toBe(true);
      expect(validate("NIT", "98765434")).toBe(true);
      expect(validate("NIT", "9876543-4")).toBe(true);
      expect(validate("NIT", "876543212")).toBe(true);
      expect(validate("NIT", "123456789")).toBe(true);
      expect(validate("NIT", "1007")).toBe(true);
      expect(validate("NIT", "124")).toBe(true);
    });

    it("normalizes lowercase k in the verifier", () => {
      // Compute a body whose DV is K. body=82 → sum = 2*2 + 8*3 = 28; r=(-28)%11 = (-28+33)%11 = 5%11=5; not K.
      // We craft one whose r becomes 10. Trying body=4: sum=4*2=8; r=(-8+11)%11=3; no.
      // body = 19: sum = 9*2 + 1*3 = 21; r = (-21 + 22) %11 = 1 → DV='1'.
      // We rely on the algorithm output below; here we just ensure case insensitivity
      // round-trips. body=2 → sum=4 → r=7 → DV='7'. body=21 → sum=1*2+2*3=8 → r=3.
      // body=37 → sum=7*2+3*3=23 → r=(-23+33)%11=10 → DV='K'. So 37K is valid.
      expect(validate("NIT", "37K")).toBe(true);
      expect(validate("NIT", "37k")).toBe(true);
      expect(validate("NIT", "37-K")).toBe(true);
      expect(validate("NIT", "37-k")).toBe(true);
    });

    it("strips whitespace and other separators", () => {
      expect(validate("NIT", "  1234567-9  ")).toBe(true);
      expect(validate("NIT", "1234567 9")).toBe(true);
      expect(validate("NIT", "1.234.567-9")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("NIT", "12345670")).toBe(false);
      expect(validate("NIT", "1234567-0")).toBe(false);
      expect(validate("NIT", "98765430")).toBe(false);
      expect(validate("NIT", "37-1")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("NIT", "")).toBe(false);
      expect(validate("NIT", "X")).toBe(false);
      expect(validate("NIT", "12345678901234")).toBe(false); // too long (>13)
      expect(validate("NIT", "ABCDEFGH")).toBe(false);
      expect(validate("NIT", "12K34")).toBe(false); // K only allowed at the end
    });

    it("rejects all-same-digit body placeholders", () => {
      // body 1111111 -> r computed; same for 0000000.
      expect(validate("NIT", "11111111")).toBe(false);
      expect(validate("NIT", "00000000")).toBe(false);
    });

    it("accepts the GT_NIT fully-qualified code", () => {
      expect(validate("GT_NIT", "12345679")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen between body and verifier", () => {
      expect(format("NIT", "12345679")).toBe("1234567-9");
      expect(format("NIT", "1234567-9")).toBe("1234567-9");
      expect(format("NIT", "37K")).toBe("37-K");
      expect(format("NIT", "37k")).toBe("37-K");
    });

    it("returns input unchanged for invalid raw form", () => {
      expect(format("NIT", "X")).toBe("X");
    });
  });

  describe("normalize", () => {
    it("strips separators and uppercases K", () => {
      expect(normalize("NIT", "1234567-9")).toBe("12345679");
      expect(normalize("NIT", "37-k")).toBe("37K");
      expect(normalize("NIT", "37-K")).toBe("37K");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success (numeric DV)", () => {
      const r = parse("NIT", "1234567-9");
      expect(r).toEqual({
        ok: true,
        code: "GT_NIT",
        normalized: "12345679",
        formatted: "1234567-9",
        confidence: "moderate",
      });
    });

    it("returns ok for K verifier (lowercase normalized)", () => {
      const r = parse("NIT", "37-k");
      expect(r).toEqual({
        ok: true,
        code: "GT_NIT",
        normalized: "37K",
        formatted: "37-K",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("NIT", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for single-character input", () => {
      const r = parse("NIT", "1");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for over 13 characters", () => {
      const r = parse("NIT", "12345678901234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for K outside the verifier slot", () => {
      const r = parse("NIT", "12K34");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for all-same-digit body", () => {
      const r = parse("NIT", "11111111");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("NIT", "12345670");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
