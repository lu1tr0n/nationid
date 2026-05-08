/**
 * Shared primitives for Colombia specs.
 *
 * Centralizes the DIAN mod-11 weight vector used by NIT and (when used as a
 * tax ID) cédula. Source: DIAN Concepto 015766 — Estatuto Tributario Art.
 * 555-1.
 */

import { stripNonDigits } from "../../core/normalize.ts";

/**
 * DIAN mod-11 weights, applied **right-to-left** over the body. Truncated to
 * the body length (NIT bodies range from 9 to 10 digits). The right-most body
 * digit pairs with weight 3, the next with 7, then 13, 17, 19, 23, 29, 37, 41,
 * 43.
 */
const DIAN_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43] as const;

/**
 * Compute the DIAN check digit (DV) for a NIT body of 9 or 10 digits.
 *
 * Formula:
 *   sum = sum(digit_i * weight_i) for i counted from the right
 *   r   = sum mod 11
 *   dv  = r            if r < 2
 *         11 - r       otherwise
 *
 * Returns the DV (0-9 or 10 — but DIAN always returns single-digit DV in
 * practice for 9-10 digit bodies because the maximum sum mod 11 ≤ 10) or -1
 * if the body is malformed.
 */
export function computeDianDV(body: string): number {
  const digits = stripNonDigits(body);
  if (digits.length < 1 || digits.length > 10) return -1;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const fromRight = digits.length - 1 - i;
    const w = DIAN_WEIGHTS[i];
    if (w === undefined) return -1;
    const d = digits.charCodeAt(fromRight) - 48;
    if (d < 0 || d > 9) return -1;
    sum += d * w;
  }
  const r = sum % 11;
  return r < 2 ? r : 11 - r;
}
