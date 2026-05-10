/**
 * Nicaragua — RUC (Registro Único de Contribuyentes).
 *
 * Issuer: Dirección General de Ingresos (DGI).
 * Source: https://www.dgi.gob.ni/
 * Legal basis: Ley 562/05 (Código Tributario).
 *
 * Format: 14 chars.
 *   - Naturales: same shape as NI_CEDULA (`000-DDMMYY-0000A`).
 *   - Jurídicas: 14 digits (`J-NNNNNNN-NNNNNN-N`-style; we accept the
 *     normalized 14-digit form).
 *
 * Check digit: not publicly documented. The DGI does not publish a verifier
 * formula. We therefore validate **format only**.
 *
 * Confidence: `low` — format-only.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/** 14 chars: either 13 digits + 1 letter (natural) or 14 digits (jurídica). */
const RAW_REGEX = /^(?:\d{13}[A-Z]|\d{14})$/;
/** Formatted shapes accepted: cédula form for naturales, hyphenated jurídica. */
const FORMATTED_REGEX = /^(?:\d{3}-\d{6}-\d{4}[A-Z]|\d{4}-\d{7}-\d{3})$/;

export const rucSpec: DocumentSpec = {
  code: "NI_RUC",
  country: "NI",
  scope: "tax",
  labelKey: "documents.NI_RUC.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000-0000000-000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const norm = stripAndUpper(input);
    return RAW_REGEX.test(norm);
  },

  format(input: string): string {
    const norm = stripAndUpper(input);
    if (!RAW_REGEX.test(norm)) return input;
    if (/[A-Z]$/.test(norm)) {
      // Natural: cédula-style mask.
      return `${norm.slice(0, 3)}-${norm.slice(3, 9)}-${norm.slice(9, 13)}${norm.slice(13)}`;
    }
    // Jurídica: split as `0000-0000000-000` (4-7-3) for readability.
    return `${norm.slice(0, 4)}-${norm.slice(4, 11)}-${norm.slice(11)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "NI_RUC", reason: { kind: "empty" } };
    }
    const norm = stripAndUpper(trimmed);
    if (norm.length < 14) {
      return { ok: false, code: "NI_RUC", reason: { kind: "too_short" } };
    }
    if (norm.length > 14) {
      return { ok: false, code: "NI_RUC", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(norm)) {
      return { ok: false, code: "NI_RUC", reason: { kind: "invalid_format" } };
    }
    const formatted = /[A-Z]$/.test(norm)
      ? `${norm.slice(0, 3)}-${norm.slice(3, 9)}-${norm.slice(9, 13)}${norm.slice(13)}`
      : `${norm.slice(0, 4)}-${norm.slice(4, 11)}-${norm.slice(11)}`;
    return {
      ok: true,
      code: "NI_RUC",
      normalized: norm,
      formatted,
      confidence: "low",
    };
  },
};
