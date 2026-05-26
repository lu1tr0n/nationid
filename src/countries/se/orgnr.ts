/**
 * Sweden — Organisationsnummer (legal-entity registration number).
 *
 * Issuer: Bolagsverket (Swedish Companies Registration Office) as principal
 *   registrar; Skatteverket, Kammarkollegiet, Lantmäteriet, and
 *   Statistikmyndigheten SCB also assign orgnrs in their respective domains.
 * Statute: Lag (1974:174) om identitetsbeteckning för juridiska personer m.fl.
 *   https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/lag-1974174-om-identitetsbeteckning-for_sfs-1974-174/
 * Canonical reference page (live-verified 2026-05-24, HTTP 200):
 *   https://bolagsverket.se/foretag/organisationsnummer.1207.html
 *   The page publishes the first-digit company-form table and Bolagsverket's
 *   own orgnr `202100-5489` as an explicit hand-verifiable anchor.
 * Cross-validation oracle (pinned commit): python-stdnum at
 *   https://raw.githubusercontent.com/arthurdejong/python-stdnum/5d4ad17cae8abeab21f446b5569f85d185566330/stdnum/se/orgnr.py
 *
 * Format: 10 digits, displayed as `XXXXXX-XXXX`.
 *
 * Disambiguation rule: the third digit must be `>= 2`. This separates orgnr
 * from personnummer (whose third digit is always 0 or 1, as it is the second
 * digit of the month). nationid enforces this guard; python-stdnum does
 * not — the stricter behaviour is deliberate and protects callers that
 * autodetect personnummer vs orgnr from a 10-digit string.
 *
 * Check digit: standard Luhn (ISO/IEC 7812-1) over all 10 digits.
 *
 * Confidence: high — direct algorithmic match against python-stdnum,
 * real-world public orgnrs (SAAB AB `556036-0793`, Volvo Personvagnar
 * `556074-3089`, Bolagsverket's own `202100-5489`), and the issuer's
 * published example. Full audit trail in
 * `docs/research/v2.2-source-of-truth/se.md`.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{10}$/;
const FORMATTED_REGEX = /^\d{6}-\d{4}$/;

const COUNTRY = "SE";
const CODE = "SE_ORGNR";

export const orgnrSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.SE_ORGNR.label",
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
    if (!hasOrgnrThirdDigit(digits)) return false;
    return luhnValid(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return `${digits.slice(0, 6)}-${digits.slice(6)}`;
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
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!hasOrgnrThirdDigit(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!luhnValid(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: `${digits.slice(0, 6)}-${digits.slice(6)}`,
      confidence: "high",
    };
  },
};

/** Third digit must be >= 2 to distinguish orgnr from personnummer. */
function hasOrgnrThirdDigit(digits: string): boolean {
  const third = digits.charCodeAt(2) - 48;
  return third >= 2;
}
