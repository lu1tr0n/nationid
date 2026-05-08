/**
 * United States — ITIN (Individual Taxpayer Identification Number).
 *
 * Issuer: Internal Revenue Service (IRS).
 * Source: https://www.irs.gov/individuals/individual-taxpayer-identification-number
 * Legal basis: IRC §6109; IRS Publication 1915.
 *
 * Format: 9 digits, displayed as `9NN-GG-NNNN` where:
 *   - Area starts with `9` (the entire 9xx area space is reserved for ITINs;
 *     the SSA never issues SSNs from 9xx).
 *   - Group must fall in one of the IRS-published ranges: 50-65, 70-88,
 *     90-92, 94-99 (Pub. 1915). Group 93 was never assigned.
 *
 * Check digit: none. Validation is structural.
 *
 * Confidence: high. Group ranges are published by IRS Pub. 1915.
 *
 * Note: an ITIN occupies the same 9-digit namespace as an SSN. Use the
 * area/group rules to disambiguate; an SSN is never `9xx-xx-xxxx`.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { ITIN_VALID_GROUPS } from "./shared.ts";

const RAW_REGEX = /^9\d{8}$/;
const FORMATTED_REGEX = /^9\d{2}-\d{2}-\d{4}$/;

export const itinSpec: DocumentSpec = {
  code: "US_ITIN",
  country: "US",
  scope: "tax",
  labelKey: "documents.US_ITIN.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000-00-0000",
  hasCheckDigit: false,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return isItinStructurallyValid(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "US_ITIN", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 9) {
      return { ok: false, code: "US_ITIN", reason: { kind: "too_short" } };
    }
    if (digits.length > 9) {
      return { ok: false, code: "US_ITIN", reason: { kind: "too_long" } };
    }
    if (!isItinStructurallyValid(digits)) {
      return { ok: false, code: "US_ITIN", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "US_ITIN",
      normalized: digits,
      formatted: `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`,
      confidence: "high",
    };
  },
};

function isItinStructurallyValid(digits: string): boolean {
  if (digits.length !== 9) return false;
  if (digits.charAt(0) !== "9") return false;
  const group = digits.slice(3, 5);
  return ITIN_VALID_GROUPS.has(group);
}
