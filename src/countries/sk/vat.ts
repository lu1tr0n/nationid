/**
 * Slovakia — IČ DPH (VAT registration number).
 *
 * Issuer: Finančné riaditeľstvo SR / Finančná správa.
 * Source: https://www.financnasprava.sk/
 * Statute: Zákon č. 222/2004 Z. z. o dani z pridanej hodnoty, §4.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.sk.dph`.
 *
 * Format: `SK` + 10 digits. First digit `[1-9]`; third digit (index 2) one
 * of `{2,3,4,7,8,9}`.
 *
 * Check digit: no separate digit — the entire 10-digit numeric value must
 * be divisible by 11.
 *
 * Confidence: high. Algorithm published by Finančná správa; rejecting the
 * python-stdnum "RČ-might-also-be-VAT" branch per v1.7 VERIFICATION §SK.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^SK[1-9]\d[234789]\d{7}$/;
const FORMATTED_REGEX = /^SK \d{10}$/;

const COUNTRY = "SK";
const CODE = "SK_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.SK_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "SK 0000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeVat(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return divisibleBy11(cleaned.slice(2, 12));
  },

  format(input: string): string {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `SK ${cleaned.slice(2, 12)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeVat(trimmed);
    if (cleaned.length < 12) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 12) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!divisibleBy11(cleaned.slice(2, 12))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `SK ${cleaned.slice(2, 12)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("SK")) return cleaned;
  if (/^\d{10}$/.test(cleaned)) return `SK${cleaned}`;
  return cleaned;
}

function divisibleBy11(body10: string): boolean {
  // 10-digit decimal fits comfortably in Number's safe integer range.
  return Number.parseInt(body10, 10) % 11 === 0;
}
