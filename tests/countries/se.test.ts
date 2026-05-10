import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/se/index.ts";

// Synthetic SE personnummer fixtures — Luhn check digits computed over the
// 10-digit form (YYMMDD + 3 ind + 1 DV). Dates picked at random; no real PII.
//   - 8112289874  — 1981-12-28, individual 987, DV 4
//   - 6408233234  — 1964-08-23, individual 323, DV 4
//   - 2001010012  — 2020-01-01, individual 001, DV 2
//   - 9005250015  — 1990-05-25, individual 001, DV 5
//   - 5501010101  — 1955-01-01, individual 010, DV 1 (sex 0 = F)
//   - 8112889871  — coordination number (day = 28 + 60 = 88), DV 1
// 12-digit forms simply prepend the century:
//   - 198112289874, 196408233234, 202001010012, 199005250015, 195501010101.

describe("SE — Personnummer", () => {
  describe("validate", () => {
    it("accepts valid 10-digit personnummer (raw and formatted)", () => {
      expect(validate("PNR", "8112289874")).toBe(true);
      expect(validate("PNR", "811228-9874")).toBe(true);
      expect(validate("PERSONNUMMER", "6408233234")).toBe(true);
      expect(validate("PERSONNUMMER", "640823-3234")).toBe(true);
      expect(validate("PNR", "5501010101")).toBe(true);
    });

    it("accepts valid 12-digit personnummer (raw and formatted)", () => {
      expect(validate("PNR", "198112289874")).toBe(true);
      expect(validate("PNR", "19811228-9874")).toBe(true);
      expect(validate("PNR", "202001010012")).toBe(true);
      expect(validate("PNR", "20200101-0012")).toBe(true);
    });

    it("accepts the `+` separator for over-100 personnummer", () => {
      expect(validate("PNR", "811228+9874")).toBe(true);
    });

    it("accepts coordination numbers (day + 60)", () => {
      expect(validate("PNR", "8112889871")).toBe(true);
      expect(validate("PNR", "811288-9871")).toBe(true);
    });

    it("strips whitespace and other separators", () => {
      expect(validate("PNR", "  811228-9874  ")).toBe(true);
      expect(validate("PNR", "811228 9874")).toBe(true);
    });

    it("rejects invalid Luhn check digits", () => {
      expect(validate("PNR", "8112289870")).toBe(false);
      expect(validate("PNR", "8112289871")).toBe(false);
      expect(validate("PNR", "198112289870")).toBe(false);
    });

    it("rejects invalid month / day", () => {
      // Month 13.
      expect(validate("PNR", "8113289874")).toBe(false);
      // Day 92 (would be 32 after coord-offset).
      expect(validate("PNR", "8112929874")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("PNR", "")).toBe(false);
      expect(validate("PNR", "12345")).toBe(false);
      expect(validate("PNR", "ABCDEFGHIJ")).toBe(false);
      expect(validate("PNR", "81122898")).toBe(false); // 8 digits
    });

    it("accepts the SE_PERSONNUMMER fully-qualified code", () => {
      expect(validate("SE_PERSONNUMMER", "8112289874")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen at the canonical position (10-digit form)", () => {
      expect(format("PNR", "8112289874")).toBe("811228-9874");
      expect(format("PNR", "811228-9874")).toBe("811228-9874");
      expect(format("PNR", "811228 9874")).toBe("811228-9874");
    });

    it("inserts hyphen at the canonical position (12-digit form)", () => {
      expect(format("PNR", "198112289874")).toBe("19811228-9874");
      expect(format("PNR", "19811228-9874")).toBe("19811228-9874");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("PNR", "1234")).toBe("1234");
    });

    it("preserves round-trip: format(normalize(x)) === format(x)", () => {
      const inputs = ["8112289874", "811228-9874", "811228 9874", "198112289874"];
      for (const x of inputs) {
        expect(format("PNR", normalize("PNR", x))).toBe(format("PNR", x));
      }
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("PNR", "811228-9874")).toBe("8112289874");
      expect(normalize("PNR", "19811228-9874")).toBe("198112289874");
    });

    it("is idempotent", () => {
      const n1 = normalize("PNR", "811228-9874");
      const n2 = normalize("PNR", n1);
      expect(n2).toBe(n1);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success (10-digit)", () => {
      const r = parse("PNR", "811228-9874");
      expect(r).toEqual({
        ok: true,
        code: "SE_PERSONNUMMER",
        normalized: "8112289874",
        formatted: "811228-9874",
        confidence: "high",
      });
    });

    it("returns ok with normalized + formatted on success (12-digit)", () => {
      const r = parse("PNR", "19811228-9874");
      expect(r).toEqual({
        ok: true,
        code: "SE_PERSONNUMMER",
        normalized: "198112289874",
        formatted: "19811228-9874",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty input", () => {
      const r = parse("PNR", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short on shorter input", () => {
      const r = parse("PNR", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long on longer input (11 or 13+ digits)", () => {
      const r1 = parse("PNR", "12345678901");
      expect(r1.ok).toBe(false);
      if (!r1.ok) expect(r1.reason.kind).toBe("too_long");
      const r2 = parse("PNR", "1234567890123");
      expect(r2.ok).toBe(false);
      if (!r2.ok) expect(r2.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_format on bad date", () => {
      const r = parse("PNR", "8113289874");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum on bad DV", () => {
      const r = parse("PNR", "8112289870");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// SE Orgnr fixtures — Luhn over all 10 digits, 3rd digit >= 2.
//   - 5566778899 — 3rd=6, DV 9
//   - 2120001561 — 3rd=2, DV 1 (Stockholm city legal entity range)
//   - 8024677299 — 3rd=2, DV 9
describe("SE — Orgnr", () => {
  describe("validate", () => {
    it("accepts valid orgnr (raw and formatted)", () => {
      expect(validate("ORGNR", "5566778899")).toBe(true);
      expect(validate("ORGNR", "556677-8899")).toBe(true);
      expect(validate("ORG", "2120001561")).toBe(true);
      expect(validate("ORG", "212000-1561")).toBe(true);
      expect(validate("ORGNR", "8024677299")).toBe(true);
    });

    it("rejects orgnr whose 3rd digit < 2 (collision with personnummer)", () => {
      // Construct a Luhn-valid 10-digit string with 3rd digit 0 or 1.
      // 5501010101 is valid Luhn but represents personnummer not orgnr.
      expect(validate("ORGNR", "5501010101")).toBe(false);
    });

    it("rejects invalid Luhn check digits", () => {
      expect(validate("ORGNR", "5566778890")).toBe(false);
      expect(validate("ORGNR", "5566778891")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("ORGNR", "")).toBe(false);
      expect(validate("ORGNR", "55667788")).toBe(false);
      expect(validate("ORGNR", "55667788991")).toBe(false);
      expect(validate("ORGNR", "ABCDEFGHIJ")).toBe(false);
    });

    it("accepts the SE_ORGNR fully-qualified code", () => {
      expect(validate("SE_ORGNR", "5566778899")).toBe(true);
    });
  });

  describe("format", () => {
    it("inserts hyphen at the canonical position", () => {
      expect(format("ORGNR", "5566778899")).toBe("556677-8899");
      expect(format("ORGNR", "556677-8899")).toBe("556677-8899");
      expect(format("ORGNR", "556677 8899")).toBe("556677-8899");
    });

    it("returns input unchanged when invalid length", () => {
      expect(format("ORGNR", "12345")).toBe("12345");
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("ORGNR", "556677-8899");
      expect(r).toEqual({
        ok: true,
        code: "SE_ORGNR",
        normalized: "5566778899",
        formatted: "556677-8899",
        confidence: "high",
      });
    });

    it("returns kind=invalid_format when 3rd digit < 2", () => {
      const r = parse("ORGNR", "5501010101");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_format");
    });

    it("returns kind=invalid_checksum on bad DV", () => {
      const r = parse("ORGNR", "5566778890");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

// SE VAT — `SE` + 10-digit orgnr + `01`.
describe("SE — VAT (Moms)", () => {
  describe("validate", () => {
    it("accepts valid SE VAT numbers", () => {
      expect(validate("VAT", "SE556677889901")).toBe(true);
      expect(validate("MOMS", "SE556677889901")).toBe(true);
      expect(validate("VAT", "SE212000156101")).toBe(true);
      expect(validate("VAT", "se556677889901")).toBe(true); // lowercase ok
      expect(validate("VAT", "SE 556677 8899 01")).toBe(true); // spaces stripped
    });

    it("rejects sequences other than 01 (library policy)", () => {
      expect(validate("VAT", "SE556677889902")).toBe(false);
      expect(validate("VAT", "SE556677889912")).toBe(false);
    });

    it("rejects when orgnr 3rd digit < 2", () => {
      expect(validate("VAT", "SE550101010101")).toBe(false);
    });

    it("rejects invalid Luhn on the orgnr body", () => {
      expect(validate("VAT", "SE556677889001")).toBe(false);
    });

    it("rejects malformed input", () => {
      expect(validate("VAT", "")).toBe(false);
      expect(validate("VAT", "SE556677889")).toBe(false);
      expect(validate("VAT", "FR556677889901")).toBe(false);
      expect(validate("VAT", "556677889901")).toBe(false);
    });

    it("accepts the SE_VAT fully-qualified code", () => {
      expect(validate("SE_VAT", "SE556677889901")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("VAT", "se 556677 8899 01");
      expect(r).toEqual({
        ok: true,
        code: "SE_VAT",
        normalized: "SE556677889901",
        formatted: "SE556677889901",
        confidence: "high",
      });
    });

    it("returns kind=too_short on short input", () => {
      const r = parse("VAT", "SE12");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=invalid_checksum when sequence is wrong", () => {
      const r = parse("VAT", "SE556677889902");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});
