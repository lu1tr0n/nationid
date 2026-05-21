/**
 * Sweden — Personnummer (personal identification number).
 *
 * Issuer: Skatteverket (Swedish Tax Agency).
 * Source: https://www.skatteverket.se/
 *
 * Format: 10 or 12 digits.
 *   - 10-digit form:  YYMMDD-NNNC          (hyphen for under 100 years)
 *                     YYMMDD+NNNC          (plus for 100+ years)
 *   - 12-digit form:  YYYYMMDD-NNNC        (century explicit, hyphen still used)
 *
 * Composition:
 *   - 6 (or 8) date-of-birth digits
 *   - 3 individual digits (3rd is sex parity: odd = male, even = female)
 *   - 1 check digit (Luhn over the 10-digit form)
 *
 * Coordination numbers (samordningsnummer): same shape, day-of-month + 60.
 * The library accepts these because they are issued by Skatteverket against
 * the same algorithm and are valid identifiers for tax / banking purposes.
 *
 * Check digit: standard Luhn (ISO/IEC 7812-1) over the 10-digit form
 * `YYMMDDNNNC` (i.e. for the 12-digit form, drop the century before
 * computing the checksum).
 *
 * Confidence: high — Skatteverket publishes the algorithm; cross-validated
 * against the `personnummer` (npm) reference implementation.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{10}$|^\d{12}$/;
// Accept either separator (`-` for under-100, `+` for over-100) on the
// 6+4 form, and an optional `-` on the 8+4 form.
const FORMATTED_REGEX = /^(?:\d{6}[-+]\d{4}|\d{8}-?\d{4})$/;

const COUNTRY = "SE";
const CODE = "SE_PERSONNUMMER";

export const personnummerSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both", // Personal ID + tax ID (Skatteverket).
  labelKey: "documents.SE_PERSONNUMMER.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000000-0000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (!validateDateAndChecksum(digits)) return false;
    return true;
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    if (digits.length === 10) {
      return `${digits.slice(0, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 8)}-${digits.slice(8)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 10) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 12 || digits.length === 11) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!hasValidDate(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!luhnValid(toTenDigit(digits))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    const formatted =
      digits.length === 10
        ? `${digits.slice(0, 6)}-${digits.slice(6)}`
        : `${digits.slice(0, 8)}-${digits.slice(8)}`;
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted,
      confidence: "high",
    };
  },
};

/** Reduce a 12-digit personnummer to its 10-digit Luhn-checkable form. */
function toTenDigit(digits: string): string {
  return digits.length === 12 ? digits.slice(2) : digits;
}

function hasValidDate(digits: string): boolean {
  let mm: number;
  let dd: number;
  if (digits.length === 12) {
    mm = parseInt(digits.slice(4, 6), 10);
    dd = parseInt(digits.slice(6, 8), 10);
  } else {
    mm = parseInt(digits.slice(2, 4), 10);
    dd = parseInt(digits.slice(4, 6), 10);
  }
  // Coordination numbers offset day by +60.
  const dayCanonical = dd > 60 ? dd - 60 : dd;
  if (mm < 1 || mm > 12) return false;
  if (dayCanonical < 1 || dayCanonical > 31) return false;
  return true;
}

function validateDateAndChecksum(digits: string): boolean {
  if (!hasValidDate(digits)) return false;
  return luhnValid(toTenDigit(digits));
}
