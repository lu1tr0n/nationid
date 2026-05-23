/**
 * India — Virtual ID (`IN_VID`).
 *
 * Issuer: Unique Identification Authority of India (UIDAI), Ministry of
 * Electronics & IT.
 * Source: https://uidai.gov.in/en/my-aadhaar/about-your-aadhaar/virtual-id-vid.html
 *         UIDAI Circular K-11020/205/2017 dated 10-Jan-2018.
 *
 * Format: 16 digits, first digit `1` (UIDAI reserves the `1xxx...` range
 * for VID, separate from the `2-9` Aadhaar range).
 *
 * Check digit: Verhoeff (IS 4905:1968) over all 16 digits, same scheme as
 * Aadhaar (only the length differs).
 *
 * Confidence: high. UIDAI publishes algorithm + circular gazetted.
 */

import { verhoeffValid } from "../../algorithms/verhoeff.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^1[0-9]{15}$/;
const FORMATTED_REGEX = /^1[0-9]{3} [0-9]{4} [0-9]{4} [0-9]{4}$/;
const CODE = "IN_VID";

export const vidSpec: DocumentSpec = {
  code: CODE,
  country: "IN",
  scope: "personal",
  labelKey: "documents.IN_VID.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000 0000 0000 0000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const cleaned = stripNonDigits(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return verhoeffValid(cleaned);
  },

  format(input: string): string {
    const cleaned = stripNonDigits(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)} ${cleaned.slice(12, 16)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = stripNonDigits(trimmed);
    if (cleaned.length < 16) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 16) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!verhoeffValid(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)} ${cleaned.slice(12, 16)}`,
      confidence: "high",
    };
  },
};
