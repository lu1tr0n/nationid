/**
 * México — RFC Persona Moral (Registro Federal de Contribuyentes).
 *
 * Issuer: SAT (Servicio de Administración Tributaria).
 * Source: https://www.sat.gob.mx/
 * Legal basis: Código Fiscal de la Federación Art. 27; RMF Anexo 1-A.
 *
 * Format: 12 chars displayed as `AAA######XXX` (no separators).
 *   - 3 letters: razón social (acronym from the legal name).
 *   - 6 digits: AAMMDD (fecha de constitución).
 *   - 3 alfanuméricos: homoclave (2 chars + 1 DV).
 *
 * Check digit: same SAT homoclave algorithm as RFC PF, but the body is padded
 * with a leading space to produce a 12-char input for the weighted sum, since
 * the table assigns space → 0 (the first slot of the SAT alphabet).
 *
 *   body12 = " " + rfc[0..10]
 *   sum    = sum(value(body12[i]) * (13 - i)) for i in 0..11
 *   r      = sum mod 11
 *   dv     = 11 - r
 *     - if dv == 11 → '0'
 *     - if dv == 10 → 'A'
 *     - else        → str(dv)
 *
 * Confidence: moderate. Same caveats as RFC_PF — the algorithm is matches the
 * `python-stdnum` reference implementation and SAT Anexo 19 transformation,
 * but no first-party fixture set is published.
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { computeRfcDV } from "./shared.ts";

const RAW_REGEX = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;

function normalizeRfc(input: string): string {
  return input.replace(/[^A-Za-zÑñ&0-9]+/g, "").toUpperCase();
}

export const rfcPmSpec: DocumentSpec = {
  code: "MX_RFC_PM",
  country: "MX",
  scope: "tax",
  labelKey: "documents.MX_RFC_PM.label",
  rawRegex: RAW_REGEX,
  mask: "AAA000000***",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return normalizeRfc(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeRfc(input);
    if (cleaned.length !== 12) return false;
    if (!RAW_REGEX.test(cleaned)) return false;
    if (!validConstitutionDate(cleaned.slice(3, 9))) return false;
    return computeRfcDV(` ${cleaned.slice(0, 11)}`) === cleaned.charAt(11);
  },

  format(input: string): string {
    const cleaned = normalizeRfc(input);
    return cleaned.length === 12 ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "MX_RFC_PM", reason: { kind: "empty" } };
    }
    const cleaned = normalizeRfc(trimmed);
    if (cleaned.length < 12) {
      return { ok: false, code: "MX_RFC_PM", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 12) {
      return { ok: false, code: "MX_RFC_PM", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: "MX_RFC_PM", reason: { kind: "invalid_format" } };
    }
    if (!validConstitutionDate(cleaned.slice(3, 9))) {
      return { ok: false, code: "MX_RFC_PM", reason: { kind: "invalid_format" } };
    }
    if (computeRfcDV(` ${cleaned.slice(0, 11)}`) !== cleaned.charAt(11)) {
      return { ok: false, code: "MX_RFC_PM", reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: "MX_RFC_PM",
      normalized: cleaned,
      formatted: cleaned,
      confidence: "moderate",
    };
  },
};

function validConstitutionDate(yymmdd: string): boolean {
  if (yymmdd.length !== 6) return false;
  const month = Number(yymmdd.slice(2, 4));
  const day = Number(yymmdd.slice(4, 6));
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  return true;
}
