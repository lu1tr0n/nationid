/**
 * Panamá — Pasaporte (`PA_PASAPORTE`).
 *
 * Issuer: Autoridad de Pasaportes de Panamá (Ministerio de Relaciones
 * Exteriores).
 * Source: https://www.pasaportes.gob.pa/
 *
 * Format: typically 8 digits numeric, occasionally with a 2-letter prefix
 * such as `PA`. Lenient regex `^[A-Z]{0,2}[0-9]{6,8}$`.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z]{0,2}[0-9]{6,8}$/;
const CODE = "PA_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "PA" as DocumentSpec["country"],
  scope: "personal",
  labelKey: "documents.PA_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "AA000000",
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
    if (cleaned.length > 10) {
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
