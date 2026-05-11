/**
 * Belgium — Numéro de Registre national / Rijksregisternummer (NRN/RRN).
 *
 * Issuer: Registre national des personnes physiques.
 * Source: https://www.ibz.rrn.fgov.be/
 *
 * Format: 11 digits. Visual `00.00.00-000.00`.
 *   - 6 digits: yymmdd date of birth (or assigned-bis date for foreigners
 *     whose DOB month gets +20 / +40 — bis numbers).
 *   - 3 digits: ordering number within the day. Odd = male, even = female.
 *   - 2 digits: check digits.
 *
 * Check digit:
 *   - Born **before 2000-01-01**: `dv = 97 - (first9 mod 97)`.
 *   - Born **on or after 2000-01-01**: prepend the digit `2` to the first
 *     9 digits → 10-digit number; `dv = 97 - (n10 mod 97)`.
 *
 * Bis numbers (foreigners): month part is `mm + 20` if sex unknown at
 * registration, `mm + 40` once known. We accept both: a bis-month is
 * decoded back to its real month before the DOB-validity check.
 *
 * Confidence: high. Algorithm is published verbatim by the Belgian Registre
 * national and reproduced in `python-stdnum.be.nn` and `validator.js
 * isIdentityCard('be-BE')`.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{11}$/;
const FORMATTED_REGEX = /^\d{2}\.\d{2}\.\d{2}-\d{3}\.\d{2}$/;
const COUNTRY = "BE" as CountryCode;
// TODO(v0.6-integration): orchestrator extends `DocumentTypeCode` with `BE_NRN`.
const CODE = "BE_NRN" as DocumentTypeCode;

export const nrnSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both", // Personal ID + tax/social ID.
  labelKey: "documents.BE_NRN.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00.00.00-000.00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (!isPlausibleDob(digits)) return false;
    return checkNrn(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return formatNrn(digits);
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!isPlausibleDob(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkNrn(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: formatNrn(digits),
      confidence: "high",
    };
  },
};

function formatNrn(digits: string): string {
  const yy = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const dd = digits.slice(4, 6);
  const ord = digits.slice(6, 9);
  const dv = digits.slice(9, 11);
  return `${yy}.${mm}.${dd}-${ord}.${dv}`;
}

/**
 * Validate dd / mm components are within plausible ranges, accounting for
 * bis-numbers where month is shifted by +20 or +40 and for the rare
 * "month=00" / "day=00" placeholders the Registre national itself emits
 * when the real DOB is unknown (we accept those).
 */
function isPlausibleDob(digits: string): boolean {
  const mmRaw = Number.parseInt(digits.slice(2, 4), 10);
  const dd = Number.parseInt(digits.slice(4, 6), 10);
  let mm = mmRaw;
  if (mm > 40) mm -= 40;
  else if (mm > 20) mm -= 20;
  if (mm < 0 || mm > 12) return false;
  if (dd < 0 || dd > 31) return false;
  return true;
}

function checkNrn(digits: string): boolean {
  const first9 = digits.slice(0, 9);
  const dv = Number.parseInt(digits.slice(9, 11), 10);
  // Try 19xx interpretation first.
  const pre2000 = 97 - (modBigStr(first9) % 97);
  if (pre2000 === dv) return true;
  // Then 20xx (or later) interpretation: prepend "2".
  const post2000 = 97 - (modBigStr(`2${first9}`) % 97);
  return post2000 === dv;
}

/** Compute n mod 97 by streaming the digit string (avoids BigInt). */
function modBigStr(s: string): number {
  let rem = 0;
  for (let i = 0; i < s.length; i++) {
    rem = (rem * 10 + (s.charCodeAt(i) - 48)) % 97;
  }
  return rem;
}
