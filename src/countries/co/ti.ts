/**
 * Colombia — Tarjeta de Identidad (`CO_TI`).
 *
 * Issuer: Registraduría Nacional del Estado Civil.
 * Source: https://www.registraduria.gov.co/
 *
 * Identity document for minors (under 18). At majority age, the holder is
 * issued a Cédula de Ciudadanía (`CO_CC`) keeping the same base number.
 *
 * Format: 10-11 digits, no separators.
 *
 * Check digit: **none**. Same situation as the Cédula de Ciudadanía.
 *
 * Confidence: low. Format-only validation.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{10,11}$/;

export const tiSpec: DocumentSpec = {
  code: "CO_TI",
  country: "CO",
  scope: "personal",
  labelKey: "documents.CO_TI.label",
  rawRegex: RAW_REGEX,
  mask: "00000000000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits) ? digits : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "CO_TI", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 10) {
      return { ok: false, code: "CO_TI", reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: "CO_TI", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "CO_TI", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "CO_TI",
      normalized: digits,
      formatted: digits,
      confidence: "low",
    };
  },
};
