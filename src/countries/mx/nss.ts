/**
 * México — NSS (Número de Seguridad Social).
 *
 * Issuer: IMSS (Instituto Mexicano del Seguro Social).
 * Source: https://www.imss.gob.mx/tramites/imss02008/
 * Legal basis: Ley del Seguro Social, Art. 15 fracción II + Reglamento
 *              de la LSS en materia de Afiliación, Clasificación de Empresas,
 *              Recaudación y Fiscalización.
 *
 * ## Format
 *
 * 11 digits, no separators in canonical form. Some IMSS-printed documents
 * group as `XX-XX-XX-XXXX-X` for legibility — `normalize()` strips those
 * separators idempotently.
 *
 *   - 2 digits: subdelegación IMSS where the worker was first registered
 *   - 2 digits: año de afiliación (last two digits of the calendar year)
 *   - 2 digits: año de nacimiento del asegurado (YY)
 *   - 4 digits: folio progresivo asignado por la subdelegación
 *   - 1 digit:  dígito verificador (Luhn / mod-10)
 *
 * ## Check digit (Luhn / ISO/IEC 7812-1)
 *
 * The DV is the standard Luhn check digit computed over the first 10 digits.
 *
 *   - From the rightmost digit of the body (10th body digit), double every
 *     second digit; if the doubled value > 9, subtract 9.
 *   - Sum all 10 digits (with the doubling rule applied).
 *   - DV = (10 - (sum mod 10)) mod 10.
 *
 * Equivalently: appending the DV makes the full 11-digit number Luhn-valid.
 *
 * ## Confidence
 *
 * `high` — IMSS publishes the NSS structure on `imss.gob.mx` and the Luhn
 * mod-10 algorithm is referenced in DOF publications and matches multiple
 * independent reference implementations (`tochotitlan/nss-validator`,
 * `python-stdnum.stdnum.mx.curp` siblings). The DV is the same Luhn
 * algorithm shipped under `src/algorithms/luhn.ts`.
 *
 * ## Notes
 *
 * - Purpose: social security (payroll, healthcare, retirement). Distinct
 *   from CURP (national ID) and RFC (tax). Many systems require all three.
 * - The audit (`coverage-audit-2026-05-10.md`) flagged MX_NSS as the
 *   single highest-priority missing document for the library — every
 *   Mexican payroll integration needs it.
 * - We intentionally do NOT validate that the subdelegación code (digits
 *   1-2) corresponds to a real IMSS office. The catalog is large, sparsely
 *   assigned, and not stable across reorganizations; coupling the
 *   validator to a snapshot would create false negatives.
 */

import { luhnValid } from "../../algorithms/luhn.ts";
import { allSameDigit, stripNonDigits } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{11}$/;
// Common IMSS-printed grouping: `XX-XX-XX-XXXX-X` or `XX XX XX XXXX X`.
const FORMATTED_REGEX = /^\d{2}[-\s]\d{2}[-\s]\d{2}[-\s]\d{4}[-\s]\d$/;

const COUNTRY = "MX" as CountryCode;
// MX_NSS is not yet a member of the DocumentTypeCode union (added by the
// orchestrator). Using a type assertion here keeps the spec self-contained
// for v0.5; when the union is extended this assertion becomes a no-op.
// TODO(v0.5-integration): drop the assertion once `MX_NSS` lands in
// `src/core/types.ts` `DocumentTypeCode`.
const CODE = "MX_NSS" as DocumentTypeCode;

export const nssSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "personal",
  labelKey: "documents.MX_NSS.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  // Canonical form has no separators. We expose the 11-digit mask so that
  // mask-based input components (Cleave, IMask) render `00000000000`.
  mask: "00000000000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return false;
    if (allSameDigit(digits)) return false;
    return luhnValid(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    if (!RAW_REGEX.test(digits)) return input;
    // IMSS uses the canonical contiguous 11-digit form. Some payroll systems
    // group as `XX-XX-XX-XXXX-X`; we standardize on the contiguous form to
    // match the IMSS portal display.
    return digits;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 11) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (digits.length > 11) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    // All-same-digit values (e.g. `00000000000`, `11111111111`) are
    // Luhn-valid for a few specific repeats but are universally treated as
    // placeholders, never real NSSs.
    if (allSameDigit(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!luhnValid(digits)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: digits,
      formatted: digits,
      confidence: "high",
    };
  },
};
