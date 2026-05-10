/**
 * Bolivia — Pasaporte (`BO_PASAPORTE`).
 *
 * Issuer: SEGIP / Dirección General de Migración.
 * Source: https://en.wikipedia.org/wiki/Visa_requirements_for_Bolivian_citizens
 *
 * Format: Andean Community common design (since 2005). Numbers are typically
 * 6-8 digits, sometimes with a single letter prefix. Lenient regex
 * `^[A-Z0-9]{6,9}$`.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low (no first-party spec located).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z0-9]{6,9}$/;
const CODE = "BO_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "BO" as DocumentSpec["country"],
  scope: "personal",
  labelKey: "documents.BO_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "AAAAAAAAA",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned) ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 6) {
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
      formatted: cleaned,
      confidence: "low",
    };
  },
};
