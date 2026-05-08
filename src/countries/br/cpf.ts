/**
 * Brasil — CPF (Cadastro de Pessoas Físicas).
 *
 * Issuer: Receita Federal do Brasil.
 * Source: https://www.gov.br/receitafederal/pt-br/servicos/cadastro/cpf
 * Legal basis: Lei 4.862/1965; IN RFB sobre CPF.
 *
 * Format: 11 digits, displayed as `000.000.000-00`.
 *
 * Check digit: two mod-11 DVs.
 *   - DV1: weights 10,9,8,7,6,5,4,3,2 over digits 1-9; r = (sum * 10) mod 11;
 *     if r == 10 or r == 11 then DV1 = 0 else DV1 = r.
 *   - DV2: weights 11,10,9,8,7,6,5,4,3,2 over digits 1-10 (including DV1);
 *     same rule.
 *
 * Confidence: high. Algorithm matches Receita Federal documentation and the
 * reference implementation in `cpf-cnpj-validator`.
 *
 * All-same-digit sequences (e.g. `111.111.111-11`) are rejected by convention
 * even though some pass the checksum, because Receita Federal treats them as
 * invalid placeholders.
 */

import { allSameDigit, stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{11}$/;
const FORMATTED_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

export const cpfSpec: DocumentSpec = {
  code: "BR_CPF",
  country: "BR",
  scope: "both", // CPF identifies a natural person AND is used as their tax ID.
  labelKey: "documents.BR_CPF.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000.000.000-00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (allSameDigit(digits)) return false;
    return checkDigitsCPF(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 11) return input;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "BR_CPF", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: "BR_CPF", reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: "BR_CPF", reason: { kind: "too_long" } };
    }
    if (allSameDigit(digits)) {
      return { ok: false, code: "BR_CPF", reason: { kind: "invalid_format" } };
    }
    if (!checkDigitsCPF(digits)) {
      return { ok: false, code: "BR_CPF", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "BR_CPF",
      normalized: digits,
      formatted: `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`,
      confidence: "high",
    };
  },
};

/**
 * Validate both CPF check digits.
 *
 * For a body of length n (9 or 10), weights run from n+1 down to 2.
 * r = (sum * 10) mod 11; DV = (r == 10 || r == 11) ? 0 : r.
 */
function computeCpfDV(body: string): number {
  let sum = 0;
  const start = body.length + 1;
  for (let i = 0; i < body.length; i++) {
    const d = body.charCodeAt(i) - 48;
    sum += d * (start - i);
  }
  const r = (sum * 10) % 11;
  return r === 10 || r === 11 ? 0 : r;
}

function checkDigitsCPF(digits: string): boolean {
  if (digits.length !== 11) return false;
  const dv1 = computeCpfDV(digits.slice(0, 9));
  if (dv1 !== digits.charCodeAt(9) - 48) return false;
  const dv2 = computeCpfDV(digits.slice(0, 10));
  return dv2 === digits.charCodeAt(10) - 48;
}
