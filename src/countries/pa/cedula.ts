/**
 * Panamá — Cédula de Identidad Personal.
 *
 * Issuer: Tribunal Electoral.
 * Source: https://www.tribunal-electoral.gob.pa/
 * Legal basis: Ley 31/2006.
 *
 * Format: `[Tipo]-[Tomo]-[Asiento]`.
 *   - Tipo: 1-2 digit provincia (1-13) or alphabetic prefix (`PE`,
 *     `E`, `N`, `1AV`-`13AV`, etc.) for casos especiales.
 *   - Tomo: 1-4 digits.
 *   - Asiento: 1-6 digits.
 *
 * Common prefixes:
 *   - 1-13: provincias / comarcas (numeric).
 *   - PE:   panameño nacido en el extranjero.
 *   - E:    extranjero residente.
 *   - N:    naturalizado.
 *
 * Check digit: none. The Tribunal Electoral does not embed a verifier in
 * the cédula; identity is matched against the central registry.
 *
 * Confidence: `moderate` — format only. Format is described by Ley 31/2006
 * but the variable-length nature of `tomo` / `asiento` makes airtight
 * regex validation infeasible.
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/** Normalized form keeps the hyphens (mandatory delimiters in PA cédula). */
const RAW_REGEX = /^(?:1[0-3]|[1-9]|PE|E|N)-\d{1,4}-\d{1,6}$/;
const FORMATTED_REGEX = RAW_REGEX;

/** Strip whitespace and uppercase the alphabetic prefix; preserve hyphens. */
function normalizePA(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}

export const cedulaSpec: DocumentSpec = {
  code: "PA_CEDULA",
  country: "PA",
  scope: "personal",
  labelKey: "documents.PA_CEDULA.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0-0000-000000",
  hasCheckDigit: false,
  confidence: "moderate",

  normalize(input: string): string {
    return normalizePA(input);
  },

  validate(input: string): boolean {
    return RAW_REGEX.test(normalizePA(input));
  },

  format(input: string): string {
    const norm = normalizePA(input);
    if (!RAW_REGEX.test(norm)) return input;
    return norm;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "PA_CEDULA", reason: { kind: "empty" } };
    }
    const norm = normalizePA(trimmed);
    if (!RAW_REGEX.test(norm)) {
      // Distinguish length-class errors when possible. Strip non-alnum to
      // estimate "raw" length.
      const rawLen = norm.replace(/-/g, "").length;
      if (rawLen < 3) {
        return { ok: false, code: "PA_CEDULA", reason: { kind: "too_short" } };
      }
      if (rawLen > 12) {
        return { ok: false, code: "PA_CEDULA", reason: { kind: "too_long" } };
      }
      return { ok: false, code: "PA_CEDULA", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "PA_CEDULA",
      normalized: norm,
      formatted: norm,
      confidence: "moderate",
    };
  },
};
