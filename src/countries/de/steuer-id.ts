/**
 * Germany — Steuer-Identifikationsnummer (IdNr).
 *
 * Issuer: Bundeszentralamt für Steuern.
 * Source: https://www.bzst.de/
 * Legal basis: § 139b Abgabenordnung (AO).
 *
 * Format: 11 digits. The first digit is non-zero. Visually grouped as
 *   `00 000 000 000` (2-3-3-3) on the BZSt notification letter.
 *
 * Composition rules within the first 10 digits:
 *   - Exactly one digit must repeat (2 or 3 times).
 *   - All other digits in the first 10 must be unique.
 *   - The 11th digit is the check digit per ISO/IEC 7064 MOD 11,10.
 *
 * Check digit (ISO/IEC 7064 MOD 11,10):
 *   check = 10
 *   for each digit d in body (10 digits):
 *     p = (d + check) mod 10
 *     if p == 0: p = 10
 *     check = (p * 2) mod 11
 *   dv = (11 - check) mod 10
 *
 * Confidence: high. Algorithm published by the Bundeszentralamt für Steuern
 * and replicated by `validator.js isTaxID('de-DE')` and `python-stdnum.de.idnr`.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[1-9]\d{10}$/;
const FORMATTED_REGEX = /^\d{2} \d{3} \d{3} \d{3}$/;

const COUNTRY = "DE" as CountryCode;
// TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
const CODE = "DE_STEUER_ID" as DocumentTypeCode;

export const steuerIdSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both",
  labelKey: "documents.DE_STEUER_ID.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00 000 000 000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (!hasValidRepeatPattern(digits.slice(0, 10))) return false;
    return computeMod1110DV(digits.slice(0, 10)) === digits.charCodeAt(10) - 48;
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
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
    if (!hasValidRepeatPattern(digits.slice(0, 10))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (computeMod1110DV(digits.slice(0, 10)) !== digits.charCodeAt(10) - 48) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`,
      confidence: "high",
    };
  },
};

/**
 * § 139b AO requires that within the first 10 digits exactly one digit repeats
 * (twice or three times) and the remaining digits are unique. This rules out
 * placeholder-like patterns such as `0000000000`.
 */
function hasValidRepeatPattern(body10: string): boolean {
  const counts = new Map<string, number>();
  for (const c of body10) counts.set(c, (counts.get(c) ?? 0) + 1);
  let repeats = 0;
  let repeatCount = 0;
  for (const v of counts.values()) {
    if (v > 1) {
      repeats++;
      repeatCount = v;
    }
  }
  return repeats === 1 && (repeatCount === 2 || repeatCount === 3);
}

/** ISO/IEC 7064 MOD 11,10 check digit for a 10-digit body. */
function computeMod1110DV(body10: string): number {
  let check = 10;
  for (let i = 0; i < body10.length; i++) {
    const d = body10.charCodeAt(i) - 48;
    let p = (d + check) % 10;
    if (p === 0) p = 10;
    check = (p * 2) % 11;
  }
  return (11 - check) % 10;
}
