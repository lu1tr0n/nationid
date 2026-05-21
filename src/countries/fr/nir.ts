/**
 * France — NIR (Numéro d'Inscription au Répertoire) / Sécurité Sociale.
 *
 * Issuer: INSEE.
 * Source: https://www.insee.fr/fr/information/1400939
 * Legal basis: Décret n°82-103 du 22 janvier 1982 (RNIPP).
 *
 * Format: 13 digits (number) + 2-digit clé (key) = 15 chars.
 *   Visually displayed with five spaces:
 *     `1 85 02 75 116 003 87` (sex + year + month + dept + commune + ordre + clé)
 *
 * Composition:
 *   - 1: sexe (`1` male, `2` female; `7`/`8` reserved for special-case temp).
 *   - 2: année de naissance (last two digits).
 *   - 2: mois de naissance (`01`-`12`; `20`, `30`, `40`, `50`, `99` are
 *     INSEE-reserved month-unknown placeholders).
 *   - 2: département de naissance (`2A` / `2B` for Corsica, `97x`/`98x` for DOM-TOM).
 *   - 3: code commune (or pays, for born-abroad).
 *   - 3: numéro d'ordre dans la commune.
 *   - 2: clé de contrôle (DV).
 *
 * Check digit: `clé = 97 - (number mod 97)` where `number` = first 13 digits
 *   parsed as a base-10 integer. For Corsica numbers, before computing the
 *   modulus replace `2A → 19` and `2B → 18` (this normalizes the alpha
 *   department code to numeric).
 *
 * Confidence: high. Algorithm published by INSEE and reproduced verbatim by
 * `validator.js isIdentityCard('fr-FR')` and `python-stdnum.fr.nir`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";
/**
 * Normalized form: 15 chars, uppercase, digits except positions 6-7 which may
 * be `2A` or `2B` (Corsica). All-digit form is enforced for everywhere else.
 */
/**
 * Month accepts `01`-`12` plus the INSEE-reserved placeholders `20`, `30`,
 * `40`, `50`, and `99` used when the real birth month is unknown at the time
 * the NIR is assigned (typically for late registrations).
 */
const RAW_REGEX = /^[12378]\d{2}(0[1-9]|1[0-2]|20|30|40|50|99)(\d{2}|2[AB])\d{6}\d{2}$/;
const FORMATTED_REGEX =
  /^[12378] \d{2} (?:0[1-9]|1[0-2]|20|30|40|50|99) (?:\d{2}|2[AB]) \d{3} \d{3} \d{2}$/;

const COUNTRY = "FR";
const CODE = "FR_NIR";

export const nirSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both",
  labelKey: "documents.FR_NIR.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "0 00 00 00 000 000 00",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkNir(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return formatNir(cleaned);
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 15) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 15) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkNir(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: formatNir(cleaned),
      confidence: "high",
    };
  },
};

/**
 * Compute the NIR clé.
 *
 * The 13-digit body uses base-10 integer parsing, except Corsica where the
 * department code is `2A` or `2B`; INSEE specifies replacing these by `19` /
 * `18` respectively before the mod-97 calculation.
 */
function checkNir(cleaned: string): boolean {
  const body = cleaned.slice(0, 13);
  const dv = Number.parseInt(cleaned.slice(13, 15), 10);
  if (Number.isNaN(dv)) return false;
  // Corsica substitution: positions 6-7 can be `2A` or `2B`.
  let numeric = body;
  const dept = body.slice(5, 7);
  if (dept === "2A") numeric = `${body.slice(0, 5)}19${body.slice(7)}`;
  else if (dept === "2B") numeric = `${body.slice(0, 5)}18${body.slice(7)}`;
  // Streaming mod-97 to avoid BigInt and keep the algo allocation-free.
  let rem = 0;
  for (let i = 0; i < numeric.length; i++) {
    rem = (rem * 10 + (numeric.charCodeAt(i) - 48)) % 97;
  }
  const expected = 97 - rem;
  return expected === dv;
}

function formatNir(cleaned: string): string {
  return [
    cleaned.slice(0, 1),
    cleaned.slice(1, 3),
    cleaned.slice(3, 5),
    cleaned.slice(5, 7),
    cleaned.slice(7, 10),
    cleaned.slice(10, 13),
    cleaned.slice(13, 15),
  ].join(" ");
}
