/**
 * Sweden — VAT registration number (Momsregistreringsnummer / SE VAT).
 *
 * Issuer: Skatteverket (Swedish Tax Agency).
 * Statute: Mervärdesskattelag (2023:200) — current VAT law, replaced
 *   SFS 1994:200 effective 2023-07-01.
 *   https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/mervardesskattelag-2023200_sfs-2023-200/
 * Canonical reference page (live-verified 2026-05-24, HTTP 200):
 *   https://www.skatteverket.se/foretag/moms/saljavarorochtjanster/forsaljningtillandraeulander/kontrolleramomsregistreringsnummervatnummer/momsregistreringsnummer.4.18e1b10334ebe8bc80002649.html
 *   Sweden row reads literally `SE 999999999999 | 12 siffror` with note
 *   "De två sista siffrorna är alltid 01."
 * Cross-validation oracle (pinned commit): python-stdnum at
 *   https://raw.githubusercontent.com/arthurdejong/python-stdnum/5d4ad17cae8abeab21f446b5569f85d185566330/stdnum/se/vat.py
 *
 * Format: `SE` + 10-digit Organisationsnummer + `01` = 14 chars total.
 * The trailing `01` is a sequence number for branches; for the principal
 * registration it is `01`. Skatteverket publishes only the `01` form for
 * mass distribution; other sequences exist but are not commonly exposed.
 *
 * The library accepts the principal form (`SE` + orgnr + `01`) and validates:
 *   - `SE` prefix — **mandatory**. python-stdnum makes it optional;
 *     nationid mirrors the EU-VIES presentation form which always carries
 *     the country code, and treats a bare 12-digit string as invalid input.
 *   - 10-digit orgnr (Luhn) — third digit must be >= 2 (inherits the
 *     personnummer disambiguation guard from `orgnr.ts`).
 *   - Trailing `01` — the only sequence Skatteverket publishes as
 *     canonical and that VIES accepts without a branch directory.
 *     Non-`01` sequences exist in real filings but are intentionally
 *     refused because the library has no authoritative branch list to
 *     check them against.
 *
 * Confidence: high — VIES + Skatteverket both expose the format; orgnr
 * Luhn is independently audited.
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
