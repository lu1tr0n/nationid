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
 * Returns -1 for any character outside the MRZ alphabet (callers may treat
 * this as "invalid" without an exception).
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
 * Throws on invalid characters. Empty string returns 0 (vacuous sum).
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
 * Throws on inputs longer than 9 chars or containing non-MRZ characters
 * (after uppercasing). Lowercase letters are uppercased before validation.
 */
export function toMrzField9(printed: string): string {
  const up = printed.toUpperCase();
  if (up.length > 9) throw new Error("ICAO_TOO_LONG");
  if (!/^[0-9A-Z]*$/.test(up)) throw new Error("ICAO_INVALID_CHAR");
  return up.padEnd(9, FILLER);
}
