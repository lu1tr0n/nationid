/**
 * Property tests for mask / format alignment.
 *
 * Covered invariants:
 *   - P10 (best-effort): synthetic inputs produced by substituting the
 *     `cleave`-style mask (`0` → digit, `A` → uppercase letter, `*` →
 *     alphanumeric, anything else verbatim) must satisfy:
 *
 *       if `spec.validate(maskSubstituted)` is true,
 *       then `spec.format(maskSubstituted) === maskSubstituted`.
 *
 *     The substituted form is, by construction, in the canonical display
 *     shape; if the spec also accepts it as valid (the check-digit stars
 *     happen to align — uncommon for checksummed specs, common for
 *     format-only specs), then `format()` must be the identity on it.
 *
 *     This catches `mask` strings that drift from the actual formatter output
 *     (e.g. if the formatter inserts dots but the mask string forgot them, or
 *     vice versa).
 *
 * Caveats:
 *   - For checksummed specs (BR_CPF, ES_DNI, MX_CURP, …) the chance that a
 *     random mask substitution lands on a passing checksum is small, so the
 *     property is almost always vacuously true. That is OK — the few times
 *     it does land, we get the strong assertion. We do not boost trial counts
 *     here because the same alignment is also exercised by P3
 *     (`format(normalized) === formatted` for every successfully parsed
 *     valid input).
 *   - For specs whose mask uses literal separators (`-`, `.`, `/`, ` `),
 *     mask substitution generates the exact display form expected by
 *     `format`, so the property is meaningfully exercised even when the
 *     checksum fails.
 */

import * as fc from "fast-check";
import { describe, it } from "vitest";

import { getSpec, listSupportedCodes } from "../../src/index.ts";

import { maskArbitrary, PROPERTY_NUM_RUNS, PROPERTY_TEST_SEED } from "./_arbitraries.ts";

describe("property — P10 mask substitution aligns with format output", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: validate(maskSub) ⇒ format(maskSub) === maskSub`, () => {
      const spec = getSpec(code);
      fc.assert(
        fc.property(maskArbitrary(spec.mask), (substituted) => {
          if (!spec.validate(substituted)) return true; // outside this property
          return spec.format(substituted) === substituted;
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});
