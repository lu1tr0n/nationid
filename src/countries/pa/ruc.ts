/**
 * Panamá — RUC (Registro Único de Contribuyentes).
 *
 * Issuer: DGI Panamá (Dirección General de Ingresos, MEF).
 * Source: https://dgi.mef.gob.pa/ — DV calculator: https://dgi.mef.gob.pa/Dv
 *
 * Format:
 *   - Naturales: same shape as `PA_CEDULA` (`[Tipo]-[Tomo]-[Asiento]`).
 *   - Jurídicas: `[Tomo]-[Folio]-[Asiento]` plus an optional 2-digit DV
 *     suffix printed on the certificate as `DV NN`.
 *
 * Check digit (DV): DGI exposes an interactive DV calculator at
 * https://dgi.mef.gob.pa/Dv but does NOT publish the underlying formula
 * in machine-readable form. Reference community implementations
 * (`apple314159/panama-dv`, `juancorradine/Panama-RUC-DV-Calculator`)
 * use a mod-11 weighted scheme that diverges in edge cases (alphabetic
 * prefixes `PE`/`E`/`N`, jurídica vs natural padding rules) and the
 * audit (`coverage-audit-2026-05-10.md`) flagged that the two reference
 * impls do not byte-match the DGI portal across all classes of input.
 *
 * For v0.5 we **deliberately keep format-only validation** (`confidence:
 * "low"`). The DV suffix is recognized in normalize/format and stripped
 * before validation, so round-tripping a DGI-printed `1234-5678-901234
 * DV 32` works. Promotion to `moderate` requires either:
 *   (a) DGI publishing the algorithm in writing, or
 *   (b) cross-validation across two independent reference implementations
 *       on at least 100 real-world RUCs, recorded in
 *       `docs/CROSS_VALIDATION.md`.
 *
 * Confidence: `low` — format only.
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";

/**
 * Accepted RUC body shapes (all separators required):
 *   - `[1-13|PE|E|N]-NNNN-NNNNNN` (natural; mirrors PA_CEDULA).
 *   - `NNNN-NNNN-NNNNNN` (jurídica).
 * An optional ` DV NN` or `-DV-NN` suffix is stripped during normalization.
 */
const RAW_REGEX = /^(?:(?:1[0-3]|[1-9]|PE|E|N)-\d{1,4}-\d{1,6}|\d{1,4}-\d{1,4}-\d{1,6})$/;
const FORMATTED_REGEX = RAW_REGEX;

/** DV suffix patterns the user might paste from a DGI certificate. */
const DV_SUFFIX = /[ -]?DV[ -]?\d{1,2}$/i;

function normalizePA(input: string): string {
  // Drop whitespace and any DV suffix; uppercase remaining alphabetic prefix.
  return input.replace(/\s+/g, "").replace(DV_SUFFIX, "").toUpperCase();
}

export const rucSpec: DocumentSpec = {
  code: "PA_RUC",
  country: "PA",
  scope: "tax",
  labelKey: "documents.PA_RUC.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0000-0000-000000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return normalizePA(input);
  },

  validate(input: string): boolean {
    return RAW_REGEX.test(normalizePA(input));
  },

  format(input: string): string {
    const norm = normalizePA(input);
    if (!RAW_REGEX.test(norm)) return input;
    return norm;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "PA_RUC", reason: { kind: "empty" } };
    }
    const norm = normalizePA(trimmed);
    if (!RAW_REGEX.test(norm)) {
      const rawLen = norm.replace(/-/g, "").length;
      if (rawLen < 3) {
        return { ok: false, code: "PA_RUC", reason: { kind: "too_short" } };
      }
      if (rawLen > 14) {
        return { ok: false, code: "PA_RUC", reason: { kind: "too_long" } };
      }
      return { ok: false, code: "PA_RUC", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "PA_RUC",
      normalized: norm,
      formatted: norm,
      confidence: "low",
    };
  },
};
