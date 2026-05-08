/**
 * Shared primitives for México specs.
 *
 * Centralizes the SAT/RENAPO character-to-value tables used by:
 *   - CURP (mod-10 over 17 chars, RENAPO Acuerdo DOF 18-OCT-2014).
 *   - RFC PF / RFC PM (mod-11 over the first 12 chars, SAT Anexo 1-A).
 *
 * Both use the same 38-entry alphabet but with different positional weights.
 *
 * Sources:
 *   - RENAPO: https://www.gob.mx/curp — Acuerdo SEGOB DOF 18-OCT-2014.
 *   - SAT: https://www.sat.gob.mx/ — Anexo 1-A RMF; Código Fiscal de la
 *     Federación Art. 27.
 */

/**
 * Character → value table used by both CURP and RFC algorithms.
 *
 * Index layout (38 positions, 0..37):
 *   ` ` (space) → 0    — RFC pad for personas morales (3-letter prefix is
 *                        prepended with a single space to align to 13 chars).
 *   `0`..`9`    → 1..10
 *   `A`..`N`    → 11..24
 *   `&`         → 25
 *   `O`..`Z`    → 26..37
 *
 * `Ñ` is **not** in this table because RFCs forbid it (SAT replaces with `X`).
 * CURPs that contain `Ñ` are pre-mapped to `X` before evaluating.
 */
const RFC_TABLE: Readonly<Record<string, number>> = {
  " ": 0,
  "0": 1,
  "1": 2,
  "2": 3,
  "3": 4,
  "4": 5,
  "5": 6,
  "6": 7,
  "7": 8,
  "8": 9,
  "9": 10,
  A: 11,
  B: 12,
  C: 13,
  D: 14,
  E: 15,
  F: 16,
  G: 17,
  H: 18,
  I: 19,
  J: 20,
  K: 21,
  L: 22,
  M: 23,
  N: 24,
  "&": 25,
  O: 26,
  P: 27,
  Q: 28,
  R: 29,
  S: 30,
  T: 31,
  U: 32,
  V: 33,
  W: 34,
  X: 35,
  Y: 36,
  Z: 37,
};

/**
 * CURP alphabet — `0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ` indexed 0..36.
 *
 * Per RENAPO Acuerdo DOF 18-OCT-2014: each character of the 17-char body is
 * mapped through this alphabet, then summed with descending weights 18..2.
 *
 * `Ñ` is at index 24; in practice CURPs almost never contain `Ñ` because the
 * standard normalizes it to `X`. We accept both for correctness.
 */
const CURP_ALPHABET = "0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";

/** Map a CURP body character (0-9, A-Z, Ñ) to its 0..36 index, or -1 if invalid. */
export function curpCharValue(ch: string): number {
  return CURP_ALPHABET.indexOf(ch);
}

/**
 * Compute the CURP check digit for a 17-char body.
 *
 * Returns the expected DV (0-9) or -1 if any character is outside the alphabet.
 *
 * Formula (RENAPO DOF 18-OCT-2014):
 *   sum = sum(value(body[i]) * (18 - i)) for i in 0..16
 *   dv  = (10 - (sum mod 10)) mod 10
 */
export function computeCurpDV(body17: string): number {
  if (body17.length !== 17) return -1;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = body17.charAt(i);
    const v = curpCharValue(ch);
    if (v < 0) return -1;
    sum += v * (18 - i);
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Compute the RFC homoclave DV for the first 12 characters of an RFC.
 *
 * For RFC PF (13 chars total) the body is `rfc[0..12]` directly.
 * For RFC PM (12 chars total) the body is a leading space + `rfc[0..11]`.
 * Both produce a 12-char body that is hashed below.
 *
 * Returns the DV character (`0..9` or `A`) or `null` if the body contains a
 * character outside the SAT table.
 *
 * Formula (SAT Anexo 1-A):
 *   sum = sum(value(body[i]) * (13 - i)) for i in 0..11
 *   r   = sum mod 11
 *   dv  = 11 - r
 *     - if dv == 11 → '0'
 *     - if dv == 10 → 'A'
 *     - else        → String(dv)
 */
export function computeRfcDV(body12: string): string | null {
  if (body12.length !== 12) return null;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const ch = body12.charAt(i);
    const v = RFC_TABLE[ch];
    if (v === undefined) return null;
    sum += v * (13 - i);
  }
  const r = sum % 11;
  const dv = 11 - r;
  if (dv === 11) return "0";
  if (dv === 10) return "A";
  return String(dv);
}

/**
 * Reserved 4-letter combinations forbidden by SAT for the first 4 chars of
 * RFC PF (palabras altisonantes — Anexo 1-A § 2).
 *
 * If the RFC starts with one of these strings, SAT mandates substituting the
 * 4th letter with `X` before computing the homoclave. Validators reject the
 * unmasked form.
 *
 * This is the public list shipped by SAT in Anexo 1-A.
 */
export const RFC_FORBIDDEN_PREFIXES: ReadonlySet<string> = new Set([
  "BACA",
  "BAKA",
  "BUEI",
  "BUEY",
  "CACA",
  "CACO",
  "CAGA",
  "CAGO",
  "CAKA",
  "CAKO",
  "COGE",
  "COGI",
  "COJA",
  "COJE",
  "COJI",
  "COJO",
  "COLA",
  "CULO",
  "FALO",
  "FETO",
  "GETA",
  "GUEI",
  "GUEY",
  "JETA",
  "JOTO",
  "KACA",
  "KACO",
  "KAGA",
  "KAGO",
  "KAKA",
  "KAKO",
  "KOGE",
  "KOGI",
  "KOJA",
  "KOJE",
  "KOJI",
  "KOJO",
  "KOLA",
  "KULO",
  "LILO",
  "LOCA",
  "LOCO",
  "LOKA",
  "LOKO",
  "MAME",
  "MAMO",
  "MEAR",
  "MEAS",
  "MEON",
  "MIAR",
  "MION",
  "MOCO",
  "MOKO",
  "MULA",
  "MULO",
  "NACA",
  "NACO",
  "PEDA",
  "PEDO",
  "PENE",
  "PIPI",
  "PITO",
  "POPO",
  "PUTA",
  "PUTO",
  "QULO",
  "RATA",
  "ROBA",
  "ROBE",
  "ROBO",
  "RUIN",
  "SENO",
  "TETA",
  "VACA",
  "VAGA",
  "VAGO",
  "VAKA",
  "VUEI",
  "VUEY",
  "WUEI",
  "WUEY",
]);
