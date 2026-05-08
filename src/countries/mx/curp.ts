/**
 * México — CURP (Clave Única de Registro de Población).
 *
 * Issuer: RENAPO (Registro Nacional de Población) — SEGOB.
 * Source: https://www.gob.mx/curp
 * Legal basis: Acuerdo SEGOB DOF 18-OCT-2014; Ley General de Población.
 *
 * Format: 18 chars, no separators, displayed as `AAAA######HXXLLL##`.
 *   - 4 letters: surnames + given-name initials.
 *   - 6 digits: AAMMDD birth date.
 *   - 1 letter: sex (`H` masculino, `M` femenino).
 *   - 2 letters: entidad federativa (32 values + `NE` para nacidos en el
 *     extranjero — see ENTIDADES below).
 *   - 3 consonants: internal consonants from name + first surname + second
 *     surname.
 *   - 1 alphanumeric: homoclave (differentiator).
 *   - 1 digit: check digit.
 *
 * Check digit: mod-10 over 17 chars converted via the 37-char SAT/RENAPO
 * alphabet `0..9 A..N Ñ O..Z` (indices 0..36).
 *   sum = sum(alphabet.indexOf(c[i]) * (18 - i)) for i in 0..16
 *   dv  = (10 - (sum mod 10)) mod 10
 *
 * Confidence: high. Algorithm published in DOF 18-OCT-2014 and matches the
 * `python-stdnum` `stdnum.mx.curp` reference implementation.
 *
 * Notes:
 *   - The "CURP genérica para extranjeros" (`XEXX010101HNEXXXA4`) is a real
 *     SAT-accepted placeholder and validates correctly under this algorithm.
 *     We do NOT special-case it.
 *   - `Ñ` is rare in CURPs because the standard usually substitutes `X`. We
 *     accept both (`Ñ` value = 24 in the RENAPO table).
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { computeCurpDV } from "./shared.ts";

/**
 * Strict regex per RENAPO. The `rawRegex` published on the spec is THIS
 * regex (not a looser superset), so consumers reading `spec.rawRegex` for
 * pre-validation see the same shape that `validate()` enforces internally.
 *
 *   - [0]: A-Z (consonant of first surname; first letter)
 *   - [1]: A-Z (vowel of first surname)
 *   - [2-3]: A-Z
 *   - [4-9]: digits AAMMDD
 *   - [10]: H or M (sex)
 *   - [11-12]: entidad federativa (validated below against `ENTIDADES`; the
 *              regex is a cheap shape gate, the set check is authoritative)
 *   - [13-15]: A-Z (internal consonants — historically excludes vowels but we
 *              accept any A-Z for forward compat)
 *   - [16]: A-Z or 0-9 (homoclave; pre-1996 uses 0, post uses A)
 *   - [17]: 0-9 (DV)
 */
const STRUCTURAL_REGEX =
  /^[A-Z][A-Z][A-Z][A-Z]\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM][A-Z]{2}[A-ZÑ]{3}[A-Z0-9]\d$/;

/** 32 entidades federativas + NE (nacido en el extranjero). RENAPO official. */
const ENTIDADES: ReadonlySet<string> = new Set([
  "AS",
  "BC",
  "BS",
  "CC",
  "CL",
  "CM",
  "CS",
  "CH",
  "DF",
  "DG",
  "GT",
  "GR",
  "HG",
  "JC",
  "MC",
  "MN",
  "MS",
  "NT",
  "NL",
  "OC",
  "PL",
  "QT",
  "QR",
  "SP",
  "SL",
  "SR",
  "TC",
  "TS",
  "TL",
  "VZ",
  "YN",
  "ZS",
  "NE",
]);

/** Strip non-alphanumeric, uppercase. */
function normalizeCurp(input: string): string {
  return input.replace(/[^A-Za-zÑñ0-9]+/g, "").toUpperCase();
}

export const curpSpec: DocumentSpec = {
  code: "MX_CURP",
  country: "MX",
  scope: "personal",
  labelKey: "documents.MX_CURP.label",
  rawRegex: STRUCTURAL_REGEX,
  // CURP has no canonical "formatted" form — it is always 18 contiguous chars.
  mask: "AAAAAAAAAAAAAAAAAA",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeCurp(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeCurp(input);
    if (!STRUCTURAL_REGEX.test(cleaned)) return false;
    const entidad = cleaned.slice(11, 13);
    if (!ENTIDADES.has(entidad)) return false;
    const expected = computeCurpDV(cleaned.slice(0, 17));
    if (expected < 0) return false;
    return expected === cleaned.charCodeAt(17) - 48;
  },

  format(input: string): string {
    // CURP is never displayed with separators.
    const cleaned = normalizeCurp(input);
    return cleaned.length === 18 ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "MX_CURP", reason: { kind: "empty" } };
    }
    const cleaned = normalizeCurp(trimmed);
    if (cleaned.length < 18) {
      return { ok: false, code: "MX_CURP", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 18) {
      return { ok: false, code: "MX_CURP", reason: { kind: "too_long" } };
    }
    if (!STRUCTURAL_REGEX.test(cleaned)) {
      return { ok: false, code: "MX_CURP", reason: { kind: "invalid_format" } };
    }
    const entidad = cleaned.slice(11, 13);
    if (!ENTIDADES.has(entidad)) {
      return { ok: false, code: "MX_CURP", reason: { kind: "invalid_format" } };
    }
    const expected = computeCurpDV(cleaned.slice(0, 17));
    if (expected < 0 || expected !== cleaned.charCodeAt(17) - 48) {
      return { ok: false, code: "MX_CURP", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "MX_CURP",
      normalized: cleaned,
      formatted: cleaned,
      confidence: "high",
    };
  },
};
