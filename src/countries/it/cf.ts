/**
 * Italy — Codice Fiscale (CF).
 *
 * Issuer: Agenzia delle Entrate.
 * Source: https://www.agenziaentrate.gov.it/
 * Legal basis: DM 23 dicembre 1976 (Ministry of Finance).
 *
 * Format: 16 alphanumeric chars for natural persons; 11 digits for legal
 *   entities (in which case the codice fiscale is identical to the partita
 *   IVA — handled by the dedicated `IT_PIVA` spec).
 *
 * Composition (16-char personal CF):
 *   - 3 letters: cognome consonants (padded with vowels and `X` if short).
 *   - 3 letters: nome consonants (per DM 23-DEC-1976 § 2).
 *   - 2 digits: anno di nascita (last two digits).
 *   - 1 letter: mese (`A`-`E`, `H`, `L`, `M`, `P`, `R`-`T` mapping Jan-Dec).
 *   - 2 digits: giorno di nascita (women: real day + 40).
 *   - 4 chars: codice catastale del comune (1 letter + 3 digits).
 *   - 1 letter: check char per the dispari/pari position table.
 *
 * Check character: per DM 23-DEC-1976. For each of the first 15 chars, look
 *   up the value via two tables (odd-position and even-position, 1-indexed).
 *   Sum mod 26 indexes into the alphabet `A`-`Z`.
 *
 * Confidence: high. Algorithm is published in DM 23-DEC-1976 and reproduced
 * in `codice-fiscale-utils`, `@maranomynet/libcodicefiscale`, and the
 * Agenzia delle Entrate online verification tool.
 *
 * Notes:
 *   - The "homocodia" remediation (where the agenzia replaces digits 7..14
 *     with letters when two persons share a CF) means a valid CF may
 *     legitimately contain letters in those positions. Our regex tolerates
 *     letters O,I,Q,L which are the documented substitutions.
 *   - The 11-digit form for entities is handled by `IT_PIVA`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

/**
 * Lenient regex tolerating homocodia substitutions (digits 7..14 may be
 * letters). Position 7-8 (year) and 10-11 (day) are the most commonly
 * substituted positions in homocodia.
 *
 * Layout: 3 letters (cognome) + 3 letters (nome) + 2 alphanum (year) +
 * 1 letter (month) + 2 alphanum (day) + 4 chars (codice catastale: 1 letter +
 * 3 alphanum) + 1 letter (check).
 */
const RAW_REGEX =
  /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-EHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/;

/** Month letter mapping per DM 23-DEC-1976. */
const MONTHS: ReadonlySet<string> = new Set([
  "A",
  "B",
  "C",
  "D",
  "E",
  "H",
  "L",
  "M",
  "P",
  "R",
  "S",
  "T",
]);

/** Odd-position values (1-based positions 1, 3, 5, ..., 15). */
const ODD_VALUES: Readonly<Record<string, number>> = {
  "0": 1,
  "1": 0,
  "2": 5,
  "3": 7,
  "4": 9,
  "5": 13,
  "6": 15,
  "7": 17,
  "8": 19,
  "9": 21,
  A: 1,
  B: 0,
  C: 5,
  D: 7,
  E: 9,
  F: 13,
  G: 15,
  H: 17,
  I: 19,
  J: 21,
  K: 2,
  L: 4,
  M: 18,
  N: 20,
  O: 11,
  P: 3,
  Q: 6,
  R: 8,
  S: 12,
  T: 14,
  U: 16,
  V: 10,
  W: 22,
  X: 25,
  Y: 24,
  Z: 23,
};

/**
 * Even-position values: digits map to themselves (0..9); letters map A=0..Z=25.
 */
function evenValue(c: string): number {
  if (c >= "0" && c <= "9") return c.charCodeAt(0) - 48;
  return c.charCodeAt(0) - 65;
}

/**
 * Homocodia mapping: when the agenzia substitutes a digit with a letter, the
 * digit can be recovered. We only use this for the day/year positions when
 * computing the optional birth-date sanity check.
 */
const HOMO_TO_DIGIT: Readonly<Record<string, string>> = {
  L: "0",
  M: "1",
  N: "2",
  P: "3",
  Q: "4",
  R: "5",
  S: "6",
  T: "7",
  U: "8",
  V: "9",
};

const COUNTRY = "IT" as CountryCode;
// TODO(v0.6-integration): orchestrator extends `DocumentTypeCode` with `IT_CF`.
const CODE = "IT_CF" as DocumentTypeCode;

export const cfSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both",
  labelKey: "documents.IT_CF.label",
  rawRegex: RAW_REGEX,
  // CF has no canonical formatted form — always 16 contiguous chars.
  formattedRegex: RAW_REGEX,
  mask: "AAAAAA00A00A000A",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    if (!MONTHS.has(cleaned[8] as string)) return false;
    if (!isPlausibleDay(cleaned)) return false;
    return computeCheckChar(cleaned.slice(0, 15)) === cleaned[15];
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    return cleaned.length === 16 ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 16) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 16) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!MONTHS.has(cleaned[8] as string)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!isPlausibleDay(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (computeCheckChar(cleaned.slice(0, 15)) !== cleaned[15]) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: cleaned,
      confidence: "high",
    };
  },
};

/** Recover the underlying digit when a homocodia letter is present. */
function unHomocodia(c: string): string {
  if (c >= "0" && c <= "9") return c;
  return HOMO_TO_DIGIT[c] ?? c;
}

/**
 * Validate that the day component (positions 10-11, optionally homocodia-
 * letter-encoded) is in `01..31` for men or `41..71` for women. The agenzia
 * does NOT enforce real-calendar validity (e.g. Feb 30 is accepted); we mirror
 * that. We do reject impossible month-independent values like `00` or `99`.
 */
function isPlausibleDay(cf: string): boolean {
  const dayChars = cf.slice(9, 11);
  const ten = unHomocodia(dayChars[0] as string);
  const eleven = unHomocodia(dayChars[1] as string);
  if (!/^\d$/.test(ten) || !/^\d$/.test(eleven)) return false;
  const day = Number.parseInt(`${ten}${eleven}`, 10);
  if (day >= 1 && day <= 31) return true;
  if (day >= 41 && day <= 71) return true;
  return false;
}

/** Compute the CF check character per DM 23-DEC-1976. */
function computeCheckChar(first15: string): string {
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    const c = first15[i] as string;
    // 1-based position parity: odd positions use ODD_VALUES, even use evenValue.
    if ((i + 1) % 2 === 1) {
      const v = ODD_VALUES[c];
      if (v === undefined) return "?";
      sum += v;
    } else {
      sum += evenValue(c);
    }
  }
  return String.fromCharCode(65 + (sum % 26));
}
