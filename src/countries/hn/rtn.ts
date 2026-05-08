/**
 * Honduras — RTN (Registro Tributario Nacional).
 *
 * Issuer: Servicio de Administración de Rentas (SAR).
 * Source: https://www.sar.gob.hn/
 * Legal basis: Decreto 17-2010, Código Tributario.
 *
 * Format: 14 digits, no canonical separator.
 *   - For persona natural: 13-digit DNI + 1 secuencial digit.
 *   - For persona jurídica: 14-digit correlativo assigned by SAR.
 *
 * Check digit: **not publicly documented** by SAR. Some commercial billing
 * platforms implement an internal verifier; the algorithm has not been
 * independently confirmed against official source. This spec validates
 * **length and structural** constraints only and requires callers needing
 * canonical confirmation to query the SAR API.
 *
 * Confidence: `unconfirmed`.
 *
 * Structural constraints:
 *   - 14 digits, all digits.
 *   - Reject the all-zero placeholder.
 *   - Reject all-same-digit sequences (placeholder convention).
 */

import { allSameDigit, stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{14}$/;
/** SAR forms occasionally show RTN as `0000-0000-000000` (4-4-6). */
const FORMATTED_REGEX = /^\d{4}-\d{4}-\d{6}$/;

export const rtnSpec: DocumentSpec = {
  code: "HN_RTN",
  country: "HN",
  scope: "tax",
  labelKey: "documents.HN_RTN.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000-0000-000000",
  hasCheckDigit: false,
  confidence: "unconfirmed",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (allSameDigit(digits)) return false;
    return true;
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 14) return input;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "HN_RTN", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 14) {
      return { ok: false, code: "HN_RTN", reason: { kind: "too_short" } };
    }
    if (digits.length > 14) {
      return { ok: false, code: "HN_RTN", reason: { kind: "too_long" } };
    }
    if (allSameDigit(digits)) {
      return { ok: false, code: "HN_RTN", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "HN_RTN",
      normalized: digits,
      formatted: `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`,
      confidence: "unconfirmed",
    };
  },
};
