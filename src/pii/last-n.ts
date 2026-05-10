/**
 * `lastN` — return the trailing N chars of the canonical (normalized) form.
 *
 * Useful for search-friendly storage where you keep `last4` indexed alongside
 * the encrypted full document. By normalizing first, "12.345.678/0001-90" and
 * "12345678000190" yield the same `last4`.
 */

import type { DocumentTypeCode } from "../core/types.ts";
import { getSpec } from "../index.ts";

/** Default reveal count, matching common KYC display conventions. */
const DEFAULT_N = 4;

export function lastN(code: DocumentTypeCode, input: string, n: number = DEFAULT_N): string {
  const spec = getSpec(code);
  const normalized = spec.normalize(input);
  if (n <= 0) return "";
  if (normalized.length <= n) return normalized;
  return normalized.slice(normalized.length - n);
}
