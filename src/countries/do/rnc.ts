/**
 * República Dominicana — RNC (Registro Nacional del Contribuyente).
 *
 * Issuer: Dirección General de Impuestos Internos (DGII).
 * Source: https://www.dgii.gov.do/
 * Legal basis: Ley 53/70 (Código Tributario, Título I).
 *
 * Format: 9 digits, no canonical separator (sometimes shown `0-00-00000-0`).
 *
 * Check digit: mod-11 weighted, weights `[7, 9, 8, 6, 5, 4, 3, 2]` over the
 * first 8 digits (left-to-right). Let `r = sum mod 11`. The verifier is:
 *   - if r == 0 → DV = 2
 *   - if r == 1 → DV = 1
 *   - else      → DV = 11 - r
 *
 * Confidence: moderate. The DGII e-CF schema documents the algorithm and
 * community libraries in the Dominican fintech ecosystem implement it
 * identically; no single canonical PDF is published by the issuer.
 *
 * Persona física use the 11-digit Cédula as their RNC; this spec applies only
 * to the 9-digit jurídica RNC.
 *
 * All-same-digit sequences (e.g. `000000000`) are rejected by convention as
 * placeholder values.
 */

import { mod11WeightedSum } from "../../algorithms/mod11.ts";
import { allSameDigit, stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{9}$/;
const WEIGHTS = [7, 9, 8, 6, 5, 4, 3, 2] as const;

export const rncSpec: DocumentSpec = {
  code: "DO_RNC",
  country: "DO",
  scope: "tax",
  labelKey: "documents.DO_RNC.label",
  rawRegex: RAW_REGEX,
  // No `formattedRegex`: DGII publishes the RNC as plain digits with no
  // separator — `format()` is the identity on the 9-digit storage form.
  // (Older informal `1-23-45678-9` notation exists but is not canonical.)
  mask: "000000000",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (allSameDigit(digits)) return false;
    return checkDigitRNC(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 9) return input;
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "DO_RNC", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 9) {
      return { ok: false, code: "DO_RNC", reason: { kind: "too_short" } };
    }
    if (digits.length > 9) {
      return { ok: false, code: "DO_RNC", reason: { kind: "too_long" } };
    }
    if (allSameDigit(digits)) {
      return { ok: false, code: "DO_RNC", reason: { kind: "invalid_format" } };
    }
    if (!checkDigitRNC(digits)) {
      return { ok: false, code: "DO_RNC", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "DO_RNC",
      normalized: digits,
      formatted: digits,
      confidence: "moderate",
    };
  },
};

function checkDigitRNC(digits: string): boolean {
  if (digits.length !== 9) return false;
  const sum = mod11WeightedSum(digits.slice(0, 8), WEIGHTS);
  const r = sum % 11;
  let expected: number;
  if (r === 0) expected = 2;
  else if (r === 1) expected = 1;
  else expected = 11 - r;
  return expected === digits.charCodeAt(8) - 48;
}
