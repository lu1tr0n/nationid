/**
 * Denmark — CPR-nummer (Det Centrale Personregister).
 *
 * Issuer: CPR-kontoret (CPR Office, Ministry of the Interior).
 * Source: https://cpr.dk/
 *
 * Format: 10 digits, displayed as `DDMMYY-NNNN`.
 *
 * Composition: 6 ddmmyy + 4 løbenummer (the last digit's parity encodes
 * sex: even = female, odd = male; the 7th-9th digits also encode century).
 *
 * Check digit policy (important):
 *   - **Historical CPRs (issued before October 2007)**: weights
 *     `[4, 3, 2, 7, 6, 5, 4, 3, 2, 1]` over all 10 digits, with
 *     `sum mod 11 == 0` denoting validity.
 *   - **Modern CPRs (issued 2007-10-01 onward)**: the CPR Office formally
 *     **abolished the modulus check** because the 1965 number-space had
 *     run out and post-2007 numbers cannot satisfy it consistently.
 *
 * Library policy: we validate **format only** (length, regex, plausible
 * date). The legacy mod-11 check is exposed as `cprMod11Legacy` for
 * callers that want to filter for pre-2007 numbers, but it is not enforced
 * by `validate()`. This matches the official CPR Office guidance
 * (https://cpr.dk/cpr-systemet/personnumre-uden-kontrolciffer-modulus-11-kontrol/).
 *
 * Confidence: moderate — format and date are deterministic, but checksum
 * coverage is partial (pre-2007 only). Surfacing the residual moduli as a
 * helper is the same approach taken by the `cpr-validator` and Datafordeleren
 * reference implementations.
 */

import { mod11WeightedSum } from "../../algorithms/mod11.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{10}$/;
const FORMATTED_REGEX = /^\d{6}-\d{4}$/;

const W = [4, 3, 2, 7, 6, 5, 4, 3, 2, 1] as const;

const COUNTRY = "DK";
const CODE = "DK_CPR";

export const cprSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both",
  labelKey: "documents.DK_CPR.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000000-0000",
  // Legacy mod-11 is not enforced because post-2007 numbers may legitimately
  // fail it. The hasCheckDigit flag reflects this: format-only enforcement.
  hasCheckDigit: false,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return hasValidCprDate(digits);
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
    if (!hasValidCprDate(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `${digits.slice(0, 6)}-${digits.slice(6)}`,
      confidence: "moderate",
    };
  },
};

function hasValidCprDate(digits: string): boolean {
  const dd = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  return true;
}

/**
 * Legacy mod-11 check (weights `[4,3,2,7,6,5,4,3,2,1]`, `sum mod 11 == 0`).
 *
 * Returns true iff the CPR satisfies the pre-2007 modulus constraint.
 * Useful for callers that want to flag pre-2007 numbers; not used by
 * `validate()`.
 */
export function cprMod11Legacy(input: string): boolean {
  const digits = stripNonDigits(input);
  if (!RAW_REGEX.test(digits)) return false;
  const sum = mod11WeightedSum(digits, W);
  return sum % 11 === 0;
}
