/**
 * Costa Rica — Cédula Jurídica.
 *
 * Issuer: Registro Nacional (Registro de Personas Jurídicas) and Hacienda.
 * Source: https://www.registronacional.go.cr/ ; https://www.hacienda.go.cr/
 *
 * Format: 10 digits, displayed as `3-000-000000`.
 *   - 1 digit: prefix `3` (jurídicas).
 *   - 3 digits: tipo de entidad (101 = sociedad anónima, 102 = SRL, etc.).
 *   - 6 digits: correlativo.
 *
 * Check digit: none. Hacienda matches against the Registro Nacional master
 * record; there is no embedded verifier.
 *
 * Confidence: high (format only). Prefix `3` and 10-digit length are fixed
 * by Hacienda's DGT and Registro Nacional. Note: Hacienda also issues
 * `CR_NITE` for entidades sin cédula jurídica (prefix `5`); that is a
 * separate document type and not handled here.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^3\d{9}$/;
const FORMATTED_REGEX = /^3-\d{3}-\d{6}$/;

export const cedulaJuridicaSpec: DocumentSpec = {
  code: "CR_CEDULA_JURIDICA",
  country: "CR",
  scope: "tax",
  labelKey: "documents.CR_CEDULA_JURIDICA.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0-000-000000",
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
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "CR_CEDULA_JURIDICA", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 10) {
      return { ok: false, code: "CR_CEDULA_JURIDICA", reason: { kind: "too_short" } };
    }
    if (digits.length > 10) {
      return { ok: false, code: "CR_CEDULA_JURIDICA", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      // Length is 10 but prefix is not `3` — out-of-spec.
      return { ok: false, code: "CR_CEDULA_JURIDICA", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "CR_CEDULA_JURIDICA",
      normalized: digits,
      formatted: `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4)}`,
      confidence: "high",
    };
  },
};
