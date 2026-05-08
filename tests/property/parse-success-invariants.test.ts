/**
 * Property tests for the success branch of `parse()`.
 *
 * Covered invariants:
 *   - P3: when `parse(x).ok` is `true`, every public surface invariant must
 *     hold for the returned `ParseResult`:
 *       (a) `result.normalized === spec.normalize(x)`
 *       (b) `result.code === spec.code`
 *       (c) `result.confidence === spec.confidence`
 *       (d) `spec.validate(result.normalized) === true`
 *       (e) `spec.validate(result.formatted) === true`
 *       (f) `spec.format(result.normalized) === result.formatted`
 *
 *   - P5 (subset): `format(format(x)) === format(x)` for valid `x` is asserted
 *     in `format-stability.test.ts` — kept here only as `(f)` because a
 *     successful parse pins down the canonical format string.
 *
 * Inputs are pulled from the per-code `arbitraryValid` generator — that is the
 * only way to materialise enough `parse(x).ok === true` paths to exercise
 * these invariants meaningfully.
 */

import * as fc from "fast-check";
import { describe, it } from "vitest";

import { getSpec, listSupportedCodes } from "../../src/index.ts";

import { arbitraryValid, PROPERTY_NUM_RUNS, PROPERTY_TEST_SEED } from "./_arbitraries.ts";

describe("property — P3 successful parse implies internal consistency", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: parse(x).ok ⇒ every contracted invariant holds`, () => {
      const spec = getSpec(code);
      fc.assert(
        fc.property(arbitraryValid(code), (x) => {
          const r = spec.parse(x);
          if (!r.ok) {
            // Generator promised valid input but parse rejected — that is a
            // distinct (and far more serious) bug than any P3 violation.
            // Surface it as a property failure so fast-check shrinks the
            // counter-example.
            return false;
          }
          if (r.code !== spec.code) return false;
          if (r.confidence !== spec.confidence) return false;
          if (r.normalized !== spec.normalize(x)) return false;
          if (!spec.validate(r.normalized)) return false;
          if (!spec.validate(r.formatted)) return false;
          if (spec.format(r.normalized) !== r.formatted) return false;
          return true;
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});
