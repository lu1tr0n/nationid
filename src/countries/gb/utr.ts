/**
 * United Kingdom — UTR (Unique Taxpayer Reference).
 *
 * Issuer: HM Revenue & Customs.
 * Source: https://www.gov.uk/find-utr-number
 *
 * Format: 10 digits. Position 1 is the check digit; positions 2..10 are the
 * body. Sometimes appended with `K` (suffix used by HMRC for paper notices) —
 * we strip non-digits during normalization.
 *
 * Check digit: weighted mod-11 over the body digits 2..10 with weights
 * `[6, 7, 8, 9, 10, 5, 4, 3, 2]` applied left-to-right.
 *   r  = sum mod 11
 *   dv = 11 - r
 *   - if dv == 11 → 0
 *   - if dv == 10 → number is invalid (HMRC reissues; impossible UTR)
 *
 * Confidence: moderate. The algorithm is HMRC-internal but is reproduced in
 * `python-stdnum.gb.utr` and matches HMRC's CDC-issued specifications used
 * by Self Assessment software vendors.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{10}$/;
const WEIGHTS = [6, 7, 8, 9, 10, 5, 4, 3, 2] as const;

const COUNTRY = "GB";
const CODE = "GB_UTR";

export const utrSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.GB_UTR.label",
  rawRegex: RAW_REGEX,
  // No canonical separators on UTR notices — formatted form === raw form.
  formattedRegex: RAW_REGEX,
  mask: "0000000000",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkUtr(digits);
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
    if (digits.length < 10) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 10) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!checkUtr(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: digits,
      confidence: "moderate",
    };
  },
};

function checkUtr(digits: string): boolean {
  // Position 1 (digits[0]) is the check digit; the body is digits[1..9].
  const check = digits.charCodeAt(0) - 48;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += (digits.charCodeAt(i + 1) - 48) * w;
  }
  const r = sum % 11;
  const dv = 11 - r;
  if (dv === 10) return false;
  const expected = dv === 11 ? 0 : dv;
  return expected === check;
}
