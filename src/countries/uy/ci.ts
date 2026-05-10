/**
 * Uruguay — CI (Cédula de Identidad).
 *
 * Issuer: Dirección Nacional de Identificación Civil (DNIC).
 * Source: https://www.gub.uy/ministerio-interior/
 * Legal basis: Ley 19.515.
 *
 * Format: 8 digits (7 base + 1 DV), displayed as `0.000.000-0`.
 *
 * Check digit: mod-10 weighted.
 *   weights = [2, 9, 8, 7, 6, 3, 4]   (left-to-right over the 7 base digits)
 *   sum     = sum(digit[i] * weights[i])
 *   r       = sum mod 10
 *   dv      = (10 - r) mod 10
 *
 * Confidence: high. The DNIC formula is widely documented and matches
 * `validador-cedula-uruguay`, `cedula-uruguay` and the canonical reference
 * algorithm used by Uruguayan civic-tech repos.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{8}$/;
const FORMATTED_REGEX = /^\d{1}\.\d{3}\.\d{3}-\d$/;
const WEIGHTS = [2, 9, 8, 7, 6, 3, 4] as const;

export const ciSpec: DocumentSpec = {
  code: "UY_CI",
  country: "UY",
  scope: "personal",
  labelKey: "documents.UY_CI.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0.000.000-0",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkDigitCI(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 8) return input;
    return `${digits.slice(0, 1)}.${digits.slice(1, 4)}.${digits.slice(4, 7)}-${digits.slice(7)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "UY_CI", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 8) {
      return { ok: false, code: "UY_CI", reason: { kind: "too_short" } };
    }
    if (digits.length > 8) {
      return { ok: false, code: "UY_CI", reason: { kind: "too_long" } };
    }
    if (!checkDigitCI(digits)) {
      return { ok: false, code: "UY_CI", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "UY_CI",
      normalized: digits,
      formatted: `${digits.slice(0, 1)}.${digits.slice(1, 4)}.${digits.slice(4, 7)}-${digits.slice(7)}`,
      confidence: "high",
    };
  },
};

/** mod-10 with weights [2,9,8,7,6,3,4] over the first 7 digits. */
function checkDigitCI(digits: string): boolean {
  if (digits.length !== 8) return false;
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = digits.charCodeAt(i) - 48;
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const expected = (10 - (sum % 10)) % 10;
  return expected === digits.charCodeAt(7) - 48;
}
