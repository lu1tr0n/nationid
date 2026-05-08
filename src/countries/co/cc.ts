/**
 * Colombia — Cédula de Ciudadanía (`CO_CC`).
 *
 * Issuer: Registraduría Nacional del Estado Civil.
 * Source: https://www.registraduria.gov.co/
 * Legal basis: Decreto 1260/1970.
 *
 * Format: 6-10 digits, no separators. Display often uses thousands
 * separators (e.g. `1.020.304.050`) but storage is digits-only.
 *
 * Check digit: **none**. The Registraduría has never published a check digit
 * for the CC; verification is done online against their database.
 *
 * Confidence: low. Format-only validation. The new "cédula digital" rolled
 * out in 2020 keeps the same number; the QR carries additional fields but
 * does not add a checksum to the printed number.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{6,10}$/;
const FORMATTED_REGEX = /^\d{1,3}(?:\.\d{3}){1,3}$/;

export const ccSpec: DocumentSpec = {
  code: "CO_CC",
  country: "CO",
  scope: "personal",
  labelKey: "documents.CO_CC.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  // Variable-length: mask is the maximum (10 digits). UI renders a flexible
  // template based on the actual length.
  mask: "0000000000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return formatThousands(digits);
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "CO_CC", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 6) {
      return { ok: false, code: "CO_CC", reason: { kind: "too_short" } };
    }
    if (digits.length > 10) {
      return { ok: false, code: "CO_CC", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "CO_CC", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "CO_CC",
      normalized: digits,
      formatted: formatThousands(digits),
      confidence: "low",
    };
  },
};

/** Insert thousands separators every 3 digits from the right. */
function formatThousands(digits: string): string {
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    const fromRight = digits.length - i;
    if (i > 0 && fromRight % 3 === 0) out += ".";
    out += digits[i];
  }
  return out;
}
