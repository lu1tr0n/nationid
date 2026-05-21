/**
 * Chile — Pasaporte (`CL_PASAPORTE`).
 *
 * Issuer: Servicio de Registro Civil e Identificación (SRCeI).
 * Source: https://en.wikipedia.org/wiki/Chilean_passport
 *
 * Format: until Aug 2013 the passport number equaled the holder's RUN
 * (national ID); since then passport numbers are unique and independent of
 * RUN. Current samples are 8-9 alphanumeric chars (mixed letters + digits).
 *
 * Check digit: none on the printed number. MRZ validation via
 * `algorithms/icao-9303.ts`.
 *
 * Confidence: low (no SRCeI public format spec).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z0-9]{8,9}$/;
const CODE = "CL_PASAPORTE";

export const passportSpec: DocumentSpec = {
  code: CODE,
  country: "CL",
  scope: "personal",
  labelKey: "documents.CL_PASAPORTE.label",
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
