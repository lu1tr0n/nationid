/**
 * Malta — VAT registration number.
 *
 * Issuer: Malta Tax and Customs Administration (MTCA, formerly CFR — the
 *         standalone Commissioner for Revenue site `cfr.gov.mt` consolidated
 *         into `mtca.gov.mt` in 2024-2025).
 * Source: https://mtca.gov.mt/ (verified live 2026-05-24)
 * Statute: Value Added Tax Act, Cap. 406 (Malta).
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.mt.vat`.
 *
 * Format: `MT` + 8 digits.
 *
 * Check digit: positions 7-8 are the check formed by `(- sum) mod 37`,
 * where `sum` is the weighted sum of the first 6 digits using weights
 * `[3,4,6,7,8,9]`. The check is zero-padded to two digits.
 *
 * Equivalently, validation: weighted sum of all 8 digits with weights
 * `[3,4,6,7,8,9,10,1]` must be divisible by 37.
 *
 * Confidence: high.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^MT\d{8}$/;
const FORMATTED_REGEX = /^MT \d{8}$/;
const FULL_WEIGHTS: ReadonlyArray<number> = [3, 4, 6, 7, 8, 9, 10, 1];

const COUNTRY = "MT";
const CODE = "MT_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.MT_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "MT 00000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeVat(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checksumOk(cleaned.slice(2, 10));
  },

  format(input: string): string {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `MT ${cleaned.slice(2, 10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeVat(trimmed);
    if (cleaned.length < 10) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 10) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checksumOk(cleaned.slice(2, 10))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `MT ${cleaned.slice(2, 10)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("MT")) return cleaned;
  if (/^\d{8}$/.test(cleaned)) return `MT${cleaned}`;
  return cleaned;
}

function checksumOk(body8: string): boolean {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const w = FULL_WEIGHTS[i];
    if (w === undefined) return false;
    sum += (body8.charCodeAt(i) - 48) * w;
  }
  return sum % 37 === 0;
}
