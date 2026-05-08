/**
 * Property tests for `format()` round-trip stability.
 *
 * Covered invariants:
 *   - P5: `format(format(x)) === format(x)` for any `x` where `validate(x)`.
 *     The display form must be a fixed point of the formatter — once a string
 *     is in canonical display form, re-formatting must be a no-op. Otherwise
 *     callers that build UIs using `format` (e.g. a controlled input that
 *     formats on every keystroke) would oscillate.
 *
 * Run against every `DocumentTypeCode` registered at runtime.
 */

import * as fc from "fast-check";
import { describe, it } from "vitest";

import { getSpec, listSupportedCodes } from "../../src/index.ts";

import { arbitraryValid, PROPERTY_NUM_RUNS, PROPERTY_TEST_SEED } from "./_arbitraries.ts";

describe("property — P5 format is stable on its own output", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: format(format(x)) === format(x) for valid x`, () => {
      const spec = getSpec(code);
      fc.assert(
        fc.property(arbitraryValid(code), (x) => {
          const once = spec.format(x);
          const twice = spec.format(once);
          return twice === once;
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});
