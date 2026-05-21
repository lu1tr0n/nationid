/**
 * Extractors for `MX_CURP`.
 *
 * CURP layout (18 chars, 0-indexed):
 *   - [0..3]   4 letters (surname / name initials)
 *   - [4..9]   AAMMDD birth date (2-digit year)
 *   - [10]     sex letter (`H` masculino, `M` femenino)
 *   - [11..12] entidad federativa (2-letter code)
 *   - [13..15] 3 internal consonants
 *   - [16]     homoclave — RENAPO uses a digit (0-9) for births in 1900s and a
 *              letter (A-Z) for births in 2000s. This lets us infer the
 *              century without ambiguity even when YY < the current YY.
 *   - [17]     mod-10 check digit
 *
 * Source for the homoclave-as-century rule: SEGOB Acuerdo DOF 18-OCT-2014 +
 * RENAPO public homoclave guide. The transition from numeric to letter
 * homoclaves happened circa 1996 and has been preserved across the 2000s for
 * exactly this disambiguation purpose. Cross-checked 2026-05-09 against
 * `python-stdnum` discussion threads and SEGOB technical bulletins.
 */

import { curpSpec } from "../../countries/mx/curp.ts";
import type { DateOfBirth, Region, Sex } from "../types.ts";

const ALPHA_RE = /^[A-Z]$/;

function parseBirth(yy: number, mm: number, dd: number, homoclave: string): DateOfBirth | null {
  // Homoclave-driven century inference. Letter → 2000s, digit → 1900s.
  // This is the documented RENAPO rule and avoids the "current YY" hack
  // (which would silently rot in 100 years).
  let year: number;
  if (ALPHA_RE.test(homoclave)) {
    year = 2000 + yy;
  } else if (homoclave >= "0" && homoclave <= "9") {
    year = 1900 + yy;
  } else {
    return null;
  }
  return validateCalendar(year, mm, dd);
}

/**
 * Reject impossible calendar dates (Feb 30, Apr 31, etc).
 *
 * The CURP regex allows month 01-12 and day 01-31 but does not cross-check
 * day against month length. Returning `null` for those keeps the `extract`
 * contract honest: a caller seeing a non-null `DateOfBirth` can rely on it
 * being a real day on a real Gregorian month.
 */
function validateCalendar(year: number, month: number, day: number): DateOfBirth | null {
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  // Use UTC to avoid local TZ rollovers (Date constructor without UTC can
  // shift the day by one in negative-offset zones during DST transitions).
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

export function extractCurpDOB(input: string): DateOfBirth | null {
  const result = curpSpec.parse(input);
  if (!result.ok) return null;
  const cleaned = result.normalized;
  const yy = Number(cleaned.slice(4, 6));
  const mm = Number(cleaned.slice(6, 8));
  const dd = Number(cleaned.slice(8, 10));
  const homoclave = cleaned.charAt(16);
  if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
  return parseBirth(yy, mm, dd, homoclave);
}

export function extractCurpSex(input: string): Sex | null {
  const result = curpSpec.parse(input);
  if (!result.ok) return null;
  const sexChar = result.normalized.charAt(10);
  if (sexChar === "H") return "M";
  if (sexChar === "M") return "F";
  return null;
}

export function extractCurpRegion(input: string): Region | null {
  const result = curpSpec.parse(input);
  if (!result.ok) return null;
  const code = result.normalized.slice(11, 13);
  if (code.length !== 2) return null;
  return { code, kind: "state" };
}
