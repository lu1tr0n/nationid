/**
 * Cross-validation: nationid vs `python-stdnum.stdnum.gt.nit`.
 *
 * Coverage: GT_NIT — 40 algorithmically-valid + 40 invalid synthetic
 * vectors. Both implementations apply the SAT-published mod-11 algorithm
 * with weights starting at 2 from the rightmost body digit and emit `K`
 * for residue 10. nationid's source comments cite python-stdnum as the
 * algorithm reference.
 *
 * Constraints:
 *   - python-stdnum strips leading zeros via `lstrip('0')` in `compact()`.
 *     nationid does not, but a leading zero contributes 0 to the weighted
 *     sum, so the DV is the same. The generator avoids leading zeros
 *     anyway to keep both libs measuring the same body length.
 *   - python-stdnum requires `len >= 2` after compact (body + DV).
 *     nationid accepts 1-12 body digits + DV. Generator uses 4-8 body
 *     digits, well within both libs' acceptance.
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import { generateInvalidGtNits, generateValidGtNits } from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.gt.nit"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;

const VALID = generateValidGtNits(VECTOR_COUNT);
const INVALID = generateInvalidGtNits(VECTOR_COUNT);

const ORACLE_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.gt.nit", "is_valid", VALID)
  : new Map<string, boolean>();
const ORACLE_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.gt.nit", "is_valid", INVALID)
  : new Map<string, boolean>();

describeOrSkip(
  `GT cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("GT_NIT — agreement on valid vectors", () => {
      it.each(VALID)("both accept %s", (input) => {
        expect(validate("GT_NIT", input)).toBe(true);
        expect(ORACLE_VALID.get(input)).toBe(true);
      });
    });

    describe("GT_NIT — agreement on invalid vectors", () => {
      it.each(INVALID)("both reject %s", (input) => {
        expect(validate("GT_NIT", input)).toBe(false);
        expect(ORACLE_INVALID.get(input)).toBe(false);
      });
    });
  },
);
