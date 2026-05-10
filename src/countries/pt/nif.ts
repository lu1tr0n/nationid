/**
 * Portugal — NIF / NIPC (Número de Identificação Fiscal /
 *                       Número de Identificação de Pessoa Coletiva).
 *
 * Issuer: Autoridade Tributária e Aduaneira (AT).
 * Source: https://info.portaldasfinancas.gov.pt/
 * Legal basis: Decreto-Lei 463/79.
 *
 * Format: 9 digits, no separator.
 *
 * Composition — the first digit identifies the holder type:
 *   - `1`, `2`, `3`     pessoa singular residente
 *   - `45`              pessoa singular não-residente (2-digit prefix)
 *   - `5`               pessoa coletiva (empresa)
 *   - `6`               administração pública
 *   - `70`, `74`, `75`  herança indivisa, regime de bens, ATM provisório
 *   - `71`              não-residentes coletivos sujeitos a retenção na fonte
 *   - `72`              fundos de investimento
 *   - `77`              atribuição oficiosa de NIF
 *   - `79`              regime excecional Expo 98
 *   - `8`               empresário em nome individual (legacy)
 *   - `90`, `91`        condomínio, sociedade irregular, herança indivisa
 *   - `98`              não-residente sem estabelecimento estável
 *   - `99`              sociedade civil sem personalidade jurídica
 *
 * Check digit: mod-11 with weights `[9, 8, 7, 6, 5, 4, 3, 2]` over the first
 * 8 digits left-to-right. `r = sum mod 11`. If `r ∈ {0, 1}` then DV = 0;
 * otherwise DV = `11 - r`.
 *
 * Confidence: high. The algorithm is published by AT and reproduced verbatim
 * in `validator.js isTaxID('pt-PT')`.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{9}$/;
const WEIGHTS = [9, 8, 7, 6, 5, 4, 3, 2] as const;

// First-digit prefixes accepted by AT. The library accepts the union of all
// documented prefixes; downstream consumers can introspect type via
// `nifHolderType` if they need to discriminate naturales / coletivos.
const VALID_FIRST_DIGIT = new Set(["1", "2", "3", "4", "5", "6", "7", "8", "9"]);

const COUNTRY = "PT" as CountryCode;
const CODE = "PT_NIF" as DocumentTypeCode;

export const nifSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.PT_NIF.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    const first = digits.charAt(0);
    if (!VALID_FIRST_DIGIT.has(first)) return false;
    return checkNIF(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 9) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 9) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    const first = digits.charAt(0);
    if (!VALID_FIRST_DIGIT.has(first)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkNIF(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: digits,
      confidence: "high",
    };
  },
};

/**
 * Holder type derived from the NIF prefix. Consumers can use this to surface
 * a "pessoa singular" vs "pessoa coletiva" hint in UI without re-parsing.
 */
export type NIFHolderType =
  | "singular_residente"
  | "singular_nao_residente"
  | "coletiva"
  | "administracao_publica"
  | "heranca_condominio_atm"
  | "empresario_individual"
  | "coletiva_irregular"
  | "unknown";

export function nifHolderType(input: string): NIFHolderType {
  const digits = stripNonDigits(input);
  if (!RAW_REGEX.test(digits)) return "unknown";
  const first = digits.charAt(0);
  const second = digits.charAt(1);
  if (first === "1" || first === "2" || first === "3") return "singular_residente";
  if (first === "4" && second === "5") return "singular_nao_residente";
  if (first === "5") return "coletiva";
  if (first === "6") return "administracao_publica";
  if (first === "7") return "heranca_condominio_atm";
  if (first === "8") return "empresario_individual";
  if (first === "9") return "coletiva_irregular";
  return "unknown";
}

function checkNIF(digits: string): boolean {
  if (digits.length !== 9) return false;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = digits.charCodeAt(i) - 48;
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const r = sum % 11;
  const expected = r === 0 || r === 1 ? 0 : 11 - r;
  return expected === digits.charCodeAt(8) - 48;
}
