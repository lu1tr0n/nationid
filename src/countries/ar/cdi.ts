/**
 * Argentina — CDI (Clave de Identificación).
 *
 * Issuer: ARCA (Agencia de Recaudación y Control Aduanero), formerly AFIP.
 * Source: https://www.arca.gob.ar/
 * Legal basis: RG AFIP 3995/2017.
 *
 * Format: 11 digits, displayed as `XX-DDDDDDDD-V`.
 *   - 2 digits: CDI prefix (`50` per RG AFIP 3995/2017).
 *   - 8 digits: base.
 *   - 1 digit: verifier.
 *
 * The CDI is assigned by ARCA to natural persons who do not hold CUIT or CUIL
 * but must be identified in tributary operations (extranjeros sin obligación,
 * sucesiones indivisas, menores, herederos).
 *
 * Check digit: identical to CUIT/CUIL — mod-11 with weights
 * `[5,4,3,2,7,6,5,4,3,2]` over the first 10 digits. r = sum mod 11; dv = 11 - r.
 *   - if dv == 11 -> 0
 *   - if dv == 10 -> the body is invalid by AFIP convention (RG AFIP 10/97 § 4
 *     handling carried over to CDI numbering).
 *
 * Confidence: high. Algorithm is shared with CUIT (RG AFIP 10/1997) and is
 * reaffirmed for CDI by RG AFIP 3995/2017. `python-stdnum.ar.cuit` validates
 * CDI/CUIT/CUIL identically (same algorithm).
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { CDI_PREFIXES, computeCuitDV } from "./shared.ts";

const RAW_REGEX = /^\d{11}$/;
const FORMATTED_REGEX = /^\d{2}-\d{8}-\d$/;

export const cdiSpec: DocumentSpec = {
  code: "AR_CDI",
  country: "AR",
  scope: "tax",
  labelKey: "documents.AR_CDI.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00-00000000-0",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    return checkCDI(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 11) return input;
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "AR_CDI", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: "AR_CDI", reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: "AR_CDI", reason: { kind: "too_long" } };
    }
    const prefix = digits.slice(0, 2);
    if (!CDI_PREFIXES.has(prefix)) {
      return { ok: false, code: "AR_CDI", reason: { kind: "invalid_format" } };
    }
    const dv = computeCuitDV(digits.slice(0, 10));
    if (dv === null || dv !== digits.charCodeAt(10) - 48) {
      return { ok: false, code: "AR_CDI", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "AR_CDI",
      normalized: digits,
      formatted: `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`,
      confidence: "high",
    };
  },
};

function checkCDI(digits: string): boolean {
  if (digits.length !== 11) return false;
  const prefix = digits.slice(0, 2);
  if (!CDI_PREFIXES.has(prefix)) return false;
  const dv = computeCuitDV(digits.slice(0, 10));
  if (dv === null) return false;
  return dv === digits.charCodeAt(10) - 48;
}
