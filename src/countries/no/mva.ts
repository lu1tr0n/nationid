/**
 * Norway — MVA (VAT registration number).
 *
 * Issuer: Skatteetaten.
 * Source: https://www.skatteetaten.no/
 *
 * Format: `NO` + 9-digit Organisasjonsnummer + `MVA` (14 chars total).
 * Common written forms: `NO 123 456 789 MVA` or `NO123456789MVA`.
 *
 * Validation: prefix + valid orgnr (Brønnøysund mod-11) + `MVA` suffix.
 *
 * Confidence: high.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";
import { checkOrgnr } from "./orgnr.ts";

const RAW_REGEX = /^NO\d{9}MVA$/;
const FORMATTED_REGEX = /^NO\d{9}MVA$/;

const COUNTRY = "NO" as CountryCode;
// TODO(v0.6-integration): orchestrator extends DocumentTypeCode with NO_MVA.
const CODE = "NO_MVA" as DocumentTypeCode;

export const mvaSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.NO_MVA.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "NO000000000MVA",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkOrgnr(cleaned.slice(2, 11));
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return cleaned;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 14) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 14) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkOrgnr(cleaned.slice(2, 11))) {
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
