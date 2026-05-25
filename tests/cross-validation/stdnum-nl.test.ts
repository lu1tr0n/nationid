/**
 * Cross-validation: nationid vs `python-stdnum.stdnum.nl.bsn` (oracle).
 *
 * Coverage: NL_BSN — 40 algorithmically-valid + 40 invalid synthetic
 * vectors. Both implementations use the "11-proef" weighted sum
 * `9d1 + 8d2 + ... + 2d8 - d9 ≡ 0 (mod 11)`. Generator avoids the
 * `000000000` placeholder which both libs reject independently.
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import { generateInvalidBsns, generateValidBsns } from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.nl.bsn"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;

const VALID = generateValidBsns(VECTOR_COUNT);
const INVALID = generateInvalidBsns(VECTOR_COUNT);

const ORACLE_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.nl.bsn", "is_valid", VALID)
  : new Map<string, boolean>();
const ORACLE_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.nl.bsn", "is_valid", INVALID)
  : new Map<string, boolean>();

describeOrSkip(
  `NL cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("NL_BSN — agreement on valid vectors", () => {
      it.each(VALID)("both accept %s", (input) => {
        expect(validate("NL_BSN", input)).toBe(true);
        expect(ORACLE_VALID.get(input)).toBe(true);
      });
    });

    describe("NL_BSN — agreement on invalid vectors", () => {
      it.each(INVALID)("both reject %s", (input) => {
        expect(validate("NL_BSN", input)).toBe(false);
        expect(ORACLE_INVALID.get(input)).toBe(false);
      });
    });
  },
);
