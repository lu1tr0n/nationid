/**
 * España — NIE (Número de Identidad de Extranjero).
 *
 * Issuer: Dirección General de la Policía (Ministerio del Interior).
 * Source: https://sede.policia.gob.es/
 * Legal basis: Real Decreto 240/2007; Orden INT/2058/2008.
 *
 * Format: 9 chars: 1 letter `[XYZ]` + 7 digits + 1 uppercase letter,
 *   displayed as `X0000000A`.
 *
 * The NIE is also the NIF (AEAT) for foreign residents.
 *
 * Check digit: substitute the prefix letter (`X→0, Y→1, Z→2`), forming an
 * 8-digit number, then apply the DNI letter table (`digits mod 23` ->
 * `TRWAGMYFPDXBNJZSQVHLCKE[i]`).
 *
 * Confidence: high. Algorithm matches Orden INT/2058/2008 and AEAT NIF
 * spec; replicated in `validator.js isTaxID('es-ES')`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { dniLetterFor, NIE_PREFIX_MAP } from "./shared.ts";

const RAW_REGEX = /^[XYZ]\d{7}[A-Z]$/;

export const nieSpec: DocumentSpec = {
  code: "ES_NIE",
  country: "ES",
  scope: "both", // NIE doubles as NIF for extranjeros residentes.
  labelKey: "documents.ES_NIE.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "A0000000A",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkNIE(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return cleaned;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "ES_NIE", reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 9) {
      return { ok: false, code: "ES_NIE", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 9) {
      return { ok: false, code: "ES_NIE", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: "ES_NIE", reason: { kind: "invalid_format" } };
    }
    if (!checkNIE(cleaned)) {
      return { ok: false, code: "ES_NIE", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "ES_NIE",
      normalized: cleaned,
      formatted: cleaned,
      confidence: "high",
    };
  },
};

function checkNIE(cleaned: string): boolean {
  const prefix = cleaned.charAt(0);
  const replacement = NIE_PREFIX_MAP[prefix];
  if (replacement === undefined) return false;
  const digits8 = `${replacement}${cleaned.slice(1, 8)}`;
  const expected = dniLetterFor(digits8);
  if (expected === null) return false;
  return expected === cleaned.charAt(8);
}
