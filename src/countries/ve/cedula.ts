/**
 * Venezuela — Cédula de Identidad.
 *
 * Issuer: SAIME (Servicio Administrativo de Identificación, Migración y
 * Extranjería).
 * Source: http://www.saime.gob.ve/
 *
 * Format: 7 to 8 digits, displayed as `V-XXXXXXXX` for venezolanos and
 * `E-XXXXXXXX` for extranjeros residentes.
 *
 * Composition: 1 letter prefix (`V` or `E`) + 7 to 8 correlative digits.
 *
 * Check digit: none. SAIME does not assign a verification digit to the
 * Cédula de Identidad. Validation is **format only**.
 *
 * Confidence: low (format-only).
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";

// Normalized form: letter prefix `V` or `E` followed by 7-8 digits, no separator.
const RAW_REGEX = /^[VE]\d{7,8}$/;
// Accepted formatted forms: with optional hyphen and surrounding whitespace.
const FORMATTED_REGEX = /^[VE]-\d{7,8}$/;

const COUNTRY = "VE";
const CODE = "VE_CEDULA";

function normalizeCedula(input: string): string {
  // Strip everything except digits and the letter prefix; uppercase.
  const cleaned = input.replace(/[^A-Za-z0-9]+/g, "").toUpperCase();
  return cleaned;
}

export const cedulaSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "personal",
  labelKey: "documents.VE_CEDULA.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "A-00000000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return normalizeCedula(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeCedula(input);
    return RAW_REGEX.test(cleaned);
  },

  format(input: string): string {
    const cleaned = normalizeCedula(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `${cleaned.charAt(0)}-${cleaned.slice(1)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = normalizeCedula(trimmed);
    // Accepted total length: prefix (1) + 7..8 digits = 8..9 chars.
    if (cleaned.length < 8) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 9) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `${cleaned.charAt(0)}-${cleaned.slice(1)}`,
      confidence: "low",
    };
  },
};
