/**
 * Colombia — Cédula de Extranjería (`CO_CE`).
 *
 * Issuer: Migración Colombia.
 * Source: https://www.migracioncolombia.gov.co/
 *
 * Format: 6-8 digits, no separators (typically 6-7 digits; up to 8 in newer
 * issuances).
 *
 * Check digit: **none** publicly documented.
 *
 * Confidence: low. Format-only validation against published length range.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{6,8}$/;

export const ceSpec: DocumentSpec = {
  code: "CO_CE",
  country: "CO",
  scope: "personal",
  labelKey: "documents.CO_CE.label",
  rawRegex: RAW_REGEX,
  mask: "00000000",
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
      return { ok: false, code: "CO_CE", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 6) {
      return { ok: false, code: "CO_CE", reason: { kind: "too_short" } };
    }
    if (digits.length > 8) {
      return { ok: false, code: "CO_CE", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "CO_CE", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "CO_CE",
      normalized: digits,
      formatted: digits,
      confidence: "low",
    };
  },
};
