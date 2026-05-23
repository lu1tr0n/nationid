/**
 * Verhoeff check digit — dihedral-group D₅ scheme.
 *
 * Devised by J. Verhoeff (1969); standardised as Indian Standard IS 4905:1968.
 * Used by India's Aadhaar (12-digit UID) and VID (16-digit Aadhaar alias);
 * detects all single-digit and all transposition errors.
 *
 * The three tables below are canonical (verbatim from Verhoeff 1969 and
 * cross-verified against python-stdnum's `stdnum.verhoeff`).
 */

/** Dihedral D₅ multiplication table, indexed `[j][k]` for `j ∘ k`. */
const D: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

/** Permutation table indexed `[i mod 8][n]`. */
const P: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

/** Multiplicative-inverse table (used only when generating a check digit). */
const INV: ReadonlyArray<number> = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Validates a digit string under Verhoeff. The check digit is the rightmost
 * digit; the input includes it.
 *
 * @param input - Digit-only string (any length ≥ 1). Non-digit characters
 *   throw — callers should normalize first.
 * @returns `true` iff the Verhoeff sum reduces to 0.
 * @throws {Error} on non-digit input.
 * @example
 * ```ts
 * import { verhoeffValid } from "nationid/algorithms";
 *
 * verhoeffValid("234123412346"); // true (canonical Aadhaar test vector)
 * verhoeffValid("234123412347"); // false (last digit flipped)
 * ```
 */
export function verhoeffValid(input: string): boolean {
  let c = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(input.length - 1 - i) - 48;
    if (ch < 0 || ch > 9) {
      throw new Error(`verhoeffValid: non-digit at position ${input.length - 1 - i}`);
    }
    const row = P[i % 8];
    if (row === undefined) throw new Error(`verhoeffValid: missing P row ${i % 8}`);
    const p = row[ch];
    if (p === undefined) throw new Error(`verhoeffValid: missing P[${i % 8}][${ch}]`);
    const dRow = D[c];
    if (dRow === undefined) throw new Error(`verhoeffValid: missing D row ${c}`);
    const nextC = dRow[p];
    if (nextC === undefined) throw new Error(`verhoeffValid: missing D[${c}][${p}]`);
    c = nextC;
  }
  return c === 0;
}

/**
 * Computes the Verhoeff check digit for a digit string that does NOT yet
 * include the check digit.
 *
 * @param base - Digit-only string (the "base" without the check digit).
 * @returns A single digit in `[0, 9]` such that `verhoeffValid(base + checkDigit) === true`.
 * @throws {Error} on non-digit input.
 * @example
 * ```ts
 * import { verhoeffCheckDigit } from "nationid/algorithms";
 *
 * verhoeffCheckDigit("23412341234"); // 6
 * ```
 */
export function verhoeffCheckDigit(base: string): number {
  let c = 0;
  // Apply over base + "0" placeholder, walking rightmost-first (i=0 is the placeholder).
  const padded = `${base}0`;
  for (let i = 0; i < padded.length; i++) {
    const ch = padded.charCodeAt(padded.length - 1 - i) - 48;
    if (ch < 0 || ch > 9) {
      throw new Error(`verhoeffCheckDigit: non-digit at position ${padded.length - 1 - i}`);
    }
    const row = P[i % 8];
    if (row === undefined) throw new Error(`verhoeffCheckDigit: missing P row ${i % 8}`);
    const p = row[ch];
    if (p === undefined) throw new Error(`verhoeffCheckDigit: missing P[${i % 8}][${ch}]`);
    const dRow = D[c];
    if (dRow === undefined) throw new Error(`verhoeffCheckDigit: missing D row ${c}`);
    const nextC = dRow[p];
    if (nextC === undefined) throw new Error(`verhoeffCheckDigit: missing D[${c}][${p}]`);
    c = nextC;
  }
  const inv = INV[c];
  if (inv === undefined) throw new Error(`verhoeffCheckDigit: missing INV[${c}]`);
  return inv;
}
