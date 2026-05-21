/**
 * Argentina — Pasaporte (`AR_PASAPORTE`).
 *
 * Issuer: Registro Nacional de las Personas (RENAPER).
 * Source: https://en.wikipedia.org/wiki/Argentine_passport
 *
 * Format: legacy issuances used a 9-digit numeric sequential number; post-2012
 * passports carry a pseudo-random alphanumeric of similar length (8-9 chars,
 * letters + digits) for higher entropy. Lenient regex `^[A-Z0-9]{8,9}$`
 * covers both eras.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low (no published spec for the post-2012 alphanumeric format).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z0-9]{8,9}$/;
const CODE = "AR_PASAPORTE";

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "AR",
  scope: "personal",
  labelKey: "documents.AR_PASAPORTE.label",
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
      confidence: "low",
    };
  },
};
