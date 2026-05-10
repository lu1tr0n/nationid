/**
 * Paraguay — Pasaporte (`PY_PASAPORTE`).
 *
 * Issuer: Departamento de Identificaciones de la Policía Nacional.
 * Source: https://www.policianacional.gov.py/
 *
 * Format: typically 6-8 digits numeric on legacy issues; biometric passports
 * may use letter + digits. Lenient regex `^[A-Z0-9]{6,9}$`.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low (no first-party publication).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z0-9]{6,9}$/;
const CODE = "PY_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "PY" as DocumentSpec["country"],
  scope: "personal",
  labelKey: "documents.PY_PASAPORTE.label",
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
    if (cleaned.length < 6) {
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
