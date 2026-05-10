/**
 * Bolivia — NIT (Número de Identificación Tributaria).
 *
 * Issuer: SIN (Servicio de Impuestos Nacionales).
 * Source: https://www.impuestos.gob.bo/
 * Legal basis: RND 102100000011/2021 (NIT migration to 13 digits).
 *
 * Format: 7-13 digits. Two coexisting layouts:
 *   - Legacy NIT: 7-11 digits (assigned before the 2021 migration).
 *   - New NIT: 13 digits (CI + computed DV; assigned 2021+).
 *
 * Check digit: SIN does not publish a verifier algorithm for legacy NITs.
 * The new 13-digit NIT corresponds to the natural person's CI plus a
 * derived DV, but the formula is not officially documented. Both formats
 * are validated by length + charset only.
 *
 * Confidence: low. Format only.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{7,13}$/;

export const nitSpec: DocumentSpec = {
  code: "BO_NIT",
  country: "BO",
  scope: "tax",
  labelKey: "documents.BO_NIT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "0000000000000",
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
    if (!RAW_REGEX.test(digits)) return input;
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "BO_NIT", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 7) {
      return { ok: false, code: "BO_NIT", reason: { kind: "too_short" } };
    }
    if (digits.length > 13) {
      return { ok: false, code: "BO_NIT", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "BO_NIT", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "BO_NIT",
      normalized: digits,
      formatted: digits,
      confidence: "low",
    };
  },
};
