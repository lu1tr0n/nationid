/**
 * Perú — Carné de Extranjería (`PE_CE`).
 *
 * Issuer: Migraciones Perú (Superintendencia Nacional de Migraciones).
 * Source: https://www.migraciones.gob.pe/
 *
 * Format: 9-12 digits, no separators. Migraciones has used 9-digit CEs
 * historically; recent issuances stretch to 12 digits to accommodate growth.
 *
 * Check digit: **none publicly documented**.
 *
 * Confidence: low. Format-only validation against the published length range.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{9,12}$/;

export const ceSpec: DocumentSpec = {
  code: "PE_CE",
  country: "PE",
  scope: "personal",
  labelKey: "documents.PE_CE.label",
  rawRegex: RAW_REGEX,
  mask: "000000000000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits) ? digits : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "PE_CE", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 9) {
      return { ok: false, code: "PE_CE", reason: { kind: "too_short" } };
    }
    if (digits.length > 12) {
      return { ok: false, code: "PE_CE", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "PE_CE", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "PE_CE",
      normalized: digits,
      formatted: digits,
      confidence: "low",
    };
  },
};
