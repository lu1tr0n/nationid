/**
 * Guatemala — Pasaporte (`GT_PASAPORTE`).
 *
 * Issuer: Instituto Guatemalteco de Migración (IGM), with civil-registry
 * inputs from RENAP.
 * Source: https://igm.gob.gt/requisitos-para-tramite-de-pasaporte-guatemalteco/,
 *         https://www.copaair.com/assets/Update-in-the-numbering-of-Guatemalan-passports.pdf
 *
 * Format: 2024 numbering update by IGM (per Copa Air carrier notice). Current
 * passports use 9 alphanumeric chars, typically letter-prefix + digits. The
 * exact regex was not extractable from the published PDF, so the spec uses
 * the lenient `^[A-Z0-9]{8,9}$` pattern.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low (IGM has not published the new numbering spec in machine-
 * readable form).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z0-9]{8,9}$/;
const CODE = "GT_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "GT",
  scope: "personal",
  labelKey: "documents.GT_PASAPORTE.label",
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
