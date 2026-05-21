/**
 * Uruguay — Pasaporte (`UY_PASAPORTE`).
 *
 * Issuer: Dirección Nacional de Identificación Civil (DNIC).
 * Source: https://www.gub.uy/ministerio-interior/
 *
 * Format: typically 1 uppercase letter + 6 digits, total 7 chars
 * (e.g., `B123456`).
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z][0-9]{6}$/;
const CODE = "UY_PASAPORTE";

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "UY",
  scope: "personal",
  labelKey: "documents.UY_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "A000000",
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
    if (cleaned.length < 7) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 7) {
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
