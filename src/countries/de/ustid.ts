/**
 * Germany — USt-IdNr (Umsatzsteuer-Identifikationsnummer).
 *
 * Issuer: Bundeszentralamt für Steuern.
 * Source: https://evatr.bff-online.de/
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/).
 *
 * Format: `DE` + 9 digits. The first digit of the body is non-zero.
 *   Visually displayed as `DE 123 456 788`.
 *
 * Check digit: ISO/IEC 7064 MOD 11,10 over the first 8 body digits; the 9th
 *   digit is the check digit. Same algorithm as the Steuer-ID (just on a
 *   shorter body).
 *
 * Confidence: high. Algorithm published by BMF and reproduced in
 * `validator.js isVAT('de-DE')` and `python-stdnum.de.vat`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^DE[1-9]\d{8}$/;
const FORMATTED_REGEX = /^DE \d{3} \d{3} \d{3}$/;

const COUNTRY = "DE";
const CODE = "DE_USTID";

export const ustidSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.DE_USTID.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "DE 000 000 000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeUstid(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeUstid(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return computeMod1110DV(cleaned.slice(2, 10)) === cleaned.charCodeAt(10) - 48;
  },

  format(input: string): string {
    const cleaned = normalizeUstid(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `DE ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = normalizeUstid(trimmed);
    if (cleaned.length < 11) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 11) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (computeMod1110DV(cleaned.slice(2, 10)) !== cleaned.charCodeAt(10) - 48) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `DE ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 11)}`,
      confidence: "high",
    };
  },
};

function normalizeUstid(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("DE")) return cleaned;
  if (/^[1-9]\d{8}$/.test(cleaned)) return `DE${cleaned}`;
  return cleaned;
}

/** ISO/IEC 7064 MOD 11,10 check digit for a body of digits. */
function computeMod1110DV(body: string): number {
  let check = 10;
  for (let i = 0; i < body.length; i++) {
    const d = body.charCodeAt(i) - 48;
    let p = (d + check) % 10;
    if (p === 0) p = 10;
    check = (p * 2) % 11;
  }
  return (11 - check) % 10;
}
