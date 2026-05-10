/**
 * Paraguay — Cédula de Identidad.
 *
 * Issuer: Departamento de Identificaciones — Policía Nacional del Paraguay.
 * Source: https://www.policianacional.gov.py/
 *
 * Format: 6-9 digits, no separators.
 *
 * Check digit: none publicly documented. Validation is length + charset
 * only.
 *
 * Confidence: moderate (format only). Length range is well documented,
 * but the Policía Nacional does not publish a verifier algorithm.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{6,9}$/;

export const ciSpec: DocumentSpec = {
  code: "PY_CI",
  country: "PY",
  scope: "personal",
  labelKey: "documents.PY_CI.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "000000000",
  hasCheckDigit: false,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "PY_CI", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 6) {
      return { ok: false, code: "PY_CI", reason: { kind: "too_short" } };
    }
    if (digits.length > 9) {
      return { ok: false, code: "PY_CI", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "PY_CI", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "PY_CI",
      normalized: digits,
      formatted: digits,
      confidence: "moderate",
    };
  },
};
