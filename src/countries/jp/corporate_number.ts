/**
 * Japan — Corporate Number / 法人番号 (`JP_CORPORATE_NUMBER`).
 *
 * Issuer: 国税庁 (National Tax Agency, NTA). Public registry at
 *         https://www.houjin-bangou.nta.go.jp/ exposes every issued number
 *         with the corresponding legal entity name and address.
 * Source: https://www.houjin-bangou.nta.go.jp/
 *         https://www.houjin-bangou.nta.go.jp/setsumei/
 *         https://www.nta.go.jp/taxes/tetsuzuki/mynumberinfo/index.htm
 *         https://www.houjin-bangou.nta.go.jp/pc/setsumei/images/kokuji_20210129.pdf
 *         (all verified live 2026-05-24).
 * Statute: 法人番号の指定等に関する省令 第3条 — Ministerial Ordinance on the
 *          Designation of Corporate Numbers, defines the check-digit
 *          calculation. Mirrored in NTA's gazetted public-spec PDF above.
 *
 * Format: 13 digits. The LEFTMOST digit is the check digit; the remaining
 * 12 digits are the body. The check digit is always in `{1..9}` because the
 * algorithm `9 - (S mod 9)` cannot produce `0`. No statute-mandated
 * separator — NTA's registry prints the number as an unbroken 13-digit
 * string; some printed forms use a 1-4-4-4 grouping for visual separation.
 *
 * Check digit: weighted mod-9 over the 12 body digits. Reverse the body and
 * apply weights `(1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2)` left-to-right. Then
 * `check = 9 - (S mod 9)`. Equivalent left-to-right weights over the body
 * (without reversal): `(2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1)`.
 *
 * Implementation note: order of operations is `9 - (S mod 9)`, NOT
 * `(9 - S) mod 9`. With `S mod 9 == 0`, the correct result is `9`, not `0`
 * — verified against `7000012050002` (NTA's own corporate number) and
 * the entire `python-stdnum/stdnum/jp/cn.py` doctest set (added 2020,
 * v1.13).
 *
 * Confidence: high. Algorithm gazetted, issuer statutory, NTA's own number
 * is itself a verifiable test fixture, and upstream stdnum agrees.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[1-9][0-9]{12}$/;
const CODE = "JP_CORPORATE_NUMBER";

const WEIGHTS_REVERSED: readonly number[] = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];

function computeCheckDigit(body: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += (body.charCodeAt(11 - i) - 48) * (WEIGHTS_REVERSED[i] as number);
  }
  return 9 - (sum % 9);
}

function checksumValid(thirteenDigits: string): boolean {
  const expected = computeCheckDigit(thirteenDigits.slice(1));
  return thirteenDigits.charCodeAt(0) - 48 === expected;
}

export const corporateNumberSpec: DocumentSpec = {
  code: CODE,
  country: "JP",
  scope: "tax",
  labelKey: "documents.JP_CORPORATE_NUMBER.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "0000000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const cleaned = stripNonDigits(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checksumValid(cleaned);
  },

  format(input: string): string {
    const cleaned = stripNonDigits(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return cleaned;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = stripNonDigits(trimmed);
    if (cleaned.length < 13) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 13) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned))
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    if (!checksumValid(cleaned))
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: cleaned,
      confidence: "high",
    };
  },
};
