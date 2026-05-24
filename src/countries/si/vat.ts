/**
 * Slovenia — Identifikacijska številka za DDV (EU VAT number).
 *
 * Issuer: Finančna uprava Republike Slovenije (FURS).
 * Source: https://www.fu.gov.si/
 * Statute: Zakon o davku na dodano vrednost (ZDDV-1), Uradni list RS 117/06.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.si.ddv`.
 *
 * Format: `SI` + 8 digits. First digit cannot be 0.
 *
 * Check digit: 8th digit. Weights `[8,7,6,5,4,3,2]` over the first 7 body
 * digits; `check = 11 - (sum mod 11)`, mapping `10 → 0`. Reject `check === 10`
 * outright (no valid 11-result exists for a real registration).
 *
 * Confidence: high.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^SI[1-9]\d{7}$/;
const FORMATTED_REGEX = /^SI \d{8}$/;
const WEIGHTS: ReadonlyArray<number> = [8, 7, 6, 5, 4, 3, 2];

const COUNTRY = "SI";
const CODE = "SI_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.SI_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "SI 00000000",
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
    return `SI ${cleaned.slice(2, 10)}`;
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
      formatted: `SI ${cleaned.slice(2, 10)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("SI")) return cleaned;
  if (/^[1-9]\d{7}$/.test(cleaned)) return `SI${cleaned}`;
  return cleaned;
}

function checksumOk(body8: string): boolean {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += (body8.charCodeAt(i) - 48) * w;
  }
  const r = sum % 11;
  const expected = r === 10 ? 0 : (11 - r) % 10;
  // If r === 1 we'd need check digit 10 — no valid SI VAT can have it; reject.
  if (r === 1) return false;
  return expected === body8.charCodeAt(7) - 48;
}
