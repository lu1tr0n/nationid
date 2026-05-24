/**
 * Latvia — PVN (VAT registration number).
 *
 * Issuer: Valsts ieņēmumu dienests (VID).
 * Source: https://www.vid.gov.lv/
 * Statute: Pievienotās vērtības nodokļa likums, Latvijas Vēstnesis 197/2012.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.lv.pvn`.
 *
 * Format: `LV` + 11 digits.
 *
 * Two registration branches:
 *   - **Legal entity** — first body digit > 3. Algorithm: weights
 *     `[9,1,4,8,3,10,2,5,7,6]` over the first 10 body digits, sum mod 11
 *     should equal 3; the 11th body digit must equal `(3 - r + 11) mod 11`.
 *     Equivalently, validate that the weighted sum of all 11 digits using
 *     weights `[9,1,4,8,3,10,2,5,7,6,1]` is congruent to 3 mod 11.
 *   - **Natural person** — first body digit ≤ 3. Format = `DDMMYY` + 5
 *     more digits with a date-validity check. python-stdnum's own source
 *     notes this branch's checksum was NOT confirmed by an independent
 *     source — ship at `confidence: "moderate"`.
 *
 * Per VERIFICATION §LV: ship the overall spec at `moderate` and explicitly
 * note the natural-person branch uncertainty in JSDoc.
 *
 * Confidence: moderate.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^LV\d{11}$/;
const FORMATTED_REGEX = /^LV \d{11}$/;
const LEGAL_WEIGHTS: ReadonlyArray<number> = [9, 1, 4, 8, 3, 10, 2, 5, 7, 6, 1];

const COUNTRY = "LV";
const CODE = "LV_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.LV_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "LV 00000000000",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return normalizeVat(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    const body = cleaned.slice(2, 13);
    if (isLegalEntity(body)) return legalEntityChecksumOk(body);
    return naturalPersonFormatOk(body);
  },

  format(input: string): string {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `LV ${cleaned.slice(2, 13)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeVat(trimmed);
    if (cleaned.length < 13) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 13) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    const body = cleaned.slice(2, 13);
    if (isLegalEntity(body)) {
      if (!legalEntityChecksumOk(body)) {
        return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
      }
    } else if (!naturalPersonFormatOk(body)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `LV ${cleaned.slice(2, 13)}`,
      confidence: "moderate",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("LV")) return cleaned;
  if (/^\d{11}$/.test(cleaned)) return `LV${cleaned}`;
  return cleaned;
}

function isLegalEntity(body11: string): boolean {
  const first = body11.charCodeAt(0) - 48;
  return first > 3;
}

function legalEntityChecksumOk(body11: string): boolean {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const w = LEGAL_WEIGHTS[i];
    if (w === undefined) return false;
    sum += (body11.charCodeAt(i) - 48) * w;
  }
  return sum % 11 === 3;
}

function naturalPersonFormatOk(body11: string): boolean {
  // First 6 digits = DDMMYY with a valid date. Per python-stdnum, allow
  // months 01..12 and days 01..31 (no day-in-month sanity check, since the
  // century year is ambiguous without the separator byte).
  const day = Number.parseInt(body11.slice(0, 2), 10);
  const month = Number.parseInt(body11.slice(2, 4), 10);
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;
  return true;
}
