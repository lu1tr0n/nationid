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
 * Character → value table used by the SAT RFC homoclave algorithm.
 *
 * Index layout (39 positions, 0..38) per SAT Anexo 19 RMF "Tabla de
 * equivalencia para la verificación del homoclave del RFC":
 *
 *   `0`..`9`    → 0..9
 *   `A`..`N`    → 10..23
 *   `&`         → 24
 *   `O`..`Z`    → 25..36
 *   ` ` (space) → 37    — RFC pad for personas morales (3-letter prefix is
 *                          prepended with a single space to align to 13 chars).
 *   `Ñ`         → 38    — rare; SAT replaces `Ñ` with `X` in modern RFCs.
 *
 * The previous v0.1 implementation had a +1 offset on every value (e.g.
 * `'0'→1` instead of `'0'→0` and put space at 0), causing every RFC
 * homoclave check to be off by 90 in the weighted sum (90 mod 11 = 2).
 * This was caught by cross-validation against `python-stdnum 2.2`
 * `stdnum.mx.rfc` whose published doctest values (`GODE561231GR8`,
 * `MAB9307148T4`) verify only under the SAT-canonical table. See
 * `docs/CROSS_VALIDATION.md` § B2.
 *
 * Source: SAT Anexo 19 RMF (Tabla 1) and the public reference
 * implementation in `python-stdnum.stdnum.mx.rfc._alphabet`.
 */
const RFC_TABLE: Readonly<Record<string, number>> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  A: 10,
  B: 11,
  C: 12,
  D: 13,
  E: 14,
  F: 15,
  G: 16,
  H: 17,
  I: 18,
  J: 19,
  K: 20,
  L: 21,
  M: 22,
  N: 23,
  "&": 24,
  O: 25,
  P: 26,
  Q: 27,
  R: 28,
  S: 29,
  T: 30,
  U: 31,
  V: 32,
  W: 33,
  X: 34,
  Y: 35,
  Z: 36,
  " ": 37,
  Ñ: 38,
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
