/**
 * México — Pasaporte (`MX_PASAPORTE`).
 *
 * Issuer: Secretaría de Relaciones Exteriores (SRE).
 * Source: https://en.wikipedia.org/wiki/Mexican_passport,
 *         https://trustdochub.com/en/verify-mexican-passport/
 *
 * Format: 1 uppercase letter + 8 digits (9 chars total). Current series start
 * with `G` and `N`; example: `G12345678`. The MRZ document-number field
 * carries the same 9 chars, no padding.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: moderate (multiple secondary confirmations including consular
 * guides; SRE has not published the format spec).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z][0-9]{8}$/;
const CODE = "MX_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "MX",
  scope: "personal",
  labelKey: "documents.MX_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "A00000000",
  hasCheckDigit: false,
  confidence: "moderate",

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
    if (cleaned.length < 9) {
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
      confidence: "moderate",
    };
  },
};
