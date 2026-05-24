/**
 * Greece — VAT / ΑΦΜ (Αριθμός Φορολογικού Μητρώου).
 *
 * Issuer: Ανεξάρτητη Αρχή Δημοσίων Εσόδων (AADE — Independent Authority
 * for Public Revenue).
 * Source: https://www.aade.gr/
 * Statute: Νόμος 2859/2000 (VAT Code).
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.gr.vat`.
 *
 * Format: 9 digits. Domestic AADE forms use no prefix; EU VIES expects
 * the prefix **`EL`** (NOT `GR` — historical EU-VAT bug). On input we
 * accept both `EL` and `GR` (and bare 9-digit) and normalize to `EL`.
 *
 * Check digit: 9th digit. Iterative `s` over the first 8 body digits:
 *   `s = 0`
 *   for each d in body[0..7]: `s = s*2 + d`
 *   check = (s * 2) mod 11 mod 10
 *
 * Confidence: high. EL/GR handling per VERIFICATION §GR.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^EL\d{9}$/;
const FORMATTED_REGEX = /^EL \d{9}$/;

const COUNTRY = "GR";
const CODE = "GR_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.GR_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "EL 000000000",
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
    return `EL ${cleaned.slice(2, 11)}`;
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
      formatted: `EL ${cleaned.slice(2, 11)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  // Accept GR-prefixed input and rewrite to EL (canonical VIES form).
  if (cleaned.startsWith("EL")) return cleaned;
  if (cleaned.startsWith("GR") && /^GR\d{9}$/.test(cleaned)) return `EL${cleaned.slice(2)}`;
  if (/^\d{9}$/.test(cleaned)) return `EL${cleaned}`;
  return cleaned;
}

function checksumOk(body9: string): boolean {
  let s = 0;
  for (let i = 0; i < 8; i++) {
    const d = body9.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    s = s * 2 + d;
  }
  const expected = ((s * 2) % 11) % 10;
  return expected === body9.charCodeAt(8) - 48;
}
