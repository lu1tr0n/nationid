/**
 * Perú — RUC (Registro Único de Contribuyentes).
 *
 * Issuer: SUNAT (Superintendencia Nacional de Aduanas y de Administración
 * Tributaria).
 * Source: https://www.sunat.gob.pe/
 * Legal basis: Decreto Legislativo 943; Resoluciones de Superintendencia
 * SUNAT.
 *
 * Format: 11 digits, no separators.
 *   - 2-digit prefix (tipo de contribuyente):
 *     - `10` — persona natural con negocio (DNI + 1 dígito + DV).
 *     - `15` — sucesión indivisa.
 *     - `16` — no domiciliado (especial).
 *     - `17` — no domiciliado.
 *     - `20` — persona jurídica.
 *   - 8-digit base (cuerpo).
 *   - 1-digit verifier (DV).
 *
 * Check digit: mod-11 with weights `[5,4,3,2,7,6,5,4,3,2]` over the first 10
 * digits.
 *   r  = sum mod 11
 *   dv = 11 - r
 *     - if dv == 11 → 0
 *     - if dv == 10 → 1
 *     - else        → dv
 *
 * Confidence: high. Algorithm matches SUNAT documentation and the reference
 * implementations in `peru-ruc` (npm) and `python-stdnum` `stdnum.pe.ruc`.
 *
 * All-same-digit bodies (e.g. `11111111111`) are rejected by convention.
 */

import { allSameDigit, stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^(10|15|16|17|20)\d{9}$/;
const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

export const rucSpec: DocumentSpec = {
  code: "PE_RUC",
  country: "PE",
  scope: "tax",
  labelKey: "documents.PE_RUC.label",
  rawRegex: RAW_REGEX,
  mask: "00000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (digits.length !== 11) return false;
    if (!RAW_REGEX.test(digits)) return false;
    if (allSameDigit(digits)) return false;
    return checkRUC(digits);
  },

  format(input: string): string {
    // RUC is canonically displayed as 11 contiguous digits.
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits) ? digits : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "PE_RUC", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: "PE_RUC", reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: "PE_RUC", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "PE_RUC", reason: { kind: "invalid_format" } };
    }
    if (allSameDigit(digits)) {
      return { ok: false, code: "PE_RUC", reason: { kind: "invalid_format" } };
    }
    if (!checkRUC(digits)) {
      return { ok: false, code: "PE_RUC", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "PE_RUC",
      normalized: digits,
      formatted: digits,
      confidence: "high",
    };
  },
};

function checkRUC(digits: string): boolean {
  if (digits.length !== 11) return false;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const d = digits.charCodeAt(i) - 48;
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const r = sum % 11;
  let dv = 11 - r;
  if (dv === 11) dv = 0;
  else if (dv === 10) dv = 1;
  return dv === digits.charCodeAt(10) - 48;
}
