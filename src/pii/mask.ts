/**
 * Mask helper — applies the spec's `mask` pattern to a normalized identity
 * document, revealing only the last `revealCount` placeholder positions.
 *
 * The `mask` pattern follows the cleave-style convention used elsewhere in
 * this library:
 *   - `0` — digit placeholder
 *   - `A` — uppercase letter placeholder
 *   - `*` — alphanumeric placeholder
 *   - any other char — literal separator (preserved verbatim)
 *
 * Stars in the masked output land ONLY on placeholder positions; separators
 * are never replaced. This ensures the masked form is visually consistent
 * with the formatted form (e.g. for a CNPJ, the slash and dashes survive).
 */

/** Single placeholder char in cleave-style masks. */
const PLACEHOLDERS: ReadonlySet<string> = new Set(["0", "A", "*"]);

/**
 * Walk `maskPattern` char-by-char. For every placeholder position, emit a
 * `*` if the placeholder index is strictly less than `numPlaceholders -
 * revealCount`, otherwise emit the matching char from `normalized`.
 *
 * Separators in the mask are preserved as-is.
 *
 * If `normalized` is shorter than the number of placeholders in the mask,
 * the missing tail positions emit `*` so callers never crash on partial
 * input. (This path is only hit on malformed input that bypassed validation;
 * the public `mask()` entry guards against it but the helper stays defensive.)
 */
export function applyMaskWithReveal(
  maskPattern: string,
  normalized: string,
  revealCount: number,
): string {
  const numPlaceholders = countPlaceholders(maskPattern);
  if (numPlaceholders === 0) {
    // No placeholders → no PII to mask. Return mask unchanged.
    return maskPattern;
  }

  const reveal = Math.max(0, Math.min(revealCount, numPlaceholders));
  const hideUntil = numPlaceholders - reveal;

  let placeholderIdx = 0;
  let out = "";
  for (let i = 0; i < maskPattern.length; i++) {
    const ch = maskPattern.charAt(i);
    if (PLACEHOLDERS.has(ch)) {
      if (placeholderIdx < hideUntil) {
        out += "*";
      } else {
        const realChar = normalized.charAt(placeholderIdx);
        out += realChar === "" ? "*" : realChar;
      }
      placeholderIdx++;
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Reveal count rule: `min(4, floor(numPlaceholders / 3))`. Short documents
 * (≤8 placeholders) reveal up to 2; mid (9-11) reveal 3; long (≥12) reveal 4.
 */
export function computeRevealCount(numPlaceholders: number): number {
  return Math.min(4, Math.floor(numPlaceholders / 3));
}

/** Count how many placeholder slots (`0`, `A`, `*`) are in the mask. */
export function countPlaceholders(maskPattern: string): number {
  let n = 0;
  for (let i = 0; i < maskPattern.length; i++) {
    if (PLACEHOLDERS.has(maskPattern.charAt(i))) n++;
  }
  return n;
}
