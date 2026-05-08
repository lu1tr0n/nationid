/**
 * El Salvador — NIT (Número de Identificación Tributaria).
 *
 * Issuer: Ministerio de Hacienda — Dirección General de Impuestos Internos.
 * Source: https://www.mh.gob.sv/ (DTE schema FE v1, CCF v3, CAT-022).
 *
 * Format: 14 digits displayed as `AAAA-DDMMYY-NNN-D`.
 *   - 4 digits: municipio
 *   - 6 digits: ddmmyy (date of birth or constitution)
 *   - 3 digits: correlative
 *   - 1 digit: check
 *
 * Check digit: mod-11 weighted, weights 14..2 over first 13 digits;
 * verifier = 11 - (sum mod 11), with mod==0 → 0, mod==1 → 1.
 *
 * Confidence: moderate. Algorithm reverse-engineered from libraries; MH does
 * not publish a public formula but DGII validates the result.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{14}$/;
const FORMATTED_REGEX = /^\d{4}-\d{6}-\d{3}-\d$/;
const WEIGHTS = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export const nitSpec: DocumentSpec = {
  code: "SV_NIT",
  country: "SV",
  scope: "tax",
  labelKey: "documents.SV_NIT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000-000000-000-0",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkDigitNIT(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 14) return input;
    return `${digits.slice(0, 4)}-${digits.slice(4, 10)}-${digits.slice(10, 13)}-${digits.slice(13)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "SV_NIT", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 14) {
      return { ok: false, code: "SV_NIT", reason: { kind: "too_short" } };
    }
    if (digits.length > 14) {
      return { ok: false, code: "SV_NIT", reason: { kind: "too_long" } };
    }
    if (!checkDigitNIT(digits)) {
      return { ok: false, code: "SV_NIT", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "SV_NIT",
      normalized: digits,
      formatted: `${digits.slice(0, 4)}-${digits.slice(4, 10)}-${digits.slice(10, 13)}-${digits.slice(13)}`,
      confidence: "moderate",
    };
  },
};

function checkDigitNIT(digits: string): boolean {
  if (digits.length !== 14) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const d = digits.charCodeAt(i) - 48;
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const mod = sum % 11;
  let expected: number;
  if (mod === 0) expected = 0;
  else if (mod === 1) expected = 1;
  else expected = 11 - mod;
  return expected === digits.charCodeAt(13) - 48;
}
