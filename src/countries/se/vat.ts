/**
 * Sweden — VAT registration number (Momsregistreringsnummer / SE VAT).
 *
 * Issuer: Skatteverket.
 * Source: https://www.skatteverket.se/
 *
 * Format: `SE` + 10-digit Organisationsnummer + `01` = 14 chars total.
 * The trailing `01` is a sequence number for branches; for the principal
 * registration it is `01`. Skatteverket publishes only the `01` form for
 * mass distribution; other sequences exist but are not commonly exposed.
 *
 * The library accepts the principal form (`SE` + orgnr + `01`) and validates:
 *   - `SE` prefix
 *   - 10-digit orgnr (Luhn) — third digit must be >= 2
 *   - trailing `01` (the only sequence we trust without an authoritative
 *     branch list)
 *
 * Confidence: high — VIES + Skatteverket both expose the format.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^SE\d{12}$/;
const FORMATTED_REGEX = /^SE\d{12}$/;

const COUNTRY = "SE";
const CODE = "SE_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.SE_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "SE000000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return validateVATBody(cleaned);
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
    if (!validateVATBody(cleaned)) {
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

function validateVATBody(cleaned: string): boolean {
  // SE + 10 orgnr digits + 2 sequence digits (`01`).
  const orgnr = cleaned.slice(2, 12);
  const seq = cleaned.slice(12);
  if (seq !== "01") return false;
  const third = orgnr.charCodeAt(2) - 48;
  if (third < 2) return false;
  return luhnValid(orgnr);
}
