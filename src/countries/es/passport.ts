/**
 * España — Pasaporte (`ES_PASAPORTE`).
 *
 * Issuer: Dirección General de la Policía (Cuerpo Nacional de Policía).
 * Source: https://learn.microsoft.com/en-us/purview/sit-defn-spain-passport-number,
 *         https://en.wikipedia.org/wiki/Spanish_passport
 *
 * Format: 3 letters + 6 digits (9 chars) on current biometric passports.
 * Microsoft Purview defines the looser pattern "two digits or letters, one
 * optional digit or letter, six digits" (8 or 9 chars total) which reflects
 * historical variants. We adopt the union: `^[A-Z0-9]{2,3}[0-9]{6}$`.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: high (multiple agreeing community sources + Microsoft Purview
 * SIT entity).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z0-9]{2,3}[0-9]{6}$/;
const CODE = "ES_PASAPORTE";

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "ES",
  scope: "personal",
  labelKey: "documents.ES_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "AAA000000",
  hasCheckDigit: false,
  confidence: "high",

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
      formatted: cleaned,
      confidence: "high",
    };
  },
};
