/**
 * Brasil — Título de Eleitor (voter registration).
 *
 * Issuer: Tribunal Superior Eleitoral (TSE) e Tribunais Regionais Eleitorais.
 * Source: https://www.tse.jus.br/eleitor/titulo-de-eleitor
 * Legal basis: Resolução TSE nº 21.538/2003 (cadastro eleitoral) art. 11 + Anexo
 * I (códigos de UF e algoritmo dos dígitos verificadores).
 *
 * Format: 12 digits structured as
 *   - positions 1-8: sequential body assigned by the cartório eleitoral.
 *   - positions 9-10: UF code (`01`=SP, `02`=MG, `03`=RJ, `04`=RS, `05`=BA,
 *     `06`=PR, `07`=CE, `08`=PE, `09`=SC, `10`=GO, `11`=MA, `12`=PB, `13`=PA,
 *     `14`=ES, `15`=PI, `16`=RN, `17`=AL, `18`=MT, `19`=MS, `20`=DF (legacy),
 *     `21`=SE, `22`=AM, `23`=RO, `24`=AC, `25`=AP, `26`=RR, `27`=TO,
 *     `28`=Exterior/ZZ).
 *   - positions 11-12: two mod-11 check digits (DV1, DV2).
 *
 * Canonical mask: `0000 0000 00 00` (4-4-2-2 group spacing per TSE display
 * convention; `brazilian-utils@2.x` uses the same grouping).
 *
 * Check digit:
 *   - DV1: weights [2,3,4,5,6,7,8,9] left-to-right over digits 1-8.
 *     r = sum mod 11. If r == 10 then DV1 = 0. Else if r == 0 AND UF ∈ {01,02}
 *     (SP, MG — historical exception) then DV1 = 1. Else DV1 = r.
 *   - DV2: weights [7,8,9] over digits 9, 10 (UF) and DV1.
 *     r = sum mod 11. Same SP/MG exception rule.
 *
 * UF range: only codes `01`..`28` are valid per TSE; other ranges are
 * unallocated and rejected by the spec.
 *
 * Confidence: high. Algorithm and UF table are published by TSE and match
 * `@brazilian-utils/brazilian-utils@2.x` (`isValidVoterId`).
 *
 * All-same-digit sequences (e.g. `111111111111`) are rejected by convention,
 * mirroring `BR_CPF` and `BR_CNPJ` placeholder handling.
 */

import { allSameDigit, stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{12}$/;
const FORMATTED_REGEX = /^\d{4} \d{4} \d{2} \d{2}$/;
const WEIGHTS_DV1 = [2, 3, 4, 5, 6, 7, 8, 9] as const;
const WEIGHTS_DV2 = [7, 8, 9] as const;
const MIN_UF = 1;
const MAX_UF = 28;
const SP_UF = "01";
const MG_UF = "02";

export const tituloEleitorSpec: DocumentSpec = {
  code: "BR_TITULO_ELEITOR",
  country: "BR",
  scope: "personal",
  labelKey: "documents.BR_TITULO_ELEITOR.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000 0000 00 00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (allSameDigit(digits)) return false;
    if (!isUfInRange(digits.slice(8, 10))) return false;
    return checkDigitsTitulo(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (digits.length !== 12) return input;
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "BR_TITULO_ELEITOR", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 12) {
      return { ok: false, code: "BR_TITULO_ELEITOR", reason: { kind: "too_short" } };
    }
    if (digits.length > 12) {
      return { ok: false, code: "BR_TITULO_ELEITOR", reason: { kind: "too_long" } };
    }
    if (allSameDigit(digits)) {
      return { ok: false, code: "BR_TITULO_ELEITOR", reason: { kind: "invalid_format" } };
    }
    if (!isUfInRange(digits.slice(8, 10))) {
      return { ok: false, code: "BR_TITULO_ELEITOR", reason: { kind: "invalid_format" } };
    }
    if (!checkDigitsTitulo(digits)) {
      return { ok: false, code: "BR_TITULO_ELEITOR", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "BR_TITULO_ELEITOR",
      normalized: digits,
      formatted: `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`,
      confidence: "high",
    };
  },
};

function isUfInRange(uf: string): boolean {
  if (uf.length !== 2) return false;
  const n = Number.parseInt(uf, 10);
  return Number.isInteger(n) && n >= MIN_UF && n <= MAX_UF;
}

function applySpMgException(r: number, uf: string): number {
  if (r === 10) return 0;
  if (r === 0 && (uf === SP_UF || uf === MG_UF)) return 1;
  return r;
}

function checkDigitsTitulo(digits: string): boolean {
  if (digits.length !== 12) return false;
  const uf = digits.slice(8, 10);

  // DV1: weights [2..9] over digits 1..8.
  let sum1 = 0;
  for (let i = 0; i < 8; i++) {
    const d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    const w = WEIGHTS_DV1[i];
    if (w === undefined) return false;
    sum1 += d * w;
  }
  const dv1 = applySpMgException(sum1 % 11, uf);
  if (dv1 !== digits.charCodeAt(10) - 48) return false;

  // DV2: weights [7,8,9] over UF1, UF2, DV1.
  const dv2Inputs = [digits.charCodeAt(8) - 48, digits.charCodeAt(9) - 48, dv1] as const;
  let sum2 = 0;
  for (let i = 0; i < 3; i++) {
    const d = dv2Inputs[i];
    if (d === undefined || d < 0 || d > 9) return false;
    const w = WEIGHTS_DV2[i];
    if (w === undefined) return false;
    sum2 += d * w;
  }
  const dv2 = applySpMgException(sum2 % 11, uf);
  return dv2 === digits.charCodeAt(11) - 48;
}
