/**
 * Uruguay — RUT (Registro Único Tributario).
 *
 * Issuer: DGI (Dirección General Impositiva).
 * Source: https://www.dgi.gub.uy/
 * Legal basis: Decreto 597/988.
 *
 * Format: 12 digits.
 *   - 2 digits prefijo (departamento / tipo).
 *   - 6 digits base (número correlativo).
 *   - 3 digits sucursal (`000` for casa matriz).
 *   - 1 DV.
 *
 * Check digit: mod-11 with weights `[4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]`
 * applied **right-to-left** over the 11-digit body.
 *   r  = sum mod 11
 *   dv = 0          if r == 0
 *        1          if r == 1
 *        11 - r     otherwise
 *
 * Confidence: moderate. DGI describes the algorithm in administrative
 * documentation and the formula matches established Uruguayan community
 * libraries, but DGI does not publish a stand-alone normative text.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{12}$/;
const FORMATTED_REGEX = /^\d{2}-?\d{6}-?\d{3}-?\d$/;
const WEIGHTS = [4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export const rutSpec: DocumentSpec = {
  code: "UY_RUT",
  country: "UY",
  scope: "tax",
  labelKey: "documents.UY_RUT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00-000000-000-0",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkDigitRUT(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 12) return input;
    return `${digits.slice(0, 2)}-${digits.slice(2, 8)}-${digits.slice(8, 11)}-${digits.slice(11)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "UY_RUT", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 12) {
      return { ok: false, code: "UY_RUT", reason: { kind: "too_short" } };
    }
    if (digits.length > 12) {
      return { ok: false, code: "UY_RUT", reason: { kind: "too_long" } };
    }
    if (!checkDigitRUT(digits)) {
      return { ok: false, code: "UY_RUT", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "UY_RUT",
      normalized: digits,
      formatted: `${digits.slice(0, 2)}-${digits.slice(2, 8)}-${digits.slice(8, 11)}-${digits.slice(11)}`,
      confidence: "moderate",
    };
  },
};

/**
 * mod-11 with weights [4,3,2,9,8,7,6,5,4,3,2] right-to-left over the body
 * (rightmost body digit pairs with weight 4).
 */
function checkDigitRUT(digits: string): boolean {
  if (digits.length !== 12) return false;
  const body = digits.slice(0, 11);
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const d = body.charCodeAt(body.length - 1 - i) - 48;
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const r = sum % 11;
  let expected: number;
  if (r === 0) expected = 0;
  else if (r === 1) expected = 1;
  else expected = 11 - r;
  return expected === digits.charCodeAt(11) - 48;
}
