/**
 * Brasil — Passaporte (`BR_PASAPORTE`).
 *
 * Issuer: Polícia Federal (under Ministério das Relações Exteriores).
 * Source: https://en.wikipedia.org/wiki/Brazilian_passport,
 *         https://www.gov.br/pf/pt-br
 *
 * Format: 2 uppercase letters + 6 digits (8 chars total). Common prefixes:
 * `FA`..`FZ`, `GA`.. (sequential issuance batches). Example: `FF123456`.
 * The MRZ field is the printed 8 chars right-padded with one `<` filler.
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: moderate (consistent across KYC vendors; no PF-published spec).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z]{2}[0-9]{6}$/;
const CODE = "BR_PASAPORTE" as DocumentTypeCode;

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "BR",
  scope: "personal",
  labelKey: "documents.BR_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "AA000000",
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
      confidence: "moderate",
    };
  },
};
