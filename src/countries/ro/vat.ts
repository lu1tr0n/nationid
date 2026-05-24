/**
 * Romania — VAT / Cod de Identificare Fiscală (CUI / CIF / CF).
 *
 * Issuer: Agenția Națională de Administrare Fiscală (ANAF).
 * Source: https://www.anaf.ro/
 * Statute: Legea nr. 227/2015 (Codul fiscal), art. 316.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.ro.cf`, `ro.cui`.
 *
 * Format: `RO` + 2 to 10 digits, first digit non-zero. VAT-registered
 * entities prefix `RO`; the underlying CUI may exist without VAT status.
 *
 * Check digit: last digit. Pad the body (excluding the check) to 9 digits
 * with leading zeros, apply weights `[7,5,3,2,1,7,5,3,2]`,
 * `check = (10·sum) mod 11 mod 10`.
 *
 * Confidence: high.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^RO[1-9]\d{1,9}$/;
const FORMATTED_REGEX = /^RO \d{2,10}$/;
const WEIGHTS: ReadonlyArray<number> = [7, 5, 3, 2, 1, 7, 5, 3, 2];

const COUNTRY = "RO";
const CODE = "RO_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.RO_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "RO ----------",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeVat(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checksumOk(cleaned.slice(2));
  },

  format(input: string): string {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `RO ${cleaned.slice(2)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeVat(trimmed);
    if (cleaned.length < 4) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 12) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checksumOk(cleaned.slice(2))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `RO ${cleaned.slice(2)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("RO")) return cleaned;
  if (/^[1-9]\d{1,9}$/.test(cleaned)) return `RO${cleaned}`;
  return cleaned;
}

function checksumOk(body: string): boolean {
  // body = body digits including the trailing check digit. Pad the body excl.
  // check to 9 digits with leading zeros.
  const bodyNoCheck = body.slice(0, -1).padStart(9, "0");
  const check = body.charCodeAt(body.length - 1) - 48;
  if (check < 0 || check > 9) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += (bodyNoCheck.charCodeAt(i) - 48) * w;
  }
  const expected = ((sum * 10) % 11) % 10;
  return expected === check;
}
