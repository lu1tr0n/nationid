/**
 * El Salvador — DUI (Documento Único de Identidad).
 *
 * Issuer: Registro Nacional de las Personas Naturales (RNPN).
 * Source: https://www.rnpn.gob.sv/
 *
 * Format: 9 digits, displayed as `XXXXXXXX-X` (8 digits + check digit).
 *
 * Check digit: mod-10 weighted. Weights 9..2 over the first 8 digits;
 * verifier = (10 - (sum mod 10)) mod 10.
 *
 * Confidence: moderate. RNPN does not publish the check-digit formula
 * publicly; it is widely documented in Salvadoran fintech repos and used
 * by Hacienda's DGII for receptor.numDocumento parsing in DTE schemas.
 *
 * Post-Decreto 763/2021: DUI may be used in lieu of NIT for natural persons
 * in DTE invoicing (CAT-022 tipoDocumento `13`).
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{9}$/;
const FORMATTED_REGEX = /^\d{8}-\d$/;

export const duiSpec: DocumentSpec = {
  code: "SV_DUI",
  country: "SV",
  scope: "both", // Personal ID + tax document for naturales post-2021.
  labelKey: "documents.SV_DUI.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00000000-0",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkDigitDUI(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 9) return input;
    return `${digits.slice(0, 8)}-${digits.slice(8)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "SV_DUI", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 9) {
      return { ok: false, code: "SV_DUI", reason: { kind: "too_short" } };
    }
    if (digits.length > 9) {
      return { ok: false, code: "SV_DUI", reason: { kind: "too_long" } };
    }
    if (!checkDigitDUI(digits)) {
      return { ok: false, code: "SV_DUI", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "SV_DUI",
      normalized: digits,
      formatted: `${digits.slice(0, 8)}-${digits.slice(8)}`,
      confidence: "moderate",
    };
  },
};

/** mod-10: weights 9..2 over first 8 digits; verifier = (10 - (sum mod 10)) mod 10. */
function checkDigitDUI(digits: string): boolean {
  if (digits.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = digits.charCodeAt(i) - 48;
    sum += d * (9 - i);
  }
  const expected = (10 - (sum % 10)) % 10;
  return expected === digits.charCodeAt(8) - 48;
}
