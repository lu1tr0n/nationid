/**
 * Portugal — Passaporte (`PT_PASAPORTE`).
 *
 * Issuer: Instituto dos Registos e do Notariado (IRN, ePassport since 2006;
 * SEF replaced by AIMA in 2023).
 * Source: https://learn.microsoft.com/en-us/purview/sit-defn-portugal-passport-number,
 *         https://en.wikipedia.org/wiki/Portuguese_passport
 *
 * Format: 1 uppercase letter + 6 digits (7 chars). Letter case-insensitive
 * on some readers but uppercase on the printed page.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: moderate (multiple agreeing secondary sources).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z][0-9]{6}$/;
const CODE = "PT_PASAPORTE";

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "PT",
  scope: "personal",
  labelKey: "documents.PT_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "A000000",
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
      confidence: "moderate",
    };
  },
};
