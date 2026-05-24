/**
 * India — Elector's Photo Identity Card (`IN_EPIC`).
 *
 * Issuer: Election Commission of India (ECI).
 * Source: https://www.eci.gov.in/ (issuer root — verified live 2026-05-24).
 *         https://voters.eci.gov.in/ (National Voter Service Portal).
 * Statute: Representation of the People Act 1950; ECI order Aug 1993
 *          introducing the voter ID card.
 *
 * Format: 10-char `[A-Z]{3}[0-9]{7}`. First 3 letters are a Functional
 * Constituency code (FC code) assigned by the ECI per assembly constituency;
 * last 7 digits are a serial. Format varies regionally and historical EPIC
 * numbers may not match this pattern (legacy 9-digit forms exist).
 *
 * Check digit: ECI does not publish a check-digit algorithm for EPIC.
 * Community libraries diverge on whether a Luhn-on-last-7 holds; we do NOT
 * implement it.
 *
 * Confidence: low. Format-only validation; the source list is non-ECI for
 * the algorithm, only the issuer is first-party. Consumers must treat EPIC
 * validity as a *shape* check, not a *real-document* check.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z]{3}[0-9]{7}$/;
const CODE = "IN_EPIC";

export const epicSpec: DocumentSpec = {
  code: CODE,
  country: "IN",
  scope: "personal",
  labelKey: "documents.IN_EPIC.label",
  rawRegex: RAW_REGEX,
  mask: "AAA0000000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned) ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 10) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 10) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: cleaned,
      confidence: "low",
    };
  },
};
