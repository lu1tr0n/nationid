/**
 * España — NUSS (Número de Usuario de la Seguridad Social).
 *
 * Issuer: Tesorería General de la Seguridad Social (TGSS).
 * Source: https://www.seg-social.es/
 * Legal basis: Resolución TGSS 4/2008; Real Decreto 84/1996 (Reglamento
 * General sobre inscripción de empresas y afiliación, altas, bajas y
 * variaciones de datos de trabajadores en la Seguridad Social).
 *
 * Format: 12 digits, displayed canonically as `XX/XXXXXXXX/DD`.
 *   - 2 digits: provincia code (asignada por TGSS).
 *   - 8 digits: correlativo dentro de la provincia.
 *   - 2 digits: dígito de control.
 *
 * Check digit: mod-97 over the first 10 digits taken as a single integer.
 *   `dv = (provincia * 10^8 + correlativo) mod 97`. The DV is rendered as
 *   exactly 2 digits, zero-padded if `dv < 10`.
 *
 * The mod-97 check is also used by Belgian RRN, French SIRET-adjacent,
 * IBAN BBAN-level checks and Italian codice fiscale variants; it is a
 * widely-used integer DV with strong error-detection (catches all single-
 * digit errors and most adjacent transpositions).
 *
 * Confidence: high. Algorithm is published by TGSS (Resolución TGSS 4/2008
 * and the public NUSS lookup at <https://portal.seg-social.gob.es/>) and is
 * replicated in community libraries (`nuss-validator` npm). validator.js
 * does not cover NUSS under `es-ES` (it is social security, not tax id), so
 * cross-validation here is documentation-only.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{12}$/;
const FORMATTED_REGEX = /^\d{2}\/\d{8}\/\d{2}$/;

export const nussSpec: DocumentSpec = {
  code: "ES_NUSS",
  country: "ES",
  scope: "personal",
  labelKey: "documents.ES_NUSS.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00/00000000/00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkNUSS(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 12) return input;
    return `${digits.slice(0, 2)}/${digits.slice(2, 10)}/${digits.slice(10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "ES_NUSS", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 12) {
      return { ok: false, code: "ES_NUSS", reason: { kind: "too_short" } };
    }
    if (digits.length > 12) {
      return { ok: false, code: "ES_NUSS", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "ES_NUSS", reason: { kind: "invalid_format" } };
    }
    if (!checkNUSS(digits)) {
      return { ok: false, code: "ES_NUSS", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "ES_NUSS",
      normalized: digits,
      formatted: `${digits.slice(0, 2)}/${digits.slice(2, 10)}/${digits.slice(10)}`,
      confidence: "high",
    };
  },
};

function checkNUSS(digits: string): boolean {
  if (digits.length !== 12) return false;
  const expected = mod97Of(digits.slice(0, 10));
  if (expected === null) return false;
  const provided = Number.parseInt(digits.slice(10), 10);
  return expected === provided;
}

/**
 * Compute `n mod 97` for a 10-digit string, using a Horner-style loop.
 *
 * The 10-digit max (9_999_999_999) fits comfortably below
 * `Number.MAX_SAFE_INTEGER` (~9.007e15), but the digit-by-digit reduction
 * keeps the running value bounded by 97 * 10 + 9 < 1000, removing any
 * temptation to rely on full 10-digit `parseInt` precision.
 */
function mod97Of(digits10: string): number | null {
  if (digits10.length !== 10) return null;
  let r = 0;
  for (let i = 0; i < 10; i++) {
    const d = digits10.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return null;
    r = (r * 10 + d) % 97;
  }
  return r;
}
