/**
 * Hungary — Közösségi adószám (EU VAT number).
 *
 * Issuer: Nemzeti Adó- és Vámhivatal (NAV).
 * Source: https://nav.gov.hu/
 * Statute: 2007. évi CXXVII. törvény (ÁFA Act), §178.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.hu.anum`.
 *
 * Format: `HU` + 8 digits. The first 8 form the standard Hungarian
 * `adószám` taxpayer number; the EU VAT prefix `HU` is appended for
 * VIES purposes.
 *
 * Check digit: 8th digit is the check digit. Weights `[9,7,3,1,9,7,3,1]`
 * over all 8 digits (including the check) — total `sum mod 10 = 0`.
 *
 * Confidence: high.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^HU\d{8}$/;
const FORMATTED_REGEX = /^HU \d{8}$/;
const WEIGHTS: ReadonlyArray<number> = [9, 7, 3, 1, 9, 7, 3, 1];

const COUNTRY = "HU";
const CODE = "HU_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.HU_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "HU 00000000",
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
    return `HU ${cleaned.slice(2, 10)}`;
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
      formatted: `HU ${cleaned.slice(2, 10)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("HU")) return cleaned;
  if (/^\d{8}$/.test(cleaned)) return `HU${cleaned}`;
  return cleaned;
}

function checksumOk(body8: string): boolean {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += (body8.charCodeAt(i) - 48) * w;
  }
  return sum % 10 === 0;
}
