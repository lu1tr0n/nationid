/**
 * France — SIRET (Système d'Identification du Répertoire des établissements).
 *
 * Issuer: INSEE.
 * Source: https://www.insee.fr/fr/information/1956003
 *
 * Format: 14 digits = SIREN (9) + NIC (5). Displayed as `123 456 782 00012`
 *   (3-3-3-5 grouping, with the NIC trailing).
 *
 * Check digit: Luhn over all 14 digits.
 *
 * Special case: the head office of `LA POSTE` (SIREN `356000000`) does NOT
 * pass standard Luhn; INSEE specifies that any SIRET starting with that SIREN
 * is valid iff the sum of all 14 digits is divisible by 5. We accept this
 * exception so e-invoicing flows interoperate with public-sector receivers.
 *
 * Confidence: high. Algorithm published by INSEE and replicated in
 * `python-stdnum.fr.siret`, `frenchsiret`, and `validator.js`.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{14}$/;
const FORMATTED_REGEX = /^\d{3} \d{3} \d{3} \d{5}$/;
const LA_POSTE_SIREN = "356000000";

const COUNTRY = "FR" as CountryCode;
// TODO(v0.6-integration): orchestrator extends `DocumentTypeCode` with `FR_SIRET`.
const CODE = "FR_SIRET" as DocumentTypeCode;

export const siretSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.FR_SIRET.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000 000 000 00000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkSiret(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return formatSiret(digits);
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 14) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 14) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!checkSiret(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: formatSiret(digits),
      confidence: "high",
    };
  },
};

function checkSiret(digits: string): boolean {
  if (digits.startsWith(LA_POSTE_SIREN)) {
    let sum = 0;
    for (let i = 0; i < 14; i++) sum += digits.charCodeAt(i) - 48;
    return sum % 5 === 0;
  }
  return luhnValid(digits);
}

function formatSiret(digits: string): string {
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9, 14)}`;
}
