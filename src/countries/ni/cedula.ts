/**
 * Nicaragua — Cédula de Identidad.
 *
 * Issuer: Consejo Supremo Electoral (CSE).
 * Source: https://www.cse.gob.ni/
 * Legal basis: Ley 152/93 (Ley de Identificación Ciudadana).
 *
 * Format: 14 chars, displayed as `000-DDMMYY-0000A`.
 *   - 3 digits: código municipio (de la circunscripción de nacimiento)
 *   - 6 digits: fecha de nacimiento DDMMYY
 *   - 4 digits: correlativo
 *   - 1 letter: dígito verificador alfabético
 *
 * Check digit: alphabetic letter (A-Z). The CSE does **not** publish the
 * algorithm, and community libraries do not agree on a formula. We therefore
 * validate **format only**: 14-character structure plus a plausible
 * DD/MM in the embedded birth-date field. The trailing letter is
 * accepted as `[A-Z]` without checksum verification.
 *
 * Confidence: `low` — format-only.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{3}\d{6}\d{4}[A-Z]$/;
const FORMATTED_REGEX = /^\d{3}-\d{6}-\d{4}[A-Z]$/;

export const cedulaSpec: DocumentSpec = {
  code: "NI_CEDULA",
  country: "NI",
  scope: "personal",
  labelKey: "documents.NI_CEDULA.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000-000000-0000A",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const norm = stripAndUpper(input);
    if (!RAW_REGEX.test(norm)) return false;
    return hasValidStructure(norm);
  },

  format(input: string): string {
    const norm = stripAndUpper(input);
    if (!RAW_REGEX.test(norm)) return input;
    return `${norm.slice(0, 3)}-${norm.slice(3, 9)}-${norm.slice(9, 13)}${norm.slice(13)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "NI_CEDULA", reason: { kind: "empty" } };
    }
    const norm = stripAndUpper(trimmed);
    if (norm.length < 14) {
      return { ok: false, code: "NI_CEDULA", reason: { kind: "too_short" } };
    }
    if (norm.length > 14) {
      return { ok: false, code: "NI_CEDULA", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(norm) || !hasValidStructure(norm)) {
      return { ok: false, code: "NI_CEDULA", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "NI_CEDULA",
      normalized: norm,
      formatted: `${norm.slice(0, 3)}-${norm.slice(3, 9)}-${norm.slice(9, 13)}${norm.slice(13)}`,
      confidence: "low",
    };
  },
};

/**
 * Plausibility checks on the embedded fields. The municipio range is broad
 * (CSE catalog covers 153 municipios but with sparse codes), so we only
 * enforce non-zero. The DDMMYY date is checked for day/month plausibility.
 */
function hasValidStructure(norm: string): boolean {
  const muni = norm.slice(0, 3);
  if (muni === "000") return false;
  const dd = parseInt(norm.slice(3, 5), 10);
  const mm = parseInt(norm.slice(5, 7), 10);
  // YY (slice 7..9) is unconstrained: it represents the last two digits of
  // the birth year and can be any value.
  if (dd < 1 || dd > 31) return false;
  if (mm < 1 || mm > 12) return false;
  return true;
}
