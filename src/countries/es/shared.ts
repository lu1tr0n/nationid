/**
 * Shared primitives for Spanish identifiers.
 *
 * The DNI letter algorithm is also reused by NIE (after prefix-letter
 * substitution) and underpins the AEAT NIF check for naturales.
 *
 * The CIF (NIF Persona Jurídica) verifier is a Luhn-like mod-10 over
 * the 7 body digits, with the final character rendered as either a digit
 * or a letter depending on the entity-type prefix.
 *
 * Sources:
 *   - Real Decreto 1553/2005 (DNI).
 *   - Orden INT/2058/2008 (NIE).
 *   - Real Decreto 1065/2007; Orden EHA/451/2008; AEAT NIF spec (CIF).
 */

/** Letter table for DNI/NIE. Indexed by `digits mod 23`. */
export const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE" as const;

/** NIE prefix substitution: `X→0, Y→1, Z→2`. */
export const NIE_PREFIX_MAP: Readonly<Record<string, string>> = {
  X: "0",
  Y: "1",
  Z: "2",
};

/** CIF letter-DV table; indexed by `r` from `(10 - (sum mod 10)) mod 10`. */
export const CIF_DV_LETTERS = "JABCDEFGHI" as const;

/** Compute the DNI verifier letter for a body of 8 digits. */
export function dniLetterFor(digits8: string): string | null {
  if (!/^\d{8}$/.test(digits8)) return null;
  const n = Number.parseInt(digits8, 10);
  const idx = n % 23;
  const ch = DNI_LETTERS[idx];
  return ch ?? null;
}

/**
 * Compute the CIF mod-10 remainder `r` for the 7 body digits.
 *
 * Algorithm (AEAT):
 *   - Odd-indexed digits (1st, 3rd, 5th, 7th — i.e. positions 0,2,4,6 zero-based)
 *     are doubled; if the product is > 9, sum its two digits.
 *   - Even-indexed digits (positions 1,3,5) are added as-is.
 *   - r = (10 - (sum mod 10)) mod 10.
 */
export function cifRemainder(body7: string): number | null {
  if (!/^\d{7}$/.test(body7)) return null;
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = body7.charCodeAt(i) - 48;
    if (i % 2 === 0) {
      const doubled = d * 2;
      sum += doubled > 9 ? doubled - 9 : doubled;
    } else {
      sum += d;
    }
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * CIF prefixes that REQUIRE a letter DV.
 *
 * Per AEAT: `N` (extranjera), `P` (corporación local), `Q` (organismo público),
 * `R` (entidad religiosa), `S` (órgano de la administración), `W`
 * (establecimiento permanente de entidad no residente).
 */
export const CIF_PREFIX_LETTER_DV: ReadonlySet<string> = new Set(["N", "P", "Q", "R", "S", "W"]);

/**
 * CIF prefixes that REQUIRE a digit DV.
 *
 * Per AEAT: `A` (SA), `B` (SL), `E` (comunidad de bienes), `H` (comunidad de
 * propietarios).
 */
export const CIF_PREFIX_DIGIT_DV: ReadonlySet<string> = new Set(["A", "B", "E", "H"]);

/**
 * CIF prefixes where EITHER digit or letter DV is accepted.
 *
 * Per AEAT regex `[ABCDEFGHJNPQRSUVW]`: the residual prefixes after the two
 * sets above are `C, D, F, G, J, U, V`.
 */
export const CIF_PREFIX_EITHER_DV: ReadonlySet<string> = new Set([
  "C",
  "D",
  "F",
  "G",
  "J",
  "U",
  "V",
]);

/** All allowed CIF entity-type prefixes. */
export const CIF_ALL_PREFIXES: ReadonlySet<string> = new Set([
  ...CIF_PREFIX_DIGIT_DV,
  ...CIF_PREFIX_LETTER_DV,
  ...CIF_PREFIX_EITHER_DV,
]);
