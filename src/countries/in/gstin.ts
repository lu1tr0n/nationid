/**
 * India — Goods and Services Tax Identification Number (`IN_GSTIN`).
 *
 * Issuer: Goods and Services Tax Network (GSTN), under CBIC, Ministry of
 * Finance.
 * Source: https://cbic-gst.gov.in/ (issuer root — verified live 2026-05-24).
 *         https://www.gst.gov.in/ (taxpayer portal — may rate-limit
 *         programmatic checks, browser-accessible).
 * Statute: CGST Act 2017; CGST Rules 2017, Rule 10.
 *
 * Format: 15-char alphanumeric `SS PPPPPPPPPP E Z C`:
 *   pos 1-2  state/UT code (01-38 + 96/97/99 non-state codes)
 *   pos 3-12 PAN of the registered taxpayer (must pass full PAN validation)
 *   pos 13   entity registration number 1-9 or A-Z (0 invalid)
 *   pos 14   literal `Z`
 *   pos 15   Luhn mod-36 check digit
 *
 * Check digit: Luhn over alphabet `"0123456789A..Z"` (base 36). Cross-
 * validated against python-stdnum and CBIC training materials.
 *
 * Confidence: high. GSTN publishes structure; CGST Rules define issuer.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
const PAN_ENTITY_TYPES = new Set(["A", "B", "C", "F", "G", "H", "J", "L", "P", "T"]);
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const STATE_CODES = new Set([
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "96",
  "97",
  "99",
]);
const CODE = "IN_GSTIN";

function luhnMod36Valid(input: string): boolean {
  let sumOdd = 0;
  let sumEven = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input[input.length - 1 - i];
    if (ch === undefined) return false;
    const v = ALPHABET.indexOf(ch);
    if (v < 0) return false;
    if (i % 2 === 0) {
      sumOdd += v;
    } else {
      const doubled = v * 2;
      sumEven += Math.floor(doubled / 36) + (doubled % 36);
    }
  }
  return (sumOdd + sumEven) % 36 === 0;
}

function panEmbeddedValid(pan: string): boolean {
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return false;
  const entity = pan[3];
  if (entity === undefined || !PAN_ENTITY_TYPES.has(entity)) return false;
  if (pan.slice(5, 9) === "0000") return false;
  return true;
}

export const gstinSpec: DocumentSpec = {
  code: CODE,
  country: "IN",
  scope: "tax",
  labelKey: "documents.IN_GSTIN.label",
  rawRegex: RAW_REGEX,
  mask: "00AAAAA0000A0Z*",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    if (!STATE_CODES.has(cleaned.slice(0, 2))) return false;
    if (!panEmbeddedValid(cleaned.slice(2, 12))) return false;
    if (cleaned[12] === "0") return false;
    return luhnMod36Valid(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned) ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 15) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 15) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!STATE_CODES.has(cleaned.slice(0, 2))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!panEmbeddedValid(cleaned.slice(2, 12))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (cleaned[12] === "0") {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!luhnMod36Valid(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: cleaned,
      confidence: "high",
    };
  },
};
