/**
 * Poland — NIP (Numer Identyfikacji Podatkowej).
 *
 * Issuer: Krajowa Administracja Skarbowa (KAS).
 * Source: https://www.podatki.gov.pl/
 * Legal basis: Ustawa o zasadach ewidencji i identyfikacji podatników i
 *              płatników (1995).
 *
 * Format: 10 digits. Visual `123-456-78-90` or `1234567890`.
 *
 * Check digit:
 *   weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
 *   sum = sum(weights[i] * digit[i]) for i in 0..8
 *   r = sum mod 11
 *   if r == 10 -> reject (NIP would be reissued without that body)
 *   else       -> dv = r
 *
 * Confidence: high. Algorithm published by KAS and reproduced verbatim
 * in `python-stdnum.pl.nip`, the npm `pl-nip` package and
 * `validator.js isTaxID('pl-PL')`.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{10}$/;
const FORMATTED_REGEX = /^\d{3}-\d{3}-\d{2}-\d{2}$/;
const WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const;
const COUNTRY = "PL";
const CODE = "PL_NIP";

export const nipSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.PL_NIP.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000-000-00-00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkNip(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
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
    if (!checkNip(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`,
      confidence: "high",
    };
  },
};

function checkNip(digits: string): boolean {
  if (digits.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = digits.charCodeAt(i) - 48;
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const r = sum % 11;
  if (r === 10) return false; // NIP would not be issued.
  return r === digits.charCodeAt(9) - 48;
}
