/**
 * Brasil — CNPJ (Cadastro Nacional da Pessoa Jurídica).
 *
 * Issuer: Receita Federal do Brasil.
 * Source: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj
 * Legal basis: IN RFB nº 2.229/2024 (DOU 16-DEZ-2024).
 *
 * Format: 14 digits, displayed as `00.000.000/0000-00`.
 *
 * Check digit: two mod-11 DVs.
 *   - DV1: weights [5,4,3,2,9,8,7,6,5,4,3,2] over chars 1-12;
 *     r = sum mod 11; if r < 2 then DV = 0 else DV = 11 - r.
 *   - DV2: weights [6,5,4,3,2,9,8,7,6,5,4,3,2] over chars 1-13 (including DV1);
 *     same rule.
 *
 * Confidence: high. Algorithm matches Receita Federal IN RFB nº 2.229/2024
 * and `cpf-cnpj-validator`.
 *
 * TODO ADR-001 alfanumérico: starting 1 July 2026, Receita Federal will issue
 * alphanumeric CNPJs (A-Z + 0-9 in positions 1-12, digits in DV positions 13-14)
 * per IN RFB nº 2.229/2024. Legacy numeric CNPJs remain valid forever. v0.1
 * supports only the legacy numeric format; alphanumeric support is tracked as
 * a separate ADR.
 *
 * All-same-digit sequences (e.g. `00.000.000/0000-00`) are rejected because
 * they are placeholders, not real CNPJs.
 */

import { allSameDigit, stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{14}$/;
const FORMATTED_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const WEIGHTS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const WEIGHTS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export const cnpjSpec: DocumentSpec = {
  code: "BR_CNPJ",
  country: "BR",
  scope: "tax",
  labelKey: "documents.BR_CNPJ.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "00.000.000/0000-00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (allSameDigit(digits)) return false;
    return checkDigitsCNPJ(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 14) return input;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 14) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "too_short" } };
    }
    if (digits.length > 14) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "too_long" } };
    }
    if (allSameDigit(digits)) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "invalid_format" } };
    }
    if (!checkDigitsCNPJ(digits)) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "BR_CNPJ",
      normalized: digits,
      formatted: `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`,
      confidence: "high",
    };
  },
};

function computeCnpjDV(body: string, weights: ReadonlyArray<number>): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const d = body.charCodeAt(i) - 48;
    const w = weights[i];
    if (w === undefined) return -1;
    sum += d * w;
  }
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

function checkDigitsCNPJ(digits: string): boolean {
  if (digits.length !== 14) return false;
  const dv1 = computeCnpjDV(digits.slice(0, 12), WEIGHTS_DV1);
  if (dv1 !== digits.charCodeAt(12) - 48) return false;
  const dv2 = computeCnpjDV(digits.slice(0, 13), WEIGHTS_DV2);
  return dv2 === digits.charCodeAt(13) - 48;
}
