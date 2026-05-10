/**
 * Extractor for `MX_RFC_PF` — birth date encoded in positions 4-9 (0-indexed)
 * of a 13-char RFC for personas físicas.
 *
 * Format: `AAAA######XXX`.
 *   - [0..3]   4 letters: name initials.
 *   - [4..9]   6 digits AAMMDD (birth date).
 *   - [10..12] 3 alphanumeric homoclave + DV.
 *
 * Century inference: RFC PF uses a 2-digit year and there is *no* SAT-published
 * disambiguator for the century (homoclave is alphanumeric purely as a
 * differentiator, not a century marker — different from CURP). The convention
 * SAT uses internally is "if YY > current 2-digit year, assume 1900s; else
 * 2000s". We replicate that here.
 *
 * SAT genéricos `XAXX010101...` and `XEXX010101...` carry a placeholder date
 * `010101`. `extractRfcDOB` returns the calendar date that would produce —
 * `2001-01-01` — which is technically the date the placeholder encodes. Callers
 * who treat that as a real DOB are responsible for filtering generics out.
 */

import { getSpec } from "../../index.ts";
import type { DateOfBirth } from "../types.ts";

/**
 * Cutoff year used to disambiguate 2-digit years for RFC PF. We compute this
 * lazily from the current calendar year so the rule keeps "rolling" with time
 * (no source-edit needed every January).
 */
function currentTwoDigitYear(): number {
  return new Date().getUTCFullYear() % 100;
}

function inferCentury(yy: number): number {
  // Future-proofing: if YY > current YY, the date is in the past century.
  // Equality is treated as the current century (a valid present-day RFC).
  return yy <= currentTwoDigitYear() ? 2000 + yy : 1900 + yy;
}

function validateCalendar(year: number, month: number, day: number): DateOfBirth | null {
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function extractRfcDOB(input: string): DateOfBirth | null {
  const result = getSpec("MX_RFC_PF").parse(input);
  if (!result.ok) return null;
  const cleaned = result.normalized;
  if (cleaned.length !== 13) return null;
  const yy = Number(cleaned.slice(4, 6));
  const mm = Number(cleaned.slice(6, 8));
  const dd = Number(cleaned.slice(8, 10));
  if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
  return validateCalendar(inferCentury(yy), mm, dd);
}
