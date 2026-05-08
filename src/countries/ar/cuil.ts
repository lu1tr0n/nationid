/**
 * Argentina — CUIL (Código Único de Identificación Laboral).
 *
 * Issuer: ANSES (Administración Nacional de la Seguridad Social).
 * Source: https://www.anses.gob.ar/
 *
 * Format: 11 digits, displayed as `XX-DDDDDDDD-V`.
 *   - 2 digits: prefix (20 for masculino, 27 for femenino, 23/24 reassigned
 *     when CUIT verifier produces dv == 10).
 *   - 8 digits: DNI base.
 *   - 1 digit: verifier (same algorithm as CUIT).
 *
 * Check digit: identical to CUIT — mod-11 with weights [5,4,3,2,7,6,5,4,3,2]
 * over the first 10 digits.
 *
 * Confidence: high. ANSES uses the same algorithm as AFIP's CUIT.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { CUIL_PREFIXES, computeCuitDV } from "./shared.ts";

const RAW_REGEX = /^\d{11}$/;
const FORMATTED_REGEX = /^\d{2}-\d{8}-\d$/;

export const cuilSpec: DocumentSpec = {
  code: "AR_CUIL",
  country: "AR",
  scope: "personal",
  labelKey: "documents.AR_CUIL.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00-00000000-0",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkCUIL(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 11) return input;
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "AR_CUIL", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: "AR_CUIL", reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: "AR_CUIL", reason: { kind: "too_long" } };
    }
    const prefix = digits.slice(0, 2);
    if (!CUIL_PREFIXES.has(prefix)) {
      return { ok: false, code: "AR_CUIL", reason: { kind: "invalid_format" } };
    }
    const dv = computeCuitDV(digits.slice(0, 10));
    if (dv === null || dv !== digits.charCodeAt(10) - 48) {
      return { ok: false, code: "AR_CUIL", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "AR_CUIL",
      normalized: digits,
      formatted: `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`,
      confidence: "high",
    };
  },
};

function checkCUIL(digits: string): boolean {
  if (digits.length !== 11) return false;
  const prefix = digits.slice(0, 2);
  if (!CUIL_PREFIXES.has(prefix)) return false;
  const dv = computeCuitDV(digits.slice(0, 10));
  if (dv === null) return false;
  return dv === digits.charCodeAt(10) - 48;
}
