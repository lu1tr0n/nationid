/**
 * España — NIF Persona Jurídica (legacy CIF).
 *
 * Issuer: Agencia Estatal de Administración Tributaria (AEAT).
 * Source: https://sede.agenciatributaria.gob.es/
 * Legal basis: Real Decreto 1065/2007; Orden EHA/451/2008. The "CIF"
 * (Código de Identificación Fiscal) was unified with the NIF in 2008
 * (Real Decreto 1065/2007), but the 9-character letter+digits+control
 * structure persists for jurídicas and is still informally called CIF.
 *
 * Format: 9 chars: 1 entity-type letter + 7 digits + 1 control char
 *   (digit OR letter, depending on entity type), displayed as `A12345678`.
 *
 * Allowed entity-type letters (AEAT): `A B C D E F G H J N P Q R S U V W`.
 *   - `A` SA · `B` SL · `C` Comanditaria · `D` (no usada) · `E` Comunidad de
 *     bienes · `F` Cooperativa · `G` Asociación · `H` Comunidad de
 *     propietarios · `J` Sociedad civil · `N` Extranjera · `P` Corporación
 *     local · `Q` Organismo público · `R` Entidad religiosa · `S` Órgano de
 *     la Administración · `U` UTE · `V` Otros · `W` Establecimiento
 *     permanente de entidad no residente.
 *
 * Check digit:
 *   1. Take the 7 body digits.
 *   2. Apply weights `[2,1,2,1,2,1,2]`. For each product > 9, sum its two
 *      digits (Luhn-style folding).
 *   3. r = `(10 - (sum mod 10)) mod 10`.
 *   4. For prefixes `[A,B,E,H]`: DV must be the digit `r`.
 *   5. For prefixes `[N,P,Q,R,S,W]`: DV must be the letter `'JABCDEFGHI'[r]`.
 *   6. For prefixes `[C,D,F,G,J,U,V]`: either form is accepted.
 *
 * Confidence: high. Algorithm matches AEAT NIF spec and `validator.js
 * isTaxID('es-ES')`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import {
  CIF_ALL_PREFIXES,
  CIF_DV_LETTERS,
  CIF_PREFIX_DIGIT_DV,
  CIF_PREFIX_LETTER_DV,
  cifRemainder,
} from "./shared.ts";

const RAW_REGEX = /^[ABCDEFGHJNPQRSUVW]\d{7}[\dA-J]$/;

export const nifPjSpec: DocumentSpec = {
  code: "ES_NIF_PJ",
  country: "ES",
  scope: "tax",
  labelKey: "documents.ES_NIF_PJ.label",
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
    return checkNifPj(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return cleaned;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "ES_NIF_PJ", reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 9) {
      return { ok: false, code: "ES_NIF_PJ", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 9) {
      return { ok: false, code: "ES_NIF_PJ", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: "ES_NIF_PJ", reason: { kind: "invalid_format" } };
    }
    if (!checkNifPj(cleaned)) {
      return { ok: false, code: "ES_NIF_PJ", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "ES_NIF_PJ",
      normalized: cleaned,
      formatted: cleaned,
      confidence: "high",
    };
  },
};

function checkNifPj(cleaned: string): boolean {
  const prefix = cleaned.charAt(0);
  if (!CIF_ALL_PREFIXES.has(prefix)) return false;

  const r = cifRemainder(cleaned.slice(1, 8));
  if (r === null) return false;

  const provided = cleaned.charAt(8);
  const expectedDigit = String(r);
  const expectedLetter = CIF_DV_LETTERS[r];
  if (expectedLetter === undefined) return false;

  if (CIF_PREFIX_DIGIT_DV.has(prefix)) return provided === expectedDigit;
  if (CIF_PREFIX_LETTER_DV.has(prefix)) return provided === expectedLetter;
  // CIF_PREFIX_EITHER_DV — accept either form.
  return provided === expectedDigit || provided === expectedLetter;
}
