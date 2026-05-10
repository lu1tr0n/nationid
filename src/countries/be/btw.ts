/**
 * Belgium — TVA / BTW / Numéro d'entreprise (Ondernemingsnummer).
 *
 * Issuer: SPF Finances / Banque-Carrefour des Entreprises (BCE/KBO).
 * Source: https://finance.belgium.be/ ; https://kbopub.economie.fgov.be/
 *
 * Format: `BE` + 10 digits, where the leading digit is `0` or (post-2008
 * exhaustion) `1`. Visual `BE 0123.456.789`. The first digit is part of
 * the company number, not a country prefix.
 *
 * Check digit: last 2 digits = `97 - (first8 mod 97)`. The BCE specifies
 * that companies whose 8-digit body would yield a check < 10 keep the
 * leading zero (`07` etc.).
 *
 * Confidence: high. Algorithm is published by SPF Finances and reproduced
 * verbatim in `python-stdnum.be.vat` and `validator.js isVAT('BE')`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

/**
 * Normalized form: `BE` + 10 digits, leading digit `0` or `1`. Pre-2008
 * VAT numbers issued without a leading `0` are accepted on input and
 * left-padded during normalize.
 */
const RAW_REGEX = /^BE[01]\d{9}$/;
const FORMATTED_REGEX = /^BE\s?[01]\d{3}\.\d{3}\.\d{3}$/;
const COUNTRY = "BE" as CountryCode;
// TODO(v0.6-integration): orchestrator extends `DocumentTypeCode` with `BE_BTW`.
const CODE = "BE_BTW" as DocumentTypeCode;

export const btwSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.BE_BTW.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "BE0000.000.000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    let cleaned = stripAndUpper(input);
    // Pre-2008 9-digit numbers: prepend the implicit leading zero.
    if (/^BE\d{9}$/.test(cleaned)) cleaned = `BE0${cleaned.slice(2)}`;
    return cleaned;
  },

  validate(input: string): boolean {
    const cleaned = this.normalize(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkBtw(cleaned);
  },

  format(input: string): string {
    const cleaned = this.normalize(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    const body = cleaned.slice(2);
    return `BE${body.slice(0, 4)}.${body.slice(4, 7)}.${body.slice(7, 10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = this.normalize(trimmed);
    if (cleaned.length < 12) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 12) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkBtw(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    const body = cleaned.slice(2);
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `BE${body.slice(0, 4)}.${body.slice(4, 7)}.${body.slice(7, 10)}`,
      confidence: "high",
    };
  },
};

function checkBtw(cleaned: string): boolean {
  // cleaned: BE + 10 digits. Body = 10 digits = 8 base + 2 dv.
  const body = cleaned.slice(2);
  const firstEight = Number.parseInt(body.slice(0, 8), 10);
  const dv = Number.parseInt(body.slice(8, 10), 10);
  if (!Number.isFinite(firstEight) || !Number.isFinite(dv)) return false;
  return 97 - (firstEight % 97) === dv;
}
