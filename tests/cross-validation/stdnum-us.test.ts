/**
 * Cross-validation: nationid vs `python-stdnum.stdnum.us.{ssn, itin, ein}`.
 *
 * Coverage:
 *   - US_SSN via `stdnum.us.ssn.is_valid` — 9 digits, structural rules.
 *   - US_ITIN via `stdnum.us.itin.is_valid` — 9## with group constraints.
 *   - US_EIN via `stdnum.us.ein.is_valid` — IRS-published prefix table.
 *
 * Documented divergences (failures here are EXPECTED, not bugs):
 *
 *   D10 — US_ITIN groups 50-65. nationid follows IRS Pub. 1915 modern
 *         ranges (50-65, 70-88, 90-92, 94-99). python-stdnum 2.2 only
 *         accepts 70-99 minus {89, 93}, missing the post-2012 IRS
 *         expansion to 50-65. nationid is correct per current IRS
 *         publication. Asserted with an explicit "nationid accepts,
 *         stdnum rejects" test.
 *
 *   D11 — US_SSN famous-blacklist. python-stdnum 2.2 hardcodes a
 *         3-element blacklist (`078-05-1120`, `457-55-5462`,
 *         `219-09-9999`) — historically promotional/known SSNs that the
 *         SSA later cancelled. nationid doesn't replicate this list
 *         (these are arguably out-of-spec edge cases, not the SSA
 *         "always invalid" rules). The generator avoids these specific
 *         numbers so the agreement count is unaffected.
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import {
  generateInvalidEins,
  generateInvalidSsns,
  generateNationidOnlyItins,
  generateValidEins,
  generateValidItins,
  generateValidSsns,
} from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.us.ssn", "stdnum.us.itin", "stdnum.us.ein"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;
const DIVERGENCE_COUNT = 20;

const VALID_SSNS = generateValidSsns(VECTOR_COUNT);
const INVALID_SSNS = generateInvalidSsns(VECTOR_COUNT);
const VALID_ITINS = generateValidItins(VECTOR_COUNT);
const NATIONID_ONLY_ITINS = generateNationidOnlyItins(DIVERGENCE_COUNT);
const VALID_EINS = generateValidEins(VECTOR_COUNT);
const INVALID_EINS = generateInvalidEins(VECTOR_COUNT);

const ORACLE_SSN_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.us.ssn", "is_valid", VALID_SSNS)
  : new Map<string, boolean>();
const ORACLE_SSN_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.us.ssn", "is_valid", INVALID_SSNS)
  : new Map<string, boolean>();
const ORACLE_ITIN_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.us.itin", "is_valid", VALID_ITINS)
  : new Map<string, boolean>();
const ORACLE_ITIN_NATIONID_ONLY = availability.ok
  ? batchStdnumIsValid("stdnum.us.itin", "is_valid", NATIONID_ONLY_ITINS)
  : new Map<string, boolean>();
const ORACLE_EIN_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.us.ein", "is_valid", VALID_EINS)
  : new Map<string, boolean>();
const ORACLE_EIN_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.us.ein", "is_valid", INVALID_EINS)
  : new Map<string, boolean>();

describeOrSkip(
  `US cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("US_SSN — agreement on valid vectors", () => {
      it.each(VALID_SSNS)("both accept %s", (input) => {
        expect(validate("US_SSN", input)).toBe(true);
        expect(ORACLE_SSN_VALID.get(input)).toBe(true);
      });
    });

    describe("US_SSN — agreement on invalid vectors", () => {
      it.each(INVALID_SSNS)("both reject %s", (input) => {
        expect(validate("US_SSN", input)).toBe(false);
        expect(ORACLE_SSN_INVALID.get(input)).toBe(false);
      });
    });

    describe("US_ITIN — agreement on valid vectors (shared groups: 70-88, 90-92, 94-99)", () => {
      it.each(VALID_ITINS)("both accept %s", (input) => {
        expect(validate("US_ITIN", input)).toBe(true);
        expect(ORACLE_ITIN_VALID.get(input)).toBe(true);
      });
    });

    describe("US_ITIN — documented divergence D10: groups 50-65 (IRS Pub. 1915 modern range)", () => {
      it("scope sanity: every vector has group in [50, 65]", () => {
        for (const v of NATIONID_ONLY_ITINS) {
          const group = Number(v.slice(3, 5));
          expect(group).toBeGreaterThanOrEqual(50);
          expect(group).toBeLessThanOrEqual(65);
        }
      });

      it.each(NATIONID_ONLY_ITINS)("nationid accepts and python-stdnum rejects %s", (input) => {
        expect(validate("US_ITIN", input)).toBe(true);
        expect(ORACLE_ITIN_NATIONID_ONLY.get(input)).toBe(false);
      });
    });

    describe("US_EIN — agreement on valid vectors", () => {
      it.each(VALID_EINS)("both accept %s", (input) => {
        expect(validate("US_EIN", input)).toBe(true);
        expect(ORACLE_EIN_VALID.get(input)).toBe(true);
      });
    });

    describe("US_EIN — agreement on invalid vectors", () => {
      it.each(INVALID_EINS)("both reject %s", (input) => {
        expect(validate("US_EIN", input)).toBe(false);
        expect(ORACLE_EIN_INVALID.get(input)).toBe(false);
      });
    });
  },
);
