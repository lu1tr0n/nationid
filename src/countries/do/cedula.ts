/**
 * República Dominicana — Cédula de Identidad y Electoral.
 *
 * Issuer: Junta Central Electoral (JCE).
 * Source: https://www.jce.gob.do/
 * Legal basis: Ley 8/92 de la Cédula de Identidad y Electoral.
 *
 * Format: 11 digits, displayed as `000-0000000-0`.
 *   - 3 digits: municipio (oficina expedidora)
 *   - 7 digits: correlativo
 *   - 1 digit: verifier (Luhn check digit)
 *
 * Check digit: standard Luhn (ISO/IEC 7812-1), applied over all 11 digits.
 *
 * Confidence: moderate. The JCE does not publish the formula in a public PDF;
 * the Luhn variant is documented in `validator.js` (`isIdentityCard('es-DO')`)
 * and in DGII's e-CF community implementations and is the established
 * convention in Dominican fintech.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{11}$/;
const FORMATTED_REGEX = /^\d{3}-\d{7}-\d$/;

export const cedulaSpec: DocumentSpec = {
  code: "DO_CEDULA",
  country: "DO",
  scope: "both", // Used as personal ID and tax ID for natural persons (RNC = cédula).
  labelKey: "documents.DO_CEDULA.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000-0000000-0",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return luhnValid(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 11) return input;
    return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "DO_CEDULA", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: "DO_CEDULA", reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: "DO_CEDULA", reason: { kind: "too_long" } };
    }
    if (!luhnValid(digits)) {
      return { ok: false, code: "DO_CEDULA", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "DO_CEDULA",
      normalized: digits,
      formatted: `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10)}`,
      confidence: "moderate",
    };
  },
};
