/**
 * Singapore NRIC + FIN share a weighted-sum + prefix-offset + table-lookup
 * algorithm with mod-11. Extracted into a shared helper so the per-spec files
 * (`nric.ts`, `fin.ts`) only differ in the prefix→offset and prefix→table
 * mappings.
 *
 * Weights for the 7 body digits d1..d7 (left to right): `(2, 7, 6, 5, 4, 3, 2)`.
 * Verified identical across NRIC and FIN in SAP KBA #2572734 and the
 * samliew/IonBazan/Jqnxyz reference implementations.
 */

/** Weights applied to the 7 body digits, left to right. */
export const NRIC_FIN_WEIGHTS = [2, 7, 6, 5, 4, 3, 2] as const;

/**
 * Normalize an NRIC/FIN/UEN candidate: uppercase and strip everything that is
 * not an ASCII letter or digit (whitespace, hyphens, slashes, etc.). Idempotent.
 */
export function normalizeSgId(input: string): string {
  return input.replace(/[^A-Za-z0-9]+/g, "").toUpperCase();
}

/**
 * Weighted sum of the 7 body digits of an NRIC/FIN. `body7` must be exactly 7
 * decimal digits (the caller guarantees the shape via regex first).
 */
export function nricFinWeightedSum(body7: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += (body7.charCodeAt(i) - 48) * (NRIC_FIN_WEIGHTS[i] as number);
  }
  return sum;
}
