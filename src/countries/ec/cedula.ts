/**
 * Ecuador — Cédula de Identidad.
 *
 * Issuer: Dirección General de Registro Civil, Identificación y Cedulación.
 * Source: https://www.registrocivil.gob.ec/
 * Legal basis: Ley Orgánica de Gestión de la Identidad y Datos Civiles.
 *
 * Format: 10 digits, no separators.
 *   - 2 digits: provincia (01-24, or 30 for ecuatorianos en el exterior)
 *   - 7 digits: correlativo
 *   - 1 digit: verificador (DV)
 *
 * Composition rule: 3rd digit must be < 6 for personas naturales.
 *
 * Check digit: Luhn-variant.
 *   weights = [2, 1, 2, 1, 2, 1, 2, 1, 2] (left-to-right over first 9 digits)
 *   for each product, if > 9 subtract 9
 *   r  = sum mod 10
 *   dv = (10 - r) mod 10
 *
 * Confidence: high. SRI publishes the algorithm in the validation
 * instructive and it matches widely deployed Ecuadorian validators
 * (cedula-ec, ec-validator, python-stdnum stdnum.ec.ci).
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{10}$/;
const CEDULA_WEIGHTS = [2, 1, 2, 1, 2, 1, 2, 1, 2] as const;

export const cedulaSpec: DocumentSpec = {
  code: "EC_CEDULA",
  country: "EC",
  // Naturales also use the cédula as part of their RUC (cedula + 001).
  scope: "personal",
  labelKey: "documents.EC_CEDULA.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "0000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (!isValidProvincia(digits)) return false;
    if (!isValidNaturalIndicator(digits)) return false;
    return checkDigitCedula(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "EC_CEDULA", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 10) {
      return { ok: false, code: "EC_CEDULA", reason: { kind: "too_short" } };
    }
    if (digits.length > 10) {
      return { ok: false, code: "EC_CEDULA", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "EC_CEDULA", reason: { kind: "invalid_format" } };
    }
    if (!isValidProvincia(digits) || !isValidNaturalIndicator(digits)) {
      return { ok: false, code: "EC_CEDULA", reason: { kind: "invalid_format" } };
    }
    if (!checkDigitCedula(digits)) {
      return { ok: false, code: "EC_CEDULA", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "EC_CEDULA",
      normalized: digits,
      formatted: digits,
      confidence: "high",
    };
  },
};

/**
 * Provincia is `01..24` (the 24 provincias del Ecuador) or `30`
 * (asignación especial: ecuatorianos nacidos en el exterior; la coverage
 * audit also documents `30` como "Galápagos resilience"-style allocation
 * en algunos consulados). Both interpretations are downstream of the same
 * SRI cédula validator, which accepts `30` regardless. We keep `30` in the
 * accepted set and reject `25..29`, `31..99`. Confirmed against
 * registrocivil.gob.ec + sri.gob.ec and `python-stdnum stdnum.ec.ci`.
 */
function isValidProvincia(digits: string): boolean {
  const p = (digits.charCodeAt(0) - 48) * 10 + (digits.charCodeAt(1) - 48);
  if (p === 30) return true;
  return p >= 1 && p <= 24;
}

/** For naturales, the 3rd digit must be < 6. */
function isValidNaturalIndicator(digits: string): boolean {
  const d3 = digits.charCodeAt(2) - 48;
  return d3 >= 0 && d3 < 6;
}

/** Luhn-variant: weights [2,1]*5 over first 9 digits, double-then-9-subtract. */
export function checkDigitCedula(digits: string): boolean {
  if (digits.length !== 10) return false;
  return computeCedulaDV(digits.slice(0, 9)) === digits.charCodeAt(9) - 48;
}

export function computeCedulaDV(body9: string): number {
  if (body9.length !== 9) return -1;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = body9.charCodeAt(i) - 48;
    const w = CEDULA_WEIGHTS[i];
    if (w === undefined) return -1;
    let p = d * w;
    if (p > 9) p -= 9;
    sum += p;
  }
  const r = sum % 10;
  return (10 - r) % 10;
}
