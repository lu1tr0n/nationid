/**
 * `lastN` — return the trailing N chars of the canonical (normalized) form.
 *
 * Useful for search-friendly storage where you keep `last4` indexed alongside
 * the encrypted full document. By normalizing first, "12.345.678/0001-90" and
 * "12345678000190" yield the same `last4`.
 */

import type { DocumentTypeCode } from "../core/types.ts";
import { getPiiSpec } from "./spec-table.ts";

/** Default reveal count, matching common KYC display conventions. */
const DEFAULT_N = 4;

/**
 * Returns the trailing `n` characters of `input` after normalization.
 *
 * Always operates on the canonical (normalized) form so that any user-visible
 * formatting variation collapses to the same suffix. Common use case: index a
 * `last4` column for search alongside the encrypted full document.
 *
 * @param code - Document type whose normalization rules apply.
 * @param input - Raw user input.
 * @param n - Number of trailing chars to return (default `4`).
 *   Values `<= 0` return the empty string. If the normalized form is shorter
 *   than `n`, the full normalized form is returned.
 * @returns The last `n` chars of the normalized form.
 * @throws {Error} if `code` is not registered.
 * @example
 * ```ts
 * import { lastN } from "nationid/pii";
 *
 * lastN("BR_CNPJ", "12.345.678/0001-90");    // "0190"
 * lastN("BR_CNPJ", "12345678000190", 6);     // "000190"
 * lastN("SV_DUI",  "04567890-3");            // "8903"
 * ```
 */
export function lastN(code: DocumentTypeCode, input: string, n: number = DEFAULT_N): string {
  const spec = getPiiSpec(code);
  if (spec === undefined) {
    throw new Error(`nationid/pii.lastN: no spec registered for "${code}"`);
  }
  const normalized = spec.normalize(input);
  if (n <= 0) return "";
  if (normalized.length <= n) return normalized;
  return normalized.slice(normalized.length - n);
}
