/**
 * Colombia — Permiso por Protección Temporal (`CO_PPT`).
 *
 * Issuer: Migración Colombia.
 * Source: https://www.migracioncolombia.gov.co/visas-permisos/permiso-por-proteccion-temporal-ppt
 * Legal basis: Decreto 216/2021 — crea el Estatuto Temporal de Protección para
 * Migrantes Venezolanos (ETPV); reemplaza progresivamente el PEP a partir de
 * 2021. Mandatorio para KYC bancario en CO desde Banco de la República
 * Circular SEDPE.
 *
 * Format: variable per issuance batch — 7-11 alphanumeric characters,
 * uppercase. Migración Colombia ha emitido lotes con formatos numéricos puros
 * y lotes con prefijo alfanumérico, sin publicar el catálogo completo.
 *
 * Check digit: **none**. Migración Colombia no publica un algoritmo de
 * verificación; la verificación se realiza en línea contra su servicio de
 * consulta de estatus.
 *
 * Confidence: low. Format-only validation against the union of observed
 * issuance shapes. No public validator library covers the PPT — see research
 * note in `nationid-research/document-gaps-2026-05-09.md` § "CO_PEP / CO_PPT".
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z0-9]{7,11}$/;

export const pptSpec: DocumentSpec = {
  code: "CO_PPT",
  country: "CO",
  scope: "personal",
  labelKey: "documents.CO_PPT.label",
  rawRegex: RAW_REGEX,
  // PPT is displayed as contiguous chars; no canonical separator.
  mask: "***********",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned) ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "CO_PPT", reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 7) {
      return { ok: false, code: "CO_PPT", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 11) {
      return { ok: false, code: "CO_PPT", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: "CO_PPT", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "CO_PPT",
      normalized: cleaned,
      formatted: cleaned,
      confidence: "low",
    };
  },
};
