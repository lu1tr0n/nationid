/**
 * Austria — UID (Umsatzsteuer-Identifikationsnummer).
 *
 * Issuer: Bundesministerium für Finanzen (BMF).
 * Source: https://www.bmf.gv.at/ (issuer root — verified live 2026-05-24).
 *         https://www.usp.gv.at/ (USP portal — taxpayer services).
 * Statute: UStG §28 Z 1 (Umsatzsteuergesetz 1994) — binding authority.
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.at.uid`.
 *
 * Format: `ATU` + 8 digits. The literal `U` follows `AT`; visually
 * displayed as `ATU 1234 5678`.
 *
 * Check digit: Luhn-variant per BMF. Over the first 7 body digits reversed,
 * doubling odd positions (1-indexed) with digit-sum folding; final check =
 * `(6 - (sum mod 10)) mod 10`, then compared to the 8th body digit.
 *
 * Confidence: high.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^ATU\d{8}$/;
const FORMATTED_REGEX = /^ATU \d{4} \d{4}$/;

const COUNTRY = "AT";
const CODE = "AT_UID";

export const uidSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.AT_UID.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "ATU 0000 0000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeUid(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeUid(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checksumOk(cleaned.slice(3, 11));
  },

  format(input: string): string {
    const cleaned = normalizeUid(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `ATU ${cleaned.slice(3, 7)} ${cleaned.slice(7, 11)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeUid(trimmed);
    if (cleaned.length < 11) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 11) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checksumOk(cleaned.slice(3, 11))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `ATU ${cleaned.slice(3, 7)} ${cleaned.slice(7, 11)}`,
      confidence: "high",
    };
  },
};

function normalizeUid(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("ATU")) return cleaned;
  if (cleaned.startsWith("AT") && /^AT\d{8}$/.test(cleaned)) return `ATU${cleaned.slice(2)}`;
  if (/^U?\d{8}$/.test(cleaned)) {
    return `AT${cleaned.startsWith("U") ? cleaned : `U${cleaned}`}`;
  }
  return cleaned;
}

function checksumOk(body8: string): boolean {
  // Body8 = 7 body digits + 1 check digit. Apply Luhn over the 7 body digits
  // (positions 0..6); position 1, 3, 5 (0-indexed even) doubled with digit-sum
  // fold; final check = (6 - sum mod 10) mod 10.
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = body8.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (i % 2 === 1) {
      const doubled = d * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += d;
    }
  }
  const check = (10 - ((sum + 4) % 10)) % 10;
  return check === body8.charCodeAt(7) - 48;
}
