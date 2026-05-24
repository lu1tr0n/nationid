/**
 * ISO/IEC 7064 check-digit primitives.
 *
 * Standard: ISO/IEC 7064:2003 — "Information technology — Security
 * techniques — Check character systems". Defines a family of mod-N,M
 * check-character algorithms used worldwide for identity / tax / commerce
 * codes.
 *
 * Implemented variants:
 *
 *   - **MOD 11,10** (`mod11_10CheckDigit`) — used by:
 *     - 🇩🇪 DE Steuer-Identifikationsnummer + USt-IdNr.
 *     - 🇭🇷 HR OIB (Osobni identifikacijski broj). Statute Zakon o OIB-u
 *       (NN 60/2008) cites ISO/IEC 7064 by name.
 *     - Length-generic — works over any positive number of body digits.
 *
 * Cross-validated against `python-stdnum.iso7064.mod_11_10` and
 * `validator.js`'s VAT implementations.
 */

/**
 * Compute the ISO/IEC 7064 MOD 11,10 check digit for a body of decimal
 * digits. The algorithm is length-generic — supply any positive-length
 * digit string and the function returns the single check digit in `0..9`
 * that, when appended, makes the full string self-checking under the
 * MOD 11,10 scheme.
 *
 * Sequence: starting from check `c = 10`, for each body digit `d`:
 *   `p = ((d + c) % 10) || 10`, then `c = (p * 2) % 11`.
 * Final check digit is `(11 - c) % 10`.
 *
 * @param body - Digit-only string (`/^\d+$/`); each char must be `'0'..'9'`.
 * @returns The check digit in `0..9`.
 * @throws {Error} if `body` is empty or contains a non-digit character.
 *
 * @example
 * ```ts
 * import { mod11_10CheckDigit } from "nationid/algorithms";
 *
 * // DE USt-IdNr: 8-digit body
 * mod11_10CheckDigit("13585627"); // 7  → ATU13585627
 *
 * // HR OIB: 10-digit body
 * mod11_10CheckDigit("3339200596"); // 1  → HR33392005961
 *
 * // DE Steuer-ID: 10-digit body (different from USt-IdNr length)
 * mod11_10CheckDigit("1234567890"); // varies by body
 * ```
 */
export function mod11_10CheckDigit(body: string): number {
  if (body.length === 0) {
    throw new Error("mod11_10CheckDigit: empty body");
  }
  let check = 10;
  for (let i = 0; i < body.length; i++) {
    const d = body.charCodeAt(i) - 48;
    if (d < 0 || d > 9) {
      throw new Error(`mod11_10CheckDigit: non-digit at position ${i}: ${body[i]}`);
    }
    let p = (d + check) % 10;
    if (p === 0) p = 10;
    check = (p * 2) % 11;
  }
  return (11 - check) % 10;
}

/**
 * Validate a full digit string under ISO/IEC 7064 MOD 11,10. The last
 * character is treated as the check digit; the leading `n-1` characters
 * are the body.
 *
 * @param full - Digit-only string of length ≥ 2.
 * @returns `true` if the last digit equals `mod11_10CheckDigit(body)`.
 * @example
 * ```ts
 * import { mod11_10Valid } from "nationid/algorithms";
 *
 * mod11_10Valid("33392005961"); // true (HR OIB)
 * mod11_10Valid("33392005960"); // false
 * ```
 */
export function mod11_10Valid(full: string): boolean {
  if (full.length < 2) return false;
  const body = full.slice(0, -1);
  const declared = full.charCodeAt(full.length - 1) - 48;
  if (declared < 0 || declared > 9) return false;
  try {
    return mod11_10CheckDigit(body) === declared;
  } catch {
    return false;
  }
}
