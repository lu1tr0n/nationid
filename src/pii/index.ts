/**
 * PII helpers for safe handling of identity documents in storage and UI.
 *
 * Three primitives, all built on top of the existing `DocumentSpec` registry:
 *
 *   - `mask(code, input)` — UI-safe redacted display form (e.g. `***.***.890-01`).
 *   - `lastN(code, input, n?)` — last N chars of the normalized form, for
 *      search-friendly storage indexing.
 *   - `hash(code, input, opts?)` — deterministic hex digest via SubtleCrypto,
 *      for equality lookups without storing raw PII.
 *
 * Every helper normalizes the input first so that any user-visible formatting
 * variation collapses to the same canonical representation.
 */

import type { DocumentTypeCode } from "../core/types.ts";
import { getSpec } from "../index.ts";
import { applyMaskWithReveal, computeRevealCount, countPlaceholders } from "./mask.ts";

export type { HashAlgorithm, HashOptions } from "./hash.ts";
export { hash } from "./hash.ts";
export { lastN } from "./last-n.ts";

/** Output for empty / whitespace-only input. */
const EMPTY_PLACEHOLDER = "***";

/**
 * Returns a masked representation of `input` using the spec's mask pattern.
 *
 * Reveal rule: `min(4, floor(numPlaceholders / 3))` chars at the tail. So a
 * 9-digit DUI reveals 3, a 14-digit CNPJ reveals 4, an 18-char CURP reveals 4.
 *
 * Stars only fall on placeholder positions; separators are preserved verbatim.
 *
 * Returns `"***"` for empty/whitespace-only input. Returns `input` unchanged
 * if the spec is unknown (matches the soft contract used by other helpers).
 *
 * @example
 *   // mask("BR_CNPJ", "12345678000190")     -> "<dot><dot><slash>01-90" (separators kept, last 4 revealed)
 *   // mask("MX_CURP", "GOMC850315HDFRRR07") -> 14 stars + "RR07"
 *   // mask("SV_DUI", "012345678")            -> 6 stars + "67" + "-" + "8"
 */
export function mask(code: DocumentTypeCode, input: string): string {
  if (input.trim().length === 0) return EMPTY_PLACEHOLDER;

  let spec: ReturnType<typeof getSpec>;
  try {
    spec = getSpec(code);
  } catch {
    // Unknown code — soft fallback per the documented contract.
    return input;
  }

  const normalized = spec.normalize(input);
  if (normalized.length === 0) return EMPTY_PLACEHOLDER;

  const maskPattern = spec.mask;
  const numPlaceholders = countPlaceholders(maskPattern);
  const reveal = computeRevealCount(numPlaceholders);

  return applyMaskWithReveal(maskPattern, normalized, reveal);
}
