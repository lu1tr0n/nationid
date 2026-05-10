/**
 * Tests for `lastN()` — last N chars of the canonical normalized form.
 */

import { describe, expect, it } from "vitest";
import { lastN } from "../../src/pii/index.ts";

describe("pii.lastN", () => {
  it("returns last 4 chars by default", () => {
    expect(lastN("BR_CPF", "529.982.247-25")).toBe("4725");
  });

  it("normalizes input before slicing (separators stripped, uppercased)", () => {
    expect(lastN("BR_CNPJ", "12.345.678/0001-90")).toBe("0190");
    expect(lastN("BR_CNPJ", "12345678000190")).toBe("0190");
  });

  it("respects a custom n", () => {
    expect(lastN("BR_CPF", "529.982.247-25", 2)).toBe("25");
    // normalized CPF "52998224725"; last 6 chars = "224725".
    expect(lastN("BR_CPF", "529.982.247-25", 6)).toBe("224725");
  });

  it("returns full normalized form when n exceeds length", () => {
    expect(lastN("SV_DUI", "01234567-8", 50)).toBe("012345678");
  });

  it("returns empty string when n is 0 or negative", () => {
    expect(lastN("BR_CPF", "529.982.247-25", 0)).toBe("");
    expect(lastN("BR_CPF", "529.982.247-25", -3)).toBe("");
  });

  it("works on alphanumeric specs (CURP)", () => {
    expect(lastN("MX_CURP", "GOMC850315HDFRRR07")).toBe("RR07");
    expect(lastN("MX_CURP", "GOMC850315HDFRRR07", 2)).toBe("07");
  });

  it("uppercases ES_DNI check letter when normalizing", () => {
    expect(lastN("ES_DNI", "12345678z", 1)).toBe("Z");
  });
});
