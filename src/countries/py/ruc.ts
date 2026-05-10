/**
 * Paraguay — RUC (Registro Único de Contribuyentes).
 *
 * Issuer: SET (Subsecretaría de Estado de Tributación).
 * Source: https://www.set.gov.py/
 * Legal basis: Ley 125/91 (Sistema Tributario).
 *
 * Format: 6-9 base digits + 1 DV. Visual form: `12345678-9`.
 *
 * Check digit: mod-11 with weights ascending `2..N` right-to-left over the
 * base digits (excluding the DV).
 *
 *   sum = sum(digit_i * weight_i)   weights start at 2 from the rightmost base digit
 *   r   = sum mod 11
 *   dv  = (r > 1) ? 11 - r : 0
 *
 * Confidence: moderate. SET does not publish a single canonical document
 * but the algorithm is implemented identically in the `paraguay-ruc` npm
 * package and several SET-aligned vendor tools.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/** Normalized: 7-10 digits (6-9 base + 1 DV). */
const RAW_REGEX = /^\d{7,10}$/;
/** Formatted: `123456789-0` (base + hyphen + DV). */
const FORMATTED_REGEX = /^\d{6,9}-\d$/;

export const rucSpec: DocumentSpec = {
  code: "PY_RUC",
  country: "PY",
  scope: "tax",
  labelKey: "documents.PY_RUC.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000000000-0",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkRUC(digits);
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
      return { ok: false, code: "PY_RUC", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 7) {
      return { ok: false, code: "PY_RUC", reason: { kind: "too_short" } };
    }
    if (digits.length > 10) {
      return { ok: false, code: "PY_RUC", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "PY_RUC", reason: { kind: "invalid_format" } };
    }
    if (!checkRUC(digits)) {
      return { ok: false, code: "PY_RUC", reason: { kind: "invalid_checksum" } };
    }
    const body = digits.slice(0, -1);
    const dv = digits.slice(-1);
    return {
      ok: true,
      code: "PY_RUC",
      normalized: digits,
      formatted: `${body}-${dv}`,
      confidence: "moderate",
    };
  },
};

function checkRUC(digits: string): boolean {
  const body = digits.slice(0, -1);
  const expected = computeRucDV(body);
  if (expected < 0) return false;
  return expected === digits.charCodeAt(digits.length - 1) - 48;
}

/** mod-11 with ascending weights 2..N right-to-left. */
export function computeRucDV(body: string): number {
  if (body.length === 0) return -1;
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    // Rightmost base digit gets weight 2; weight grows left.
    const idx = body.length - 1 - i;
    const d = body.charCodeAt(idx) - 48;
    const w = 2 + i;
    sum += d * w;
  }
  const r = sum % 11;
  return r > 1 ? 11 - r : 0;
}
