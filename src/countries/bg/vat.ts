/**
 * Bulgaria — VAT (ДДС №) — legal-entity 9-digit form.
 *

 * Issuer: Национална агенция за приходите (NRA, National Revenue Agency).
 * Source: https://nra.bg/ (issuer root — programmatic checks blocked by
 *         self-signed TLS cert; browser-accessible).
 *         https://web.archive.org/web/2024/https://nra.bg/ (Wayback snapshot
 *         verified live 2026-05-24).
 * Statute: Закон за данък върху добавената стойност (ЗДДС), чл. 94 — binding authority.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.bg.vat`.
 *
 * Format: `BG` + 9 digits. **Scope: 9-digit legal-entity only** (per
 * v2.0 EU-VAT VERIFICATION §BG-1). The 10-digit branch (sole proprietor
 * with embedded EGN / PNF / other) is deferred to a future `BG_EGN` spec.
 *
 * Check digit: 9th digit. Primary weights `[1,2,3,4,5,6,7,8]` over the 8
 * body digits, sum mod 11. If result is 10, retry with fallback weights
 * `[3,4,5,6,7,8,9,10]`, sum mod 11. If that result is also 10, the check
 * digit is `0`. Otherwise it equals the result.
 *
 * Confidence: high (legal-entity branch).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^BG\d{9}$/;
const FORMATTED_REGEX = /^BG \d{9}$/;
const PRIMARY_WEIGHTS: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6, 7, 8];
const FALLBACK_WEIGHTS: ReadonlyArray<number> = [3, 4, 5, 6, 7, 8, 9, 10];

const COUNTRY = "BG";
const CODE = "BG_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.BG_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "BG 000000000",
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
    return `BG ${cleaned.slice(2, 11)}`;
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
      formatted: `BG ${cleaned.slice(2, 11)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("BG")) return cleaned;
  if (/^\d{9}$/.test(cleaned)) return `BG${cleaned}`;
  return cleaned;
}

function weightedSumMod11(body8: string, weights: ReadonlyArray<number>): number {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const w = weights[i];
    if (w === undefined) return -1;
    sum += (body8.charCodeAt(i) - 48) * w;
  }
  return sum % 11;
}

function checksumOk(body9: string): boolean {
  const body8 = body9.slice(0, 8);
  const declared = body9.charCodeAt(8) - 48;
  if (declared < 0 || declared > 9) return false;
  let r = weightedSumMod11(body8, PRIMARY_WEIGHTS);
  if (r === 10) {
    r = weightedSumMod11(body8, FALLBACK_WEIGHTS);
    if (r === 10) r = 0;
  }
  return r === declared;
}
