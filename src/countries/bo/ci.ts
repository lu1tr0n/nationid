/**
 * Bolivia — CI (Cédula de Identidad).
 *
 * Issuer: SEGIP (Servicio General de Identificación Personal).
 * Source: https://www.segip.gob.bo/
 * Legal basis: Ley 145/2011 (Ley del Servicio General de Identificación Personal).
 *
 * Format: 6-9 digits, optionally followed by a 2-letter departmental
 * complement (LP, CB, SC, OR, PT, CH, TJ, BE, PA). Common visual form:
 * `1234567 LP` or `1234567-LP`.
 *
 * Departmental codes:
 *   LP=La Paz, CB=Cochabamba, SC=Santa Cruz, OR=Oruro, PT=Potosí,
 *   CH=Chuquisaca, TJ=Tarija, BE=Beni, PA=Pando.
 *
 * Check digit: none publicly documented. Validation is length + charset only.
 *
 * Confidence: moderate (format only). SEGIP does not publish a verifier
 * algorithm and length is variable.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/** Normalized: 6-9 digits, optionally followed by 2-letter dept code. */
const RAW_REGEX = /^\d{6,9}(LP|CB|SC|OR|PT|CH|TJ|BE|PA)?$/;
/** Formatted: digits + space or hyphen + 2-letter dept (or bare digits). */
const FORMATTED_REGEX = /^\d{6,9}([ -](LP|CB|SC|OR|PT|CH|TJ|BE|PA))?$/;

export const ciSpec: DocumentSpec = {
  code: "BO_CI",
  country: "BO",
  scope: "personal",
  labelKey: "documents.BO_CI.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  // Variable-length; mask covers the longest visual form.
  mask: "000000000-AA",
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
    if (!RAW_REGEX.test(cleaned)) return input;
    const match = cleaned.match(/^(\d{6,9})([A-Z]{2})?$/);
    if (!match) return input;
    const digits = match[1] ?? "";
    const dept = match[2];
    return dept ? `${digits}-${dept}` : digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "BO_CI", reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    // The numeric part must be at least 6 digits. The trailing dept code is
    // at most 2 letters (LP, CB, SC, etc.), so the bounded quantifier
    // `{0,2}` matches the actual semantic max and avoids any ReDoS concern
    // a `+` would raise on uncontrolled input.
    const digitsOnly = cleaned.replace(/[A-Z]{0,2}$/, "");
    if (digitsOnly.length < 6) {
      return { ok: false, code: "BO_CI", reason: { kind: "too_short" } };
    }
    if (digitsOnly.length > 9) {
      return { ok: false, code: "BO_CI", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: "BO_CI", reason: { kind: "invalid_format" } };
    }
    const match = cleaned.match(/^(\d{6,9})([A-Z]{2})?$/);
    const digits = match?.[1] ?? cleaned;
    const dept = match?.[2];
    return {
      ok: true,
      code: "BO_CI",
      normalized: cleaned,
      formatted: dept ? `${digits}-${dept}` : digits,
      confidence: "moderate",
    };
  },
};
