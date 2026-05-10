/**
 * Shared CUIT/CUIL primitives.
 *
 * CUIT and CUIL share the same mod-11 verifier algorithm; they differ only in
 * which prefixes they accept. This module centralizes the algorithm and the
 * prefix sets so both specs stay in sync.
 *
 * Source: AFIP (now ARCA) RG 10/1997.
 */

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/**
 * Compute the CUIT/CUIL verifier digit for the first 10 digits.
 *
 * Returns:
 *   - the verifier digit (0-9) on success.
 *   - `null` if the body produces dv == 10, which is invalid: AFIP changes
 *     the prefix (RG AFIP 10/97 § 4) and reissues the number.
 */
export function computeCuitDV(body10: string): number | null {
  if (body10.length !== 10) return null;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const d = body10.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return null;
    const w = WEIGHTS[i];
    if (w === undefined) return null;
    sum += d * w;
  }
  const r = sum % 11;
  const dv = 11 - r;
  if (dv === 11) return 0;
  if (dv === 10) return null;
  return dv;
}

/** CUIT prefixes: personas físicas (20/23/24/25/26/27) + jurídicas (30/33/34). */
export const CUIT_PREFIXES: ReadonlySet<string> = new Set([
  "20",
  "23",
  "24",
  "25",
  "26",
  "27",
  "30",
  "33",
  "34",
]);

/** CUIL prefixes: personas físicas working under labor regime. */
export const CUIL_PREFIXES: ReadonlySet<string> = new Set(["20", "23", "24", "27"]);

/**
 * CDI prefixes: Clave de Identificación assigned by ARCA (ex-AFIP) to personas
 * who do not hold CUIT/CUIL but must appear in tax operations (extranjeros sin
 * obligación, sucesiones indivisas, menores).
 *
 * Per RG AFIP 3995/2017, ARCA assigns CDI under prefix `50`. Algorithm and
 * verifier are identical to CUIT/CUIL.
 */
export const CDI_PREFIXES: ReadonlySet<string> = new Set(["50"]);
