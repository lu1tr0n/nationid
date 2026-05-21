/**
 * `nationid/extract` — structured-data extraction from documents that
 * structurally encode that data (DOB, sex, region).
 *
 * Design notes:
 *   - All extractors validate first via `parse()`. If `parse(...).ok === false`
 *     they return `null`. No extractor sees an unverified body.
 *   - The dispatcher is a switch on `DocumentTypeCode`. Adding a new spec
 *     requires only an entry in `SUPPORT_TABLE` plus the per-spec extractor.
 *   - The public surface is intentionally small: 4 functions and 4 types.
 *     We do *not* expose a "rich" object with all three fields because most
 *     specs encode only one or two; mixing them in a single shape would force
 *     consumers to handle implausible combinations.
 *
 * @packageDocumentation
 */

import type { DocumentTypeCode } from "../core/types.ts";

import { extractArSex } from "./ar/sex.ts";
import { extractDpiRegion } from "./gt/dpi.ts";
import { extractCurpDOB, extractCurpRegion, extractCurpSex } from "./mx/curp.ts";
import { extractRfcDOB } from "./mx/rfc.ts";
import { extractRucRegion } from "./pe/ruc.ts";
import type { DateOfBirth, ExtractKind, Region, Sex } from "./types.ts";

export type { DateOfBirth, ExtractKind, Region, Sex } from "./types.ts";

/**
 * Compile-time-checked support matrix. Each entry lists which extract kinds a
 * spec can answer. Specs not listed here support nothing (the default).
 *
 * Using `Partial<Record<...>>` lets TypeScript flag typos in the keys without
 * forcing every `DocumentTypeCode` to declare an empty entry.
 */
const SUPPORT_TABLE: Partial<Record<DocumentTypeCode, ReadonlySet<ExtractKind>>> = {
  MX_CURP: new Set<ExtractKind>(["dob", "sex", "region"]),
  MX_RFC_PF: new Set<ExtractKind>(["dob"]),
  AR_CUIT: new Set<ExtractKind>(["sex"]),
  AR_CUIL: new Set<ExtractKind>(["sex"]),
  AR_CDI: new Set<ExtractKind>(["sex"]),
  GT_DPI: new Set<ExtractKind>(["region"]),
  PE_RUC: new Set<ExtractKind>(["region"]),
};

/**
 * Returns whether `code` exposes the requested extract kind.
 *
 * Use this to gate UI affordances (e.g. only show a "show birthday" button
 * for documents that encode a DOB).
 *
 * @param code - Document type to query.
 * @param kind - Extract category: `"dob"`, `"sex"`, or `"region"`.
 * @returns `true` if `code` can answer `kind`, `false` otherwise.
 * @example
 * ```ts
 * import { supports } from "nationid/extract";
 *
 * supports("MX_CURP", "dob");    // true
 * supports("MX_CURP", "sex");    // true
 * supports("SV_DUI",  "dob");    // false (DUI does not encode DOB)
 * ```
 */
export function supports(code: DocumentTypeCode, kind: ExtractKind): boolean {
  const kinds = SUPPORT_TABLE[code];
  if (kinds === undefined) return false;
  return kinds.has(kind);
}

/**
 * Returns the date of birth encoded in `input`, or `null` if the spec does
 * not encode DOB or the input fails validation.
 *
 * The returned `DateOfBirth` is a plain calendar date (year/month/day) — NOT
 * a `Date` instance — to side-step timezone semantics. See {@link DateOfBirth}.
 *
 * @param code - Document type. Must support `"dob"` (see `supports`).
 * @param input - Raw user input; will be normalized and validated first.
 * @returns A `DateOfBirth` on success, `null` otherwise.
 * @example
 * ```ts
 * import { extractDOB } from "nationid/extract";
 *
 * extractDOB("MX_CURP", "GOMC850315HDFRRR07");
 * // { year: 1985, month: 3, day: 15 }
 * extractDOB("SV_DUI", "045678903"); // null  (DUI does not encode DOB)
 * ```
 */
export function extractDOB(code: DocumentTypeCode, input: string): DateOfBirth | null {
  if (!supports(code, "dob")) return null;
  switch (code) {
    case "MX_CURP":
      return extractCurpDOB(input);
    case "MX_RFC_PF":
      return extractRfcDOB(input);
    default:
      return null;
  }
}

/**
 * Returns the sex marker encoded in `input`, or `null` if the spec does not
 * encode sex or the input fails validation.
 *
 * Returns the document's literal marker — `"M"`, `"F"`, or `"X"` for
 * non-physical-person entities (e.g. Argentine PJ CUIT prefixes `30/33/34`).
 *
 * @param code - Document type. Must support `"sex"` (see `supports`).
 * @param input - Raw user input; will be normalized and validated first.
 * @returns A `Sex` on success, `null` otherwise.
 * @example
 * ```ts
 * import { extractSex } from "nationid/extract";
 *
 * extractSex("MX_CURP", "GOMC850315HDFRRR07"); // "M"
 * extractSex("AR_CUIT", "30709653543");        // "X"  (persona jurídica)
 * ```
 */
export function extractSex(code: DocumentTypeCode, input: string): Sex | null {
  if (!supports(code, "sex")) return null;
  switch (code) {
    case "MX_CURP":
      return extractCurpSex(input);
    case "AR_CUIT":
    case "AR_CUIL":
    case "AR_CDI":
      return extractArSex(code, input);
    default:
      return null;
  }
}

/**
 * Returns the administrative region encoded in `input`, or `null` if the spec
 * does not encode region or the input fails validation.
 *
 * The returned `Region` carries the raw token plus a `kind` discriminant
 * (state / province / department / municipality / tax_region). Callers can
 * resolve the token against their own catalog to obtain the human-readable
 * region name.
 *
 * @param code - Document type. Must support `"region"` (see `supports`).
 * @param input - Raw user input; will be normalized and validated first.
 * @returns A `Region` on success, `null` otherwise.
 * @example
 * ```ts
 * import { extractRegion } from "nationid/extract";
 *
 * extractRegion("MX_CURP", "GOMC850315HDFRRR07");
 * // { code: "DF", kind: "state" }
 * extractRegion("GT_DPI", "0123456780101");
 * // { code: "01", kind: "department" }
 * ```
 */
export function extractRegion(code: DocumentTypeCode, input: string): Region | null {
  if (!supports(code, "region")) return null;
  switch (code) {
    case "MX_CURP":
      return extractCurpRegion(input);
    case "GT_DPI":
      return extractDpiRegion(input);
    case "PE_RUC":
      return extractRucRegion(input);
    default:
      return null;
  }
}
