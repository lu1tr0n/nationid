/**
 * Lithuania — PVM mokėtojo kodas (VAT identification number).
 *
 * Issuer: Valstybinė mokesčių inspekcija (VMI).
 * Source: https://www.vmi.lt/
 * Statute: Lietuvos Respublikos pridėtinės vertės mokesčio įstatymas, art. 71.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.lt.pvm`.
 *
 * Format: `LT` + 9 digits (legal entity) OR `LT` + 12 digits (temporary
 * registration). For 9-digit form, position 7 (0-indexed pos 6) is the
 * structural marker `1`. For 12-digit form, position 10 (0-indexed pos 9)
 * is the structural marker `1`.
 *
 * Check digit: last digit. Weights cycle `[1,2,3,4,5,6,7,8,9,1,2,…]` over
 * body excluding the check digit. `r = sum mod 11`; if `r == 10`, retry
 * with fallback weights `[3,4,5,6,7,8,9,1,2,3,4,…]`. Final `r mod 10`
 * is the check digit.
 *
 * Confidence: high.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX_9 = /^LT\d{6}1\d{2}$/;
const RAW_REGEX_12 = /^LT\d{9}1\d{2}$/;
const FORMATTED_REGEX = /^LT \d{9,12}$/;

const COUNTRY = "LT";
const CODE = "LT_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.LT_VAT.label",
  rawRegex: RAW_REGEX_9,
  formattedRegex: FORMATTED_REGEX,
  mask: "LT 000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeVat(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeVat(input);
    if (!isShape(cleaned)) return false;
    return checksumOk(cleaned.slice(2));
  },

  format(input: string): string {
    const cleaned = normalizeVat(input);
    if (!isShape(cleaned)) return input;
    return `LT ${cleaned.slice(2)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeVat(trimmed);
    if (cleaned.length < 11) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 14) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!isShape(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checksumOk(cleaned.slice(2))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `LT ${cleaned.slice(2)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("LT")) return cleaned;
  if (/^\d{9}$/.test(cleaned) || /^\d{12}$/.test(cleaned)) return `LT${cleaned}`;
  return cleaned;
}

function isShape(cleaned: string): boolean {
  return RAW_REGEX_9.test(cleaned) || RAW_REGEX_12.test(cleaned);
}

function checksumOk(body: string): boolean {
  // body includes trailing check digit. Split.
  const bodyNoCheck = body.slice(0, -1);
  const declared = body.charCodeAt(body.length - 1) - 48;
  if (declared < 0 || declared > 9) return false;

  // Primary weights: i+1 mod 10, capped at 9 (cycles 1..9,1,2,...).
  let r = weightedSumMod11Cycle(bodyNoCheck, 1);
  if (r === 10) {
    // Fallback weights: i+3 mod 10, cycles 3..9,1,2,3...
    r = weightedSumMod11Cycle(bodyNoCheck, 3);
    if (r === 10) r = 0;
  }
  return r === declared;
}

function weightedSumMod11Cycle(body: string, startWeight: number): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const d = body.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return -1;
    // Cycle 1..9,1,2,3,... starting at startWeight.
    const w = ((i + startWeight - 1) % 9) + 1;
    sum += d * w;
  }
  return sum % 11;
}
