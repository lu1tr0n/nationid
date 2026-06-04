/**
 * Norway — D-nummer (foreign-resident identification number).
 *
 * Issuer: Skatteetaten.
 * Source: https://www.skatteetaten.no/
 *
 * Format: 11 digits — identical layout to Fødselsnummer, but the day-of-
 * month is offset by `+40` (e.g. Jan 1 becomes day 41). This distinguishes
 * D-numbers issued to non-residents who interact with Norwegian tax /
 * banking systems but do not have a permanent personnummer.
 *
 * Check digits: same dual mod-11 as FNR (weights `[3,7,6,1,8,9,4,5,2]` and
 * `[5,4,3,2,7,6,5,4,3,2]`).
 *
 * Confidence: high.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { checkFnrDigits } from "./fnr.ts";

const RAW_REGEX = /^\d{11}$/;

const COUNTRY = "NO";
const CODE = "NO_DNR";

export const dnrSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both",
  labelKey: "documents.NO_DNR.label",
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
    if (!hasValidDnrDate(digits)) return false;
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
    if (!hasValidDnrDate(digits)) {
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

function hasValidDnrDate(digits: string): boolean {
  // D-number day-of-month is the canonical day (1..31) offset by +40, so the
  // valid range is exactly [41, 71]. That bound alone fully validates the day;
  // a post-offset `canonical` recheck would always pass (dead code).
  const dd = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  if (mm < 1 || mm > 12) return false;
  if (dd < 41 || dd > 71) return false;
  return true;
}
