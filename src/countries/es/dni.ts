/**
 * España — DNI (Documento Nacional de Identidad).
 *
 * Issuer: Dirección General de la Policía (Ministerio del Interior).
 * Source: https://www.dnielectronico.es/
 * Legal basis: Real Decreto 1553/2005, de 23 de diciembre.
 *
 * Format: 9 chars: 8 digits + 1 uppercase letter, displayed as `00000000A`.
 *
 * The DNI is also the NIF (Número de Identificación Fiscal) for natural
 * persons of Spanish nationality (AEAT, Real Decreto 1065/2007).
 *
 * Check digit: letter computed via `letras = "TRWAGMYFPDXBNJZSQVHLCKE"`,
 *   index = `digits mod 23`. The letters `I, Ñ, O, U` are intentionally
 *   omitted to avoid confusion with `1`, `N`, `0`, `V`.
 *
 * Confidence: high. Algorithm matches Real Decreto 1553/2005 Annex and is
 * replicated in `validator.js isTaxID('es-ES')` and the AEAT NIF spec.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { dniLetterFor } from "./shared.ts";

const RAW_REGEX = /^\d{8}[A-Z]$/;

export const dniSpec: DocumentSpec = {
  code: "ES_DNI",
  country: "ES",
  scope: "both", // DNI doubles as NIF for naturales españoles.
  labelKey: "documents.ES_DNI.label",
  rawRegex: RAW_REGEX,
  // No canonical separator on the physical card; formatted form === raw form.
  formattedRegex: RAW_REGEX,
  mask: "00000000A",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkDNI(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return cleaned;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "ES_DNI", reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 9) {
      return { ok: false, code: "ES_DNI", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 9) {
      return { ok: false, code: "ES_DNI", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: "ES_DNI", reason: { kind: "invalid_format" } };
    }
    if (!checkDNI(cleaned)) {
      return { ok: false, code: "ES_DNI", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "ES_DNI",
      normalized: cleaned,
      formatted: cleaned,
      confidence: "high",
    };
  },
};

function checkDNI(cleaned: string): boolean {
  const expected = dniLetterFor(cleaned.slice(0, 8));
  if (expected === null) return false;
  return expected === cleaned.charAt(8);
}
