/**
 * Guatemala — NIT (Número de Identificación Tributaria).
 *
 * Issuer: Superintendencia de Administración Tributaria (SAT).
 * Source: https://portal.sat.gob.gt/portal/
 * Legal basis: Reglamento de Factura Electrónica en Línea (FEL).
 *
 * Format: variable length. 1–12 base digits + 1 verifier digit (`0`–`9` or
 * `K`), commonly displayed as `0000000-D` with a hyphen separating the body
 * and the verifier.
 *
 * Check digit: mod-11 weighted. Weights `2, 3, 4, 5, ...` are applied
 * **right-to-left** over the body (rightmost body digit × 2, next × 3, etc.).
 * The verifier is computed as:
 *
 *   r  = (-sum) mod 11
 *   dv = '0123456789K'[r]
 *
 * Equivalently: `dv = 11 - (sum mod 11)`; if the result is 11 → '0', if 10 → 'K'.
 *
 * Confidence: moderate. The algorithm matches `python-stdnum` `stdnum.gt.nit`
 * and the SAT FEL technical addenda used by certified billing providers.
 *
 * All-same-digit sequences (e.g. `1111111`) are rejected as placeholder
 * values, mirroring the convention applied to BR CPF / CNPJ.
 *
 * Persona natural may use **CUI/DPI** as their NIT in FEL post-2022; this
 * spec validates only the classic NIT format. Callers that want to accept a
 * CUI in the NIT field should validate it as `GT_DPI`.
 */

import { allSameDigit, stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/** Body of 1-12 digits followed by a verifier (digit or `K`). */
const RAW_REGEX = /^\d{1,12}[\dK]$/;
const FORMATTED_REGEX = /^\d{1,12}-[\dK]$/;

export const nitSpec: DocumentSpec = {
  code: "GT_NIT",
  country: "GT",
  scope: "tax",
  labelKey: "documents.GT_NIT.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000000-A",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    if (allSameDigit(cleaned.slice(0, -1))) return false;
    return checkNIT(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "GT_NIT", reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 2) {
      return { ok: false, code: "GT_NIT", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 13) {
      return { ok: false, code: "GT_NIT", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: "GT_NIT", reason: { kind: "invalid_format" } };
    }
    if (allSameDigit(cleaned.slice(0, -1))) {
      return { ok: false, code: "GT_NIT", reason: { kind: "invalid_format" } };
    }
    if (!checkNIT(cleaned)) {
      return { ok: false, code: "GT_NIT", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "GT_NIT",
      normalized: cleaned,
      formatted: `${cleaned.slice(0, -1)}-${cleaned.slice(-1)}`,
      confidence: "moderate",
    };
  },
};

/**
 * SAT NIT verifier.
 *
 *   sum = Σ (body_from_right[i] * (i + 2))  for i = 0..n-1
 *   r   = ((-sum) mod 11 + 11) mod 11
 *   dv  = "0123456789K"[r]
 */
function computeNitDV(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const idx = body.length - 1 - i;
    const d = body.charCodeAt(idx) - 48;
    if (d < 0 || d > 9) return "?";
    sum += d * (i + 2);
  }
  const r = ((-sum % 11) + 11) % 11;
  if (r === 10) return "K";
  return String(r);
}

function checkNIT(cleaned: string): boolean {
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  if (body.length === 0) return false;
  return computeNitDV(body) === dv;
}
