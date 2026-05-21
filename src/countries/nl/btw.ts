/**
 * Netherlands — BTW-id / OB-nummer (Omzetbelastingnummer).
 *
 * Issuer: Belastingdienst.
 * Source: https://www.belastingdienst.nl/
 * Legal basis: Wijziging btw-identificatienummer 2020.
 *
 * Format: `NL` + 9 digits + `B` + 2 digits (country prefix is part of the
 * normalized form). 14 chars total. Example: `NL123456789B01`.
 *
 * Check digit:
 *   - **Pre-2020 BTW** (legacy) for sole proprietors derived the 9 core
 *     digits from the BSN and used the BSN eleven-test.
 *   - **Post-2020 BTW-id** for sole proprietors uses random 9 chars (not
 *     necessarily passing the BSN eleven-test) and Belastingdienst documents
 *     ISO/IEC 7064 MOD 97-10 over the 9-digit core.
 *   - Companies (BV/NV/etc.) keep deriving the 9-digit core from the BSN/
 *     RSIN of an officer and the eleven-test still applies.
 *
 * We accept either eleven-test or MOD 97-10 over the 9-digit core. This is
 * the same compromise published by the EU CBE-BCE VIES interoperability
 * notes for NL VAT. The `B##` suffix is a sub-number selector with no
 * semantic check (must be 2 digits, neither all-zero `B00` is rejected).
 *
 * Confidence: moderate. Belastingdienst published the redesign but does not
 * publish the MOD 97-10 specification text in machine-readable form;
 * VIES is authoritative for existence checks.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { checkBsn } from "./bsn.ts";

const RAW_REGEX = /^NL\d{9}B\d{2}$/;
const COUNTRY = "NL";
const CODE = "NL_BTW";

export const btwSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.NL_BTW.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "NL000000000B00",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkBtw(cleaned);
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
    if (!checkBtw(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: cleaned,
      confidence: "moderate",
    };
  },
};

function checkBtw(cleaned: string): boolean {
  // cleaned form: NL + 9 digits + B + 2 digits
  const core = cleaned.slice(2, 11);
  const sub = cleaned.slice(12, 14);
  if (core === "000000000") return false;
  if (sub === "00") return false;
  // Accept either BSN-style eleven-test (legacy + corporate) or
  // ISO/IEC 7064 MOD 97-10 (post-2020 sole proprietor).
  return checkBsn(core) || checkMod9710(core);
}

/**
 * ISO/IEC 7064 MOD 97-10 over a 9-digit core.
 *
 * The 9-digit string is interpreted as an integer; valid iff
 * `int(core) mod 97 == 1`. Long-integer division done in chunks to stay
 * within JS Number safe range.
 */
function checkMod9710(core: string): boolean {
  if (!/^\d{9}$/.test(core)) return false;
  let rem = 0;
  for (let i = 0; i < core.length; i++) {
    rem = (rem * 10 + (core.charCodeAt(i) - 48)) % 97;
  }
  return rem === 1;
}
