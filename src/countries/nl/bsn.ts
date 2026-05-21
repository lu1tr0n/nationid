/**
 * Netherlands — BSN (Burgerservicenummer).
 *
 * Issuer: Rijksdienst voor Identiteitsgegevens (RvIG).
 * Source: https://www.rvig.nl/burgerservicenummer
 * Legal basis: Wet algemene bepalingen burgerservicenummer (Wabb) 2007.
 *
 * Format: 9 digits. Inputs of 8 digits are left-padded with `0` per RvIG
 * documentation (the BSN is conceptually a 9-digit identifier whose leading
 * zeroes are sometimes dropped in legacy systems).
 *
 * Check digit ("11-proef" / eleven-test):
 *   sum = 9*d1 + 8*d2 + 7*d3 + 6*d4 + 5*d5 + 4*d6 + 3*d7 + 2*d8 - 1*d9
 *   valid iff sum mod 11 == 0
 *
 * Note: Reject all-zeros (`000000000`) as an administrative placeholder.
 *
 * Confidence: high. Algorithm is published by RvIG in the BPR specification
 * and matches `validator.js isBIC`-adjacent helpers and the community
 * `bsn-validator` package on npm.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{9}$/;
const COUNTRY = "NL";
const CODE = "NL_BSN";

export const bsnSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both", // BSN is the personal ID and the citizen tax/social ID.
  labelKey: "documents.NL_BSN.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length === 8) return `0${digits}`;
    return digits;
  },

  validate(input: string): boolean {
    const digits = this.normalize(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (digits === "000000000") return false;
    return checkBsn(digits);
  },

  format(input: string): string {
    const digits = this.normalize(input);
    if (!RAW_REGEX.test(digits)) return input;
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const raw = stripNonDigits(trimmed);
    if (raw.length < 8) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (raw.length > 9) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    const digits = raw.length === 8 ? `0${raw}` : raw;
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (digits === "000000000") {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkBsn(digits)) {
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

/** Eleven-test: weights `[9,8,7,6,5,4,3,2,-1]`; valid iff sum mod 11 == 0. */
export function checkBsn(digits: string): boolean {
  if (digits.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = digits.charCodeAt(i) - 48;
    sum += d * (9 - i);
  }
  const last = digits.charCodeAt(8) - 48;
  sum -= last;
  return sum % 11 === 0;
}
