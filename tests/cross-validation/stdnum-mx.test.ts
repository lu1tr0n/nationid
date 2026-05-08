/**
 * Cross-validation: nationid vs `python-stdnum` (out-of-process oracle).
 *
 * Coverage:
 *   - MX_CURP via `stdnum.mx.curp.is_valid`
 *   - MX_RFC_PF via `stdnum.mx.rfc.is_valid(..., validate_check_digits=True)`
 *   - MX_RFC_PM via `stdnum.mx.rfc.is_valid(..., validate_check_digits=True)`
 *
 * Algorithmic notes:
 *   - python-stdnum's MX_RFC defaults to `validate_check_digits=False`
 *     (because ~1.5% of real-world RFCs have invalid DVs); we explicitly
 *     enable check-digit validation for parity with nationid.
 *   - python-stdnum's MX_RFC additionally constrains the homoclave shape
 *     to `^[1-9A-V][1-9A-Z][0-9A]$`. Our generators produce homoclaves in
 *     this stricter shape so the comparison is on algorithm only.
 *   - python-stdnum's MX_CURP rejects palabras altisonantes in the first
 *     4 letters; nationid CURP does not. Our generator avoids those
 *     prefixes for the agreement test.
 *   - The CURP DV alphabet differs at index 24 (nationid uses `Ñ`,
 *     python-stdnum uses `&`). Neither character appears in synthetic
 *     fixtures so the mathematical agreement is unaffected.
 *
 * The B2 fix (RFC table off-by-one) was discovered by this very test
 * during this run; see `docs/CROSS_VALIDATION.md` § B2.
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import {
  generateInvalidCurps,
  generateInvalidRfcPfs,
  generateInvalidRfcPms,
  generateValidCurps,
  generateValidRfcPfs,
  generateValidRfcPms,
} from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.mx.curp", "stdnum.mx.rfc"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;

const VALID_CURPS = generateValidCurps(VECTOR_COUNT);
const INVALID_CURPS = generateInvalidCurps(VECTOR_COUNT);
const VALID_RFC_PFS = generateValidRfcPfs(VECTOR_COUNT);
const INVALID_RFC_PFS = generateInvalidRfcPfs(VECTOR_COUNT);
const VALID_RFC_PMS = generateValidRfcPms(VECTOR_COUNT);
const INVALID_RFC_PMS = generateInvalidRfcPms(VECTOR_COUNT);

const ORACLE_CURP_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.mx.curp", "is_valid", VALID_CURPS)
  : new Map<string, boolean>();
const ORACLE_CURP_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.mx.curp", "is_valid", INVALID_CURPS)
  : new Map<string, boolean>();
const ORACLE_RFC_PF_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.mx.rfc", "is_valid", VALID_RFC_PFS, ["validate_check_digits=True"])
  : new Map<string, boolean>();
const ORACLE_RFC_PF_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.mx.rfc", "is_valid", INVALID_RFC_PFS, ["validate_check_digits=True"])
  : new Map<string, boolean>();
const ORACLE_RFC_PM_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.mx.rfc", "is_valid", VALID_RFC_PMS, ["validate_check_digits=True"])
  : new Map<string, boolean>();
const ORACLE_RFC_PM_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.mx.rfc", "is_valid", INVALID_RFC_PMS, ["validate_check_digits=True"])
  : new Map<string, boolean>();

describeOrSkip(
  `MX cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("MX_CURP — agreement on valid vectors", () => {
      it.each(VALID_CURPS)("both accept %s", (input) => {
        expect(validate("MX_CURP", input)).toBe(true);
        expect(ORACLE_CURP_VALID.get(input)).toBe(true);
      });
    });

    describe("MX_CURP — agreement on invalid vectors", () => {
      it.each(INVALID_CURPS)("both reject %s", (input) => {
        expect(validate("MX_CURP", input)).toBe(false);
        expect(ORACLE_CURP_INVALID.get(input)).toBe(false);
      });
    });

    describe("MX_RFC_PF — agreement on valid vectors", () => {
      it.each(VALID_RFC_PFS)("both accept %s", (input) => {
        expect(validate("MX_RFC_PF", input)).toBe(true);
        expect(ORACLE_RFC_PF_VALID.get(input)).toBe(true);
      });
    });

    describe("MX_RFC_PF — agreement on invalid vectors", () => {
      it.each(INVALID_RFC_PFS)("both reject %s", (input) => {
        expect(validate("MX_RFC_PF", input)).toBe(false);
        expect(ORACLE_RFC_PF_INVALID.get(input)).toBe(false);
      });
    });

    describe("MX_RFC_PM — agreement on valid vectors", () => {
      it.each(VALID_RFC_PMS)("both accept %s", (input) => {
        expect(validate("MX_RFC_PM", input)).toBe(true);
        expect(ORACLE_RFC_PM_VALID.get(input)).toBe(true);
      });
    });

    describe("MX_RFC_PM — agreement on invalid vectors", () => {
      it.each(INVALID_RFC_PMS)("both reject %s", (input) => {
        expect(validate("MX_RFC_PM", input)).toBe(false);
        expect(ORACLE_RFC_PM_INVALID.get(input)).toBe(false);
      });
    });
  },
);
