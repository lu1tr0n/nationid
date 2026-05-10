/**
 * Norway — Organisasjonsnummer (legal-entity registration number).
 *
 * Issuer: Brønnøysundregistrene (Brønnøysund Register Centre).
 * Source: https://www.brreg.no/
 *
 * Format: 9 digits, displayed as `XXX XXX XXX` (groups of 3, optional
 * separator). The library normalises to digits-only and renders the
 * formatted form with single spaces between the three groups.
 *
 * Check digit: weights `[3, 2, 7, 6, 5, 4, 3, 2]` over digits 1-8.
 *   r  = sum mod 11
 *   dv = 11 - r ; if r == 0 → dv = 0 ; if dv == 10 → number is invalid
 *
 * Confidence: high — Brønnøysund publishes the algorithm; cross-validated
 * against `validator.js isVAT('NO')` and `python-stdnum stdnum.no.orgnr`.
 */

import { mod11WeightedSum } from "../../algorithms/mod11.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{9}$/;
const FORMATTED_REGEX = /^\d{3} \d{3} \d{3}$/;

const W = [3, 2, 7, 6, 5, 4, 3, 2] as const;

const COUNTRY = "NO" as CountryCode;
// TODO(v0.6-integration): orchestrator extends DocumentTypeCode with NO_ORGNR.
const CODE = "NO_ORGNR" as DocumentTypeCode;

export const orgnrSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.NO_ORGNR.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000 000 000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkOrgnr(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 9) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 9) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkOrgnr(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`,
      confidence: "high",
    };
  },
};

export function checkOrgnr(digits: string): boolean {
  if (digits.length !== 9) return false;
  const sum = mod11WeightedSum(digits.slice(0, 8), W as unknown as number[]);
  let dv = 11 - (sum % 11);
  if (dv === 11) dv = 0;
  if (dv === 10) return false;
  return dv === digits.charCodeAt(8) - 48;
}
