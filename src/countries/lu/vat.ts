/**
 * Luxembourg — TVA (Numéro d'identification à la TVA).
 *
 * Issuer: Administration de l'enregistrement, des domaines et de la TVA (AED).
 * Source: https://pfi.public.lu/fr.html (AED portal — verified live 2026-05-24).
 *         https://guichet.public.lu/ (citizen/business gateway).
 * Statute: Loi du 12 février 1979 concernant la taxe sur la valeur ajoutée
 *          (binding authority).
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/),
 *                   `python-stdnum.lu.tva`.
 *
 * Format: `LU` + 8 digits. Visually displayed as `LU 12345678`.
 *
 * Check digit: positions 7-8 are the check formed by `body6 mod 89`, where
 * `body6` is the 6-digit number at positions 1-6 (treated as a decimal
 * integer). The check is zero-padded to two digits.
 *
 * Confidence: high. Algorithm published by AED + reproduced byte-for-byte
 * in `python-stdnum.lu.tva`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^LU\d{8}$/;
const FORMATTED_REGEX = /^LU \d{8}$/;

const COUNTRY = "LU";
const CODE = "LU_VAT";

export const vatSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.LU_VAT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "LU 00000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeVat(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return computeCheck(cleaned.slice(2, 8)) === cleaned.slice(8, 10);
  },

  format(input: string): string {
    const cleaned = normalizeVat(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `LU ${cleaned.slice(2, 10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeVat(trimmed);
    if (cleaned.length < 10) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 10) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (computeCheck(cleaned.slice(2, 8)) !== cleaned.slice(8, 10)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `LU ${cleaned.slice(2, 10)}`,
      confidence: "high",
    };
  },
};

function normalizeVat(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("LU")) return cleaned;
  if (/^\d{8}$/.test(cleaned)) return `LU${cleaned}`;
  return cleaned;
}

function computeCheck(body6: string): string {
  const n = Number.parseInt(body6, 10);
  const check = n % 89;
  return check.toString().padStart(2, "0");
}
