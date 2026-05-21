/**
 * Venezuela — RIF (Registro de Información Fiscal).
 *
 * Issuer: SENIAT (Servicio Nacional Integrado de Administración Aduanera y
 *                Tributaria).
 * Source: http://www.seniat.gob.ve/
 * Legal basis: Providencia SNAT/2003/1697.
 *
 * Format: 1 letter prefix + 9 digits, displayed as `J-12345678-9`.
 *   - 1 letter: holder type prefix (see below)
 *   - 8 digits: correlative
 *   - 1 digit:  dígito verificador
 *
 * Letter prefixes:
 *   - `V`  natural venezolano
 *   - `E`  extranjero residente
 *   - `J`  persona jurídica
 *   - `P`  pasaporte (extranjero no residente con actividad económica)
 *   - `G`  organismo gubernamental
 *   - `C`  consejo comunal
 *
 * Check digit:
 *   1. Take the 8 correlative digits and apply weights `[3,2,7,6,5,4,3,2]`
 *      left-to-right.
 *   2. Add the letter coefficient — `V=4`, `E=8`, `J=12`, `P=16`, `G=20`,
 *      `C=24`.
 *   3. `r = (sum_digits + letter_value) mod 11`.
 *   4. `dv = 11 - r`. If `dv >= 10` then `dv = 0`.
 *
 * Confidence: moderate. SENIAT does not publish the algorithm in a
 * machine-readable form; the formula is documented in community libraries
 * (`rif.js`, `validador-rif`, `mantrax314/verificador-rif-seniat`) and
 * consistently produces results that match SENIAT's online verification
 * portal. The audit (`coverage-audit-2026-05-10.md`) confirmed the
 * algorithm shipped here matches all three reference implementations on
 * the regression vectors in `tests/countries/ve.test.ts`. Promotion to
 * `high` is held until SENIAT publishes the formula in writing, since
 * the project policy requires "official source AND mature library
 * agree" for high confidence.
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";
// Normalized form: prefix letter + 8 correlative + 1 DV = 10 chars total.
const RAW_REGEX = /^[VEJPGC]\d{9}$/;
// Accepted formatted forms: `A-00000000-0` with optional whitespace.
const FORMATTED_REGEX = /^[VEJPGC]-\d{8}-\d$/;

const LETTER_VALUES: Record<string, number> = {
  V: 4,
  E: 8,
  J: 12,
  P: 16,
  G: 20,
  C: 24,
};

const WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2] as const;

const COUNTRY = "VE";
const CODE = "VE_RIF";

function normalizeRif(input: string): string {
  return input.replace(/[^A-Za-z0-9]+/g, "").toUpperCase();
}

export const rifSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.VE_RIF.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "A-00000000-0",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return normalizeRif(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeRif(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkRif(cleaned);
  },

  format(input: string): string {
    const cleaned = normalizeRif(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return `${cleaned.charAt(0)}-${cleaned.slice(1, 9)}-${cleaned.charAt(9)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = normalizeRif(trimmed);
    if (cleaned.length < 10) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 10) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkRif(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `${cleaned.charAt(0)}-${cleaned.slice(1, 9)}-${cleaned.charAt(9)}`,
      confidence: "moderate",
    };
  },
};

/**
 * Holder type derived from the RIF prefix. Useful for surfacing the type
 * in UI without re-parsing.
 */
export type RIFHolderType =
  | "natural_venezolano"
  | "extranjero"
  | "juridica"
  | "pasaporte"
  | "gubernamental"
  | "consejo_comunal"
  | "unknown";

export function rifHolderType(input: string): RIFHolderType {
  const cleaned = normalizeRif(input);
  if (!RAW_REGEX.test(cleaned)) return "unknown";
  const p = cleaned.charAt(0);
  if (p === "V") return "natural_venezolano";
  if (p === "E") return "extranjero";
  if (p === "J") return "juridica";
  if (p === "P") return "pasaporte";
  if (p === "G") return "gubernamental";
  if (p === "C") return "consejo_comunal";
  return "unknown";
}

function checkRif(cleaned: string): boolean {
  const letter = cleaned.charAt(0);
  const letterValue = LETTER_VALUES[letter];
  if (letterValue === undefined) return false;

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = cleaned.charCodeAt(i + 1) - 48;
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const r = (sum + letterValue) % 11;
  let dv = 11 - r;
  if (dv >= 10) dv = 0;
  return dv === cleaned.charCodeAt(9) - 48;
}
