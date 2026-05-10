/**
 * Italy — Partita IVA (P.IVA).
 *
 * Issuer: Agenzia delle Entrate.
 * Source: https://www.agenziaentrate.gov.it/
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/) for
 * the EU-wide intra-community variant `IT` + 11 digits.
 *
 * Format: 11 digits.
 *   - 7 digits: numero del contribuente.
 *   - 3 digits: codice ufficio provinciale.
 *   - 1 digit: cifra di controllo.
 *
 * Check digit: Luhn (ISO/IEC 7812-1) over all 11 digits.
 *
 * Confidence: high. Algorithm published by Agenzia delle Entrate; reproduced
 * by `validator.js isVAT('IT')`, `python-stdnum.it.iva`, and `codice-fiscale-utils`.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripAndUpper } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{11}$/;
const FORMATTED_REGEX = RAW_REGEX;
const PREFIXED_REGEX = /^IT\d{11}$/;

const COUNTRY = "IT" as CountryCode;
// TODO(v0.6-integration): orchestrator extends `DocumentTypeCode` with `IT_PIVA`.
const CODE = "IT_PIVA" as DocumentTypeCode;

export const pivaSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.IT_PIVA.label",
  rawRegex: RAW_REGEX,
  // The intra-EU VIES form `IT12345678901` is also accepted on input.
  formattedRegex: FORMATTED_REGEX,
  mask: "00000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizePiva(input);
  },

  validate(input: string): boolean {
    const digits = normalizePiva(input);
    if (!RAW_REGEX.test(digits)) return false;
    return luhnValid(digits);
  },

  format(input: string): string {
    const digits = normalizePiva(input);
    if (!RAW_REGEX.test(digits)) return input;
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = normalizePiva(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!luhnValid(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: digits,
      confidence: "high",
    };
  },
};

/** Strip the optional `IT` prefix and any non-digit separators. */
function normalizePiva(input: string): string {
  const cleaned = stripAndUpper(input);
  if (PREFIXED_REGEX.test(cleaned)) return cleaned.slice(2);
  return cleaned.replace(/[^0-9]/g, "");
}
