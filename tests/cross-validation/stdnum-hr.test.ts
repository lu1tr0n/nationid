/**
 * Cross-validation: nationid vs `python-stdnum.stdnum.hr.oib` (oracle).
 *
 * Coverage: HR_OIB — 40 algorithmically-valid + 40 invalid synthetic
 * vectors. Both implementations use ISO/IEC 7064 MOD 11,10 over the first
 * 10 body digits with the 11th digit as the check.
 *
 * Vectors are bare 11-digit strings. nationid's `validate("HR_OIB", body)`
 * normalises the input by prepending `HR` when the input is exactly 11
 * digits; `stdnum.hr.oib.is_valid` accepts the same bare form. The two
 * libraries agree on the algorithm; the cross-check confirms parity on the
 * exact ISO 7064 implementation (length-generic primitive in
 * `src/algorithms/iso7064.ts`).
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import { generateInvalidOibs, generateValidOibs } from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.hr.oib"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;

const VALID = generateValidOibs(VECTOR_COUNT);
const INVALID = generateInvalidOibs(VECTOR_COUNT);

const ORACLE_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.hr.oib", "is_valid", VALID)
  : new Map<string, boolean>();
const ORACLE_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.hr.oib", "is_valid", INVALID)
  : new Map<string, boolean>();

describeOrSkip(
  `HR cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("HR_OIB — agreement on valid vectors", () => {
      it.each(VALID)("both accept %s", (input) => {
        expect(validate("HR_OIB", input)).toBe(true);
        expect(ORACLE_VALID.get(input)).toBe(true);
      });
    });

    describe("HR_OIB — agreement on invalid vectors", () => {
      it.each(INVALID)("both reject %s", (input) => {
        expect(validate("HR_OIB", input)).toBe(false);
        expect(ORACLE_INVALID.get(input)).toBe(false);
      });
    });
  },
);
