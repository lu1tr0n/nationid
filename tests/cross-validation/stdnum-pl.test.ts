/**
 * Cross-validation: nationid vs `python-stdnum.stdnum.pl.pesel` (oracle).
 *
 * Coverage: PL_PESEL — 40 algorithmically-valid + 40 invalid synthetic
 * vectors. The generator emits PESELs across all five century-offset
 * variants (`+0`, `+20`, `+40`, `+60`, `+80`) and restricts the day field
 * to `1..28` so the date parses unambiguously across both libraries
 * regardless of month length.
 *
 * Both implementations use weights `[1,3,7,9,1,3,7,9,1,3]` over the first
 * 10 digits with the 11th as check; nationid additionally enforces a
 * plausible-DOB precondition that `stdnum.pl.pesel.is_valid` also
 * implements (which is why the day range is conservative here).
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import { generateInvalidPesels, generateValidPesels } from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.pl.pesel"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;

const VALID = generateValidPesels(VECTOR_COUNT);
const INVALID = generateInvalidPesels(VECTOR_COUNT);

const ORACLE_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.pl.pesel", "is_valid", VALID)
  : new Map<string, boolean>();
const ORACLE_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.pl.pesel", "is_valid", INVALID)
  : new Map<string, boolean>();

describeOrSkip(
  `PL cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("PL_PESEL — agreement on valid vectors", () => {
      it.each(VALID)("both accept %s", (input) => {
        expect(validate("PL_PESEL", input)).toBe(true);
        expect(ORACLE_VALID.get(input)).toBe(true);
      });
    });

    describe("PL_PESEL — agreement on invalid vectors", () => {
      it.each(INVALID)("both reject %s", (input) => {
        expect(validate("PL_PESEL", input)).toBe(false);
        expect(ORACLE_INVALID.get(input)).toBe(false);
      });
    });
  },
);
