/**
 * Cross-validation: nationid vs `python-stdnum.stdnum.cr.{cpf, cpj}`.
 *
 * Coverage:
 *   - CR_CEDULA_FISICA via `stdnum.cr.cpf.is_valid` — format-only.
 *   - CR_CEDULA_JURIDICA via `stdnum.cr.cpj.is_valid` — format + subtype.
 *
 * Algorithmic notes:
 *   - Cédula Física: nationid stores 9 digits (provincia 1-9 + tomo 4 +
 *     asiento 4). python-stdnum stores 10 digits (leading `0` + 9-digit
 *     consumer form). When fed a 9-digit input, python-stdnum pads to 10
 *     with a leading zero in `compact()`, then validates that
 *     `number[0] == '0'`. So both libs accept the same 9-digit space when
 *     provincia ∈ [1,9]. Generator uses provincias 1-8 (the historically
 *     issued range).
 *   - Cédula Jurídica: nationid accepts any 10-digit `3xxxxxxxxx`.
 *     python-stdnum restricts the 4-digit prefix to a published subtype
 *     list (002-014, 101-110 for class three). The agreement-rate
 *     generator restricts to that shared subtype set.
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import { generateValidCrCedulasFisicas, generateValidCrCedulasJuridicas } from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.cr.cpf", "stdnum.cr.cpj"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;

const VALID_CF = generateValidCrCedulasFisicas(VECTOR_COUNT);
const VALID_CJ = generateValidCrCedulasJuridicas(VECTOR_COUNT);

const ORACLE_CF_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.cr.cpf", "is_valid", VALID_CF)
  : new Map<string, boolean>();
const ORACLE_CJ_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.cr.cpj", "is_valid", VALID_CJ)
  : new Map<string, boolean>();

describeOrSkip(
  `CR cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("CR_CEDULA_FISICA — agreement on valid vectors (provincia 1-8, format-only)", () => {
      it.each(VALID_CF)("both accept %s", (input) => {
        expect(validate("CR_CEDULA_FISICA", input)).toBe(true);
        expect(ORACLE_CF_VALID.get(input)).toBe(true);
      });
    });

    describe("CR_CEDULA_JURIDICA — agreement on valid vectors (shared subtype set, format-only)", () => {
      it.each(VALID_CJ)("both accept %s", (input) => {
        expect(validate("CR_CEDULA_JURIDICA", input)).toBe(true);
        expect(ORACLE_CJ_VALID.get(input)).toBe(true);
      });
    });
  },
);
