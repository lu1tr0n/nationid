/**
 * Perú — Pasaporte (`PE_PASAPORTE`).
 *
 * Issuer: Superintendencia Nacional de Migraciones (Migraciones).
 * Source: https://es.wikipedia.org/wiki/Pasaporte_peruano,
 *         https://sel.migraciones.gob.pe/servmig-valreg/VerificarPAS
 *
 * Format: most current sources report 1 uppercase letter + 8 digits (9 chars).
 * Legacy 9-digit numeric and 8-char alphanumeric variants also circulate.
 * Lenient regex `^[A-Z]?[0-9]{8,9}$` covers all reported shapes.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low (sources contradict on the letter prefix).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z]?[0-9]{8,9}$/;
const CODE = "PE_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "PE",
  scope: "personal",
  labelKey: "documents.PE_PASAPORTE.label",
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
    if (cleaned.length < 8) {
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
