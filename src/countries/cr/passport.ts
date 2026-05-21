/**
 * Costa Rica — Pasaporte (`CR_PASAPORTE`).
 *
 * Issuer: Dirección General de Migración y Extranjería (DGME CR).
 * Source: https://en.wikipedia.org/wiki/Costa_Rican_passport,
 *         https://www.gi-de.com/en/spotlight/digital-security/costa-rica-the-art-of-passport-security
 *
 * Format: biometric ePassport (G+D, since 2021). Numbers are 9 chars
 * alphanumeric, often letter-prefixed.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low (no first-party publication of the format spec).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z0-9]{9}$/;
const CODE = "CR_PASAPORTE";

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "CR",
  scope: "personal",
  labelKey: "documents.CR_PASAPORTE.label",
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
      confidence: "low",
    };
  },
};
