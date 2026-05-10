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

/** Returns whether `code` exposes the requested extract kind. */
export function supports(code: DocumentTypeCode, kind: ExtractKind): boolean {
  const kinds = SUPPORT_TABLE[code];
  if (kinds === undefined) return false;
  return kinds.has(kind);
}

/** Returns DOB or null if code doesn't encode it / input is invalid. */
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

/** Returns sex or null if code doesn't encode it / input is invalid. */
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

/** Returns region or null if code doesn't encode it / input is invalid. */
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
