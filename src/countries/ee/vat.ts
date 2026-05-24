/**
 * Estonia — KMKR (EU VAT number).
 *
 * Issuer: Maksu- ja Tolliamet (MTA, Estonian Tax and Customs Board).
 * Source: https://www.emta.ee/
 * Statute: Käibemaksuseadus (RT I 2003, 82, 554), §20.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.ee.kmkr`.
 *
 * Format: `EE` + 9 digits.
 *
 * Check digit: 9th digit. Weights `[3,7,1,3,7,1,3,7,1]` over all 9 digits
 * (including the check) — total `sum mod 10 = 0`.
 *
 * Confidence: high.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^EE\d{9}$/;
const FORMATTED_REGEX = /^EE \d{9}$/;
const WEIGHTS: ReadonlyArray<number> = [3, 7, 1, 3, 7, 1, 3, 7, 1];

const COUNTRY = "EE";
const CODE = "EE_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.EE_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "EE 000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeVat(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checksumOk(cleaned.slice(2, 11));
  },

  format(input: string): string {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `EE ${cleaned.slice(2, 11)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeVat(trimmed);
    if (cleaned.length < 11) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 11) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checksumOk(cleaned.slice(2, 11))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `EE ${cleaned.slice(2, 11)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("EE")) return cleaned;
  if (/^\d{9}$/.test(cleaned)) return `EE${cleaned}`;
  return cleaned;
}

function checksumOk(body9: string): boolean {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += (body9.charCodeAt(i) - 48) * w;
  }
  return sum % 10 === 0;
}
