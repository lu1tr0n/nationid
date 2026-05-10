/**
 * United States — Passport (`US_PASAPORTE`).
 *
 * Issuer: U.S. Department of State, Bureau of Consular Affairs.
 * Source: https://travel.state.gov/content/travel/en/passports/passport-help/next-generation-passport.html,
 *         https://en.wikipedia.org/wiki/United_States_passport
 *
 * Format: legacy 9 digits; Next Generation Passport (NGP, rolled out 2021+)
 * uses 1 letter + 8 digits. Both circulate concurrently. Regex
 * `^([A-Z][0-9]{8}|[0-9]{9})$`.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: moderate (State Dept FAQ confirms the NGP letter prefix; no
 * single canonical regex published).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^([A-Z][0-9]{8}|[0-9]{9})$/;
const CODE = "US_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "US",
  scope: "personal",
  labelKey: "documents.US_PASAPORTE.label",
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
