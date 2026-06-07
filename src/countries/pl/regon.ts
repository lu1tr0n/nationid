/**
 * Poland — REGON (Krajowy Rejestr Urzędowy Podmiotów Gospodarki Narodowej).
 *
 * Issuer: Główny Urząd Statystyczny (GUS).
 * Source: https://wyszukiwarkaregon.stat.gov.pl/
 *
 * Format: 9 or 14 digits.
 *   - 9 digits: principal entity REGON.
 *   - 14 digits: principal REGON + 5-digit "jednostka lokalna" suffix +
 *     a re-computed final check digit over the full 14-digit value.
 *
 * Check digit:
 *   9-digit  weights = [8, 9, 2, 3, 4, 5, 6, 7]; mod-11; if r == 10 -> dv = 0.
 *   14-digit weights = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8]; mod-11; if r == 10 -> dv = 0.
 *
 * Confidence: high. Algorithm published by GUS and reproduced in
 * `python-stdnum.pl.regon` and the npm `polish-regon` package.
 */

import { mod11WeightedSum } from "../../algorithms/mod11.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{9}(\d{5})?$/;
const WEIGHTS_9 = [8, 9, 2, 3, 4, 5, 6, 7] as const;
const WEIGHTS_14 = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8] as const;
const COUNTRY = "PL";
const CODE = "PL_REGON";

export const regonSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.PL_REGON.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return digits.length === 9 ? checkRegon9(digits) : checkRegon14(digits);
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
    if (digits.length < 9) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 14 || (digits.length > 9 && digits.length < 14)) {
      return {
        ok: false,
        code: CODE,
        reason: { kind: digits.length > 14 ? "too_long" : "invalid_format" },
      };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    const ok = digits.length === 9 ? checkRegon9(digits) : checkRegon14(digits);
    if (!ok) {
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

function checkRegon9(digits: string): boolean {
  if (digits.length !== 9) return false;
  const r = mod11WeightedSum(digits.slice(0, 8), WEIGHTS_9) % 11;
  const expected = r === 10 ? 0 : r;
  return expected === digits.charCodeAt(8) - 48;
}

function checkRegon14(digits: string): boolean {
  if (digits.length !== 14) return false;
  // The 9-digit principal must independently pass mod-11.
  if (!checkRegon9(digits.slice(0, 9))) return false;
  const r = mod11WeightedSum(digits.slice(0, 13), WEIGHTS_14) % 11;
  const expected = r === 10 ? 0 : r;
  return expected === digits.charCodeAt(13) - 48;
}
