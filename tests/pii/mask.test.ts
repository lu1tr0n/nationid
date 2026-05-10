/**
 * Tests for `mask()` — UI-safe display masking for identity documents.
 *
 * Coverage strategy:
 *   - One representative case per country/spec confirming separator
 *     preservation and tail-reveal length.
 *   - Edge cases (empty, whitespace, unformatted input, unknown code).
 *   - Internal helper round-trip via the public surface.
 */

import { describe, expect, it } from "vitest";
import { listSupportedCodes } from "../../src/index.ts";
import { mask } from "../../src/pii/index.ts";
import { applyMaskWithReveal, computeRevealCount, countPlaceholders } from "../../src/pii/mask.ts";

describe("pii.mask — concrete cases", () => {
  // 18 placeholders, no separators → reveal 4
  it("MX_CURP — 14 stars + last 4 chars", () => {
    expect(mask("MX_CURP", "GOMC850315HDFRRR07")).toBe("**************RR07");
  });

  // 11 placeholders with separators → reveal 3 (floor(11/3))
  it("BR_CPF — preserves dots and dash, reveals last 3 digits", () => {
    expect(mask("BR_CPF", "12345678901")).toBe("***.***.**9-01");
  });

  it("BR_CPF — accepts pre-formatted input", () => {
    expect(mask("BR_CPF", "123.456.789-01")).toBe("***.***.**9-01");
  });

  // 14 placeholders → reveal 4
  it("BR_CNPJ — preserves all separators, reveals last 4 digits", () => {
    expect(mask("BR_CNPJ", "12345678000190")).toBe("**.***.***/**01-90");
  });

  // 9 placeholders → reveal 3
  it("SV_DUI — preserves dash, reveals last 3 digits", () => {
    expect(mask("SV_DUI", "012345678")).toBe("******67-8");
  });

  it("SV_DUI — accepts formatted input", () => {
    expect(mask("SV_DUI", "01234567-8")).toBe("******67-8");
  });

  // 11 placeholders → reveal 3
  it("AR_CUIT — preserves both dashes", () => {
    expect(mask("AR_CUIT", "20123456786")).toBe("**-******78-6");
  });

  // 9 placeholders (8 digits + 1 letter) → reveal 3
  it("ES_DNI — last 3 chars revealed including the check letter", () => {
    expect(mask("ES_DNI", "12345678Z")).toBe("******78Z");
  });

  // 9 placeholders → reveal 3
  it("US_SSN — preserves both dashes, reveals last 3 digits", () => {
    expect(mask("US_SSN", "123456789")).toBe("***-**-*789");
  });

  it("CL_RUT — masks dot/dash separators correctly", () => {
    // mask is "00.000.000-A" (8 digits + 1 alphanum check), 9 placeholders → reveal 3
    expect(mask("CL_RUT", "12345678-5")).toBe("**.***.*78-5");
  });

  it("MX_RFC_PF — alphanumeric placeholders work like digit placeholders", () => {
    // mask "AAAA000000***" — 13 placeholders → reveal 4
    // For input HEGA800101AB1: last 4 chars are "1AB1"
    expect(mask("MX_RFC_PF", "HEGA800101AB1")).toBe("*********1AB1");
  });

  it("CO_CC — 10-digit national ID with thousands-style dot separators", () => {
    // mask "0.000.000.000" — 10 placeholders, 3 dots → reveal 3
    expect(mask("CO_CC", "1234567890")).toBe("*.***.***.890");
  });
});

describe("pii.mask — edge cases", () => {
  it("returns *** for empty string", () => {
    expect(mask("BR_CPF", "")).toBe("***");
  });

  it("returns *** for whitespace-only input", () => {
    expect(mask("BR_CPF", "   ")).toBe("***");
  });

  it("returns *** when normalization yields empty (only separators)", () => {
    expect(mask("BR_CPF", "...---")).toBe("***");
  });

  it("never reveals more than 4 chars even on long inputs", () => {
    // CURP is 18 chars, reveal stays at 4.
    const out = mask("MX_CURP", "GOMC850315HDFRRR07");
    const stars = (out.match(/\*/g) ?? []).length;
    expect(stars).toBe(14);
  });

  it("returns input unchanged for an unknown code (soft fallback)", () => {
    // @ts-expect-error — intentionally outside the union to test runtime guard
    expect(mask("XX_UNKNOWN", "12345")).toBe("12345");
  });

  it("masks every registered spec without throwing", () => {
    for (const code of listSupportedCodes()) {
      // Synthesize a deterministic input matching the mask shape.
      // Doesn't have to validate; mask() is a pure transform.
      const sample = code.includes("CURP")
        ? "GOMC850315HDFRRR07"
        : code.includes("RFC")
          ? "HEGA800101AB1"
          : "1".repeat(20);
      expect(() => mask(code, sample), `mask(${code}) threw`).not.toThrow();
    }
  });
});

describe("pii.mask — separator integrity", () => {
  it("output keeps separator chars at exact same positions as the spec mask", () => {
    const cnpj = mask("BR_CNPJ", "12345678000190");
    expect(cnpj.charAt(2)).toBe(".");
    expect(cnpj.charAt(6)).toBe(".");
    expect(cnpj.charAt(10)).toBe("/");
    expect(cnpj.charAt(15)).toBe("-");
  });

  it("output keeps the same total length as the spec mask", () => {
    // 14-char mask "00.000.000/0000-00" → 18 chars including separators.
    expect(mask("BR_CNPJ", "12345678000190").length).toBe("00.000.000/0000-00".length);
  });
});

describe("pii.mask — internal helpers", () => {
  it("computeRevealCount follows min(4, floor(n/3))", () => {
    expect(computeRevealCount(0)).toBe(0);
    expect(computeRevealCount(2)).toBe(0);
    expect(computeRevealCount(8)).toBe(2);
    expect(computeRevealCount(9)).toBe(3);
    expect(computeRevealCount(11)).toBe(3);
    expect(computeRevealCount(12)).toBe(4);
    expect(computeRevealCount(18)).toBe(4);
    expect(computeRevealCount(99)).toBe(4);
  });

  it("countPlaceholders ignores separators", () => {
    expect(countPlaceholders("000.000.000-00")).toBe(11);
    expect(countPlaceholders("00.000.000/0000-00")).toBe(14);
    expect(countPlaceholders("AAAAAAAAAAAAAAAAAA")).toBe(18);
    expect(countPlaceholders("AAAA000000***")).toBe(13);
  });

  it("applyMaskWithReveal handles missing trailing chars defensively", () => {
    // Mask expects 11 placeholders, normalized only has 5 → tail → "*"
    expect(applyMaskWithReveal("000.000.000-00", "12345", 3)).toBe("***.***.***-**");
  });

  it("applyMaskWithReveal returns mask unchanged when no placeholders", () => {
    expect(applyMaskWithReveal("---", "12345", 3)).toBe("---");
  });

  it("applyMaskWithReveal clamps reveal count to placeholder count", () => {
    expect(applyMaskWithReveal("0000", "1234", 99)).toBe("1234");
  });

  it("applyMaskWithReveal handles negative reveal as zero", () => {
    expect(applyMaskWithReveal("0000", "1234", -3)).toBe("****");
  });
});
