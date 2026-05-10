/**
 * Brasil — CNPJ (Cadastro Nacional da Pessoa Jurídica).
 *
 * Issuer: Receita Federal do Brasil.
 * Source: https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/cadastros/cnpj
 * Legal basis: IN RFB nº 2.229/2024 (DOU 16-DEZ-2024).
 *
 * ## Format
 *
 * Two coexisting forms are accepted:
 *
 * 1. **Legacy numeric** (issued before 2026-07-01) — 14 digits, mask
 *    `00.000.000/0000-00`. Every CNPJ ever issued through 2026-06-30 fits this
 *    form. They remain valid forever.
 * 2. **Alphanumeric** (issued from 2026-07-01 onward) — 14 chars: positions
 *    1-12 are `[A-Z0-9]`, positions 13-14 are `\d{2}` (the two check digits
 *    are still numeric). Mask: `XX.XXX.XXX-XXXX-00` where each `X` covers
 *    `[A-Z0-9]`. The runtime `spec.mask` field exposes the asterisk-form
 *    (`**.***.***-****-00` with `/` instead of the second `-`) for parity
 *    with the legacy convention.
 *
 * ## Check-digit algorithm (alphanumeric-aware)
 *
 * For each char `c` at position `i` in the body, the numeric value used in the
 * weighted mod-11 sum is `c.charCodeAt(0) - 48`. Concretely:
 *
 *   - `'0'..'9'` → `0..9`   (back-compat with legacy numeric CNPJs)
 *   - `'A'..'Z'` → `17..42` (`'A'`=65−48=17, `'Z'`=90−48=42)
 *
 * The same mod-11 weights as the legacy spec are applied:
 *   - DV1: weights `[5,4,3,2,9,8,7,6,5,4,3,2]` over chars 1-12
 *   - DV2: weights `[6,5,4,3,2,9,8,7,6,5,4,3,2]` over chars 1-13 (incl. DV1)
 *   - For each: `r = sum mod 11; dv = r < 2 ? 0 : 11 - r`.
 *
 * **Backwards-compatibility property** — when every body char is a digit, the
 * char-value rule produces identical numeric values to the legacy "parseInt"
 * approach (`'5'.charCodeAt(0) - 48 === 5`), so the weighted sum and final DVs
 * are byte-for-byte equal to the legacy algorithm. Every CNPJ valid under the
 * v0.4 numeric-only validator is still valid here.
 *
 * Confidence: high. Algorithm matches Receita Federal IN RFB nº 2.229/2024
 * "Nota Técnica CNPJ Alfanumérico v1.0" published on `gov.br/receitafederal`
 * and is cross-validated against `cpf-cnpj-validator` for the digit-only
 * branch. Alphanumeric cross-validation is deferred until a public reference
 * implementation ships (`@brazilian-utils/brazilian-utils@2.3` does not yet
 * support the new format).
 *
 * All-same-character sequences (e.g. `00.000.000/0000-00`, `AAAAAAAAAAAAAA`)
 * are rejected because they are placeholders, not real CNPJs.
 */

import { allSameDigit } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/** Body of 12 alphanumeric chars + 2 numeric DVs. */
const RAW_REGEX = /^[A-Z0-9]{12}\d{2}$/;
/** Formatted with dots, slash, hyphen — body is alphanumeric, DVs numeric. */
const FORMATTED_REGEX = /^[A-Z0-9]{2}\.[A-Z0-9]{3}\.[A-Z0-9]{3}\/[A-Z0-9]{4}-\d{2}$/;
const WEIGHTS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const WEIGHTS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

/**
 * Strip CNPJ separators (`.`, `/`, `-`, whitespace) and uppercase the rest.
 *
 * We deliberately do NOT use the generic `stripAndUpper`, because that helper
 * keeps every alphanumeric char — including letters that would never appear
 * in a real CNPJ separator slot. The tighter regex here only removes the
 * canonical CNPJ punctuation, so an input like `12-ABC-345/01-DE-35` is
 * normalized to `12ABC34501DE35` while a string with spurious letters stays
 * recognizably invalid.
 */
function normalizeCnpj(input: string): string {
  return input.replace(/[\s./-]+/g, "").toUpperCase();
}

/**
 * True iff every char in `s` is the same. Used for placeholder detection on
 * alphanumeric inputs (`AAAAAAAAAAAAAA`); digit-only placeholders are still
 * caught by `allSameDigit` as well.
 */
function allSameChar(s: string): boolean {
  if (s.length === 0) return false;
  const c0 = s.charCodeAt(0);
  for (let i = 1; i < s.length; i++) {
    if (s.charCodeAt(i) !== c0) return false;
  }
  return true;
}

export const cnpjSpec: DocumentSpec = {
  code: "BR_CNPJ",
  country: "BR",
  scope: "tax",
  labelKey: "documents.BR_CNPJ.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  // Mask reflects the post-2026-07-01 alphanumeric form. Legacy numeric CNPJs
  // still match this mask trivially because `*` covers `[A-Z0-9]`.
  mask: "**.***.***/****-00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeCnpj(input);
  },

  validate(input: string): boolean {
    const body = normalizeCnpj(input);
    if (!RAW_REGEX.test(body)) return false;
    if (allSameChar(body)) return false;
    return checkDigitsCNPJ(body);
  },

  format(input: string): string {
    const body = normalizeCnpj(input);
    if (body.length !== 14) return input;
    if (!RAW_REGEX.test(body)) return input;
    return `${body.slice(0, 2)}.${body.slice(2, 5)}.${body.slice(5, 8)}/${body.slice(8, 12)}-${body.slice(12)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "empty" } };
    }
    const body = normalizeCnpj(trimmed);
    if (body.length < 14) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "too_short" } };
    }
    if (body.length > 14) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(body)) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "invalid_format" } };
    }
    // allSameDigit covers numeric placeholders (`00000000000000`); allSameChar
    // covers alphanumeric placeholders (`AAAAAAAAAAAAAA`). Both are disallowed.
    if (allSameDigit(body) || allSameChar(body)) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "invalid_format" } };
    }
    if (!checkDigitsCNPJ(body)) {
      return { ok: false, code: "BR_CNPJ", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "BR_CNPJ",
      normalized: body,
      formatted: `${body.slice(0, 2)}.${body.slice(2, 5)}.${body.slice(5, 8)}/${body.slice(8, 12)}-${body.slice(12)}`,
      confidence: "high",
    };
  },
};

/**
 * Compute one CNPJ check digit from a body and weight vector.
 *
 * Char value rule (IN RFB 2.229/2024): `value = charCode - 48`. This collapses
 * to plain `digit` when the char is `'0'..'9'` and yields `17..42` for
 * `'A'..'Z'`. The caller MUST guarantee the body is uppercase ASCII
 * `[A-Z0-9]` — `validate` and `parse` both enforce this via `RAW_REGEX`.
 */
function computeCnpjDV(body: string, weights: ReadonlyArray<number>): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const w = weights[i];
    if (w === undefined) return -1;
    const v = body.charCodeAt(i) - 48;
    sum += v * w;
  }
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

function checkDigitsCNPJ(body: string): boolean {
  if (body.length !== 14) return false;
  const dv1 = computeCnpjDV(body.slice(0, 12), WEIGHTS_DV1);
  if (dv1 !== body.charCodeAt(12) - 48) return false;
  const dv2 = computeCnpjDV(body.slice(0, 13), WEIGHTS_DV2);
  return dv2 === body.charCodeAt(13) - 48;
}
