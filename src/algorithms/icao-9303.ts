/**
 * ICAO Doc 9303 (Machine Readable Travel Documents) Part 3 — Visual Inspection
 * Zone & Machine Readable Zone.
 *
 * The MRZ check digit algorithm is identical for all MRTD types (TD1, TD2, TD3).
 * Used to validate the document number, DOB, expiry, and final composite check.
 *
 * Spec: ICAO Doc 9303 Part 3 §4.9.
 *   1. Convert each char `c[i]` to a numeric value `v[i]`:
 *      `'0'..'9'` → `0..9`, `'A'..'Z'` → `10..35` (A=10), `'<'` → `0`.
 *   2. Cyclic weights `W = [7, 3, 1, 7, 3, 1, ...]`.
 *   3. `sum = Σ v[i] * W[i mod 3]`; check digit = `sum mod 10`.
 *
 * Worked example: MRZ field `L898902C<` → check digit `3` (canonical specimen).
 *
 * Public-domain mathematical algorithm.
 */

const FILLER = "<";
const ICAO_WEIGHTS = [7, 3, 1] as const;

/**
 * Char value for MRZ checksum: `'0'-'9'` → 0..9; `'A'-'Z'` → 10..35; `'<'` → 0.
 *
 * Returns `-1` for any character outside the MRZ alphabet (callers may treat
 * this as "invalid" without an exception).
 *
 * @param ch - A single-character string. Multi-char strings return `-1`.
 * @returns Numeric value in `[0, 35]`, or `-1` for invalid input.
 * @example
 * ```ts
 * import { mrzCharValue } from "nationid/algorithms";
 *
 * mrzCharValue("A"); // 10
 * mrzCharValue("Z"); // 35
 * mrzCharValue("<"); // 0
 * mrzCharValue("a"); // -1  (lowercase not allowed)
 * ```
 */
export function mrzCharValue(ch: string): number {
  if (ch.length !== 1) return -1;
  const code = ch.charCodeAt(0);
  // '0'..'9' → 48..57
  if (code >= 48 && code <= 57) return code - 48;
  // 'A'..'Z' → 65..90 → 10..35
  if (code >= 65 && code <= 90) return code - 55;
  if (ch === FILLER) return 0;
  return -1;
}

/**
 * Compute the MRZ check digit for a string per ICAO 9303
 * (cyclic weights `[7, 3, 1]`, mod 10).
 *
 * Used as a building block to validate the document number, DOB, expiry, and
 * the final composite check digit of an MRZ line.
 *
 * @param input - A string drawn from the MRZ alphabet (`[0-9A-Z<]*`).
 * @returns The check digit in `[0, 9]`. Empty string returns `0`.
 * @throws {Error} `ICAO_INVALID_CHAR` if `input` contains any character
 *   outside the MRZ alphabet.
 * @example
 * ```ts
 * import { mrzCheckDigit } from "nationid/algorithms";
 *
 * mrzCheckDigit("L898902C<"); // 3  (ICAO 9303 worked example)
 * ```
 */
export function mrzCheckDigit(input: string): number {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    const v = mrzCharValue(input[i] as string);
    if (v < 0) {
      throw new Error(`ICAO_INVALID_CHAR: '${input[i]}' at index ${i}`);
    }
    sum += v * (ICAO_WEIGHTS[i % 3] as number);
  }
  return sum % 10;
}

/**
 * Validate a 9-char document number + 1-char check digit (10 chars total).
 *
 * Returns `true` iff the input is exactly 10 chars, the body matches the
 * MRZ alphabet (`[0-9A-Z<]{9}`), the check digit is a single decimal,
 * and `mrzCheckDigit(input.slice(0, 9)) === Number(input[9])`.
 *
 * Never throws — invalid input simply returns `false`.
 *
 * @param input - 10-char string: 9 MRZ-alphabet chars + 1 decimal check digit.
 * @returns `true` if the input is a well-formed, checksum-correct MRZ number.
 * @example
 * ```ts
 * import { validateMrzNumber, toMrzField9, mrzCheckDigit } from "nationid/algorithms";
 *
 * const body = toMrzField9("L898902C");      // "L898902C<"
 * const full = body + String(mrzCheckDigit(body));
 * validateMrzNumber(full); // true
 * ```
 */
export function validateMrzNumber(input: string): boolean {
  if (input.length !== 10) return false;
  const body = input.slice(0, 9);
  const cd = input[9] as string;
  if (cd < "0" || cd > "9") return false;
  for (let i = 0; i < body.length; i++) {
    if (mrzCharValue(body[i] as string) < 0) return false;
  }
  return mrzCheckDigit(body) === Number(cd);
}

/**
 * Right-pad a printed passport number to the 9-char MRZ field with `<`.
 * Useful when the issued number is shorter than 9 chars.
 *
 * Lowercase letters are uppercased before validation, so callers do not need
 * to pre-normalize case.
 *
 * @param printed - The number as printed on the data page (1..9 chars).
 * @returns A 9-char string in the MRZ alphabet, right-padded with `<`.
 * @throws {Error} `ICAO_TOO_LONG` if `printed` exceeds 9 chars.
 * @throws {Error} `ICAO_INVALID_CHAR` if `printed` contains characters outside
 *   `[0-9A-Za-z]` (filler `<` is added by the function, not accepted as input).
 * @example
 * ```ts
 * import { toMrzField9 } from "nationid/algorithms";
 *
 * toMrzField9("L898902C"); // "L898902C<"
 * toMrzField9("abc123");   // "ABC123<<<"
 * ```
 */
export function toMrzField9(printed: string): string {
  const up = printed.toUpperCase();
  if (up.length > 9) throw new Error("ICAO_TOO_LONG");
  if (!/^[0-9A-Z]*$/.test(up)) throw new Error("ICAO_INVALID_CHAR");
  return up.padEnd(9, FILLER);
}
