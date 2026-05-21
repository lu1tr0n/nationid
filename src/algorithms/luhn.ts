/**
 * Luhn algorithm — ISO/IEC 7812-1.
 *
 * Used by: credit cards, CA SIN, FR SIREN/SIRET, IT P.IVA, IL TZ/HP, ZA ID,
 * and several IDs that document the algorithm as "Luhn variant".
 *
 * Algorithm:
 *   1. From the rightmost digit, double every second digit.
 *   2. If doubling produces a 2-digit number, sum its digits (or subtract 9).
 *   3. Sum all digits.
 *   4. Number is valid iff sum is divisible by 10.
 *
 * Public-domain mathematical algorithm.
 *
 * @param digits - Digit-only string including the trailing check digit.
 *   Non-digit input is rejected (returns `false`) — separators must be
 *   stripped by the caller.
 * @returns `true` when the digits satisfy the Luhn property (sum mod 10 = 0).
 * @example
 * ```ts
 * import { luhnValid } from "nationid/algorithms";
 *
 * luhnValid("79927398713"); // true  (canonical Luhn specimen)
 * luhnValid("79927398710"); // false
 * luhnValid("12-34");       // false (non-digit characters)
 * ```
 */
export function luhnValid(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let parity = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    const d = digits.charCodeAt(i) - 48; // ASCII '0' = 48
    if (parity === 1) {
      const doubled = d * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += d;
    }
    parity ^= 1;
  }
  return sum % 10 === 0;
}

/**
 * Compute the Luhn check digit for a body of digits (without the check digit).
 *
 * Returns the check digit (0-9) that, when appended, makes the full number
 * Luhn-valid. Useful for generating synthetic test data or for the trailing
 * digit on emitted document numbers.
 *
 * @param body - Digit-only string WITHOUT the check digit position.
 * @returns Integer in `[0, 9]` — the digit to append to make `body` Luhn-valid.
 * @throws {Error} if `body` contains non-digit characters.
 * @example
 * ```ts
 * import { luhnCheckDigit, luhnValid } from "nationid/algorithms";
 *
 * const body = "7992739871";
 * const cd = luhnCheckDigit(body); // 3
 * luhnValid(body + String(cd));    // true
 * ```
 */
export function luhnCheckDigit(body: string): number {
  if (!/^\d+$/.test(body)) {
    throw new Error("luhnCheckDigit: body must be digits only");
  }
  let sum = 0;
  let parity = 0;
  for (let i = body.length - 1; i >= 0; i--) {
    const d = body.charCodeAt(i) - 48;
    // First doubled position is the rightmost — but the body has no check digit,
    // so the first iteration here corresponds to the position that WILL be doubled
    // in the final number's evaluation. Equivalent to parity 1 starting at body's end.
    if (parity === 0) {
      const doubled = d * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += d;
    }
    parity ^= 1;
  }
  return (10 - (sum % 10)) % 10;
}
