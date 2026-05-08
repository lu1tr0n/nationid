/**
 * Cross-validation: nationid vs `python-stdnum.stdnum.do.{cedula, rnc}`.
 *
 * Coverage:
 *   - DO_CEDULA via `stdnum.do.cedula.is_valid` — Luhn over 11 digits.
 *   - DO_RNC via `stdnum.do.rnc.is_valid` — mod-11 weighted (7,9,8,6,5,4,3,2).
 *
 * Both algorithms are documented in the DGII e-CF schema and are
 * convention in Dominican fintech. nationid additionally rejects
 * all-same-digit RNC bodies; the generator avoids them.
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import {
  generateInvalidDoCedulas,
  generateInvalidDoRncs,
  generateValidDoCedulas,
  generateValidDoRncs,
} from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.do.cedula", "stdnum.do.rnc"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;

const VALID_CEDULAS = generateValidDoCedulas(VECTOR_COUNT);
const INVALID_CEDULAS = generateInvalidDoCedulas(VECTOR_COUNT);
const VALID_RNCS = generateValidDoRncs(VECTOR_COUNT);
const INVALID_RNCS = generateInvalidDoRncs(VECTOR_COUNT);

const ORACLE_CEDULA_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.do.cedula", "is_valid", VALID_CEDULAS)
  : new Map<string, boolean>();
const ORACLE_CEDULA_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.do.cedula", "is_valid", INVALID_CEDULAS)
  : new Map<string, boolean>();
const ORACLE_RNC_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.do.rnc", "is_valid", VALID_RNCS)
  : new Map<string, boolean>();
const ORACLE_RNC_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.do.rnc", "is_valid", INVALID_RNCS)
  : new Map<string, boolean>();

describeOrSkip(
  `DO cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("DO_CEDULA — agreement on valid vectors", () => {
      it.each(VALID_CEDULAS)("both accept %s", (input) => {
        expect(validate("DO_CEDULA", input)).toBe(true);
        expect(ORACLE_CEDULA_VALID.get(input)).toBe(true);
      });
    });

    describe("DO_CEDULA — agreement on invalid vectors", () => {
      it.each(INVALID_CEDULAS)("both reject %s", (input) => {
        expect(validate("DO_CEDULA", input)).toBe(false);
        expect(ORACLE_CEDULA_INVALID.get(input)).toBe(false);
      });
    });

    describe("DO_RNC — agreement on valid vectors", () => {
      it.each(VALID_RNCS)("both accept %s", (input) => {
        expect(validate("DO_RNC", input)).toBe(true);
        expect(ORACLE_RNC_VALID.get(input)).toBe(true);
      });
    });

    describe("DO_RNC — agreement on invalid vectors", () => {
      it.each(INVALID_RNCS)("both reject %s", (input) => {
        expect(validate("DO_RNC", input)).toBe(false);
        expect(ORACLE_RNC_INVALID.get(input)).toBe(false);
      });
    });
  },
);
