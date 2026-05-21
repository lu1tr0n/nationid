/**
 * France — SIREN (Système d'Identification du Répertoire des ENtreprises).
 *
 * Issuer: INSEE.
 * Source: https://www.insee.fr/fr/information/1956003
 *
 * Format: 9 digits, displayed as `123 456 782` (3-3-3 grouping).
 *
 * Check digit: Luhn (ISO/IEC 7812-1) over all 9 digits.
 *
 * Confidence: high. Algorithm published by INSEE; matches `validator.js`
 * `isVAT('fr-FR')` (which derives the SIREN portion of TVA) and
 * `python-stdnum.fr.siren`.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{9}$/;
const FORMATTED_REGEX = /^\d{3} \d{3} \d{3}$/;

const COUNTRY = "FR";
const CODE = "FR_SIREN";

export const sirenSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.FR_SIREN.label",
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
    return luhnValid(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
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
    if (!luhnValid(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`,
      confidence: "high",
    };
  },
};
