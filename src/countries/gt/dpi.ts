/**
 * Guatemala — DPI / CUI (Documento Personal de Identificación / Código Único
 * de Identificación).
 *
 * Issuer: Registro Nacional de las Personas (RENAP).
 * Source: https://www.renap.gob.gt/
 * Legal basis: Decreto 90-2005, Ley del RENAP.
 *
 * Format: 13 digits, displayed as `0000 00000 0000`.
 *   - 8 digits: correlativo
 *   - 1 digit: verifier
 *   - 2 digits: código departamento (01-22)
 *   - 2 digits: código municipio
 *
 * Check digit (9th position): mod-11 with weights `[2, 3, 4, 5, 6, 7, 8, 9]`
 * left-to-right over the first 8 digits. The verifier equals `sum mod 11`.
 * If the result is 10, RENAP rejects the number — DPIs with DV=10 are not
 * issued. This spec mirrors that constraint.
 *
 * Confidence: moderate. The algorithm is consistent across community
 * implementations and matches RENAP-issued documents in the wild; RENAP does
 * not publish the formula in a citable PDF, so confidence is not `high`.
 */

import { mod11WeightedSum } from "../../algorithms/mod11.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{13}$/;
const FORMATTED_REGEX = /^\d{4} \d{5} \d{4}$/;
const WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9] as const;

export const dpiSpec: DocumentSpec = {
  code: "GT_DPI",
  country: "GT",
  scope: "personal",
  labelKey: "documents.GT_DPI.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000 00000 0000",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkDigitDPI(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 13) return input;
    return `${digits.slice(0, 4)} ${digits.slice(4, 9)} ${digits.slice(9)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "GT_DPI", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 13) {
      return { ok: false, code: "GT_DPI", reason: { kind: "too_short" } };
    }
    if (digits.length > 13) {
      return { ok: false, code: "GT_DPI", reason: { kind: "too_long" } };
    }
    if (!checkDigitDPI(digits)) {
      return { ok: false, code: "GT_DPI", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "GT_DPI",
      normalized: digits,
      formatted: `${digits.slice(0, 4)} ${digits.slice(4, 9)} ${digits.slice(9)}`,
      confidence: "moderate",
    };
  },
};

function checkDigitDPI(digits: string): boolean {
  if (digits.length !== 13) return false;
  const sum = mod11WeightedSum(digits.slice(0, 8), WEIGHTS);
  const r = sum % 11;
  // RENAP does not issue DPIs whose computed verifier would be 10.
  if (r === 10) return false;
  return r === digits.charCodeAt(8) - 48;
}
