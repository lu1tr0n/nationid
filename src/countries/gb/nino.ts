/**
 * United Kingdom — NINO (National Insurance Number).
 *
 * Issuer: HM Revenue & Customs / Department for Work and Pensions.
 * Source: https://www.gov.uk/national-insurance-number
 * Reference: HMRC NIM39110.
 *
 * Format: 9 chars: 2 letters + 6 digits + 1 letter suffix (`A`, `B`, `C`, or `D`).
 *   Visually displayed as `AB 12 34 56 C`.
 *
 * Excluded prefixes (reserved by HMRC): `BG, GB, NK, KN, TN, NT, ZZ`.
 * The first prefix letter cannot be `D, F, I, Q, U, V`.
 * The second prefix letter cannot be `D, F, I, O, Q, U, V`.
 *
 * Check digit: none. Format-only validation.
 *
 * Confidence: moderate. HMRC publishes prefix exclusions but no checksum
 * algorithm. The format constraints encoded here match HMRC NIM39110 and
 * `validator.js` `isIdentityCard('en-GB')`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/**
 * Strict NINO regex per HMRC NIM39110:
 * - First letter: A-Z minus D, F, I, Q, U, V
 * - Second letter: A-Z minus D, F, I, O, Q, U, V
 * - Then six digits
 * - Suffix letter: A, B, C, or D
 * - Excluded two-letter prefixes (negative lookahead): BG, GB, NK, KN, TN, NT, ZZ
 */
const RAW_REGEX = /^(?!BG|GB|NK|KN|TN|NT|ZZ)[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z]\d{6}[A-D]$/;
const FORMATTED_REGEX =
  /^(?!BG|GB|NK|KN|TN|NT|ZZ)[A-CEGHJ-PR-TW-Z][A-CEGHJ-NPR-TW-Z] \d{2} \d{2} \d{2} [A-D]$/;

const COUNTRY = "GB";
const CODE = "GB_NINO";

export const ninoSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both",
  labelKey: "documents.GB_NINO.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "AA 00 00 00 A",
  hasCheckDigit: false,
  confidence: "moderate",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    return RAW_REGEX.test(stripAndUpper(input));
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return formatNino(cleaned);
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 9) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 9) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: formatNino(cleaned),
      confidence: "moderate",
    };
  },
};

function formatNino(cleaned: string): string {
  return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
}
