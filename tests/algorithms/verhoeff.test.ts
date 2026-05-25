/**
 * Direct tests for the Verhoeff D₅ primitive.
 *
 * Country specs (IN_AADHAAR, IN_VID) exercise this transitively, but a
 * refactor of `src/algorithms/verhoeff.ts` could regress without breaking
 * country tests if a country happened to also have a hand-rolled parallel
 * check. These direct tests anchor the primitive to its public contract.
 *
 * Canonical vectors:
 *  - Aadhaar synthetic anchor `234123412346` (also used by python-stdnum
 *    `stdnum.in_.aadhaar` doctests).
 *  - VID synthetic anchor `1234567890123455`.
 *  - Round-trip invariant: `verhoeffValid(base + verhoeffCheckDigit(base))`
 *    holds for all-zero, repunit, and random bases.
 */

import { describe, expect, it } from "vitest";
import { verhoeffCheckDigit, verhoeffValid } from "../../src/algorithms/verhoeff.ts";

describe("verhoeffValid", () => {
  it("validates the canonical Aadhaar anchor", () => {
    expect(verhoeffValid("234123412346")).toBe(true);
  });

  it("validates the canonical VID anchor", () => {
    expect(verhoeffValid("1234567890123455")).toBe(true);
  });

  it("rejects checksum-flipped strings", () => {
    expect(verhoeffValid("234123412347")).toBe(false);
    expect(verhoeffValid("1234567890123456")).toBe(false);
  });

  it("throws on non-digit input (caller is responsible for stripping)", () => {
    expect(() => verhoeffValid("abc")).toThrow();
    expect(() => verhoeffValid("23412341234A")).toThrow();
    expect(() => verhoeffValid("234 123 412 346")).toThrow(); // separators are caller's job
  });

  it("treats empty input as 'no digits to check' → true (caller must guard length)", () => {
    // The primitive returns true on "" because no iterations run and the
    // initial state `c = 0` equals the success condition. Country specs
    // gate on regex length before calling, so this never surfaces in
    // production. Documenting the contract here.
    expect(verhoeffValid("")).toBe(true);
  });
});

describe("verhoeffCheckDigit", () => {
  it("computes the digit that closes any base under Verhoeff", () => {
    expect(verhoeffCheckDigit("23412341234")).toBe(6); // Aadhaar anchor base
    expect(verhoeffCheckDigit("123456789012345")).toBe(5); // VID anchor base
  });

  it("round-trips: verhoeffValid(base + verhoeffCheckDigit(base)) is true", () => {
    const bases = [
      "00000000000",
      "99999999999",
      "11111111111",
      "12345678901",
      "98765432109",
      "0000000000000000",
      "9999999999999999",
      "1234567890123456",
    ];
    for (const base of bases) {
      const closed = base + String(verhoeffCheckDigit(base));
      expect(verhoeffValid(closed)).toBe(true);
    }
  });

  it("detects every single-digit substitution in a closed Aadhaar", () => {
    const base = "23412341234";
    const closed = base + String(verhoeffCheckDigit(base));
    expect(verhoeffValid(closed)).toBe(true);

    // Flip each digit in turn and expect rejection
    for (let i = 0; i < closed.length; i++) {
      const original = closed[i] as string;
      for (let d = 0; d < 10; d++) {
        if (String(d) === original) continue;
        const mutated = closed.slice(0, i) + String(d) + closed.slice(i + 1);
        expect(
          verhoeffValid(mutated),
          `expected rejection for ${mutated} (pos ${i}: ${original}→${d})`,
        ).toBe(false);
      }
    }
  });

  it("detects every adjacent-digit transposition in a closed Aadhaar", () => {
    const base = "23412341234";
    const closed = base + String(verhoeffCheckDigit(base));

    for (let i = 0; i < closed.length - 1; i++) {
      const a = closed[i] as string;
      const b = closed[i + 1] as string;
      if (a === b) continue; // swap of equal digits is a no-op
      const mutated = closed.slice(0, i) + b + a + closed.slice(i + 2);
      expect(
        verhoeffValid(mutated),
        `expected rejection for ${mutated} (transposed pos ${i}↔${i + 1})`,
      ).toBe(false);
    }
  });
});
