import { describe, expect, it } from "vitest";
import { format, normalize, parse, validate } from "../../src/countries/uy/index.ts";

describe("UY — CI", () => {
  describe("validate", () => {
    it("accepts valid synthetic CIs (raw form)", () => {
      // DV computed via DNIC mod-10 weights [2,9,8,7,6,3,4]
      expect(validate("CI", "12345672")).toBe(true);
      expect(validate("CI", "40985731")).toBe(true);
      expect(validate("CI", "45678905")).toBe(true);
      expect(validate("CI", "10000008")).toBe(true);
      expect(validate("CI", "55555555")).toBe(true);
      expect(validate("CI", "35009005")).toBe(true);
      expect(validate("CI", "98765438")).toBe(true);
    });

    it("accepts the formatted form `0.000.000-0`", () => {
      expect(validate("CI", "1.234.567-2")).toBe(true);
      expect(validate("CI", "4.098.573-1")).toBe(true);
      expect(validate("CI", "9.876.543-8")).toBe(true);
    });

    it("accepts UY_CI fully-qualified code", () => {
      expect(validate("UY_CI", "12345672")).toBe(true);
    });

    it("rejects single-digit mutations that change the DV", () => {
      // For each position, mutate by a delta that cannot collide with the
      // original DV under mod-10 arithmetic. With weights [2,9,8,7,6,3,4]
      // (or weight 1 for the DV position itself), a delta of ±1 always
      // shifts the expected DV by a non-zero amount mod 10 — except on
      // weight 9 (10≡0), which doesn't appear at the DV position. So we
      // pick delta=1 and assert that the resulting CI fails validation.
      const base = "12345672";
      for (let pos = 0; pos < 8; pos++) {
        const orig = base.charCodeAt(pos) - 48;
        const alt = (orig + 1) % 10;
        const mutated = base.slice(0, pos) + String(alt) + base.slice(pos + 1);
        // pos=1 has weight 9; delta=1 → expected DV shifts by 9 mod 10 = 9,
        // so cannot collide. Other positions weights are coprime-ish with 10
        // for delta=1; verified manually.
        expect(validate("CI", mutated)).toBe(false);
      }
    });

    it("rejects all-digit-but-wrong DV", () => {
      // Base 40985731 has DV=1; flipping DV to anything else breaks it.
      for (let alt = 0; alt < 10; alt++) {
        if (alt === 1) continue;
        expect(validate("CI", `4098573${alt}`)).toBe(false);
      }
    });

    it("rejects malformed input", () => {
      expect(validate("CI", "")).toBe(false);
      expect(validate("CI", "1234")).toBe(false);
      expect(validate("CI", "123456789")).toBe(false); // 9 digits
      expect(validate("CI", "abcdefgh")).toBe(false);
      expect(validate("CI", "1.234.567")).toBe(false); // missing DV
    });
  });

  describe("format", () => {
    it("inserts dots and DV hyphen", () => {
      expect(format("CI", "12345672")).toBe("1.234.567-2");
      expect(format("CI", "1.234.567-2")).toBe("1.234.567-2");
      expect(format("CI", "1 234 567 2")).toBe("1.234.567-2");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("CI", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips dots, hyphens, spaces", () => {
      expect(normalize("CI", "1.234.567-2")).toBe("12345672");
      expect(normalize("CI", "1 234 567 2")).toBe("12345672");
    });

    it("is idempotent", () => {
      const once = normalize("CI", "1.234.567-2");
      expect(normalize("CI", once)).toBe(once);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("CI", "1.234.567-2");
      expect(r).toEqual({
        ok: true,
        code: "UY_CI",
        normalized: "12345672",
        formatted: "1.234.567-2",
        confidence: "high",
      });
    });

    it("returns kind=empty on empty", () => {
      const r = parse("CI", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for short", () => {
      const r = parse("CI", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for long", () => {
      const r = parse("CI", "123456789");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_checksum for wrong DV", () => {
      const r = parse("CI", "12345670");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("UY — RUT", () => {
  describe("validate", () => {
    it("accepts valid synthetic RUTs (raw 12-digit form)", () => {
      // mod-11 weights [4,3,2,9,8,7,6,5,4,3,2] right-to-left over body
      expect(validate("RUT", "211234567001")).toBe(true);
      expect(validate("RUT", "210000010006")).toBe(true);
      expect(validate("RUT", "219876543004")).toBe(true);
      expect(validate("RUT", "120000000003")).toBe(true);
      expect(validate("RUT", "135000000002")).toBe(true);
    });

    it("accepts the formatted form `00-000000-000-0`", () => {
      expect(validate("RUT", "21-123456-700-1")).toBe(true);
      expect(validate("RUT", "21-987654-300-4")).toBe(true);
    });

    it("accepts UY_RUT fully-qualified code", () => {
      expect(validate("UY_RUT", "211234567001")).toBe(true);
    });

    it("rejects DV mutations of a valid RUT", () => {
      // 211234567001 has DV=1; alter to 0..9 except 1
      for (let alt = 0; alt < 10; alt++) {
        if (alt === 1) continue;
        expect(validate("RUT", `21123456700${alt}`)).toBe(false);
      }
    });

    it("rejects body-position mutations that change the DV", () => {
      // Body of 211234567001 is 21123456700. We try a mutation per position
      // and require that the resulting DV is no longer 1. Some weight*delta
      // combinations preserve the DV mod 11; pick an alt that breaks it.
      // We pick alt = (orig + 2) % 10, which gives delta=2 (or -8). For our
      // weight set [4,3,2,9,8,7,6,5,4,3,2] applied right-to-left, no body
      // position*delta lands on a multiple of 11 — verified empirically.
      const base = "211234567001";
      for (let pos = 0; pos < 11; pos++) {
        const orig = base.charCodeAt(pos) - 48;
        const alt = (orig + 2) % 10;
        const mutated = base.slice(0, pos) + String(alt) + base.slice(pos + 1);
        expect(validate("RUT", mutated)).toBe(false);
      }
    });

    it("accepts all-zeros as algorithmically valid (DGI rejects administratively)", () => {
      // Body all zeros: sum = 0 → r=0 → DV=0. The spec validates the
      // checksum only; real-world DGI rejects prefix `00` as not a valid
      // departamento code, but that catalog check is out of scope.
      expect(validate("RUT", "000000000000")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("RUT", "")).toBe(false);
      expect(validate("RUT", "1234")).toBe(false);
      expect(validate("RUT", "12345678901")).toBe(false); // 11 digits
      expect(validate("RUT", "1234567890123")).toBe(false); // 13 digits
      expect(validate("RUT", "abcabcabcabc")).toBe(false);
    });
  });

  describe("format", () => {
    it("inserts hyphens at canonical positions", () => {
      expect(format("RUT", "211234567001")).toBe("21-123456-700-1");
      expect(format("RUT", "21-123456-700-1")).toBe("21-123456-700-1");
    });

    it("returns input unchanged for invalid length", () => {
      expect(format("RUT", "1234")).toBe("1234");
    });
  });

  describe("normalize", () => {
    it("strips separators", () => {
      expect(normalize("RUT", "21-123456-700-1")).toBe("211234567001");
    });

    it("is idempotent", () => {
      const once = normalize("RUT", "211234567001");
      expect(normalize("RUT", once)).toBe(once);
    });
  });

  describe("parse", () => {
    it("returns ok with normalized + formatted on success", () => {
      const r = parse("RUT", "21-123456-700-1");
      expect(r).toEqual({
        ok: true,
        code: "UY_RUT",
        normalized: "211234567001",
        formatted: "21-123456-700-1",
        confidence: "moderate",
      });
    });

    it("returns kind=empty on empty", () => {
      const r = parse("RUT", "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("empty");
    });

    it("returns kind=too_short for short", () => {
      const r = parse("RUT", "1234");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for long", () => {
      const r = parse("RUT", "1234567890123");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });

    it("returns kind=invalid_checksum for wrong DV", () => {
      const r = parse("RUT", "211234567000");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
    });
  });
});

describe("UY — Pasaporte (UY_PASAPORTE)", () => {
  describe("validate", () => {
    it("accepts valid passport numbers (1 letter + 6 digits)", () => {
      expect(validate("PASAPORTE", "B123456")).toBe(true);
      expect(validate("PASAPORTE", "A000001")).toBe(true);
      expect(validate("PASAPORTE", "Z999999")).toBe(true);
      expect(validate("PASAPORTE", "C123456")).toBe(true);
      expect(validate("PASAPORTE", " B123456 ")).toBe(true);
    });

    it("rejects malformed input", () => {
      expect(validate("PASAPORTE", "")).toBe(false);
      expect(validate("PASAPORTE", "1234567")).toBe(false); // 7 digits no letter
      expect(validate("PASAPORTE", "B12345")).toBe(false); // too short
      expect(validate("PASAPORTE", "B1234567")).toBe(false); // too long
      expect(validate("PASAPORTE", "AB12345")).toBe(false); // 2 letters
    });

    it("normalizes lowercase to uppercase", () => {
      expect(validate("PASAPORTE", "b123456")).toBe(true);
    });

    it("accepts the UY_PASAPORTE fully-qualified code", () => {
      expect(validate("UY_PASAPORTE", "B123456")).toBe(true);
    });
  });

  describe("parse", () => {
    it("returns ok on success", () => {
      const r = parse("PASAPORTE", "b123456");
      expect(r).toEqual({
        ok: true,
        code: "UY_PASAPORTE",
        normalized: "B123456",
        formatted: "B123456",
        confidence: "low",
      });
    });

    it("returns kind=too_short for shorter input", () => {
      const r = parse("PASAPORTE", "B12345");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_short");
    });

    it("returns kind=too_long for longer input", () => {
      const r = parse("PASAPORTE", "B1234567");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason.kind).toBe("too_long");
    });
  });
});
