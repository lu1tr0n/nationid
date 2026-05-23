/**
 * India — Aadhaar number (`IN_AADHAAR`).
 *
 * Issuer: Unique Identification Authority of India (UIDAI), Ministry of
 * Electronics & IT.
 * Source: https://uidai.gov.in/en/my-aadhaar/about-your-aadhaar.html
 *         https://web.archive.org/web/20140611025606/http://uidai.gov.in/UID_PDF/Working_Papers/A_UID_Numbering_Scheme.pdf
 * Statute: Aadhaar (Targeted Delivery of Financial and Other Subsidies,
 *          Benefits and Services) Act 2016.
 *
 * Format: 12 digits, first digit `2`–`9` (UIDAI reserves `0` for system use
 * and `1` for VID). Canonical print form is `NNNN NNNN NNNN`.
 *
 * Check digit: Verhoeff (IS 4905:1968) over all 12 digits. The Verhoeff
 * scheme detects all single-digit and all transposition errors.
 *
 * UIDAI's working paper additionally rejects palindromes; we mirror that
 * runtime guard.
 *
 * Confidence: high. UIDAI publishes the algorithm + the first-party
 * numbering scheme paper is archived; statute is gazetted.
 */

import { verhoeffValid } from "../../algorithms/verhoeff.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[2-9][0-9]{11}$/;
const FORMATTED_REGEX = /^[2-9][0-9]{3} [0-9]{4} [0-9]{4}$/;
const CODE = "IN_AADHAAR";

function isPalindrome(s: string): boolean {
  for (let i = 0; i < s.length >> 1; i++) {
    if (s.charCodeAt(i) !== s.charCodeAt(s.length - 1 - i)) return false;
  }
  return true;
}

export const aadhaarSpec: DocumentSpec = {
  code: CODE,
  country: "IN",
  scope: "personal",
  labelKey: "documents.IN_AADHAAR.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000 0000 0000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const cleaned = stripNonDigits(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    if (isPalindrome(cleaned)) return false;
    return verhoeffValid(cleaned);
  },

  format(input: string): string {
    const cleaned = stripNonDigits(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = stripNonDigits(trimmed);
    if (cleaned.length < 12) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 12) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned) || isPalindrome(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!verhoeffValid(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`,
      confidence: "high",
    };
  },
};
