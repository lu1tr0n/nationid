/**
 * Switzerland — AHV-Nummer / Numéro AVS / Numero AVS.
 * (Sozialversicherungs-/Versichertennummer.)
 *
 * Issuer: Zentrale Ausgleichsstelle (ZAS / CdC).
 * Source: https://www.zas.admin.ch/
 *
 * Format: 13 digits, always starting with `756` (the ISO 3166 numeric code
 * for Switzerland). Visual `756.1234.5678.97`.
 *
 * Check digit: EAN-13 / GS1 mod-10 with alternating weights `1,3,1,3,...`
 * applied left-to-right over the first 12 digits. The check digit is the
 * smallest non-negative number that, when added to the weighted sum, makes
 * the total a multiple of 10. Equivalently, `dv = (10 - (sum mod 10)) mod 10`.
 *
 * Confidence: high. Algorithm is published by the Bundesamt für Statistik
 * for the AHV redesign of 2008 and matches `python-stdnum.ch.ssn`.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^756\d{10}$/;
const FORMATTED_REGEX = /^756\.\d{4}\.\d{4}\.\d{2}$/;
const COUNTRY = "CH";
const CODE = "CH_AHV";

export const ahvSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "personal",
  labelKey: "documents.CH_AHV.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "756.0000.0000.00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkAhv(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `756.${digits.slice(3, 7)}.${digits.slice(7, 11)}.${digits.slice(11, 13)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 13) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 13) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkAhv(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `756.${digits.slice(3, 7)}.${digits.slice(7, 11)}.${digits.slice(11, 13)}`,
      confidence: "high",
    };
  },
};

/** EAN-13 mod-10: weights 1,3,1,3,... over digits 1..12 left-to-right. */
function checkAhv(digits: string): boolean {
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = digits.charCodeAt(i) - 48;
    sum += d * (i % 2 === 0 ? 1 : 3);
  }
  const expected = (10 - (sum % 10)) % 10;
  return expected === digits.charCodeAt(12) - 48;
}
