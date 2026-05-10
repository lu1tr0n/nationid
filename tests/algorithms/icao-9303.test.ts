import { describe, expect, it } from "vitest";
import {
  mrzCharValue,
  mrzCheckDigit,
  toMrzField9,
  validateMrzNumber,
} from "../../src/algorithms/icao-9303.ts";

describe("mrzCharValue", () => {
  it("maps digits to face value", () => {
    expect(mrzCharValue("0")).toBe(0);
    expect(mrzCharValue("5")).toBe(5);
    expect(mrzCharValue("9")).toBe(9);
  });

  it("maps uppercase letters to 10..35 (A=10, Z=35)", () => {
    expect(mrzCharValue("A")).toBe(10);
    expect(mrzCharValue("J")).toBe(19);
    expect(mrzCharValue("Z")).toBe(35);
  });

  it("maps the filler '<' to 0", () => {
    expect(mrzCharValue("<")).toBe(0);
  });

  it("rejects lowercase, multi-char and non-MRZ characters with -1", () => {
    expect(mrzCharValue("a")).toBe(-1);
    expect(mrzCharValue("AB")).toBe(-1);
    expect(mrzCharValue("")).toBe(-1);
    expect(mrzCharValue(" ")).toBe(-1);
    expect(mrzCharValue("-")).toBe(-1);
  });
});

describe("mrzCheckDigit", () => {
  it("computes the canonical ICAO 9303 specimen (L898902C<) → 3", () => {
    // ICAO 9303 Part 3 §4.9 worked example. Sum: 21*7 + 8*3 + 9*1 + 8*7
    // + 9*3 + 0*1 + 2*7 + 12*3 + 0*1 = 313; 313 mod 10 = 3.
    expect(mrzCheckDigit("L898902C<")).toBe(3);
  });

  it("computes D23145890 → 7", () => {
    // 13*7 + 2*3 + 3*1 + 1*7 + 4*3 + 5*1 + 8*7 + 9*3 + 0*1 = 207 → 7.
    expect(mrzCheckDigit("D23145890")).toBe(7);
  });

  it("computes 123456789 → 7", () => {
    // 1*7 + 2*3 + 3*1 + 4*7 + 5*3 + 6*1 + 7*7 + 8*3 + 9*1 = 147 → 7.
    expect(mrzCheckDigit("123456789")).toBe(7);
  });

  it("computes the visa MRV-A example XK9305487 → 5", () => {
    // 33*7 + 20*3 + 9*1 + 3*7 + 0*3 + 5*1 + 4*7 + 8*3 + 7*1 = 385 → 5.
    expect(mrzCheckDigit("XK9305487")).toBe(5);
  });

  it("treats '<' as zero in the weighted sum", () => {
    // Same as "AB123" with two '<' fillers contributing 0.
    expect(mrzCheckDigit("AB123<<")).toBe(mrzCheckDigit("AB123") % 10);
  });

  it("returns 0 for the empty string (vacuous sum)", () => {
    expect(mrzCheckDigit("")).toBe(0);
  });

  it("throws on invalid characters", () => {
    expect(() => mrzCheckDigit("abc")).toThrow(/ICAO_INVALID_CHAR/);
    expect(() => mrzCheckDigit("AB CD")).toThrow(/ICAO_INVALID_CHAR/);
    expect(() => mrzCheckDigit("ABC-1")).toThrow(/ICAO_INVALID_CHAR/);
  });
});

describe("validateMrzNumber", () => {
  it("accepts the canonical ICAO specimen with check digit 3", () => {
    expect(validateMrzNumber("L898902C<3")).toBe(true);
  });

  it("accepts the visa MRV-A example with check digit 5", () => {
    expect(validateMrzNumber("XK93054875")).toBe(true);
  });

  it("rejects mismatched check digits", () => {
    expect(validateMrzNumber("L898902C<0")).toBe(false);
    expect(validateMrzNumber("L898902C<9")).toBe(false);
  });

  it("rejects wrong-length inputs", () => {
    expect(validateMrzNumber("L898902C<")).toBe(false); // 9 chars
    expect(validateMrzNumber("L898902C<33")).toBe(false); // 11 chars
    expect(validateMrzNumber("")).toBe(false);
  });

  it("rejects non-MRZ characters in the body", () => {
    expect(validateMrzNumber("L898902c<3")).toBe(false); // lowercase
    expect(validateMrzNumber("L898902 <3")).toBe(false); // space
    expect(validateMrzNumber("L898902-<3")).toBe(false); // hyphen
  });

  it("rejects a non-digit check-digit position", () => {
    expect(validateMrzNumber("L898902C<A")).toBe(false);
    expect(validateMrzNumber("L898902C<<")).toBe(false);
  });
});

describe("toMrzField9", () => {
  it("right-pads short numbers with '<' to length 9", () => {
    expect(toMrzField9("ABC123")).toBe("ABC123<<<");
    expect(toMrzField9("L898902C")).toBe("L898902C<");
  });

  it("returns 9-char inputs unchanged (no padding)", () => {
    expect(toMrzField9("123456789")).toBe("123456789");
  });

  it("uppercases lowercase letters before padding", () => {
    expect(toMrzField9("abc123")).toBe("ABC123<<<");
  });

  it("returns the empty string padded to 9 fillers", () => {
    expect(toMrzField9("")).toBe("<<<<<<<<<");
  });

  it("throws on inputs longer than 9 characters", () => {
    expect(() => toMrzField9("0123456789")).toThrow(/ICAO_TOO_LONG/);
  });

  it("throws on non-MRZ characters", () => {
    expect(() => toMrzField9("ABC-123")).toThrow(/ICAO_INVALID_CHAR/);
    expect(() => toMrzField9("ABC 123")).toThrow(/ICAO_INVALID_CHAR/);
  });

  it("round-trips: padded form is computable by mrzCheckDigit", () => {
    const padded = toMrzField9("ABC123");
    expect(padded).toBe("ABC123<<<");
    // Sanity: result is a valid 9-char MRZ field.
    expect(padded.length).toBe(9);
    expect(() => mrzCheckDigit(padded)).not.toThrow();
    // And toMrzField9("L898902C") + computed CD should match the canonical
    // specimen value 3.
    expect(mrzCheckDigit(toMrzField9("L898902C"))).toBe(3);
  });
});
