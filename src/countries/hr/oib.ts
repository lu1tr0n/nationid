/**
 * Croatia — OIB (Osobni identifikacijski broj) — personal + tax identifier.
 *
 * Issuer: Ministarstvo financija, Porezna uprava.
 * Source: https://www.porezna-uprava.hr/
 * Statute: Zakon o osobnom identifikacijskom broju, NN 60/2008
 *          (statute cites ISO/IEC 7064 by name).
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.hr.oib`.
 *
 * Format: 11 digits. EU VIES prefixes with `HR`; the bare `OIB` form is
 * the canonical persisted form. Visually displayed as 11 contiguous digits.
 *
 * Scope: `both`. OIB serves as the natural-person personal identifier AND
 * the tax identifier for legal entities; the same algorithm validates both.
 *
 * Check digit: ISO/IEC 7064 MOD 11,10 over the first 10 body digits.
 *
 * Confidence: high.
 */

import { mod11_10CheckDigit } from "../../algorithms/iso7064.ts";
import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^HR\d{11}$/;
const FORMATTED_REGEX = /^HR \d{11}$/;

const COUNTRY = "HR";
const CODE = "HR_OIB";

export const oibSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both",
  labelKey: "documents.HR_OIB.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "HR 00000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeOib(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeOib(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return mod11_10CheckDigit(cleaned.slice(2, 12)) === cleaned.charCodeAt(12) - 48;
  },

  format(input: string): string {
    const cleaned = normalizeOib(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `HR ${cleaned.slice(2, 13)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeOib(trimmed);
    if (cleaned.length < 13) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 13) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (mod11_10CheckDigit(cleaned.slice(2, 12)) !== cleaned.charCodeAt(12) - 48) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `HR ${cleaned.slice(2, 13)}`,
      confidence: "high",
    };
  },
};

function normalizeOib(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("HR")) return cleaned;
  if (/^\d{11}$/.test(cleaned)) return `HR${cleaned}`;
  return cleaned;
}
