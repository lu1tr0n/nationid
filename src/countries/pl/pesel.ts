/**
 * Poland — PESEL (Powszechny Elektroniczny System Ewidencji Ludności).
 *
 * Issuer: Ministerstwo Spraw Wewnętrznych i Administracji (MSWiA).
 * Source: https://www.gov.pl/web/gov/czym-jest-numer-pesel
 * Legal basis: Ustawa o ewidencji ludności (2010).
 *
 * Format: 11 digits, no separator.
 *   - 6 digits: yymmdd. Month encodes century:
 *       1800-1899: month + 80
 *       1900-1999: month +  0
 *       2000-2099: month + 20
 *       2100-2199: month + 40
 *       2200-2299: month + 60
 *   - 4 digits: serial; the 10th digit encodes sex (odd = male, even = female).
 *   - 1 digit: check digit.
 *
 * Check digit:
 *   weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
 *   sum = sum(weights[i] * digit[i]) for i in 0..9
 *   r = sum mod 10
 *   dv = (10 - r) mod 10
 *
 * Confidence: high. Algorithm published by MSWiA and reproduced verbatim
 * in `python-stdnum.pl.pesel`, the npm `polish-pesel` package and
 * `validator.js isIdentityCard('pl-PL')`.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{11}$/;
const WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3] as const;
const COUNTRY = "PL";
const CODE = "PL_PESEL";

export const peselSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both",
  labelKey: "documents.PL_PESEL.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "00000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (!isPlausibleDob(digits)) return false;
    return checkPesel(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!isPlausibleDob(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkPesel(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: digits,
      confidence: "high",
    };
  },
};

function checkPesel(digits: string): boolean {
  if (digits.length !== 11) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const d = digits.charCodeAt(i) - 48;
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const expected = (10 - (sum % 10)) % 10;
  return expected === digits.charCodeAt(10) - 48;
}

/**
 * Decode month + day, accounting for century-shifted month codes
 * (+0/+20/+40/+60/+80). Reject if neither raw month nor any decoded
 * variant lands in 1..12 with day in 1..31.
 */
function isPlausibleDob(digits: string): boolean {
  const mmRaw = Number.parseInt(digits.slice(2, 4), 10);
  const dd = Number.parseInt(digits.slice(4, 6), 10);
  const candidates = [mmRaw, mmRaw - 20, mmRaw - 40, mmRaw - 60, mmRaw - 80];
  const mm = candidates.find((m) => m >= 1 && m <= 12);
  if (mm === undefined) return false;
  if (dd < 1 || dd > 31) return false;
  return true;
}
