/**
 * República Dominicana — Pasaporte (`DO_PASAPORTE`).
 *
 * Issuer: Dirección General de Pasaportes (DGP).
 * Source: https://www.consilium.europa.eu/prado/en/prado-documents/dom/a/docs-per-category.html,
 *         https://dr1.com/forums/threads/dominican-passport-numbers.396022/
 *
 * Format: 2-letter office prefix + 7 digits (9 chars total). The 2-letter
 * prefix encodes the issuing office: `SD` (Santo Domingo), `PP` (Puerto
 * Plata), and similar codes for consular offices abroad.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: moderate (consistent reports on PRADO catalog and community
 * sources; no DGP-published format spec).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z]{2}[0-9]{7}$/;
const CODE = "DO_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "DO",
  scope: "personal",
  labelKey: "documents.DO_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "AA0000000",
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
