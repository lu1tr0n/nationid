/**
 * France — TVA (Numéro de TVA Intracommunautaire).
 *
 * Issuer: DGFiP (Direction Générale des Finances Publiques).
 * Source: https://www.impots.gouv.fr/professionnel/numero-tva-intracommunautaire
 * Cross-validation: VIES (https://ec.europa.eu/taxation_customs/vies/).
 *
 * Format: 13 chars = `FR` + 2-char clé + 9-digit SIREN.
 *   The 2-char clé is digit-only for SIRENs assigned numerically; for some
 *   newer SIRENs the clé may include uppercase letters (excluding `I` and `O`).
 *
 * Check digit:
 *   Numeric clé: `clé = (12 + 3 * (SIREN mod 97)) mod 97` (zero-padded to 2).
 *   Alphabetic clé: not algorithmically derivable; format-only check.
 *
 * Confidence: high (numeric variant) / moderate (alpha variant — format-only).
 *
 * Algorithm published by DGFiP and replicated by `validator.js isVAT('fr-FR')`
 * and `python-stdnum.fr.vat`.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
/**
 * Normalized form: `FR` + 2-char key + 9-digit SIREN. The two key chars may
 * be digits or letters from `[A-HJ-NP-Z]` (excluding `I` and `O` to avoid
 * confusion with `1` / `0`).
 */
const RAW_REGEX = /^FR[A-HJ-NP-Z\d]{2}\d{9}$/;
const FORMATTED_REGEX = /^FR [A-HJ-NP-Z\d]{2} \d{9}$/;

const COUNTRY = "FR";
const CODE = "FR_TVA";

export const tvaSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.FR_TVA.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "FR AA 000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeTva(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeTva(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkTva(cleaned);
  },

  format(input: string): string {
    const cleaned = normalizeTva(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `FR ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = normalizeTva(trimmed);
    if (cleaned.length < 13) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 13) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkTva(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `FR ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`,
      confidence: "high",
    };
  },
};

function normalizeTva(input: string): string {
  const cleaned = stripAndUpper(input);
  if (cleaned.startsWith("FR")) return cleaned;
  if (/^[A-HJ-NP-Z\d]{2}\d{9}$/.test(cleaned)) return `FR${cleaned}`;
  if (/^\d{9}$/.test(cleaned)) return cleaned; // bare SIREN; let regex reject.
  return cleaned;
}

function checkTva(cleaned: string): boolean {
  const key = cleaned.slice(2, 4);
  const siren = cleaned.slice(4, 13);
  // The SIREN itself must pass Luhn — independent invariant.
  if (!luhnValid(siren)) return false;
  if (/^\d{2}$/.test(key)) {
    // Compute expected numeric key.
    const sirenNum = Number.parseInt(siren, 10);
    if (Number.isNaN(sirenNum)) return false;
    const expected = (12 + 3 * (sirenNum % 97)) % 97;
    return expected === Number.parseInt(key, 10);
  }
  // Alphabetic clé: DGFiP does not publish the derivation; we accept any pair
  // from the allowed charset and rely on SIREN Luhn for the only checkable
  // invariant.
  return true;
}
