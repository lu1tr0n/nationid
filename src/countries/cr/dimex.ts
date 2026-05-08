/**
 * Costa Rica — DIMEX (Documento de Identidad Migratorio para Extranjeros).
 *
 * Issuer: Dirección General de Migración y Extranjería.
 * Source: https://www.migracion.go.cr/
 * Legal basis: Ley General de Migración y Extranjería (Ley 8764, 2009).
 *
 * Format: 11 or 12 digits, no separators on the physical card.
 *   The first digit is `1` for residentes; the remaining digits encode
 *   tipo de residencia + correlativo. Migración has not published a
 *   stable composition formula.
 *
 * Check digit: none publicly documented. Validation is length + numeric
 * only.
 *
 * Confidence: moderate (format only). Length range is documented by
 * Migración; absence of a verifier means we cannot promote to `high`.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{11,12}$/;

export const dimexSpec: DocumentSpec = {
  code: "CR_DIMEX",
  country: "CR",
  scope: "personal",
  labelKey: "documents.CR_DIMEX.label",
  rawRegex: RAW_REGEX,
  // No separators on the physical card; formatted form === raw form.
  formattedRegex: RAW_REGEX,
  mask: "000000000000",
  hasCheckDigit: false,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "CR_DIMEX", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: "CR_DIMEX", reason: { kind: "too_short" } };
    }
    if (digits.length > 12) {
      return { ok: false, code: "CR_DIMEX", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "CR_DIMEX", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "CR_DIMEX",
      normalized: digits,
      formatted: digits,
      confidence: "moderate",
    };
  },
};
