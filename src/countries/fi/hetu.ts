/**
 * Finland — Henkilötunnus (HETU, personal identity code).
 *
 * Issuer: DVV (Digital and Population Data Services Agency).
 * Source: https://dvv.fi/en/personal-identity-code
 *
 * Format: 11 chars: `DDMMYY` + century separator + 3 individual digits + 1
 * check character.
 *
 * Century separator:
 *   - `+`   1800s
 *   - `-`   1900s (legacy alphabet `Y/X/W/V/U` from 2023 also encode 1900s)
 *   - `A`   2000s (legacy alphabet `B/C/D/E/F` from 2023 also encode 2000s)
 *
 * The 2023 reform (DVV) added five extra characters per century to extend
 * the number space; this library accepts the full set
 * `[+-ABCDEFYXWVU]`.
 *
 * Individual number 3rd digit encodes sex (odd = male, even = female).
 *
 * Check digit: `(int(DDMMYY || NNN) mod 31)` mapped against the alphabet
 * `"0123456789ABCDEFHJKLMNPRSTUVWXY"` (skipping G, I, O, Q, Z).
 *
 * Confidence: high — DVV publishes the algorithm; cross-validated against
 * `finnish-personal-identity-code` (npm) and `python-stdnum stdnum.fi.hetu`.
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const CHARSET = "0123456789ABCDEFHJKLMNPRSTUVWXY";
const RAW_REGEX = /^\d{6}[-+ABCDEFYXWVU]\d{3}[\dA-FHJ-NPR-Y]$/;
const FORMATTED_REGEX = RAW_REGEX;

const COUNTRY = "FI";
const CODE = "FI_HETU";

export const hetuSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "both",
  labelKey: "documents.FI_HETU.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "000000A000A",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    // HETU keeps the century separator and uppercase letters. We strip
    // whitespace and uppercase but preserve `+` / `-`.
    return normalizeHetu(input);
  },

  validate(input: string): boolean {
    const normalized = normalizeHetu(input);
    if (!RAW_REGEX.test(normalized)) return false;
    if (!hasValidHetuDate(normalized)) return false;
    return checkHetuChar(normalized);
  },

  format(input: string): string {
    const normalized = normalizeHetu(input);
    if (!RAW_REGEX.test(normalized)) return input;
    return normalized;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const normalized = normalizeHetu(trimmed);
    if (normalized.length < 11) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (normalized.length > 11) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(normalized)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!hasValidHetuDate(normalized)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkHetuChar(normalized)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    return {
      ok: true,
      code: CODE,
      normalized,
      formatted: normalized,
      confidence: "high",
    };
  },
};

function normalizeHetu(input: string): string {
  // Preserve `+` and `-` (century separators) and uppercase letters.
  // Strip whitespace and other punctuation only.
  return input.replace(/[^0-9A-Za-z+-]/g, "").toUpperCase();
}

function hasValidHetuDate(s: string): boolean {
  const dd = parseInt(s.slice(0, 2), 10);
  const mm = parseInt(s.slice(2, 4), 10);
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  return true;
}

function checkHetuChar(s: string): boolean {
  // First 6 + last 3 individual digits before the check char.
  const ddmmyy = s.slice(0, 6);
  const ind = s.slice(7, 10);
  const num = Number(ddmmyy + ind);
  const idx = num % 31;
  const expected = CHARSET[idx];
  return expected === s.charAt(10);
}
