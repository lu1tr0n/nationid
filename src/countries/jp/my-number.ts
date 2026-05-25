/**
 * Japan — Individual Number / My Number (`JP_MY_NUMBER`).
 *
 * Issuer: each 市区町村 (city / ward / town / village) on behalf of the
 *         national 個人番号 system, jointly governed by 総務省 (MIC) and
 *         個人情報保護委員会 (PPC).
 * Source: https://www.cao.go.jp/bangouseido/
 *         https://www.soumu.go.jp/kojinbango_card/
 *         https://www.digital.go.jp/policies/mynumber
 *         (all verified live 2026-05-24).
 * Statute: 行政手続における特定の個人を識別するための番号の利用等に関する法律
 *          (Number Use Act, 平成25年法律第27号).
 * Algorithm: 平成26年総務省令第85号 第5条 — MIC ministerial ordinance defining
 *          the check-digit calculation and the allowable number space.
 *
 * Format: 12 digits, no leading-digit restriction (unlike Aadhaar). Canonical
 * print form on the 通知カード and 個人番号カード is `NNNN NNNN NNNN` (a single
 * ASCII space separates each 4-digit group). No statute-mandated grouping —
 * the 4-4-4 split is the de-facto display convention.
 *
 * Check digit: weighted mod-11. The 11 leading digits form the base; the
 * 12th (rightmost) digit is the check. Weight schedule from left to right
 * across the base: `(6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2)`. With
 * `r = S mod 11`, the check is `0` when `r ≤ 1`, otherwise `11 - r`.
 *
 * The "ordinance-special" branch `r ≤ 1 → 0` (rather than producing
 * `check = 10` or `check = 11`, which are not single digits) is published
 * in 総務省令第85号 itself. Equivalent algorithm shipped upstream as
 * `python-stdnum/stdnum/jp/in_.py` (added 2025); doctests agree byte-for-byte.
 *
 * Confidence: high. Algorithm cited in a gazetted ministerial ordinance,
 * issuer statutorily defined, multiple independent implementations converge.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[0-9]{12}$/;
const FORMATTED_REGEX = /^[0-9]{4} [0-9]{4} [0-9]{4}$/;
const CODE = "JP_MY_NUMBER";

const WEIGHTS: readonly number[] = [6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function computeCheckDigit(base: string): number {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += (base.charCodeAt(i) - 48) * (WEIGHTS[i] as number);
  }
  const r = sum % 11;
  return r <= 1 ? 0 : 11 - r;
}

function checksumValid(twelveDigits: string): boolean {
  const expected = computeCheckDigit(twelveDigits.slice(0, 11));
  return twelveDigits.charCodeAt(11) - 48 === expected;
}

export const myNumberSpec: DocumentSpec = {
  code: CODE,
  country: "JP",
  scope: "personal",
  labelKey: "documents.JP_MY_NUMBER.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000 0000 0000",
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
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = stripNonDigits(trimmed);
    if (cleaned.length < 12) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 12) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned))
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    if (!checksumValid(cleaned))
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)}`,
      confidence: "high",
    };
  },
};
