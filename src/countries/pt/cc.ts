/**
 * Portugal — CC (Cartão de Cidadão).
 *
 * Issuer: Instituto dos Registos e do Notariado (IRN).
 * Source: https://www.cartaodecidadao.pt/
 * Legal basis: Decreto-Lei 83/2000.
 *
 * Format (12 chars, displayed `12345678 9 ZZ4`):
 *   - 8 digits: Número de Identificação Civil (NIC)
 *   - 1 digit:  dígito de controlo do NIC
 *   - 2 letters: versão de emissão (e.g. `ZZ`, `AA`, `BC`...)
 *   - 1 digit:  dígito de controlo do documento (full 12-char check)
 *
 * Check digit:
 *   - The full 12-char document check uses ISO/IEC 7064 MOD 11-2.
 *   - The official IRN spec is not openly published in a form that lets us
 *     guarantee parity with all field versions.
 *
 * Confidence: low. The library validates **format only** (regex + charset).
 * Callers needing strict checksum verification should use the IRN's
 * authoritative web service. Promotion to moderate/high confidence requires
 * an in-country contributor to confirm the algorithm against current cards.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{9}[A-Z]{2}\d$/;
// Accepted formatted forms: `12345678 9 ZZ 4` or `12345678 9 ZZ4`.
const FORMATTED_REGEX = /^\d{8} \d [A-Z]{2}\s?\d$/;

const COUNTRY = "PT" as CountryCode;
const CODE = "PT_CC" as DocumentTypeCode;

export const ccSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "personal",
  labelKey: "documents.PT_CC.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00000000 0 AA 0",
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
    return `${cleaned.slice(0, 8)} ${cleaned.slice(8, 9)} ${cleaned.slice(9, 11)} ${cleaned.slice(11)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 12) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 12) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `${cleaned.slice(0, 8)} ${cleaned.slice(8, 9)} ${cleaned.slice(9, 11)} ${cleaned.slice(11)}`,
      confidence: "low",
    };
  },
};
