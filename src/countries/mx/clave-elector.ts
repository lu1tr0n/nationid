/**
 * México — Clave de Elector (`MX_CLAVE_ELECTOR`).
 *
 * Issuer: INE (Instituto Nacional Electoral) — printed on the credencial para
 * votar (credencial INE / IFE).
 * Source: https://www.ine.mx/credencial/
 * Legal basis: INE Acuerdo CG58/2014 ("Estructura de la Clave de Elector"); Ley
 * General de Instituciones y Procedimientos Electorales (LGIPE).
 *
 * Format: 18 chars, no separators, displayed as a single contiguous string.
 *   - 6 letters: 2 consonants of apellido paterno + 2 consonants of apellido
 *     materno + 2 consonants of nombre.
 *   - 2 digits: YY (year of birth — last two digits).
 *   - 2 digits: entidad federativa NUMERIC code (01..32 per INE catalog —
 *     numeric, NOT the 2-letter RENAPO codes used by CURP).
 *   - 2 digits: MM (month of birth, 01..12).
 *   - 2 digits: DD (day of birth, 01..31).
 *   - 1 letter: sex (`H` masculino, `M` femenino).
 *   - 3 digits: homoclave / correlativo asignado por INE.
 *
 * Check digit: **none**. INE does not publish a check digit specification for
 * the Clave de Elector. Validation here is regex + structural rules
 * (numeric entidad range, plausible month/day).
 *
 * Confidence: low. Format-only — INE acuerdo CG58/2014 documents the
 * structure but no DV. No public validator library covers it; this is a
 * greenfield format-only implementation. See research note in
 * `nationid-research/document-gaps-2026-05-09.md` § "MX_CLAVE_ELECTOR".
 *
 * Notes:
 *   - The entidad federativa segment is **numeric** (e.g. `09` for Ciudad de
 *     México, `15` for Estado de México) — different from CURP which uses
 *     2-letter codes (`DF`, `MC`). We do not reuse `MX_ENTIDADES` here; we
 *     validate the numeric range 01..32. Documented divergence.
 *   - The aliases `CLAVE_ELECTOR` and `INE` both resolve to this spec at the
 *     country-scoped API level.
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/**
 * Strict 18-char regex.
 *
 *   - [0-5]: A-Z (6 consonants)
 *   - [6-7]: digits YY (any year, no plausibility check beyond shape)
 *   - [8-9]: digits — entidad federativa numeric (validated to 01..32 below)
 *   - [10-11]: digits MM (validated to 01..12 below)
 *   - [12-13]: digits DD (validated to 01..31 below)
 *   - [14]: H or M (sex)
 *   - [15-17]: digits (correlativo / homoclave)
 */
const STRUCTURAL_REGEX = /^[A-Z]{6}\d{8}[HM]\d{3}$/;

/** Strip non-alphanumeric, uppercase. */
function normalizeClaveElector(input: string): string {
  return input.replace(/[^A-Za-z0-9]+/g, "").toUpperCase();
}

/** True iff the 8-digit middle block decodes to plausible YY/EE/MM/DD. */
function passesStructuralRules(cleaned: string): boolean {
  const entidad = Number.parseInt(cleaned.slice(8, 10), 10);
  if (!Number.isInteger(entidad) || entidad < 1 || entidad > 32) return false;
  const month = Number.parseInt(cleaned.slice(10, 12), 10);
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  const day = Number.parseInt(cleaned.slice(12, 14), 10);
  if (!Number.isInteger(day) || day < 1 || day > 31) return false;
  return true;
}

export const claveElectorSpec: DocumentSpec = {
  code: "MX_CLAVE_ELECTOR",
  country: "MX",
  scope: "personal",
  labelKey: "documents.MX_CLAVE_ELECTOR.label",
  rawRegex: STRUCTURAL_REGEX,
  // Clave de Elector is always displayed as 18 contiguous chars, no separators.
  mask: "AAAAAAAAAAAAAAAAAA",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return normalizeClaveElector(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeClaveElector(input);
    if (!STRUCTURAL_REGEX.test(cleaned)) return false;
    return passesStructuralRules(cleaned);
  },

  format(input: string): string {
    const cleaned = normalizeClaveElector(input);
    return cleaned.length === 18 ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "MX_CLAVE_ELECTOR", reason: { kind: "empty" } };
    }
    const cleaned = normalizeClaveElector(trimmed);
    if (cleaned.length < 18) {
      return { ok: false, code: "MX_CLAVE_ELECTOR", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 18) {
      return { ok: false, code: "MX_CLAVE_ELECTOR", reason: { kind: "too_long" } };
    }
    if (!STRUCTURAL_REGEX.test(cleaned)) {
      return { ok: false, code: "MX_CLAVE_ELECTOR", reason: { kind: "invalid_format" } };
    }
    if (!passesStructuralRules(cleaned)) {
      return { ok: false, code: "MX_CLAVE_ELECTOR", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "MX_CLAVE_ELECTOR",
      normalized: cleaned,
      formatted: cleaned,
      confidence: "low",
    };
  },
};
