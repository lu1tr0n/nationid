/**
 * Canada — SIN (Social Insurance Number / Numéro d'assurance sociale).
 *
 * Issuer: Service Canada / Employment and Social Development Canada (ESDC).
 * Source: https://www.canada.ca/en/employment-social-development/services/sin.html
 * Bilingual official name: "Social Insurance Number" (EN) /
 *                          "Numéro d'assurance sociale" (FR, abbreviated NAS).
 *
 * Format: 9 digits, displayed as `000-000-000`.
 *
 * Composition: the 1st digit indicates the region of registration:
 *   - 1: Atlantic provinces (NB, NS, PE, NL).
 *   - 2, 3: Quebec.
 *   - 4, 5: Ontario.
 *   - 6: Prairie provinces, NWT and Nunavut.
 *   - 7: Pacific (BC, YT).
 *   - 8: not currently assigned.
 *   - 9: temporary residents (work / study permits). Valid SIN, but the
 *        holder's residency status is non-permanent and callers may want
 *        to know via the helper `isTemporaryResidentSIN`.
 *   - 0: rarely assigned in modern issuance, but the canonical Service
 *        Canada test SIN `046-454-286` starts with 0, so this library does
 *        not reject the leading-zero range. Callers that need to enforce
 *        the strict assignment ranges can layer their own check on top.
 *
 * Check digit: standard Luhn (ISO/IEC 7812-1) applied over all 9 digits.
 *
 * Confidence: high. Service Canada documents the Luhn check in the SIN Code
 * of Practice; cross-validated against community libraries (`sin-validator`,
 * `validator.js isIdentityCard('en-CA')`).
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{9}$/;
const FORMATTED_REGEX = /^\d{3}-\d{3}-\d{3}$/;

const COUNTRY = "CA";
const CODE = "CA_SIN";

export const sinSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both", // Personal ID + tax ID for CRA.
  labelKey: "documents.CA_SIN.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000-000-000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return luhnValid(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 9) return input;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 9) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 9) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!luhnValid(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`,
      confidence: "high",
    };
  },
};

/**
 * Returns true iff the SIN belongs to the temporary-resident range (`9XXXXXXXX`).
 *
 * Useful for callers that need to gate functionality (e.g. some banking or
 * benefit flows) on permanent vs. temporary residency.
 */
export function isTemporaryResidentSIN(input: string): boolean {
  const digits = stripNonDigits(input);
  if (!RAW_REGEX.test(digits)) return false;
  return digits.charCodeAt(0) === 57; // '9'
}
