/**
 * México — RFC Persona Física (Registro Federal de Contribuyentes).
 *
 * Issuer: SAT (Servicio de Administración Tributaria).
 * Source: https://www.sat.gob.mx/
 * Legal basis: Código Fiscal de la Federación Art. 27; RMF Anexo 1-A.
 *
 * Format: 13 chars displayed as `AAAA######XXX` (no separators).
 *   - 4 letters: 2 letras del primer apellido + 1 letra del segundo apellido +
 *     1 letra del nombre. SAT replaces forbidden 4-letter sequences (palabras
 *     altisonantes) with `X` in the 4th position.
 *   - 6 digits: AAMMDD (fecha de nacimiento).
 *   - 3 alfanuméricos: homoclave (2 chars + 1 DV).
 *
 * Check digit: SAT homoclave algorithm — mod-11 over the first 12 chars
 * mapped through the SAT Anexo 19 39-entry table (`0`->0, ..., `9`->9,
 * `A`->10, ..., `N`->23, `&`->24, `O`->25, ..., `Z`->36, ` `->37, `Ñ`->38),
 * weighted 13..2 left-to-right.
 *   sum = sum(value(rfc[i]) * (13 - i)) for i in 0..11
 *   r   = sum mod 11
 *   dv  = 11 - r
 *     - if dv == 11 → '0'
 *     - if dv == 10 → 'A'
 *     - else        → str(dv)
 *
 * Confidence: moderate. The algorithm matches `python-stdnum`
 * `stdnum.mx.rfc` (cross-validated 2026-05-08) and the SAT-published Anexo
 * 19 "Tabla de equivalencia para la verificación del homoclave del RFC".
 * SAT does not publish the weight vector verbatim but the formula is
 * consistent across mature libraries. Downgraded from `high` because there
 * is no first-party SAT test fixture set; we cross-checked against
 * synthetic vectors generated from the SAT formula plus python-stdnum's
 * published doctest values (`GODE561231GR8`, `MAB9307148T4`).
 *
 * Genéricos (SAT-accepted placeholders, both validate as `high`):
 *   - `XAXX010101000` — operación con público en general / extranjero.
 *   - `XEXX010101000` — extranjero sin RFC.
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { computeRfcDV, RFC_FORBIDDEN_PREFIXES } from "./shared.ts";

// 4 letters + 6 digits + 2 alphanumeric homoclave + 1 DV.
// The DV at position 12 is `0-9` or `A` only — see `computeRfcDV` (residue 10
// is mapped to `A`, residues 0-9 to `0-9`). Tightening the regex makes
// `parse()` return `invalid_format` (instead of `invalid_checksum`) for
// strings whose DV character is impossible.
const RAW_REGEX = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{2}[0-9A]$/;

/** Strip separators and uppercase. */
function normalizeRfc(input: string): string {
  return input.replace(/[^A-Za-zÑñ&0-9]+/g, "").toUpperCase();
}

/** SAT genéricos that bypass standard checks (CFDI 4.0 accepted). */
const GENERIC_PF: ReadonlySet<string> = new Set(["XAXX010101000", "XEXX010101000"]);

export const rfcPfSpec: DocumentSpec = {
  code: "MX_RFC_PF",
  country: "MX",
  scope: "tax",
  labelKey: "documents.MX_RFC_PF.label",
  rawRegex: RAW_REGEX,
  mask: "AAAA000000***",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return normalizeRfc(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeRfc(input);
    if (cleaned.length !== 13) return false;
    if (!RAW_REGEX.test(cleaned)) return false;
    if (GENERIC_PF.has(cleaned)) return true;
    if (RFC_FORBIDDEN_PREFIXES.has(cleaned.slice(0, 4))) return false;
    if (!validBirthDate(cleaned.slice(4, 10))) return false;
    return computeRfcDV(cleaned.slice(0, 12)) === cleaned.charAt(12);
  },

  format(input: string): string {
    const cleaned = normalizeRfc(input);
    return cleaned.length === 13 ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "MX_RFC_PF", reason: { kind: "empty" } };
    }
    const cleaned = normalizeRfc(trimmed);
    if (cleaned.length < 13) {
      return { ok: false, code: "MX_RFC_PF", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 13) {
      return { ok: false, code: "MX_RFC_PF", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: "MX_RFC_PF", reason: { kind: "invalid_format" } };
    }
    if (GENERIC_PF.has(cleaned)) {
      return {
        ok: true,
        code: "MX_RFC_PF",
        normalized: cleaned,
        formatted: cleaned,
        confidence: "moderate",
      };
    }
    if (RFC_FORBIDDEN_PREFIXES.has(cleaned.slice(0, 4))) {
      return { ok: false, code: "MX_RFC_PF", reason: { kind: "invalid_format" } };
    }
    if (!validBirthDate(cleaned.slice(4, 10))) {
      return { ok: false, code: "MX_RFC_PF", reason: { kind: "invalid_format" } };
    }
    if (computeRfcDV(cleaned.slice(0, 12)) !== cleaned.charAt(12)) {
      return { ok: false, code: "MX_RFC_PF", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "MX_RFC_PF",
      normalized: cleaned,
      formatted: cleaned,
      confidence: "moderate",
    };
  },
};

/** AAMMDD plausibility check (no full Gregorian — RFC accepts any plausible date). */
function validBirthDate(yymmdd: string): boolean {
  if (yymmdd.length !== 6) return false;
  const month = Number(yymmdd.slice(2, 4));
  const day = Number(yymmdd.slice(4, 6));
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  return true;
}
