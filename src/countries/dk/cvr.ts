/**
 * Denmark — CVR (Det Centrale Virksomhedsregister).
 *
 * Issuer: Erhvervsstyrelsen (Danish Business Authority).
 * Source: https://datacvr.virk.dk/
 *
 * Format: 8 digits, no separator.
 *
 * Check digit: weights `[2, 7, 6, 5, 4, 3, 2, 1]` over all 8 digits;
 * `sum mod 11 == 0` denotes a valid CVR.
 *
 * Confidence: high — Erhvervsstyrelsen publishes the algorithm and the
 * datacvr.virk.dk lookup confirms it; cross-validated against
 * `python-stdnum stdnum.dk.cvr` and `validator.js isVAT('DK')`.
 */

import { mod11WeightedSum } from "../../algorithms/mod11.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{8}$/;
const W = [2, 7, 6, 5, 4, 3, 2, 1] as const;

const COUNTRY = "DK";
const CODE = "DK_CVR";

export const cvrSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.DK_CVR.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "00000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkCVR(digits);
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
    if (digits.length < 8) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 8) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkCVR(digits)) {
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

export function checkCVR(digits: string): boolean {
  if (digits.length !== 8) return false;
  const sum = mod11WeightedSum(digits, W);
  return sum % 11 === 0;
}
