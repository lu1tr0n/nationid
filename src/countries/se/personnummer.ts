/**
 * Sweden — Personnummer (personal identification number).
 *
 * Issuer: Skatteverket (Swedish Tax Agency, Folkbokföringen).
 * Statute: Folkbokföringslag (1991:481), §18 — defines the structure of the
 *   identifier, the `-`/`+` separator rule, and the 8-digit machine form.
 *   https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/folkbokforingslag-1991481_sfs-1991-481/
 * Samordningsnummer statute: Lag (2022:1697) om samordningsnummer.
 *   https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-20221697-om-samordningsnummer_sfs-2022-1697/
 * Consumer-facing reference pages (live-verified 2026-05-24, HTTP 200):
 *   https://www.skatteverket.se/privat/folkbokforing/personnummerochsamordningsnummer.4.3810a01c150939e893f18c29.html
 *   https://www.skatteverket.se/privat/folkbokforing/samordningsnummer.4.5c281c7015abecc2e201130b.html
 * Cross-validation oracle (pinned commit): python-stdnum at
 *   https://raw.githubusercontent.com/arthurdejong/python-stdnum/5d4ad17cae8abeab21f446b5569f85d185566330/stdnum/se/personnummer.py
 * npm reference implementation: `personnummer` v3.2.1
 *   (https://github.com/personnummer/js, src/index.ts).
 *
 * Format: 10 or 12 digits.
 *   - 10-digit form:  YYMMDD-NNNC          (hyphen for under 100 years)
 *                     YYMMDD+NNNC          (plus for 100+ years)
 *   - 12-digit form:  YYYYMMDD-NNNC        (century explicit, hyphen still used)
 *
 * Composition:
 *   - 6 (or 8) date-of-birth digits
 *   - 3 individual digits (3rd is sex parity: odd = male, even = female)
 *   - 1 check digit (Luhn over the 10-digit form)
 *
 * Coordination numbers (samordningsnummer): same shape, day-of-month + 60.
 * The library accepts these because they are issued by Skatteverket against
 * the same algorithm and are valid identifiers for tax / banking purposes.
 * Skatteverket's published worked example `701063-2391` (a man born
 * 1970-10-03 with day field 03+60=63) is hand-verified in
 * `docs/research/v2.2-source-of-truth/se.md`.
 *
 * Check digit: standard Luhn (ISO/IEC 7812-1) over the 10-digit form
 * `YYMMDDNNNC` (i.e. for the 12-digit form, drop the century before
 * computing the checksum).
 *
 * Out of scope: interim numbers (`interimspersonnummer`, used by health-care
 * systems before identity verification) substitute one of
 * `[TRSUWXJKLMN]` for the first individnummer digit. nationid currently
 * rejects them; the npm `personnummer` package accepts them under
 * `allowInterimNumber`. Track as a v2.3+ scope decision.
 *
 * Confidence: high — Folkbokföringslagen §18 + python-stdnum oracle +
 * Skatteverket's own published samordningsnummer example all agree.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{10}$|^\d{12}$/;
// Accept either separator (`-` for under-100, `+` for over-100) on the
// 6+4 form, and an optional `-` on the 8+4 form.
const FORMATTED_REGEX = /^(?:\d{6}[-+]\d{4}|\d{8}-?\d{4})$/;

const COUNTRY = "SE";
const CODE = "SE_PERSONNUMMER";

export const personnummerSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both", // Personal ID + tax ID (Skatteverket).
  labelKey: "documents.SE_PERSONNUMMER.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000000-0000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (!validateDateAndChecksum(digits)) return false;
    return true;
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    if (digits.length === 10) {
      return `${digits.slice(0, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 8)}-${digits.slice(8)}`;
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
    if (digits.length > 12 || digits.length === 11) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!hasValidDate(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!luhnValid(toTenDigit(digits))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    const formatted =
      digits.length === 10
        ? `${digits.slice(0, 6)}-${digits.slice(6)}`
        : `${digits.slice(0, 8)}-${digits.slice(8)}`;
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted,
      confidence: "high",
    };
  },
};

/** Reduce a 12-digit personnummer to its 10-digit Luhn-checkable form. */
function toTenDigit(digits: string): string {
  return digits.length === 12 ? digits.slice(2) : digits;
}

function hasValidDate(digits: string): boolean {
  let mm: number;
  let dd: number;
  if (digits.length === 12) {
    mm = parseInt(digits.slice(4, 6), 10);
    dd = parseInt(digits.slice(6, 8), 10);
  } else {
    mm = parseInt(digits.slice(2, 4), 10);
    dd = parseInt(digits.slice(4, 6), 10);
  }
  // Coordination numbers offset day by +60.
  const dayCanonical = dd > 60 ? dd - 60 : dd;
  if (mm < 1 || mm > 12) return false;
  if (dayCanonical < 1 || dayCanonical > 31) return false;
  return true;
}

function validateDateAndChecksum(digits: string): boolean {
  if (!hasValidDate(digits)) return false;
  return luhnValid(toTenDigit(digits));
}
