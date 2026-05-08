/**
 * Argentina — CUIT (Clave Única de Identificación Tributaria).
 *
 * Issuer: AFIP, renamed ARCA (Agencia de Recaudación y Control Aduanero) per
 * Decreto 953/2024.
 * Source: https://www.arca.gob.ar/ (formerly afip.gob.ar)
 * Legal basis: RG AFIP 10/1997.
 *
 * Format: 11 digits, displayed as `XX-DDDDDDDD-V`.
 *   - 2 digits: prefix (20/23/24/25/26/27 for personas físicas, 30/33/34 for jurídicas).
 *   - 8 digits: base (DNI for personas naturales).
 *   - 1 digit: verifier.
 *
 * Check digit: mod-11 with weights [5,4,3,2,7,6,5,4,3,2] over the first 10 digits.
 *   r = sum mod 11; dv = 11 - r.
 *   - if dv == 11 -> 0
 *   - if dv == 10 -> the number is invalid by convention. AFIP issues prefix 23/24
 *     instead of 20/27 for those persons (RG AFIP 10/97 § 4) and recomputes.
 *
 * Confidence: high. Algorithm matches AFIP RG 10/1997 and is replicated in
 * `validator.js` and Argentine fintech libraries.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { CUIT_PREFIXES, computeCuitDV } from "./shared.ts";

const RAW_REGEX = /^\d{11}$/;
const FORMATTED_REGEX = /^\d{2}-\d{8}-\d$/;

export const cuitSpec: DocumentSpec = {
  code: "AR_CUIT",
  country: "AR",
  scope: "tax",
  labelKey: "documents.AR_CUIT.label",
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
    return checkCUIT(digits, CUIT_PREFIXES);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 11) return input;
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "AR_CUIT", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: "AR_CUIT", reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: "AR_CUIT", reason: { kind: "too_long" } };
    }
    const prefix = digits.slice(0, 2);
    if (!CUIT_PREFIXES.has(prefix)) {
      return { ok: false, code: "AR_CUIT", reason: { kind: "invalid_format" } };
    }
    const dv = computeCuitDV(digits.slice(0, 10));
    if (dv === null || dv !== digits.charCodeAt(10) - 48) {
      return { ok: false, code: "AR_CUIT", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "AR_CUIT",
      normalized: digits,
      formatted: `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`,
      confidence: "high",
    };
  },
};

function checkCUIT(digits: string, allowedPrefixes: ReadonlySet<string>): boolean {
  if (digits.length !== 11) return false;
  const prefix = digits.slice(0, 2);
  if (!allowedPrefixes.has(prefix)) return false;
  const dv = computeCuitDV(digits.slice(0, 10));
  if (dv === null) return false;
  return dv === digits.charCodeAt(10) - 48;
}
