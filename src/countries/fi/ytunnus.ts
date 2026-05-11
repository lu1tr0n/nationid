/**
 * Finland — Y-tunnus (Business Identity Code).
 *
 * Issuer: PRH (Patentti- ja rekisterihallitus) and Tax Administration via
 * the YTJ joint registry.
 * Source: https://www.ytj.fi/
 *
 * Format: 8 digits, displayed as `1234567-8` (7 digits + `-` + 1 check digit).
 *
 * Check digit: weights `[7, 9, 10, 5, 8, 4, 2]` over the 7 body digits.
 *   r  = sum mod 11
 *   if r == 0  → dv = 0
 *   if r == 1  → number is invalid (DV would be 10, not allowed)
 *   else       → dv = 11 - r
 *
 * Confidence: high — PRH publishes the algorithm; cross-validated against
 * `finnish-business-ids` (npm) and `python-stdnum stdnum.fi.ytunnus`.
 */

import { mod11WeightedSum } from "../../algorithms/mod11.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{8}$/;
const FORMATTED_REGEX = /^\d{7}-\d$/;
const W = [7, 9, 10, 5, 8, 4, 2] as const;

const COUNTRY = "FI" as CountryCode;
// TODO(v0.6-integration): orchestrator extends DocumentTypeCode with FI_YTUNNUS.
const CODE = "FI_YTUNNUS" as DocumentTypeCode;

export const ytunnusSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.FI_YTUNNUS.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000000-0",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkYtunnus(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 7)}-${digits.slice(7)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 8) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 8) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkYtunnus(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `${digits.slice(0, 7)}-${digits.slice(7)}`,
      confidence: "high",
    };
  },
};

export function checkYtunnus(digits: string): boolean {
  if (digits.length !== 8) return false;
  const sum = mod11WeightedSum(digits.slice(0, 7), W as unknown as number[]);
  const r = sum % 11;
  if (r === 1) return false; // dv would be 10, invalid by spec.
  const dv = r === 0 ? 0 : 11 - r;
  return dv === digits.charCodeAt(7) - 48;
}
