/**
 * Costa Rica — Cédula de Identidad (Persona Física).
 *
 * Issuer: Tribunal Supremo de Elecciones (TSE) — Registro Civil.
 * Source: https://www.tse.go.cr/
 * Legal basis: Código Electoral; Ley Orgánica del TSE.
 *
 * Format: 9 digits, displayed as `0-0000-0000`.
 *   - 1 digit: provincia (1-9; 1-7 are the historically issued provincias —
 *     San José, Alajuela, Cartago, Heredia, Guanacaste, Puntarenas, Limón —
 *     8 reserved for naturalizados, 9 reserved for special cases).
 *   - 4 digits: tomo
 *   - 4 digits: asiento
 *
 * Hacienda's DGT internally pads to 10 digits with a leading `0` for tax
 * filings; the consumer-facing form is always 9 digits and the leading `0`
 * is rejected here as out-of-spec.
 *
 * Check digit: none. The TSE does not publish a public verifier algorithm,
 * and the 9-digit cédula carries no embedded checksum.
 *
 * Confidence: high (format-only). Format is fixed by Código Electoral and
 * matches every TSE-published cédula sample.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[1-9]\d{8}$/;
const FORMATTED_REGEX = /^[1-9]-\d{4}-\d{4}$/;

export const cedulaFisicaSpec: DocumentSpec = {
  code: "CR_CEDULA_FISICA",
  country: "CR",
  scope: "both", // Cédula identifies a natural person and is the personal tax ID.
  labelKey: "documents.CR_CEDULA_FISICA.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0-0000-0000",
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
    return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "CR_CEDULA_FISICA", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 9) {
      return { ok: false, code: "CR_CEDULA_FISICA", reason: { kind: "too_short" } };
    }
    if (digits.length > 9) {
      return { ok: false, code: "CR_CEDULA_FISICA", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      // Length is 9 but provincia is 0 — out-of-spec.
      return { ok: false, code: "CR_CEDULA_FISICA", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "CR_CEDULA_FISICA",
      normalized: digits,
      formatted: `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`,
      confidence: "high",
    };
  },
};
