/**
 * Argentina — DNI (Documento Nacional de Identidad).
 *
 * Issuer: RENAPER (Registro Nacional de las Personas).
 * Source: https://www.argentina.gob.ar/dni
 * Legal basis: Ley 17.671.
 *
 * Format: 7-8 digits, displayed with thousands separators as `00.000.000`.
 *
 * Check digit: none on the DNI itself. Validation is format and length only.
 *
 * Confidence: high (format only — RENAPER does not publish a check-digit
 * algorithm for the DNI alone; the verifier digit lives on CUIT/CUIL).
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{7,8}$/;
const FORMATTED_REGEX = /^\d{1,2}\.\d{3}\.\d{3}$/;

export const dniSpec: DocumentSpec = {
  code: "AR_DNI",
  country: "AR",
  scope: "personal",
  labelKey: "documents.AR_DNI.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00.000.000",
  hasCheckDigit: false,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length < 7 || digits.length > 8) return input;
    // Thousands separators: split last 3, then last 3 of the remainder.
    const last3 = digits.slice(-3);
    const mid3 = digits.slice(-6, -3);
    const head = digits.slice(0, -6);
    return `${head}.${mid3}.${last3}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "AR_DNI", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 7) {
      return { ok: false, code: "AR_DNI", reason: { kind: "too_short" } };
    }
    if (digits.length > 8) {
      return { ok: false, code: "AR_DNI", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "AR_DNI", reason: { kind: "invalid_format" } };
    }
    const last3 = digits.slice(-3);
    const mid3 = digits.slice(-6, -3);
    const head = digits.slice(0, -6);
    return {
      ok: true,
      code: "AR_DNI",
      normalized: digits,
      formatted: `${head}.${mid3}.${last3}`,
      confidence: "high",
    };
  },
};
