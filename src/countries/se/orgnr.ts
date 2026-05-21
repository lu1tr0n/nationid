/**
 * Sweden — Organisationsnummer (legal-entity registration number).
 *
 * Issuer: Bolagsverket (Swedish Companies Registration Office).
 * Source: https://bolagsverket.se/
 *
 * Format: 10 digits, displayed as `XXXXXX-XXXX`.
 *
 * Disambiguation rule: the third digit must be `>= 2`. This separates orgnr
 * from personnummer (whose third digit is always 0 or 1, as it is the second
 * digit of the month). Skatteverket and Bolagsverket both publish the rule.
 *
 * Check digit: standard Luhn (ISO/IEC 7812-1) over all 10 digits.
 *
 * Confidence: high — Bolagsverket publishes the algorithm; cross-validated
 * against the `swedish-organisationsnummer` and `validator.js` rules.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{10}$/;
const FORMATTED_REGEX = /^\d{6}-\d{4}$/;

const COUNTRY = "SE";
const CODE = "SE_ORGNR";

export const orgnrSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.SE_ORGNR.label",
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
    if (!hasOrgnrThirdDigit(digits)) return false;
    return luhnValid(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 6)}-${digits.slice(6)}`;
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
    if (digits.length > 10) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!hasOrgnrThirdDigit(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!luhnValid(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `${digits.slice(0, 6)}-${digits.slice(6)}`,
      confidence: "high",
    };
  },
};

/** Third digit must be >= 2 to distinguish orgnr from personnummer. */
function hasOrgnrThirdDigit(digits: string): boolean {
  const third = digits.charCodeAt(2) - 48;
  return third >= 2;
}
