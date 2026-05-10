/**
 * Colombia — Permiso Especial de Permanencia (`CO_PEP`).
 *
 * Issuer: Migración Colombia.
 * Source: https://www.migracioncolombia.gov.co/
 * Legal basis: Resolución 5797/2017 (Ministerio de Relaciones Exteriores) —
 * crea el PEP para nacionales venezolanos. Reemplazado progresivamente por el
 * PPT (`CO_PPT`) a partir del Decreto 216/2021, pero los PEP vigentes siguen
 * presentándose en KYC y trámites bancarios.
 *
 * Format: 15 sequential digits, no separators.
 *
 * Check digit: **none**. Migración Colombia did not publish a verification
 * algorithm for the PEP number; downstream verification is done online
 * against their consultation service.
 *
 * Confidence: low. Format-only validation against the published 15-digit
 * length. No public validator library covers the PEP — see research note in
 * `nationid-research/document-gaps-2026-05-09.md` § "CO_PEP / CO_PPT".
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{15}$/;

export const pepSpec: DocumentSpec = {
  code: "CO_PEP",
  country: "CO",
  scope: "personal",
  labelKey: "documents.CO_PEP.label",
  rawRegex: RAW_REGEX,
  // PEP is displayed as 15 contiguous digits; no canonical separator.
  mask: "000000000000000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits) ? digits : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "CO_PEP", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 15) {
      return { ok: false, code: "CO_PEP", reason: { kind: "too_short" } };
    }
    if (digits.length > 15) {
      return { ok: false, code: "CO_PEP", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "CO_PEP", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "CO_PEP",
      normalized: digits,
      formatted: digits,
      confidence: "low",
    };
  },
};
