/**
 * Ireland — VAT (Value-Added Tax registration).
 *
 * Issuer: Office of the Revenue Commissioners.
 * Source: https://www.revenue.ie/en/vat/index.aspx
 * Statute: VAT Consolidation Act 2010, s. 65.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.ie.vat`.
 *
 * Format two coexisting forms:
 *   - Old (pre-2013): `IE` + 7 digits + 1 check letter (e.g. `IE8473625E`).
 *   - New (post-2013): `IE` + 7 digits + check letter + trailing letter
 *     (typically `W` for unincorporated bodies / partnerships, e.g.
 *     `IE3628739UA`). The 9th character is the second-letter discriminator.
 *
 * Check letter: mod-23 over the 7 body digits with weights `[8,7,6,5,4,3,2]`.
 * For the post-2013 form, the trailing letter contributes a value of 9 (W),
 * mapping into the same mod-23 sum.
 *
 * The 23-letter alphabet for the check is `WABCDEFGHIJKLMNOPQRSTUV`
 * (note: starts with `W`, not `A` — this equals `[A-W]` as a character
 * class so the regex can use either notation; the alphabet only matters
 * for the index → letter mapping at position `sum mod 23`).
 *
 * Confidence: high.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

// Accept both old (7 digits + 1 letter) and new (7 digits + 2 letters,
// trailing letter in {A,W} per Revenue) forms.
const RAW_REGEX = /^IE\d{7}[A-W]([AW])?$/;
const FORMATTED_REGEX = /^IE\d{7}[A-W][AW]?$/;
const WEIGHTS: ReadonlyArray<number> = [8, 7, 6, 5, 4, 3, 2];
// 23-letter alphabet (W=0..V=22). Equivalent character class to [A-W].
const CHECK_ALPHABET = "WABCDEFGHIJKLMNOPQRSTUV";

const COUNTRY = "IE";
const CODE = "IE_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.IE_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "IE0000000A",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeVat(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checksumOk(cleaned);
  },

  format(input: string): string {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return cleaned;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeVat(trimmed);
    if (cleaned.length < 10) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 11) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checksumOk(cleaned)) {
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

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("IE")) return cleaned;
  if (/^\d{7}[A-W][AW]?$/.test(cleaned)) return `IE${cleaned}`;
  return cleaned;
}

function checksumOk(full: string): boolean {
  // full = "IE" + body. Body is either 8 chars (old: 7 digits + letter) or
  // 9 chars (new: 7 digits + letter + trailing letter).
  const body = full.slice(2);
  const digits = body.slice(0, 7);
  const checkLetter = body.charAt(7);
  const trailing = body.length === 9 ? body.charAt(8) : "";

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += (digits.charCodeAt(i) - 48) * w;
  }
  // For the post-2013 9-char form, the trailing letter contributes 9 * (its
  // alphabetic position - 0) — Revenue's published rule says `W` adds 9·9=81
  // and `A` adds 0. Use the check-alphabet index since `W` = 0 in that table.
  if (trailing) {
    const trailingIdx = CHECK_ALPHABET.indexOf(trailing);
    if (trailingIdx === -1) return false;
    sum += 9 * trailingIdx;
  }
  const expectedIdx = sum % 23;
  const expectedLetter = CHECK_ALPHABET[expectedIdx];
  return expectedLetter === checkLetter;
}
