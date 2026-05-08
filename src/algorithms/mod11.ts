/**
 * MOD-11 weighted check digit — parameterized.
 *
 * Used by: CO NIT, AR CUIT/CUIL, PE RUC, CL RUT/RUN, GT NIT, DO RNC, BR CPF,
 * BR CNPJ, EC RUC, PY RUC, JP My Number (variant), KR RRN (variant).
 *
 * The variants differ on:
 *   - Direction of weight application (left-to-right vs right-to-left)
 *   - Starting weight and increment
 *   - Whether weights cycle (e.g. CL RUT cycles 2..7)
 *   - Behavior when remainder is 0, 1, or 10
 *   - Whether the check digit can be a letter (`K` for CL/GT)
 *
 * This module exposes the primitive `mod11WeightedSum` plus the most common
 * variants used across countries.
 */

/**
 * Compute weighted sum mod 11, given digits and weights.
 *
 * Weights are applied 1-to-1 with `digits` from left to right. If `weights`
 * is shorter than `digits`, an error is thrown — country-specific code must
 * pre-extend or cycle weights as needed.
 */
export function mod11WeightedSum(digits: string, weights: ReadonlyArray<number>): number {
  if (digits.length !== weights.length) {
    throw new Error(
      `mod11WeightedSum: digits length ${digits.length} != weights length ${weights.length}`,
    );
  }
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) {
      throw new Error(`mod11WeightedSum: non-digit at position ${i}: ${digits[i]}`);
    }
    const w = weights[i];
    if (w === undefined) {
      // Defensive: TS noUncheckedIndexedAccess. Length check above guards this.
      throw new Error(`mod11WeightedSum: missing weight at position ${i}`);
    }
    sum += d * w;
  }
  return sum;
}

/**
 * Build a weight array by cycling a base sequence to a target length, applied
 * right-to-left then reversed so it lines up with left-to-right digits.
 *
 * Example: cycleWeights([2,3,4,5,6,7], 9) => [4,3,2,7,6,5,4,3,2]
 *
 * Used by CL RUT (cycle 2..7 right-to-left).
 */
export function cycleWeights(base: ReadonlyArray<number>, length: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < length; i++) {
    const w = base[i % base.length];
    if (w === undefined) {
      throw new Error("cycleWeights: empty base array");
    }
    out.push(w);
  }
  return out.reverse();
}
