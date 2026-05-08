/**
 * Cross-validation: nationid vs `python-stdnum.stdnum.co.nit` (oracle).
 *
 * Coverage: CO_NIT — 40 algorithmically-valid + 40 invalid synthetic
 * vectors. Restricted to nationid's accepted shape (10 or 11 digits with
 * leading non-zero) so the comparison is on algorithm, not range. Both
 * implementations use the DIAN mod-11 with weights `3, 7, 13, 17, 19, 23,
 * 29, 37, 41, 43` applied right-to-left over the body.
 *
 * Note: nationid additionally rejects all-same-digit bodies as
 * placeholders; the generator avoids them.
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import { generateInvalidCoNits, generateValidCoNits } from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.co.nit"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;

const VALID = generateValidCoNits(VECTOR_COUNT);
const INVALID = generateInvalidCoNits(VECTOR_COUNT);

const ORACLE_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.co.nit", "is_valid", VALID)
  : new Map<string, boolean>();
const ORACLE_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.co.nit", "is_valid", INVALID)
  : new Map<string, boolean>();

describeOrSkip(
  `CO cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("CO_NIT — agreement on valid vectors", () => {
      it.each(VALID)("both accept %s", (input) => {
        expect(validate("CO_NIT", input)).toBe(true);
        expect(ORACLE_VALID.get(input)).toBe(true);
      });
    });

    describe("CO_NIT — agreement on invalid vectors", () => {
      it.each(INVALID)("both reject %s", (input) => {
        expect(validate("CO_NIT", input)).toBe(false);
        expect(ORACLE_INVALID.get(input)).toBe(false);
      });
    });
  },
);
