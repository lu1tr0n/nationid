/**
 * Property tests for whitespace resilience.
 *
 * Covered invariants:
 *   - P7: inserting arbitrary whitespace (spaces, tabs, newlines) at any
 *     position of a valid input must NOT change validity. `normalize()` is
 *     contractually required to strip non-content characters, so the
 *     `validate` boolean must survive whitespace pollution unchanged.
 *
 * The companion property "whitespace insertion does not flip an invalid input
 * to valid" is too noisy to test as-is (a 30-character random string injected
 * with whitespace can still happen to expose a valid prefix), so we cover the
 * stronger and more useful direction.
 */

import * as fc from "fast-check";
import { describe, it } from "vitest";

import { getSpec, listSupportedCodes } from "../../src/index.ts";

import {
  arbitraryValid,
  PROPERTY_NUM_RUNS,
  PROPERTY_TEST_SEED,
  withRandomWhitespace,
} from "./_arbitraries.ts";

describe("property — P7 whitespace insertion preserves validity", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: validate stays true under arbitrary whitespace splicing`, () => {
      const spec = getSpec(code);
      fc.assert(
        fc.property(
          arbitraryValid(code).chain((valid) =>
            withRandomWhitespace(valid).map((s) => ({ valid, polluted: s })),
          ),
          ({ polluted }) => {
            return spec.validate(polluted) === true;
          },
        ),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});
