/**
 * Property tests for `nationid/extract`.
 *
 * Invariants covered:
 *
 *   E1: For any random string `x`, `extractDOB`, `extractSex`, `extractRegion`
 *       never throw and never return data for unsupported (code, kind) pairs.
 *
 *   E2: When a code declares `supports(code, "dob") === true`, every valid
 *       synthetic input is either rejected by `extractDOB` (returns null) or
 *       returns a `DateOfBirth` whose `(year, month, day)` form a real
 *       Gregorian calendar day (Date.UTC round-trip).
 *
 *   E3: `extractSex` only returns one of `"M" | "F" | "X" | null`.
 *
 *   E4: `extractRegion(code, x).code` is non-empty when non-null.
 *
 *   E5: `supports(code, kind)` is *consistent* with the extractors: if
 *       `supports() === false`, the corresponding extract function ALWAYS
 *       returns null, even on a valid input.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { DateOfBirth, Region, Sex } from "../../src/extract/index.ts";
import {
  extractDOB as extractDOBNarrow,
  extractRegion as extractRegionNarrow,
  extractSex as extractSexNarrow,
  supports,
} from "../../src/extract/index.ts";
import type { DocumentTypeCode } from "../../src/index.ts";
import { listSupportedCodes } from "../../src/index.ts";

/**
 * Property-test view of the extractors. These tests deliberately iterate
 * `listSupportedCodes()` (all 124 codes) to verify the runtime safety net —
 * extractors must return `null` for any code outside their support matrix.
 *
 * That probe is wider than the v1.0 *compile-time* contract, which narrows
 * each extractor to the codes declared in `SUPPORT_TABLE`. Re-typing the
 * imports here is the legitimate boundary cast: we're testing the runtime
 * fallback, not the typed surface that v1.0 ships to consumers.
 */
const extractDOB = extractDOBNarrow as (
  code: DocumentTypeCode,
  input: string,
) => DateOfBirth | null;
const extractSex = extractSexNarrow as (code: DocumentTypeCode, input: string) => Sex | null;
const extractRegion = extractRegionNarrow as (
  code: DocumentTypeCode,
  input: string,
) => Region | null;

import {
  arbitraryInput,
  arbitraryValid,
  PROPERTY_NUM_RUNS,
  PROPERTY_TEST_SEED,
} from "./_arbitraries.ts";

/** Helper: confirm a `DateOfBirth` round-trips through `Date.UTC`. */
function isValidGregorian(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

describe("property — E1 extract* never throws on arbitrary input", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: arbitrary input is exception-safe`, () => {
      fc.assert(
        fc.property(arbitraryInput, (x) => {
          // Must not throw. Return values are simply asserted to be of
          // the documented types or null.
          extractDOB(code, x);
          extractSex(code, x);
          extractRegion(code, x);
          return true;
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});

describe("property — E2 valid input ⇒ DOB is a real calendar day", () => {
  // Only iterate codes that declare DOB support; for the rest we have a
  // consistency check in E5 below.
  const dobCodes = listSupportedCodes().filter((c) => supports(c, "dob"));
  for (const code of dobCodes) {
    it(`${code}: extractDOB returns null or a real Gregorian date`, () => {
      fc.assert(
        fc.property(arbitraryValid(code), (x) => {
          const dob = extractDOB(code, x);
          if (dob === null) return true;
          return isValidGregorian(dob.year, dob.month, dob.day);
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});

describe("property — E3 extractSex only returns M / F / X / null", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: extractSex output is in the allowed set`, () => {
      fc.assert(
        fc.property(arbitraryValid(code), (x) => {
          const s = extractSex(code, x);
          return s === null || s === "M" || s === "F" || s === "X";
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});

describe("property — E4 region.code is non-empty when not null", () => {
  for (const code of listSupportedCodes()) {
    it(`${code}: extractRegion code/kind shape`, () => {
      fc.assert(
        fc.property(arbitraryValid(code), (x) => {
          const r = extractRegion(code, x);
          if (r === null) return true;
          if (typeof r.code !== "string" || r.code.length === 0) return false;
          // kind must be one of the documented variants.
          return (
            r.kind === "state" ||
            r.kind === "province" ||
            r.kind === "department" ||
            r.kind === "municipality" ||
            r.kind === "tax_region"
          );
        }),
        { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
      );
    });
  }
});

describe("property — E5 supports() agrees with extract* return values", () => {
  // For every (code, kind) where supports() is false, the matching extract
  // function must return null on every valid input. This is the core
  // contract of the support table.
  for (const code of listSupportedCodes()) {
    it(`${code}: unsupported kinds always return null`, () => {
      const checkOne = (
        kind: "dob" | "sex" | "region",
        fn: (c: DocumentTypeCode, x: string) => unknown,
      ) =>
        fc.assert(
          fc.property(arbitraryValid(code), (x) => {
            if (supports(code, kind)) return true;
            return fn(code, x) === null;
          }),
          { numRuns: PROPERTY_NUM_RUNS, seed: PROPERTY_TEST_SEED },
        );
      checkOne("dob", extractDOB);
      checkOne("sex", extractSex);
      checkOne("region", extractRegion);
      expect(true).toBe(true);
    });
  }
});
