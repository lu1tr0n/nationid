/**
 * Region extractor for `GT_DPI`.
 *
 * DPI layout (13 digits, 0-indexed):
 *   - [0..7]   8-digit correlativo
 *   - [8]      mod-11 verifier
 *   - [9..10]  código departamento (01..22, RENAP-issued)
 *   - [11..12] código municipio
 *
 * We surface the departamento as the canonical `Region.code` (`kind: "department"`)
 * because the municipio is only meaningful in the context of its parent department
 * and Guatemala's 22 departamentos are the natural administrative tier most
 * consumers care about.
 *
 * Callers who need both can read `regionMunicipalityCode()` separately. We do not
 * concatenate the two into a single `Region.code` to keep the payload self-describing.
 */

import { dpiSpec } from "../../countries/gt/dpi.ts";
import type { Region } from "../types.ts";

export function extractDpiRegion(input: string): Region | null {
  const result = dpiSpec.parse(input);
  if (!result.ok) return null;
  const digits = result.normalized;
  if (digits.length !== 13) return null;
  const department = digits.slice(9, 11);
  // The validate() guard already confirmed dept is in 01..22. We re-check
  // defensively: this extractor is independent of validate's internals and
  // must not return a department outside the issued range even if a future
  // regression slips a bad value past parse().
  const dept = Number(department);
  if (!Number.isFinite(dept) || dept < 1 || dept > 22) return null;
  return { code: department, kind: "department" };
}
