import { describe, expect, it } from "vitest";
import { luhnCheckDigit, luhnValid } from "../../src/algorithms/luhn.ts";

describe("luhnValid", () => {
  it("validates known credit-card test numbers", () => {
    expect(luhnValid("79927398713")).toBe(true);
    expect(luhnValid("4532015112830366")).toBe(true);
    expect(luhnValid("6011514433546201")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(luhnValid("")).toBe(false);
    expect(luhnValid("abc")).toBe(false);
    expect(luhnValid("123 456")).toBe(false);
  });

  it("rejects numbers with bad check digit", () => {
    expect(luhnValid("79927398710")).toBe(false);
    expect(luhnValid("4532015112830367")).toBe(false);
  });
});

describe("luhnCheckDigit", () => {
  it("computes the digit that makes the body Luhn-valid", () => {
    expect(luhnCheckDigit("7992739871")).toBe(3);
    expect(luhnCheckDigit("453201511283036")).toBe(6);
  });

  it("throws on non-digit input", () => {
    expect(() => luhnCheckDigit("abc")).toThrow();
  });
});
