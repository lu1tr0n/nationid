/**
 * Germany — Steuernummer (state-issued tax number).
 *
 * Issuer: 16 Bundesländer Finanzämter (each Land issues its own format).
 * Sources: BMF Schreiben 2008-12-19; ELSTER documentation.
 *
 * Format: 10 or 11 digits, displayed grouped as `xxx/xxxx/xxxx` or
 *   `xxx/xxx/xxxxx` depending on Land. The state-internal layout encodes the
 *   Finanzamt code (positions 1-4) + the Bezirksnummer + the Unterscheidungs-
 *   nummer + a check digit.
 *
 * Check digit: state-specific. There is no single nationwide algorithm; each
 *   Land's ELSTER configuration files define its own variant. We do NOT
 *   verify the check digit here.
 *
 * Confidence: low. Format-only validation. Backend lookup against the
 * Bundeszentralamt USt-IdNr / ELSTER endpoint is recommended for any
 * authoritative check.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/** 10-13 digits accept window: covers all Land variants and the 13-digit "Bundeseinheitliche Steuernummer". */
const RAW_REGEX = /^\d{10,13}$/;
/**
 * Two common Land formats are accepted in the formatted regex; we do not try
 * to enumerate all 16 variants.
 *   `123/456/78901` (Bayern, NRW after-2007: 11 chars, 3-3-5)
 *   `123/4567/8901` (NRW pre-2007: 11 chars, 3-4-4)
 */
const FORMATTED_REGEX = /^\d{2,4}\/\d{3,4}\/\d{4,5}$/;

const COUNTRY = "DE";
const CODE = "DE_STEUERNUMMER";

export const steuernummerSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.DE_STEUERNUMMER.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000/0000/0000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    return RAW_REGEX.test(stripNonDigits(input));
  },

  format(input: string): string {
    // Cannot reliably format without knowing the issuing Land. We return
    // the input unchanged when it doesn't already match a known shape.
    if (FORMATTED_REGEX.test(input.trim())) return input.trim();
    return input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 10) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 13) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      // No canonical formatted form without Land context; preserve raw input
      // shape if it already has separators.
      formatted: FORMATTED_REGEX.test(trimmed) ? trimmed : digits,
      confidence: "low",
    };
  },
};
