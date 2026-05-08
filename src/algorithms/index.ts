/**
 * Public algorithm primitives. Tree-shakable subpath: `nationid/algorithms`.
 *
 * Each function is a pure mathematical primitive with cited spec.
 */

export { luhnCheckDigit, luhnValid } from "./luhn.ts";
export { cycleWeights, mod11WeightedSum } from "./mod11.ts";
