/**
 * Cyprus — VAT (ΦΠΑ — Φόρος Προστιθέμενης Αξίας).
 *
 * Issuer: Tax Department, Ministry of Finance.
 * Source: https://mof.gov.cy/
 * Statute: Ν. 95(I)/2000 — Value Added Tax Law (Cyprus VAT Law).
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.cy.vat`.
 *
 * Format: `CY` + 8 digits + 1 uppercase check letter (e.g. `CY10259033P`).
 * First two digits cannot be `12` (reserved prefix).
 *
 * Check letter: positional translation. Even-indexed digits (0,2,4,6) are
 * translated via a fixed table: `[1,0,5,7,9,13,15,17,19,21]`. Odd-indexed
 * digits (1,3,5,7) are kept raw. Sum mod 26 → index into `A..Z`.
 *
 * Confidence: high.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^CY\d{8}[A-Z]$/;
const FORMATTED_REGEX = /^CY \d{8}[A-Z]$/;
// Translation table for even-indexed (0,2,4,6) body digits → "weighted" value.
const EVEN_TRANSLATION: ReadonlyArray<number> = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21];
const LETTER_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const COUNTRY = "CY";
const CODE = "CY_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.CY_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "CY 00000000A",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeVat(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    if (cleaned.slice(2, 4) === "12") return false;
    return checksumOk(cleaned.slice(2));
  },

  format(input: string): string {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `CY ${cleaned.slice(2)}`;
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
    if (cleaned.slice(2, 4) === "12") {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checksumOk(cleaned.slice(2))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `CY ${cleaned.slice(2)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("CY")) return cleaned;
  if (/^\d{8}[A-Z]$/.test(cleaned)) return `CY${cleaned}`;
  return cleaned;
}

function checksumOk(body9: string): boolean {
  // body9 = 8 digits + 1 letter.
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = body9.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (i % 2 === 0) {
      const t = EVEN_TRANSLATION[d];
      if (t === undefined) return false;
      sum += t;
    } else {
      sum += d;
    }
  }
  const expectedIdx = sum % 26;
  const expectedLetter = LETTER_ALPHABET[expectedIdx];
  return expectedLetter === body9.charAt(8);
}
