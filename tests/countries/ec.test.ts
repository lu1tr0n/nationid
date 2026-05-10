import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/ec/index.ts";

// EC vectors derived directly from the SRI Luhn-variant (cédula and RUC
// natural) and mod-11 algorithms (RUC jurídica, RUC pública). All values
// are synthetic and computed from the published weights.
//
//   - 1710034065     cédula natural (provincia 17, d3=1, dv=5)
//   - 0912345675     cédula natural (provincia 09, dv=5)
//   - 3012345678     cédula natural exterior (provincia 30, dv=8)
//   - 1710034065001  RUC natural (cédula + 001)
//   - 0900000019001  RUC natural (provincia 09)
//   - 1791000005001  RUC jurídica (3rd digit = 9, mod-11)
//   - 1760000070001  RUC pública  (3rd digit = 6, mod-11; pos 10 must be 0)

describe("EC — Cédula", () => {
  describe("validate", () => {
    it("accepts synthetic-valid cédulas (all provincias)", () => {
      expect(validate("CEDULA", "1710034065")).toBe(true);
      expect(validate("CEDULA", "0912345675")).toBe(true);
      expect(validate("CEDULA", "3012345678")).toBe(true);
    });

    it("rejects cédulas with invalid check digit", () => {
      expect(validate("CEDULA", "1710034066")).toBe(false);
      expect(validate("CEDULA", "1710034064")).toBe(false);
      expect(validate("CEDULA", "0912345670")).toBe(false);
      expect(validate("CEDULA", "3012345670")).toBe(false);
    });

    it("rejects cédulas with provincia out of range (>24 and !=30)", () => {
      expect(validate("CEDULA", "2510034065")).toBe(false); // provincia 25
      expect(validate("CEDULA", "9910034065")).toBe(false); // provincia 99
      expect(validate("CEDULA", "0010034065")).toBe(false); // provincia 00
    });

    it("rejects cédulas where 3rd digit >= 6 (not personas naturales)", () => {
      expect(validate("CEDULA", "1760034065")).toBe(false); // d3=6
      expect(validate("CEDULA", "1770034065")).toBe(false); // d3=7
      expect(validate("CEDULA", "1790034065")).toBe(false); // d3=9
    });

    it("rejects wrong length", () => {
      expect(validate("CEDULA", "171003406")).toBe(false); // 9 digits
      expect(validate("CEDULA", "17100340655")).toBe(false); // 11 digits
    });

    it("rejects non-digit input", () => {
      expect(validate("CEDULA", "ABCDEFGHIJ")).toBe(false);
      expect(validate("CEDULA", "171003406A")).toBe(false);
    });

    it("rejects empty / whitespace", () => {
      expect(validate("CEDULA", "")).toBe(false);
      expect(validate("CEDULA", "   ")).toBe(false);
    });

    it("strips separators before validating", () => {
      expect(validate("CEDULA", "1710-0340-65")).toBe(true);
      expect(validate("CEDULA", " 17 10 03 40 65 ")).toBe(true);
    });

    it("accepts both EC_CEDULA and CEDULA codes", () => {
      expect(validate("EC_CEDULA", "1710034065")).toBe(true);
      expect(validate("CEDULA", "1710034065")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns 10 digits unchanged (no canonical separator)", () => {
      expect(format("CEDULA", "1710034065")).toBe("1710034065");
      expect(format("CEDULA", "1710-0340-65")).toBe("1710034065");
    });

    it("returns input unchanged when invalid", () => {
      expect(format("CEDULA", "X")).toBe("X");
    });
  });

  describe("normalize", () => {
    it("strips non-digit characters", () => {
      expect(normalize("CEDULA", "1710-0340-65")).toBe("1710034065");
      expect(normalize("CEDULA", "1710034065")).toBe("1710034065");
    });

    it("is idempotent", () => {
      const a = normalize("CEDULA", "1710-0340-65");
      const b = normalize("CEDULA", a);
      expect(b).toBe(a);
    });
  });

  describe("parse", () => {
    it("returns ok on valid cédula", () => {
      const r = parse("CEDULA", "1710-0340-65");
      expect(r).toEqual({
        ok: true,
        code: "EC_CEDULA",
        normalized: "1710034065",
        formatted: "1710034065",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CEDULA", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for <10 digits", () => {
      const r = parse("CEDULA", "171003406");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for >10 digits", () => {
      const r = parse("CEDULA", "17100340655");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for bad provincia", () => {
      const r = parse("CEDULA", "2510034065");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for d3 >= 6", () => {
      const r = parse("CEDULA", "1770034065");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("CEDULA", "1710034066");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("EC — RUC", () => {
  describe("validate", () => {
    it("accepts RUC for persona natural (3rd digit < 6)", () => {
      expect(validate("RUC", "1710034065001")).toBe(true);
      expect(validate("RUC", "0900000019001")).toBe(true);
    });

    it("accepts RUC for persona jurídica (3rd digit = 9)", () => {
      expect(validate("RUC", "1791000005001")).toBe(true);
    });

    it("accepts RUC for sociedad pública (3rd digit = 6)", () => {
      expect(validate("RUC", "1760000070001")).toBe(true);
    });

    it("accepts higher establecimiento codes", () => {
      // For natural RUC, only the first 10 digits feed the checksum;
      // establecimiento changes the last 3 freely.
      expect(validate("RUC", "1710034065002")).toBe(true);
      expect(validate("RUC", "1710034065999")).toBe(true);
    });

    it("rejects RUC where 3rd digit ∈ {7, 8} (no algorithm branch)", () => {
      expect(validate("RUC", "1770000000001")).toBe(false);
      expect(validate("RUC", "1780000000001")).toBe(false);
    });

    it("rejects RUC pública where pos 10 is not 0", () => {
      // 1760000070001 is valid; flipping pos-10 (0-indexed 9) to '1' breaks it.
      expect(validate("RUC", "1760000071001")).toBe(false);
    });

    it("rejects RUC with establecimiento `000` (matriz must be ≥ 001)", () => {
      expect(validate("RUC", "1710034065000")).toBe(false);
    });

    it("rejects RUC with bad provincia", () => {
      expect(validate("RUC", "2510034065001")).toBe(false);
    });

    it("rejects RUC with invalid jurídica DV", () => {
      expect(validate("RUC", "1791000004001")).toBe(false);
      expect(validate("RUC", "1791000006001")).toBe(false);
    });

    it("rejects RUC with invalid pública DV", () => {
      expect(validate("RUC", "1760000080001")).toBe(false);
      expect(validate("RUC", "1760000060001")).toBe(false);
    });

    it("rejects RUC with invalid natural DV", () => {
      expect(validate("RUC", "1710034066001")).toBe(false);
    });

    it("rejects wrong length", () => {
      expect(validate("RUC", "171003406500")).toBe(false); // 12 digits
      expect(validate("RUC", "17100340650011")).toBe(false); // 14 digits
    });

    it("rejects non-digit input", () => {
      expect(validate("RUC", "ABCDEFGHIJKLM")).toBe(false);
    });

    it("rejects empty / whitespace", () => {
      expect(validate("RUC", "")).toBe(false);
      expect(validate("RUC", "   ")).toBe(false);
    });

    it("strips separators", () => {
      expect(validate("RUC", "1710-034065-001")).toBe(true);
    });

    it("accepts both EC_RUC and RUC codes", () => {
      expect(validate("EC_RUC", "1710034065001")).toBe(true);
      expect(validate("RUC", "1710034065001")).toBe(true);
    });
  });

  describe("format", () => {
    it("returns 13 digits unchanged", () => {
      expect(format("RUC", "1710034065001")).toBe("1710034065001");
      expect(format("RUC", "1710-034065-001")).toBe("1710034065001");
    });

    it("returns input unchanged when invalid length", () => {
      expect(format("RUC", "X")).toBe("X");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("RUC", "1710-034065-001")).toBe("1710034065001");
    });

    it("is idempotent", () => {
      const a = normalize("RUC", "1710-034065-001");
      const b = normalize("RUC", a);
      expect(b).toBe(a);
    });
  });

  describe("parse", () => {
    it("returns ok on valid natural RUC", () => {
      const r = parse("RUC", "1710-034065-001");
      expect(r).toEqual({
        ok: true,
        code: "EC_RUC",
        normalized: "1710034065001",
        formatted: "1710034065001",
        confidence: "high",
      });
    });

    it("returns ok on valid jurídica RUC", () => {
      const r = parse("RUC", "1791000005001");
      expect(r.ok).toBe(true);
    });

    it("returns ok on valid pública RUC", () => {
      const r = parse("RUC", "1760000070001");
      expect(r.ok).toBe(true);
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("RUC", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for <13 digits", () => {
      const r = parse("RUC", "171003406500");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for >13 digits", () => {
      const r = parse("RUC", "17100340650011");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for `000` establecimiento", () => {
      const r = parse("RUC", "1710034065000");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_format for bad provincia", () => {
      const r = parse("RUC", "2510034065001");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad jurídica DV", () => {
      const r = parse("RUC", "1791000004001");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
