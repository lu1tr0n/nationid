/**
 * Iceland — VSK (Virðisaukaskattur, Icelandic VAT).
 *
 * Issuer: Skatturinn (Iceland Revenue and Customs / RSK).
 * Source: https://www.skatturinn.is/
 * Statute: Lög nr. 50/1988 um virðisaukaskatt (Icelandic VAT Act).
 *
 * Format: 5 or 6 digits. Visually displayed as the bare digits, sometimes
 * preceded by `IS` informally — Iceland is in the EEA but NOT in EU VIES,
 * so `IS` is not a VIES prefix.
 *
 * Check digit: none published by RSK. **Format-only validation.**
 *
 * Confidence: moderate (format-only — no algorithm to fail). Iceland is
 * **not** a VIES participant; this spec exists for KYC / invoicing tools
 * that need to recognize the form of an Icelandic tax number.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{5,6}$/;

const COUNTRY = "IS";
const CODE = "IS_VSK";

export const vskSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.IS_VSK.label",
  rawRegex: RAW_REGEX,
  mask: "000000",
  hasCheckDigit: false,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    return RAW_REGEX.test(stripNonDigits(input));
  },

  format(input: string): string {
    const cleaned = stripNonDigits(input);
    return RAW_REGEX.test(cleaned) ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = stripNonDigits(trimmed);
    if (cleaned.length < 5) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 6) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: cleaned,
      confidence: "moderate",
    };
  },
};
