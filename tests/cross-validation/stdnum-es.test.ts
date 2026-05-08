/**
 * Cross-validation: nationid vs `python-stdnum.stdnum.es.{dni, nie, cif}`.
 *
 * Coverage:
 *   - ES_DNI via `stdnum.es.dni.is_valid` (Real Decreto 1553/2005).
 *   - ES_NIE via `stdnum.es.nie.is_valid` (Orden INT/2058/2008).
 *   - ES_NIF_PJ (CIF) via `stdnum.es.cif.is_valid` (RD 1065/2007). This
 *     was out-of-scope for the first-pass validator.js comparison
 *     (D4 in CROSS_VALIDATION.md). python-stdnum closes that gap.
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import {
  generateInvalidDnis,
  generateInvalidNies,
  generateInvalidNifPjs,
  generateValidDnis,
  generateValidNies,
  generateValidNifPjs,
} from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.es.dni", "stdnum.es.nie", "stdnum.es.cif"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;

const VALID_DNIS = generateValidDnis(VECTOR_COUNT);
const INVALID_DNIS = generateInvalidDnis(VECTOR_COUNT);
const VALID_NIES = generateValidNies(VECTOR_COUNT);
const INVALID_NIES = generateInvalidNies(VECTOR_COUNT);
const VALID_CIFS = generateValidNifPjs(VECTOR_COUNT);
const INVALID_CIFS = generateInvalidNifPjs(VECTOR_COUNT);

const ORACLE_DNI_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.es.dni", "is_valid", VALID_DNIS)
  : new Map<string, boolean>();
const ORACLE_DNI_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.es.dni", "is_valid", INVALID_DNIS)
  : new Map<string, boolean>();
const ORACLE_NIE_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.es.nie", "is_valid", VALID_NIES)
  : new Map<string, boolean>();
const ORACLE_NIE_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.es.nie", "is_valid", INVALID_NIES)
  : new Map<string, boolean>();
const ORACLE_CIF_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.es.cif", "is_valid", VALID_CIFS)
  : new Map<string, boolean>();
const ORACLE_CIF_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.es.cif", "is_valid", INVALID_CIFS)
  : new Map<string, boolean>();

describeOrSkip(
  `ES cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("ES_DNI — agreement on valid vectors", () => {
      it.each(VALID_DNIS)("both accept %s", (input) => {
        expect(validate("ES_DNI", input)).toBe(true);
        expect(ORACLE_DNI_VALID.get(input)).toBe(true);
      });
    });

    describe("ES_DNI — agreement on invalid vectors", () => {
      it.each(INVALID_DNIS)("both reject %s", (input) => {
        expect(validate("ES_DNI", input)).toBe(false);
        expect(ORACLE_DNI_INVALID.get(input)).toBe(false);
      });
    });

    describe("ES_NIE — agreement on valid vectors", () => {
      it.each(VALID_NIES)("both accept %s", (input) => {
        expect(validate("ES_NIE", input)).toBe(true);
        expect(ORACLE_NIE_VALID.get(input)).toBe(true);
      });
    });

    describe("ES_NIE — agreement on invalid vectors", () => {
      it.each(INVALID_NIES)("both reject %s", (input) => {
        expect(validate("ES_NIE", input)).toBe(false);
        expect(ORACLE_NIE_INVALID.get(input)).toBe(false);
      });
    });

    describe("ES_NIF_PJ — agreement on valid vectors (closes D4 gap)", () => {
      it.each(VALID_CIFS)("both accept %s", (input) => {
        expect(validate("ES_NIF_PJ", input)).toBe(true);
        expect(ORACLE_CIF_VALID.get(input)).toBe(true);
      });
    });

    describe("ES_NIF_PJ — agreement on invalid vectors", () => {
      it.each(INVALID_CIFS)("both reject %s", (input) => {
        expect(validate("ES_NIF_PJ", input)).toBe(false);
        expect(ORACLE_CIF_INVALID.get(input)).toBe(false);
      });
    });
  },
);
