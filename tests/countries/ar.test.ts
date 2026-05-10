import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/ar/index.ts";

describe("AR — DNI", () => {
  describe("validate", () => {
    it("accepts valid DNIs (7 or 8 digits, raw and formatted)", () => {
      expect(validate("DNI", "12345678")).toBe(true);
      expect(validate("DNI", "12.345.678")).toBe(true);
      expect(validate("DNI", "1234567")).toBe(true); // 7-digit (older)
      expect(validate("DNI", "1.234.567")).toBe(true);
      expect(validate("DNI", "28123456")).toBe(true);
      expect(validate("DNI", "99999999")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("DNI", "")).toBe(false);
      expect(validate("DNI", "123")).toBe(false);
      expect(validate("DNI", "123456789")).toBe(false); // too long
      expect(validate("DNI", "ABCDEFGH")).toBe(false);
    });

    it("accepts the AR_DNI fully-qualified code", () => {
      expect(validate("AR_DNI", "12345678")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts thousands separators", () => {
      expect(format("DNI", "12345678")).toBe("12.345.678");
      expect(format("DNI", "1234567")).toBe("1.234.567");
      expect(format("DNI", "12.345.678")).toBe("12.345.678");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("DNI", "12")).toBe("12");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("DNI", "12.345.678")).toBe("12345678");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("DNI", "12.345.678");
      expect(r).toEqual({
        ok: true,
        code: "AR_DNI",
        normalized: "12345678",
        formatted: "12.345.678",
        confidence: "high",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("DNI", "123");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("DNI", "123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});

// CUIT/CUIL test vectors with verifier digits computed using AFIP RG 10/97
// algorithm (weights [5,4,3,2,7,6,5,4,3,2], 11 - (sum mod 11)).
//   - 20-12345678-6: prefix 20 + base 12345678 + DV 6
//   - 27-11111111-7: prefix 27 + base 11111111 + DV 7
//   - 30-70123456-8: prefix 30 (jurídica) + base + DV 8
//   - 33-12345678-0: prefix 33 + base + DV 0 (from dv == 11 -> 0)
//   - 23-33333333-3: prefix 23 + base + DV 3

describe("AR — CUIL", () => {
  describe("validate", () => {
    it("accepts valid CUILs (raw and formatted, prefixes 20/23/24/27)", () => {
      expect(validate("CUIL", "20123456786")).toBe(true);
      expect(validate("CUIL", "20-12345678-6")).toBe(true);
      expect(validate("CUIL", "27111111117")).toBe(true);
      expect(validate("CUIL", "27-11111111-7")).toBe(true);
      expect(validate("CUIL", "23333333333")).toBe(true);
      expect(validate("CUIL", "24123456781")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CUIL", "20123456780")).toBe(false);
      expect(validate("CUIL", "27111111110")).toBe(false);
      expect(validate("CUIL", "20123456789")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CUIL", "")).toBe(false);
      expect(validate("CUIL", "1234")).toBe(false);
      expect(validate("CUIL", "201234567861")).toBe(false);
      expect(validate("CUIL", "ABCDEFGHIJK")).toBe(false);
    });

    it("rejects CUIT-only prefixes (30/33/34) for CUIL", () => {
      expect(validate("CUIL", "30701234568")).toBe(false);
      expect(validate("CUIL", "33123456780")).toBe(false);
    });

    it("accepts the AR_CUIL fully-qualified code", () => {
      expect(validate("AR_CUIL", "20123456786")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at canonical positions", () => {
      expect(format("CUIL", "20123456786")).toBe("20-12345678-6");
      expect(format("CUIL", "20-12345678-6")).toBe("20-12345678-6");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CUIL", "20-12345678-6");
      expect(r).toEqual({
        ok: true,
        code: "AR_CUIL",
        normalized: "20123456786",
        formatted: "20-12345678-6",
        confidence: "high",
      });
    });

    it("returns kind=invalid_format for forbidden prefix (DV correct)", () => {
      // 30-70123456-8 has correct DV but prefix 30 is CUIT-only; CUIL forbids it.
      const r = parse("CUIL", "30701234568");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("CUIL", "20123456780");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// AR_CDI test vectors (computed using the same mod-11 algorithm as CUIT/CUIL,
// weights [5,4,3,2,7,6,5,4,3,2], with prefix 50 per RG AFIP 3995/2017):
//   - 50-12345678-2: body10 5012345678; sum=163; r=9; dv=11-9=2
//   - 50-11111111-9: body10 5011111111; sum=57;  r=2; dv=11-2=9
//   - 50-00000000-8: body10 5000000000; sum=25;  r=3; dv=11-3=8
//   - 50-98765432-2: body10 5098765432; sum=207; r=9; dv=11-9=2
//   - 50-50000000-4: body10 5050000000; sum=40;  r=7; dv=11-7=4

describe("AR — CDI", () => {
  describe("validate", () => {
    it("accepts valid CDIs (raw and formatted, prefix 50)", () => {
      expect(validate("CDI", "50123456782")).toBe(true);
      expect(validate("CDI", "50-12345678-2")).toBe(true);
      expect(validate("CDI", "50111111119")).toBe(true);
      expect(validate("CDI", "50000000008")).toBe(true);
      expect(validate("CDI", "50987654322")).toBe(true);
      expect(validate("CDI", "50500000004")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CDI", "50123456780")).toBe(false);
      expect(validate("CDI", "50111111110")).toBe(false);
      expect(validate("CDI", "50500000005")).toBe(false);
    });

    it("rejects CUIT/CUIL prefixes (even when DV would be correct)", () => {
      // 20123456786 has correct DV for prefix 20 but is not a CDI.
      expect(validate("CDI", "20123456786")).toBe(false);
      // 27111111117 has correct DV for prefix 27 but is not a CDI.
      expect(validate("CDI", "27111111117")).toBe(false);
      // 30701234568 has correct DV for prefix 30 but is not a CDI.
      expect(validate("CDI", "30701234568")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CDI", "")).toBe(false);
      expect(validate("CDI", "1234")).toBe(false);
      expect(validate("CDI", "5012345678")).toBe(false); // 10 digits — too short
      expect(validate("CDI", "501234567823")).toBe(false); // 12 digits — too long
      expect(validate("CDI", "ABCDEFGHIJK")).toBe(false);
    });

    it("accepts the AR_CDI fully-qualified code", () => {
      expect(validate("AR_CDI", "50123456782")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at canonical positions", () => {
      expect(format("CDI", "50123456782")).toBe("50-12345678-2");
      expect(format("CDI", "50-12345678-2")).toBe("50-12345678-2");
      expect(format("CDI", "50500000004")).toBe("50-50000000-4");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CDI", "50")).toBe("50");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("CDI", "50-12345678-2")).toBe("50123456782");
      expect(normalize("CDI", " 50-12345678-2 ")).toBe("50123456782");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CDI", "50-12345678-2");
      expect(r).toEqual({
        ok: true,
        code: "AR_CDI",
        normalized: "50123456782",
        formatted: "50-12345678-2",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("CDI", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("CDI", "5012345678");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("CDI", "501234567823");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format for non-CDI prefix (DV correct)", () => {
      // Prefix 20 with valid CUIT DV; CDI must reject.
      const r = parse("CDI", "20123456786");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV under prefix 50", () => {
      const r = parse("CDI", "50123456780");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("AR — CUIT", () => {
  describe("validate", () => {
    it("accepts valid CUITs (personas físicas + jurídicas)", () => {
      expect(validate("CUIT", "20123456786")).toBe(true);
      expect(validate("CUIT", "20-12345678-6")).toBe(true);
      expect(validate("CUIT", "27111111117")).toBe(true);
      expect(validate("CUIT", "30701234568")).toBe(true);
      expect(validate("CUIT", "30-70123456-8")).toBe(true);
      expect(validate("CUIT", "33123456780")).toBe(true);
      expect(validate("CUIT", "23333333333")).toBe(true);
    });

    it("rejects invalid check digits", () => {
      expect(validate("CUIT", "20123456780")).toBe(false);
      expect(validate("CUIT", "30701234560")).toBe(false);
      expect(validate("CUIT", "33123456789")).toBe(false);
    });

    it("rejects forbidden prefixes (even when DV is correct)", () => {
      // Prefix 28: DV computed from 2812345678 = 7. Still rejected (forbidden).
      expect(validate("CUIT", "28123456787")).toBe(false);
      // Prefix 35: DV computed from 3512345678 = 3. Still rejected (forbidden).
      expect(validate("CUIT", "35123456783")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("CUIT", "")).toBe(false);
      expect(validate("CUIT", "1234")).toBe(false);
      expect(validate("CUIT", "201234567861")).toBe(false);
      expect(validate("CUIT", "ABCDEFGHIJK")).toBe(false);
    });

    it("accepts the AR_CUIT fully-qualified code", () => {
      expect(validate("AR_CUIT", "30701234568")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphens at canonical positions", () => {
      expect(format("CUIT", "30701234568")).toBe("30-70123456-8");
      expect(format("CUIT", "30-70123456-8")).toBe("30-70123456-8");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CUIT", "30-70123456-8");
      expect(r).toEqual({
        ok: true,
        code: "AR_CUIT",
        normalized: "30701234568",
        formatted: "30-70123456-8",
        confidence: "high",
      });
    });

    it("returns kind=invalid_format for forbidden prefix (DV correct)", () => {
      const r = parse("CUIT", "28123456787");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum for bad DV", () => {
      const r = parse("CUIT", "20123456780");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("AR — Pasaporte (AR_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (8-9 alphanumeric)", () => {
      expect(validate("PASAPORTE", "12345678")).toBe(true);
      expect(validate("PASAPORTE", "123456789")).toBe(true);
      expect(validate("PASAPORTE", "AAB12345Z")).toBe(true);
      expect(validate("PASAPORTE", "RENAPER1")).toBe(true);
      expect(validate("PASAPORTE", " 123456789 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "1234567")).toBe(false); // too short
      expect(validate("PASAPORTE", "1234567890")).toBe(false); // too long
      expect(validate("PASAPORTE", "@@@@@@@@")).toBe(false);
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "abc12345")).toBe(true);
    });

    it("accepts the AR_PASAPORTE fully-qualified code", () => {
      expect(validate("AR_PASAPORTE", "12345678")).toBe(true);
    });
  });

  describe("normalize", () => {
    it("is idempotent", () => {
      const a = normalize("PASAPORTE", "abc12345");
      expect(normalize("PASAPORTE", a)).toBe(a);
      expect(a).toBe("ABC12345");
    });
  });

  describe("format", () => {
    it("round-trips through normalize → format", () => {
      const raw = "abc12345";
      const n = normalize("PASAPORTE", raw);
      expect(format("PASAPORTE", n)).toBe(n);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "abc12345");
      expect(r).toEqual({
        ok: true,
        code: "AR_PASAPORTE",
        normalized: "ABC12345",
        formatted: "ABC12345",
        confidence: "low",
      });
    });

    it("returns kind=too_short for fewer than 8 chars", () => {
      const r = parse("PASAPORTE", "1234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for more than 9 chars", () => {
      const r = parse("PASAPORTE", "1234567890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
