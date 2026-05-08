/**
 * Property tests for `normalize()`.
 *
 * Covered invariants:
 *   - P1: `normalize(normalize(x)) === normalize(x)` for any input — idempotency.
 *   - P6: `normalize(format(x)) === normalize(x)` when `validate(x)` — round-trip
 *         through display form must not change the canonical storage form.
 *
 * Both properties run against every `DocumentTypeCode` listed at runtime, so
 * adding a country requires no edits here.
 */

import * as fc from "fast-check";
import { describe, it } from "vitest";

import { getSpec, listSupportedCodes } from "../../src/index.ts";

import {
  arbitraryInput,
  arbitraryValid,
  PROPERTY_NUM_RUNS,
  PROPERTY_TEST_SEED,
} from "./_arbitraries.ts";

describe("property — P1 normalize is idempotent (every spec, any string)", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: normalize(normalize(x)) === normalize(x)`, () => {
      const spec = getSpec(code);
      fc.assert(
        fc.property(arbitraryInput, (x) => {
          const once = spec.normalize(x);
          const twice = spec.normalize(once);
          return twice === once;
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});

describe("property — P6 normalize on already-formatted input is a no-op", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: normalize(format(x)) === normalize(x) for valid x`, () => {
      const spec = getSpec(code);
      fc.assert(
        fc.property(arbitraryValid(code), (x) => {
          const formatted = spec.format(x);
          return spec.normalize(formatted) === spec.normalize(x);
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});
