/**
 * United States — EIN (Employer Identification Number).
 *
 * Issuer: Internal Revenue Service (IRS).
 * Source: https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes
 * Legal basis: IRC §6109.
 *
 * Format: 9 digits, displayed as `NN-NNNNNNN`.
 *   - 2 digits: campus prefix (assigned by IRS service center).
 *   - 7 digits: serial.
 *
 * Valid 2-digit prefixes (IRS-published): 01-06, 10-16, 20-27, 30-48,
 *   50-77, 80-88, 90-99. Reserved/never-issued: 00, 07-09, 17-19, 28-29,
 *   49, 78-79, 89.
 *
 * Check digit: none. Validation is structural prefix membership.
 *
 * Confidence: high. The IRS publishes the prefix list openly.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { EIN_VALID_PREFIXES } from "./shared.ts";

const RAW_REGEX = /^\d{9}$/;
const FORMATTED_REGEX = /^\d{2}-\d{7}$/;

export const einSpec: DocumentSpec = {
  code: "US_EIN",
  country: "US",
  scope: "tax",
  labelKey: "documents.US_EIN.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00-0000000",
  hasCheckDigit: false,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return isEinStructurallyValid(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "US_EIN", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 9) {
      return { ok: false, code: "US_EIN", reason: { kind: "too_short" } };
    }
    if (digits.length > 9) {
      return { ok: false, code: "US_EIN", reason: { kind: "too_long" } };
    }
    if (!isEinStructurallyValid(digits)) {
      return { ok: false, code: "US_EIN", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "US_EIN",
      normalized: digits,
      formatted: `${digits.slice(0, 2)}-${digits.slice(2)}`,
      confidence: "high",
    };
  },
};

function isEinStructurallyValid(digits: string): boolean {
  if (digits.length !== 9) return false;
  return EIN_VALID_PREFIXES.has(digits.slice(0, 2));
}
