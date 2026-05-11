/**
 * United Kingdom — NHS Number (England & Wales).
 *
 * Issuer: NHS Digital (England) / Digital Health and Care Wales.
 * Source: https://digital.nhs.uk/services/personal-demographics-service
 *
 * Format: 10 digits, displayed as `999 999 9999` (3-3-4 grouping).
 * Note: Scotland uses CHI numbers (also 10 digits but starting with DDMMYY)
 * and Northern Ireland uses H&C numbers; both are out of scope here.
 *
 * Check digit: Modulus 11 over the first 9 digits with weights
 * `[10, 9, 8, 7, 6, 5, 4, 3, 2]`.
 *   r  = sum mod 11
 *   dv = 11 - r
 *   - if dv == 11 → 0
 *   - if dv == 10 → number is invalid (NHS Digital re-issues)
 *
 * Confidence: high. Algorithm is published by NHS Digital and replicated by
 * `validator.js isIdentityCard('en-GB')` and the NHS PDS API.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{10}$/;
const FORMATTED_REGEX = /^\d{3} \d{3} \d{4}$/;
const WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2] as const;

const COUNTRY = "GB" as CountryCode;
// TODO(v0.6-integration): orchestrator extends `DocumentTypeCode` with `GB_NHS`.
const CODE = "GB_NHS" as DocumentTypeCode;

export const nhsSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "personal",
  labelKey: "documents.GB_NHS.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000 000 0000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkNhs(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
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
    if (digits.length > 10) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!checkNhs(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`,
      confidence: "high",
    };
  },
};

function checkNhs(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += (digits.charCodeAt(i) - 48) * w;
  }
  const r = sum % 11;
  const dv = 11 - r;
  if (dv === 10) return false;
  const expected = dv === 11 ? 0 : dv;
  return expected === digits.charCodeAt(9) - 48;
}
