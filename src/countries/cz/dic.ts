/**
 * Czechia — DIČ (Daňové identifikační číslo) — legal-entity 8-digit branch.
 *
 * Issuer: Finanční správa České republiky.
 * Source: https://financnisprava.gov.cz/
 * Statute: Zákon č. 235/2004 Sb., o dani z přidané hodnoty, §94–95.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.cz.dic`.
 *
 * Format: `CZ` + 8 digits. **Scope: 8-digit legal-entity branch only**
 * (per v2.0 EU-VAT VERIFICATION §CZ). The 9-digit "special natural
 * person" branch (first digit `6`) and 10-digit RČ branch are deferred
 * to a future `CZ_RC` spec.
 *
 * Check digit: 8th digit. Weights `[8,7,6,5,4,3,2]` over the first 7 body
 * digits. `r = sum mod 11`; `check = (11 - r) mod 11`; if `check === 10`,
 * substitute `1` then `mod 10`. First body digit must not be `9`.
 *
 * Confidence: high (legal-entity branch only).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^CZ[0-8]\d{7}$/;
const FORMATTED_REGEX = /^CZ \d{8}$/;
const WEIGHTS: ReadonlyArray<number> = [8, 7, 6, 5, 4, 3, 2];

const COUNTRY = "CZ";
const CODE = "CZ_DIC";

export const dicSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.CZ_DIC.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "CZ 00000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeDic(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeDic(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checksumOk(cleaned.slice(2, 10));
  },

  format(input: string): string {
    const cleaned = normalizeDic(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `CZ ${cleaned.slice(2, 10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeDic(trimmed);
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
      formatted: `CZ ${cleaned.slice(2, 10)}`,
      confidence: "high",
    };
  },
};

function normalizeDic(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("CZ")) return cleaned;
  if (/^[0-8]\d{7}$/.test(cleaned)) return `CZ${cleaned}`;
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
  let check: number;
  if (r === 0) check = 1;
  else if (r === 1) check = 0;
  else check = 11 - r;
  return check === body8.charCodeAt(7) - 48;
}
