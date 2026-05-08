/**
 * Honduras — DNI / Identidad Nacional.
 *
 * Issuer: Registro Nacional de las Personas (RNP).
 * Source: https://www.rnp.hn/
 * Legal basis: Decreto 62-2004, Ley del RNP.
 *
 * Format: 13 digits, displayed as `0000-0000-00000`.
 *   - 4 digits: 2 departamento (01-18) + 2 municipio
 *   - 4 digits: año de nacimiento (e.g. `1990`)
 *   - 5 digits: correlativo
 *
 * Check digit: not publicly documented by RNP and not consistently implemented
 * across community libraries. This spec validates **format only** (length +
 * structural constraints). Confidence: `low`.
 *
 * Structural constraints enforced:
 *   - Departamento (positions 1-2) must be 01-18 (Honduras has 18 departamentos).
 *   - Año (positions 5-8) must be a plausible 4-digit year (1900-current).
 *
 * The 2021 DNI redesign retained the same numeric format.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{13}$/;
const FORMATTED_REGEX = /^\d{4}-\d{4}-\d{5}$/;

/** Honduras departamento codes 01-18. */
const MIN_DEPT = 1;
const MAX_DEPT = 18;
/** Earliest plausible year of birth on a current Honduran ID. */
const MIN_YEAR = 1900;

export const dniSpec: DocumentSpec = {
  code: "HN_DNI",
  country: "HN",
  // DNI is the Honduran personal ID. Per `hn/rtn.ts:9`, the first 13 digits
  // of RTN (tax ID) for natural persons are derived from the DNI itself, so
  // DNI is also used as the tax ID body. Matches SV_DUI precedent →
  // scope: "both".
  scope: "both",
  labelKey: "documents.HN_DNI.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000-0000-00000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return hasValidStructure(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 13) return input;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "HN_DNI", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 13) {
      return { ok: false, code: "HN_DNI", reason: { kind: "too_short" } };
    }
    if (digits.length > 13) {
      return { ok: false, code: "HN_DNI", reason: { kind: "too_long" } };
    }
    if (!hasValidStructure(digits)) {
      return { ok: false, code: "HN_DNI", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "HN_DNI",
      normalized: digits,
      formatted: `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`,
      confidence: "low",
    };
  },
};

function hasValidStructure(digits: string): boolean {
  const dept = parseInt(digits.slice(0, 2), 10);
  if (dept < MIN_DEPT || dept > MAX_DEPT) return false;
  const year = parseInt(digits.slice(4, 8), 10);
  // Upper bound is "now"; we keep the comparison side-bound to avoid leaking the
  // current year into the spec, which would make tests time-dependent. We accept
  // any plausible 4-digit year, with a generous upper bound of the year 2099.
  if (year < MIN_YEAR || year > 2099) return false;
  return true;
}
