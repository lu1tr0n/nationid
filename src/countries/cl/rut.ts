/**
 * Chile — RUT/RUN (Rol Único Tributario / Rol Único Nacional).
 *
 * Issuer: Servicio de Registro Civil (RUN for naturales) and Servicio de
 * Impuestos Internos (RUT for jurídicas). Both share the same number space.
 *
 * Source: https://www.sii.cl/
 * Legal basis: DFL 3/1969 (Servicio de Registro Civil).
 *
 * Format: 1-8 base digits + 1 verifier digit (0-9 or 'K').
 *   Displayed as `12.345.678-5` or `8.765.432-K` with thousands separators.
 *
 * Check digit: mod-11 with cyclic weights 2,3,4,5,6,7 right-to-left.
 *   sum = sum(digit_i * weight_i) for i from rightmost to leftmost
 *   r = sum mod 11
 *   dv = 11 - r
 *   - if dv == 11 -> '0'
 *   - if dv == 10 -> 'K'
 *   - else -> str(dv)
 *
 * Confidence: high. Algorithm matches SII documentation and the reference
 * implementation in `rut.js` and `validator.js`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/** Normalized form: digits only, plus an uppercase 'K' or final digit as DV. */
const RAW_REGEX = /^\d{1,8}[\dK]$/;
/** Formatted form: `12.345.678-5` (thousands separators + hyphen + DV). */
const FORMATTED_REGEX = /^\d{1,2}\.\d{3}\.\d{3}-[\dK]$/;
const WEIGHTS = [2, 3, 4, 5, 6, 7] as const;

export const rutSpec: DocumentSpec = {
  code: "CL_RUT",
  country: "CL",
  scope: "both", // RUN for naturales, RUT for jurídicas — same number space.
  labelKey: "documents.CL_RUT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00.000.000-A",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkRUT(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return formatRUT(cleaned);
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "CL_RUT", reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 2) {
      return { ok: false, code: "CL_RUT", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 9) {
      return { ok: false, code: "CL_RUT", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: "CL_RUT", reason: { kind: "invalid_format" } };
    }
    if (!checkRUT(cleaned)) {
      return { ok: false, code: "CL_RUT", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "CL_RUT",
      normalized: cleaned,
      formatted: formatRUT(cleaned),
      confidence: "high",
    };
  },
};

function computeRutDV(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const idx = body.length - 1 - i;
    const d = body.charCodeAt(idx) - 48;
    const w = WEIGHTS[i % WEIGHTS.length];
    if (w === undefined) return "?";
    sum += d * w;
  }
  const r = sum % 11;
  const dv = 11 - r;
  if (dv === 11) return "0";
  if (dv === 10) return "K";
  return String(dv);
}

function checkRUT(cleaned: string): boolean {
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  return computeRutDV(body) === dv;
}

/** Insert thousands separators into the body and join with `-` + DV. */
function formatRUT(cleaned: string): string {
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  // Insert dots every 3 digits from the right.
  let withDots = "";
  for (let i = 0; i < body.length; i++) {
    const fromRight = body.length - i;
    if (i > 0 && fromRight % 3 === 0) withDots += ".";
    withDots += body[i];
  }
  return `${withDots}-${dv}`;
}
