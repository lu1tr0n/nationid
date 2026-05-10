/**
 * Canada — Passport (`CA_PASAPORTE`).
 *
 * Issuer: IRCC / Passport Program.
 * Source: https://learn.microsoft.com/en-us/purview/sit-defn-canada-passport-number,
 *         https://en.wikipedia.org/wiki/Canadian_passport
 *
 * Format: 2 uppercase letters + 6 digits (e.g., `AB123456`) on current
 * ePassports. A newer variant (1 letter + 6 digits + 2 letters) has been
 * observed in community reports but is not confirmed by IRCC, so we keep
 * the 2L+6D regex documented by Microsoft Purview.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: high (Microsoft Purview SIT entity, IRCC-aligned).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z]{2}[0-9]{6}$/;
const CODE = "CA_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "CA" as DocumentSpec["country"],
  scope: "personal",
  labelKey: "documents.CA_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "AA000000",
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
    if (cleaned.length > 8) {
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
