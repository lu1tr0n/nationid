/**
 * Honduras — Pasaporte (`HN_PASAPORTE`).
 *
 * Issuer: Instituto Nacional de Migración (INM) and Honduran consulates.
 * Source: https://www.passportindex.org/passport/honduras/
 *
 * Format: most-cited modern format is 1 uppercase letter + 7 digits (often
 * `E` or `A`), but legacy 9-digit numeric issues circulate. Lenient regex
 * `^[A-Z]?[0-9]{7,9}$` covers both shapes.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low (no first-party publication).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z]?[0-9]{7,9}$/;
const CODE = "HN_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "HN",
  scope: "personal",
  labelKey: "documents.HN_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "A00000000",
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
