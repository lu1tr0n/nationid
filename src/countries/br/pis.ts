/**
 * Brasil — PIS / PASEP / NIT / NIS — single 11-digit social-security number.
 *
 * The number is shared across four programs and aliases:
 *   - PIS  — Programa de Integração Social (private-sector workers, operated
 *     by Caixa Econômica Federal).
 *   - PASEP — Programa de Formação do Patrimônio do Servidor Público (public-
 *     sector workers, operated by Banco do Brasil).
 *   - NIT  — Número de Inscrição do Trabalhador (INSS contributors).
 *   - NIS  — Número de Identificação Social (Bolsa Família / CadÚnico).
 *
 * One natural person has one number across all programs. We ship the spec as
 * `BR_PIS` because that is the most-used public alias; consumers needing the
 * other names should reuse the same validator.
 *
 * Issuer: Caixa Econômica Federal (PIS), Banco do Brasil (PASEP), INSS (NIT),
 * Ministério da Cidadania (NIS).
 * Source: https://www.caixa.gov.br/cadastros/pis/
 * Legal basis: Lei nº 7.998/1990; eSocial Manual de Orientação (MOS) S-1.x —
 * leiaute eSocial define os campos `cpfTrab`/`nisTrab` e exige checksum válido.
 *
 * Format: 11 digits. Canonical mask: `000.00000.00-0` (3-5-2-1) per Caixa
 * extracts and the `brazilian-utils@2.x` formatter.
 *
 * Check digit (single mod-11):
 *   - weights [3,2,9,8,7,6,5,4,3,2] left-to-right over digits 1-10.
 *   - r = sum mod 11.
 *   - if r < 2 then DV = 0 else DV = 11 - r.
 *
 * Confidence: high. Algorithm is documented by Caixa Econômica Federal and
 * matches `@brazilian-utils/brazilian-utils@2.x` (`isValidPis`).
 *
 * All-same-digit sequences are rejected by convention, mirroring `BR_CPF` and
 * `BR_CNPJ` placeholder handling.
 *
 * Scope: `both` — the number identifies a natural person AND is used as a
 * tax-tracking ID for payroll withholding (FGTS, INSS, eSocial S-1200).
 */

import { allSameDigit, stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{11}$/;
const FORMATTED_REGEX = /^\d{3}\.\d{5}\.\d{2}-\d{1}$/;
const WEIGHTS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export const pisSpec: DocumentSpec = {
  code: "BR_PIS",
  country: "BR",
  scope: "both",
  labelKey: "documents.BR_PIS.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000.00000.00-0",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (allSameDigit(digits)) return false;
    return checkDigitPIS(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 11) return input;
    return `${digits.slice(0, 3)}.${digits.slice(3, 8)}.${digits.slice(8, 10)}-${digits.slice(10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "BR_PIS", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: "BR_PIS", reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: "BR_PIS", reason: { kind: "too_long" } };
    }
    if (allSameDigit(digits)) {
      return { ok: false, code: "BR_PIS", reason: { kind: "invalid_format" } };
    }
    if (!checkDigitPIS(digits)) {
      return { ok: false, code: "BR_PIS", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "BR_PIS",
      normalized: digits,
      formatted: `${digits.slice(0, 3)}.${digits.slice(3, 8)}.${digits.slice(8, 10)}-${digits.slice(10)}`,
      confidence: "high",
    };
  },
};

/**
 * Compute the single PIS DV for a 10-digit body.
 *
 * weights [3,2,9,8,7,6,5,4,3,2] left-to-right; r = sum mod 11; DV = (r < 2)
 * ? 0 : 11 - r.
 */
function computePisDV(body10: string): number {
  if (body10.length !== 10) return -1;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const d = body10.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return -1;
    const w = WEIGHTS[i];
    if (w === undefined) return -1;
    sum += d * w;
  }
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

function checkDigitPIS(digits: string): boolean {
  if (digits.length !== 11) return false;
  const dv = computePisDV(digits.slice(0, 10));
  return dv === digits.charCodeAt(10) - 48;
}
