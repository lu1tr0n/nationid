/**
 * Property tests asserting `parse()` and `validate()` agree on every input.
 *
 * Covered invariants:
 *   - P2: `parse(x).ok === validate(x)` for any string `x`.
 *   - P4: when `parse(x).ok === false`, the typed `reason.kind` is one of
 *     `empty | too_short | too_long | invalid_format | invalid_checksum`.
 *     Enforced through an exhaustive switch with a `never` default — a
 *     compile-time guarantee that catching `ParseError` is exhaustive in
 *     downstream consumers.
 *   - P8: when `validate(x) === false`, then `parse(x).ok === false` (logical
 *     contrapositive of P2 — kept as an explicit assertion for clarity).
 *
 * All three run for every `DocumentTypeCode` registered at runtime.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { ParseError } from "../../src/index.ts";
import { getSpec, listSupportedCodes } from "../../src/index.ts";

import { arbitraryInput, PROPERTY_NUM_RUNS, PROPERTY_TEST_SEED } from "./_arbitraries.ts";

/**
 * Exhaustive `ParseError.kind` enumeration check. The compiler will reject any
 * future `ParseError` variant added without a matching arm here.
 */
function isKnownErrorKind(reason: ParseError): true {
  switch (reason.kind) {
    case "empty":
    case "too_short":
    case "too_long":
    case "invalid_format":
    case "invalid_checksum":
      return true;
    default: {
      const exhaustive: never = reason;
      return exhaustive;
    }
  }
}

describe("property — P2 parse(x).ok === validate(x) (every spec, any string)", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: parse and validate agree`, () => {
      const spec = getSpec(code);
      fc.assert(
        fc.property(arbitraryInput, (x) => {
          return spec.parse(x).ok === spec.validate(x);
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});

describe("property — P4 parse failures expose a typed ParseError reason", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: parse(x).ok === false implies typed reason`, () => {
      const spec = getSpec(code);
      fc.assert(
        fc.property(arbitraryInput, (x) => {
          const r = spec.parse(x);
          if (r.ok) return true;
          return isKnownErrorKind(r.reason) === true;
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }

  it("is exhaustive at the type level (compiler check)", () => {
    // Compile-time only — `isKnownErrorKind` would not type-check if a new
    // ParseError variant were added without updating the switch above. The
    // runtime assertion exists purely to keep this test from being collected
    // as empty.
    expect(typeof isKnownErrorKind).toBe("function");
  });
});

describe("property — P8 !validate(x) implies !parse(x).ok (every spec)", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: invalid inputs are rejected by parse`, () => {
      const spec = getSpec(code);
      fc.assert(
        fc.property(arbitraryInput, (x) => {
          if (spec.validate(x)) return true; // outside this property's scope
          return spec.parse(x).ok === false;
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});
