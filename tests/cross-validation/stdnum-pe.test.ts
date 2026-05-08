/**
 * Cross-validation: nationid vs `python-stdnum.stdnum.pe.{ruc, cui}`.
 *
 * Coverage:
 *   - PE_RUC via `stdnum.pe.ruc.is_valid` (40 valid + 40 invalid).
 *   - PE_DNI via `stdnum.pe.cui.is_valid` — 8-digit form (no checksum).
 *
 * Documented divergences (failures here are EXPECTED, not bugs):
 *
 *   D8 — PE_RUC prefix `16` (no domiciliado especial). SUNAT issues prefixes
 *        `10, 15, 16, 17, 20`; python-stdnum 2.2's regex omits `16`.
 *        nationid follows SUNAT, the authoritative issuer. Asserted with
 *        an explicit "nationid accepts, stdnum rejects" test.
 *
 *   D9 — PE_RUC mod-11 residue `r ∈ {0, 1}`. SUNAT (RS 210-2004) maps
 *        `r=0 → DV=0` and `r=1 → DV=1`. python-stdnum 2.2 uses the
 *        shortcut `(11-r) % 10` which maps `r=0 → 1` and `r=1 → 0`.
 *        nationid follows SUNAT. The agreement-rate generator skips
 *        bodies with `r ∈ {0, 1}`; an explicit divergence test asserts
 *        that nationid accepts SUNAT-correct DVs in the divergence zone
 *        while python-stdnum rejects them.
 */

import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import {
  generateInvalidRucs,
  generateValidPeDnis,
  generateValidRucs,
  generateValidRucsDvDivergence,
  generateValidRucsNationidOnly,
  RUC_PREFIXES_NATIONID_ONLY,
} from "./_helpers.ts";
import { batchStdnumIsValid, probeStdnum } from "./_stdnum-oracle.ts";

const REQUIRED = ["stdnum.pe.ruc", "stdnum.pe.cui"] as const;
const availability = probeStdnum(REQUIRED);
const describeOrSkip = availability.ok ? describe : describe.skip;

const VECTOR_COUNT = 40;
const DIVERGENCE_COUNT = 20;

const VALID_RUCS = generateValidRucs(VECTOR_COUNT);
const INVALID_RUCS = generateInvalidRucs(VECTOR_COUNT);
const VALID_DNIS = generateValidPeDnis(VECTOR_COUNT);
const VALID_RUCS_NATIONID_PREFIX = generateValidRucsNationidOnly(DIVERGENCE_COUNT);
const VALID_RUCS_DV_DIVERGENCE = generateValidRucsDvDivergence(DIVERGENCE_COUNT);

const ORACLE_RUC_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.pe.ruc", "is_valid", VALID_RUCS)
  : new Map<string, boolean>();
const ORACLE_RUC_INVALID = availability.ok
  ? batchStdnumIsValid("stdnum.pe.ruc", "is_valid", INVALID_RUCS)
  : new Map<string, boolean>();
const ORACLE_DNI_VALID = availability.ok
  ? batchStdnumIsValid("stdnum.pe.cui", "is_valid", VALID_DNIS)
  : new Map<string, boolean>();
const ORACLE_RUC_PREFIX16 = availability.ok
  ? batchStdnumIsValid("stdnum.pe.ruc", "is_valid", VALID_RUCS_NATIONID_PREFIX)
  : new Map<string, boolean>();
const ORACLE_RUC_DV_DIV = availability.ok
  ? batchStdnumIsValid("stdnum.pe.ruc", "is_valid", VALID_RUCS_DV_DIVERGENCE)
  : new Map<string, boolean>();

describeOrSkip(
  `PE cross-validation (python-stdnum) ${availability.ok ? "" : `[skipped: ${availability.reason}]`}`,
  () => {
    describe("PE_RUC — agreement on valid vectors (shared prefix + non-divergent DV)", () => {
      it.each(VALID_RUCS)("both accept %s", (input) => {
        expect(validate("PE_RUC", input)).toBe(true);
        expect(ORACLE_RUC_VALID.get(input)).toBe(true);
      });
    });

    describe("PE_RUC — agreement on invalid vectors", () => {
      it.each(INVALID_RUCS)("both reject %s", (input) => {
        expect(validate("PE_RUC", input)).toBe(false);
        expect(ORACLE_RUC_INVALID.get(input)).toBe(false);
      });
    });

    describe("PE_RUC — documented divergence D8: prefix 16 (SUNAT-issued, stdnum 2.2 rejects)", () => {
      it("scope sanity: every vector starts with 16", () => {
        for (const v of VALID_RUCS_NATIONID_PREFIX) {
          expect(RUC_PREFIXES_NATIONID_ONLY).toContain(v.slice(0, 2));
        }
      });

      it.each(
        VALID_RUCS_NATIONID_PREFIX,
      )("nationid accepts and python-stdnum rejects %s", (input) => {
        expect(validate("PE_RUC", input)).toBe(true);
        expect(ORACLE_RUC_PREFIX16.get(input)).toBe(false);
      });
    });

    describe("PE_RUC — documented divergence D9: SUNAT DV mapping for r ∈ {0,1}", () => {
      it.each(
        VALID_RUCS_DV_DIVERGENCE,
      )("nationid accepts and python-stdnum rejects %s", (input) => {
        expect(validate("PE_RUC", input)).toBe(true);
        expect(ORACLE_RUC_DV_DIV.get(input)).toBe(false);
      });
    });

    describe("PE_DNI — agreement on valid 8-digit vectors", () => {
      it.each(VALID_DNIS)("both accept %s (format-only)", (input) => {
        expect(validate("PE_DNI", input)).toBe(true);
        expect(ORACLE_DNI_VALID.get(input)).toBe(true);
      });
    });
  },
);
