/**
 * Ecuador — RUC (Registro Único de Contribuyentes).
 *
 * Issuer: SRI (Servicio de Rentas Internas).
 * Source: https://www.sri.gob.ec/
 * Legal basis: Ley del Registro Único de Contribuyentes (Ley 41); SRI
 * Resolución NAC-DGERCGC (validation instructive).
 *
 * Format: 13 digits.
 *   - 2 digits: provincia (01-24, or 30 for exterior)
 *   - 1 digit: tipo (3rd digit determines algorithm branch)
 *   - 7 digits: correlativo (jurídicas) or 6 + DV (naturales)
 *   - 3 digits: establecimiento (`001` matriz, `002+` sucursales)
 *
 * Three branches based on the 3rd digit:
 *   - `< 6`  → persona natural: same Luhn-variant as cédula on first 10 digits.
 *   - `= 6`  → sociedad pública: mod-11 with weights [3,2,7,6,5,4,3,2] over
 *             first 8 digits. DV at position 9 (0-indexed 8). Position 10
 *             (0-indexed 9) is always `0`.
 *   - `= 9`  → persona jurídica privada: mod-11 with weights
 *             [4,3,2,7,6,5,4,3,2] over first 9 digits. DV at position 10
 *             (0-indexed 9).
 *
 * mod-11 rule (both jurídica branches):
 *   r = sum mod 11; dv = (r === 0) ? 0 : 11 - r
 *
 * After the DV, all RUCs end in 3 digits encoding the establecimiento
 * (`001` is the matriz). The establecimiento is not part of the checksum.
 *
 * Confidence: high. Matches the SRI public instructive and is reproduced
 * in cedula-ec, ec-validator, and python-stdnum.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { computeCedulaDV } from "./cedula.ts";

const RAW_REGEX = /^\d{13}$/;
const JURIDICA_WEIGHTS = [4, 3, 2, 7, 6, 5, 4, 3, 2] as const;
const PUBLICA_WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2] as const;

export const rucSpec: DocumentSpec = {
  code: "EC_RUC",
  country: "EC",
  scope: "tax",
  labelKey: "documents.EC_RUC.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "0000000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkRUC(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "EC_RUC", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 13) {
      return { ok: false, code: "EC_RUC", reason: { kind: "too_short" } };
    }
    if (digits.length > 13) {
      return { ok: false, code: "EC_RUC", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "EC_RUC", reason: { kind: "invalid_format" } };
    }
    if (!isValidProvincia(digits)) {
      return { ok: false, code: "EC_RUC", reason: { kind: "invalid_format" } };
    }
    if (!hasValidEstablecimiento(digits)) {
      return { ok: false, code: "EC_RUC", reason: { kind: "invalid_format" } };
    }
    if (!validChecksum(digits)) {
      return { ok: false, code: "EC_RUC", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "EC_RUC",
      normalized: digits,
      formatted: digits,
      confidence: "high",
    };
  },
};

function checkRUC(digits: string): boolean {
  if (!isValidProvincia(digits)) return false;
  if (!hasValidEstablecimiento(digits)) return false;
  return validChecksum(digits);
}

function isValidProvincia(digits: string): boolean {
  const p = (digits.charCodeAt(0) - 48) * 10 + (digits.charCodeAt(1) - 48);
  if (p === 30) return true;
  return p >= 1 && p <= 24;
}

/** Establecimiento (last 3 digits) must be >= 001. */
function hasValidEstablecimiento(digits: string): boolean {
  const est =
    (digits.charCodeAt(10) - 48) * 100 +
    (digits.charCodeAt(11) - 48) * 10 +
    (digits.charCodeAt(12) - 48);
  return est >= 1;
}

function validChecksum(digits: string): boolean {
  const d3 = digits.charCodeAt(2) - 48;
  if (d3 < 6) return validateNatural(digits);
  if (d3 === 6) return validatePublica(digits);
  if (d3 === 9) return validateJuridica(digits);
  return false;
}

/** Natural: cédula DV (first 10 digits) + establecimiento. */
function validateNatural(digits: string): boolean {
  const expected = computeCedulaDV(digits.slice(0, 9));
  if (expected < 0) return false;
  return expected === digits.charCodeAt(9) - 48;
}

/** Jurídica privada (3rd digit = 9): mod-11 over first 9 digits. */
function validateJuridica(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = digits.charCodeAt(i) - 48;
    const w = JURIDICA_WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const r = sum % 11;
  const expected = r === 0 ? 0 : 11 - r;
  if (expected === 11) return false;
  return expected === digits.charCodeAt(9) - 48;
}

/** Sociedad pública (3rd digit = 6): mod-11 over first 8 digits; DV at pos 9; pos 10 must be 0. */
function validatePublica(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = digits.charCodeAt(i) - 48;
    const w = PUBLICA_WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const r = sum % 11;
  const expected = r === 0 ? 0 : 11 - r;
  if (expected === 11) return false;
  if (expected !== digits.charCodeAt(8) - 48) return false;
  // Position 10 (0-indexed 9) must always be `0` for sociedad pública.
  return digits.charCodeAt(9) - 48 === 0;
}
