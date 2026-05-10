/**
 * Venezuela — Pasaporte (`VE_PASAPORTE`).
 *
 * Issuer: Servicio Administrativo de Identificación, Migración y Extranjería
 * (SAIME).
 * Source: http://www.saime.gob.ve/
 *
 * Format: typically 9 digits numeric on legacy issues; current biometric
 * series add no documented letter prefix. Regex `^[0-9]{8,9}$`.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low (no first-party publication).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[0-9]{8,9}$/;
const CODE = "VE_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "VE" as DocumentSpec["country"],
  scope: "personal",
  labelKey: "documents.VE_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "000000000",
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
