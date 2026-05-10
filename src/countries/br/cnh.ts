/**
 * Brasil — CNH (Carteira Nacional de Habilitação).
 *
 * Issuer: DENATRAN / DETRAN estaduais (driver's license database operated under
 * CONTRAN national rules).
 * Source: https://www.gov.br/transportes/pt-br/assuntos/transito/cnh
 * Legal basis: Resolução CONTRAN nº 192/2006; Ofício DENATRAN nº 51/2008
 * (technical specification for the 11-digit "número de registro" / "número de
 * espelho" and its mod-11 dual check digit).
 *
 * Format: 11 digits with no canonical separator. The display form
 * `123456789-00` (9 + 2 with a single hyphen before the DVs) is widely used in
 * publications and by the `brazilian-utils` formatter; we adopt it as the
 * canonical mask.
 *
 * Check digit: two mod-11 DVs.
 *   - DV1: weights [9,8,7,6,5,4,3,2,1] applied left-to-right over digits 1-9.
 *     r = sum mod 11; if r >= 10 then DV1 = 0 AND a "DSC" offset of 2 is applied
 *     to DV2's residue; else DV1 = r and DSC = 0.
 *   - DV2: weights [1,2,3,4,5,6,7,8,9] applied left-to-right over digits 1-9.
 *     r = (sum - DSC) mod 11; if r >= 10 then DV2 = 0 else DV2 = r.
 *
 * Confidence: high. Algorithm is published by CONTRAN/DENATRAN and matches the
 * implementation in `@brazilian-utils/brazilian-utils@2.x` (`isValidCnh`).
 *
 * All-same-digit sequences (e.g. `11111111111`) are rejected by convention,
 * mirroring `BR_CPF` and `BR_CNPJ` placeholder handling.
 */

import { allSameDigit, stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{11}$/;
const FORMATTED_REGEX = /^\d{9}-\d{2}$/;
const WEIGHTS_DV1 = [9, 8, 7, 6, 5, 4, 3, 2, 1] as const;
const WEIGHTS_DV2 = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const cnhSpec: DocumentSpec = {
  code: "BR_CNH",
  country: "BR",
  scope: "personal",
  labelKey: "documents.BR_CNH.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000000000-00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (allSameDigit(digits)) return false;
    return checkDigitsCNH(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 11) return input;
    return `${digits.slice(0, 9)}-${digits.slice(9)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "BR_CNH", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: "BR_CNH", reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: "BR_CNH", reason: { kind: "too_long" } };
    }
    if (allSameDigit(digits)) {
      return { ok: false, code: "BR_CNH", reason: { kind: "invalid_format" } };
    }
    if (!checkDigitsCNH(digits)) {
      return { ok: false, code: "BR_CNH", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "BR_CNH",
      normalized: digits,
      formatted: `${digits.slice(0, 9)}-${digits.slice(9)}`,
      confidence: "high",
    };
  },
};

/**
 * Compute the two CNH DVs for a body of 9 digits. Returns `null` if the body
 * is not 9 digits or contains a non-digit (defensive — RAW_REGEX guards this
 * at the call site).
 */
function computeCnhDVs(body9: string): readonly [number, number] | null {
  if (body9.length !== 9) return null;
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    const d = body9.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return null;
    const w = WEIGHTS_DV1[i];
    if (w === undefined) return null;
    sum1 += d * w;
  }
  const r1 = sum1 % 11;
  let dv1: number;
  let dsc: number;
  if (r1 >= 10) {
    dv1 = 0;
    dsc = 2;
  } else {
    dv1 = r1;
    dsc = 0;
  }

  let sum2 = 0;
  for (let i = 0; i < 9; i++) {
    const d = body9.charCodeAt(i) - 48;
    const w = WEIGHTS_DV2[i];
    if (w === undefined) return null;
    sum2 += d * w;
  }
  // Apply DENATRAN "desconto" offset; ensure positive remainder.
  let r2 = (sum2 - dsc) % 11;
  if (r2 < 0) r2 += 11;
  const dv2 = r2 >= 10 ? 0 : r2;
  return [dv1, dv2];
}

function checkDigitsCNH(digits: string): boolean {
  if (digits.length !== 11) return false;
  const dvs = computeCnhDVs(digits.slice(0, 9));
  if (dvs === null) return false;
  const [dv1, dv2] = dvs;
  if (dv1 !== digits.charCodeAt(9) - 48) return false;
  return dv2 === digits.charCodeAt(10) - 48;
}
