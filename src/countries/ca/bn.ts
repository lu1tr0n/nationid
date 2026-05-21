/**
 * Canada — BN (Business Number / Numéro d'entreprise).
 *
 * Issuer: Canada Revenue Agency (CRA).
 * Source: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/registering-your-business/you-need-a-business-number-a-program-account.html
 *
 * Format: 9-digit root, optionally followed by a 2-letter program identifier
 * and a 4-digit reference (e.g. `123456789 RT0001`). Program codes:
 *   - `RT`: GST/HST (Sales Tax)
 *   - `RP`: Payroll deductions
 *   - `RC`: Corporation income tax
 *   - `RM`: Importer / Exporter
 *   - `RR`: Registered charity
 *   - `RZ`: Information returns
 *
 * Check digit: the 9-digit root historically uses the same Luhn (mod-10)
 * algorithm as the SIN. The CRA, however, does not publish the formula in a
 * machine-validatable spec, so this library validates **format only** and
 * leaves checksum verification to authoritative CRA endpoints.
 *
 * Confidence: low (format-only validation per public-source policy).
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
// 9-digit root, with an optional space + program letters + 4-digit reference.
const RAW_REGEX = /^\d{9}(?:(?:RT|RP|RC|RM|RR|RZ)\d{4})?$/;
const FORMATTED_REGEX = /^\d{9}(?: (?:RT|RP|RC|RM|RR|RZ)\d{4})?$/;

const COUNTRY = "CA";
const CODE = "CA_BN";

export const bnSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.CA_BN.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000000000 AA0000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    if (cleaned.length === 9) return cleaned;
    return `${cleaned.slice(0, 9)} ${cleaned.slice(9)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 9) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length !== 9 && cleaned.length !== 15) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    const formatted = cleaned.length === 9 ? cleaned : `${cleaned.slice(0, 9)} ${cleaned.slice(9)}`;
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted,
      confidence: "low",
    };
  },
};
