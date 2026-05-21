/**
 * United Kingdom — VAT registration number.
 *
 * Issuer: HM Revenue & Customs.
 * Source: https://www.gov.uk/check-uk-vat-number
 * Reference: HMRC VAT Notice 700/1.
 *
 * Format: 9 digits (standard) or 12 digits (with 3-digit branch suffix).
 *   Visually displayed as `GB 123 4567 89` or `GB 123 4567 89 001`.
 *   Government & health-authority registrations (`GBHA…`, `GBGD…`) are out of
 *   scope here — they have a different format and we do not validate them.
 *
 * Check digit: HMRC mod-97 algorithm.
 *   weights = [8, 7, 6, 5, 4, 3, 2] applied to digits 1..7 (left-to-right)
 *   sum = sum(d_i * w_i)
 *   dv  = digits 8..9 read as a 2-digit integer
 *   Pre-2010 registrations: (sum + dv) mod 97 == 0
 *   Post-2010 ("9755+" range): (sum + 55 + dv) mod 97 == 0
 *
 * The branch suffix (positions 10..12) does not participate in the check
 * digit; we accept it but do not validate it.
 *
 * Confidence: high. Algorithm is published in HMRC's reference docs and is
 * reproduced in `validator.js isVAT('GB')` and `python-stdnum.gb.vat`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/**
 * Normalized form: `GB` prefix optional; 9 or 12 trailing digits. We always
 * store the prefix during normalization so downstream code can rely on
 * `value.startsWith("GB")`.
 */
const RAW_REGEX = /^GB\d{9}(\d{3})?$/;
/** Formatted form: `GB 123 4567 89` (with optional ` 001` branch suffix). */
const FORMATTED_REGEX = /^GB \d{3} \d{4} \d{2}( \d{3})?$/;
const WEIGHTS = [8, 7, 6, 5, 4, 3, 2] as const;

const COUNTRY = "GB";
const CODE = "GB_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.GB_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "GB 000 0000 00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeVat(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkVat(cleaned.slice(2, 11));
  },

  format(input: string): string {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return formatVat(cleaned);
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = normalizeVat(trimmed);
    // Minimum: GB + 9 digits = 11 chars; maximum: GB + 12 digits = 14 chars.
    if (cleaned.length < 11) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 14) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkVat(cleaned.slice(2, 11))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: formatVat(cleaned),
      confidence: "high",
    };
  },
};

/** Strip separators, uppercase, and ensure the canonical `GB` prefix. */
function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("GB")) return cleaned;
  if (/^\d+$/.test(cleaned)) return `GB${cleaned}`;
  return cleaned;
}

/**
 * Validate a 9-digit core VAT number against the HMRC mod-97 algorithm.
 * Accepts both pre-2010 and post-2010 ("+55") variants.
 */
function checkVat(nineDigits: string): boolean {
  if (nineDigits.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += (nineDigits.charCodeAt(i) - 48) * w;
  }
  const dv = Number.parseInt(nineDigits.slice(7, 9), 10);
  if (Number.isNaN(dv)) return false;
  // Pre-2010 (legacy registrations): (sum + dv) ≡ 0 mod 97.
  if ((sum + dv) % 97 === 0) return true;
  // Post-2010: (sum + 55 + dv) ≡ 0 mod 97.
  if ((sum + 55 + dv) % 97 === 0) return true;
  return false;
}

function formatVat(cleaned: string): string {
  // cleaned starts with `GB` and has 9 or 12 digits after.
  const digits = cleaned.slice(2);
  const base = `GB ${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 9)}`;
  return digits.length === 12 ? `${base} ${digits.slice(9, 12)}` : base;
}
