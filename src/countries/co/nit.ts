/**
 * Colombia — NIT (Número de Identificación Tributaria).
 *
 * Issuer: DIAN (Dirección de Impuestos y Aduanas Nacionales).
 * Source: https://www.dian.gov.co/
 * Legal basis: Estatuto Tributario Art. 555-1; DIAN Concepto 015766.
 *
 * Format: 9-10 base digits + 1 DV. Display: `000000000-0`.
 *   - Personas jurídicas: 9-digit base typically starting with `8` or `9`
 *     (corporate ranges).
 *   - Personas naturales: cédula used as base with a DIAN-computed DV
 *     appended.
 *
 * Check digit: mod-11 with weights `[3, 7, 13, 17, 19, 23, 29, 37, 41, 43]`
 * applied **right-to-left** over the body (truncated to body length).
 *   r  = sum mod 11
 *   dv = r              if r < 2
 *        11 - r         otherwise
 *
 * Confidence: high. DIAN documents the algorithm in Concepto 015766 and the
 * formula matches `validator.js` `isTaxID('es-CO')` and `python-stdnum`
 * `stdnum.co.nit`.
 *
 * All-same-digit bodies (e.g. `000000000-3`) are rejected as administrative
 * placeholders even though some pass the checksum.
 */

import { allSameDigit, stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { computeDianDV } from "./shared.ts";

const RAW_REGEX = /^\d{10,11}$/;
const FORMATTED_REGEX = /^\d{9,10}-\d$/;

export const nitSpec: DocumentSpec = {
  code: "CO_NIT",
  country: "CO",
  scope: "tax",
  labelKey: "documents.CO_NIT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000000000-0",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (allSameDigit(digits)) return false;
    return checkNIT(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    const body = digits.slice(0, -1);
    const dv = digits.slice(-1);
    return `${body}-${dv}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "CO_NIT", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 10) {
      return { ok: false, code: "CO_NIT", reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: "CO_NIT", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "CO_NIT", reason: { kind: "invalid_format" } };
    }
    if (allSameDigit(digits)) {
      return { ok: false, code: "CO_NIT", reason: { kind: "invalid_format" } };
    }
    if (!checkNIT(digits)) {
      return { ok: false, code: "CO_NIT", reason: { kind: "invalid_checksum" } };
    }
    const body = digits.slice(0, -1);
    const dv = digits.slice(-1);
    return {
      ok: true,
      code: "CO_NIT",
      normalized: digits,
      formatted: `${body}-${dv}`,
      confidence: "high",
    };
  },
};

function checkNIT(digits: string): boolean {
  const body = digits.slice(0, -1);
  const expected = computeDianDV(body);
  if (expected < 0) return false;
  return expected === digits.charCodeAt(digits.length - 1) - 48;
}
