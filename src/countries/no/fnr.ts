/**
 * Norway — Fødselsnummer (national identification number).
 *
 * Issuer: Skatteetaten (Norwegian Tax Administration).
 * Source: https://www.skatteetaten.no/
 *
 * Format: 11 digits, no separator (sometimes displayed `DDMMYY NNNCC`).
 *
 * Composition:
 *   - 6 date-of-birth digits (DDMMYY)
 *   - 3 individnummer (the third digit of which encodes sex: odd = male,
 *     even = female; the full 3-digit block also encodes century)
 *   - 2 check digits (DV1, DV2)
 *
 * Check digits:
 *   - DV1: weights `[3, 7, 6, 1, 8, 9, 4, 5, 2]` over digits 1-9.
 *          dv1 = 11 - (sum mod 11); if 11 → 0; if 10 → invalid number.
 *   - DV2: weights `[5, 4, 3, 2, 7, 6, 5, 4, 3, 2]` over digits 1-10.
 *          dv2 = 11 - (sum mod 11); same rules.
 *
 * Confidence: high — Skatteetaten publishes the algorithm; cross-validated
 * against `validator.js isIdentityCard('nb-NO')` and the
 * `norwegian-national-id-number` package.
 */

import { mod11WeightedSum } from "../../algorithms/mod11.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{11}$/;

const W1 = [3, 7, 6, 1, 8, 9, 4, 5, 2] as const;
const W2 = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

const COUNTRY = "NO" as CountryCode;
// TODO(v0.6-integration): orchestrator extends DocumentTypeCode with NO_FNR.
const CODE = "NO_FNR" as DocumentTypeCode;

export const fnrSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both",
  labelKey: "documents.NO_FNR.label",
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
    if (!hasValidFnrDate(digits)) return false;
    return checkFnrDigits(digits);
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
    if (!hasValidFnrDate(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkFnrDigits(digits)) {
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

/**
 * FNR day-of-month is in [1, 31]; D-nummer ranges (for foreign residents)
 * use the same algorithm but with day + 40 and are exposed through
 * `dnrSpec`. From a strict FNR perspective, days > 31 are invalid; we
 * perform basic month / day sanity here. The full date encoding is
 * accepted (months 1-12, days 1-31).
 */
function hasValidFnrDate(digits: string): boolean {
  const dd = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  return true;
}

/** Validates DV1 and DV2 per Skatteetaten's published mod-11 spec. */
export function checkFnrDigits(digits: string): boolean {
  if (digits.length !== 11) return false;
  const sum1 = mod11WeightedSum(digits.slice(0, 9), W1 as unknown as number[]);
  let dv1 = 11 - (sum1 % 11);
  if (dv1 === 11) dv1 = 0;
  if (dv1 === 10) return false;
  if (dv1 !== digits.charCodeAt(9) - 48) return false;
  const sum2 = mod11WeightedSum(digits.slice(0, 10), W2 as unknown as number[]);
  let dv2 = 11 - (sum2 % 11);
  if (dv2 === 11) dv2 = 0;
  if (dv2 === 10) return false;
  return dv2 === digits.charCodeAt(10) - 48;
}
