/**
 * United States — SSN (Social Security Number).
 *
 * Issuer: Social Security Administration (SSA).
 * Source: https://www.ssa.gov/
 * Legal basis: Social Security Act §205(c)(2); SSA Pub. No. 05-10002.
 *
 * Format: 9 digits, displayed as `AAA-GG-SSSS`.
 *   - 3 digits: area (since 2011-06-25 the SSA assigns areas at random;
 *     pre-2011 the area encoded a state of issuance).
 *   - 2 digits: group.
 *   - 4 digits: serial.
 *
 * Check digit: none. Structural rules per SSA:
 *   - Area `000`, `666`, and `900-999` are never issued (the 9xx range is
 *     reserved for ITINs).
 *   - Group `00` is never issued.
 *   - Serial `0000` is never issued.
 *
 * The SSA randomization announcement
 * (https://www.ssa.gov/employer/randomization.html) deprecated the
 * geographic encoding of the area number on 2011-06-25; consumers MUST
 * NOT infer state-of-issuance from a post-2011 SSN.
 *
 * Confidence: high. The structural rules above are codified in SSA
 * Publication 05-10002 and the randomization announcement.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { isSsnReservedArea, SSN_INVALID_AREAS } from "./shared.ts";

const RAW_REGEX = /^\d{9}$/;
const FORMATTED_REGEX = /^\d{3}-\d{2}-\d{4}$/;

export const ssnSpec: DocumentSpec = {
  code: "US_SSN",
  country: "US",
  scope: "personal", // SSN identifies a natural person; ITIN/EIN are tax-only.
  labelKey: "documents.US_SSN.label",
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
    return isSsnStructurallyValid(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "US_SSN", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 9) {
      return { ok: false, code: "US_SSN", reason: { kind: "too_short" } };
    }
    if (digits.length > 9) {
      return { ok: false, code: "US_SSN", reason: { kind: "too_long" } };
    }
    if (!isSsnStructurallyValid(digits)) {
      return { ok: false, code: "US_SSN", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "US_SSN",
      normalized: digits,
      formatted: `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`,
      confidence: "high",
    };
  },
};

function isSsnStructurallyValid(digits: string): boolean {
  if (digits.length !== 9) return false;
  const area = digits.slice(0, 3);
  const group = digits.slice(3, 5);
  const serial = digits.slice(5);
  if (SSN_INVALID_AREAS.has(area)) return false;
  if (isSsnReservedArea(area)) return false; // 9xx reserved (ITIN namespace).
  if (group === "00") return false;
  if (serial === "0000") return false;
  return true;
}
