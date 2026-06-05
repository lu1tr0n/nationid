/**
 * Singapore — UEN (Unique Entity Number) (`SG_UEN`).
 *
 * Issuer: ACRA (registrar of companies/businesses) plus other agencies (MAS,
 *         MCCY, etc.) for "Other Entity" UENs, coordinated by the UEN Steering
 *         Committee (ACRA + IRAS + MOM).
 * Source: https://sso.agc.gov.sg/Act/UENA2008 (Unique Entity Number Act 2008,
 *         Act 21 of 2008; UEN Regulations 2008)
 *         https://www.acra.gov.sg/
 *         https://www.acra.gov.sg/register/business/choosing-business-structure/
 *         https://www.iras.gov.sg/
 *         https://www.bizfile.gov.sg/
 *         https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/singapore-tin.pdf
 *         (OECD CRS Singapore-TIN PDF; all verified live 2026-05-24).
 * Statute: Unique Entity Number Act 2008 (referenced at the SSO URL above).
 *
 * Format: three categories sharing one umbrella spec, dispatched by shape:
 *   - Category A — Business (ROB): `\d{8}[A-Z]` (8 digits + check letter).
 *   - Category B — Local Company (ROC): `\d{9}[A-Z]` (4-digit year +
 *     5-digit sequence + check letter).
 *   - Category C — Other Entity: `[RST]\d{2}[A-Z]{2}\d{4}[A-Z]` (era letter +
 *     2-digit year + 2-letter entity-type code + 4-digit sequence + check
 *     letter).
 *
 * Check letters: each category has its own weighted mod-11 (Cat A/B) or
 * mod-11-with-offset over a 32-char alphabet (Cat C) scheme. All constants are
 * extracted verbatim from `python-stdnum/stdnum/sg/uen.py` (LGPL 2.1+,
 * SHA1 d8f4c7468a08832da4e481627dc7060174e798aa, fetched 2026-05-24), the
 * de-facto open-source oracle. The four python-stdnum doctest fixtures
 * (`00192200M`, `197401143C`, `S16FC0121D`, `T01FC6132D`) hand-verify, and the
 * real-world Cat B UENs `196800306E` (DBS Bank) and `199201624D` (Singtel)
 * validate under the Cat B algorithm.
 *
 * Confidence: high. python-stdnum is mature/maintained with explicit algorithms
 * for all three categories plus the 38-code entity-type whitelist.
 *
 * Open questions:
 *   - ACRA does not officially publish the check-digit algorithms. The
 *     python-stdnum implementation appears to be derived empirically and is the
 *     strongest available oracle; the 4 doctest fixtures and 2 real-world Cat B
 *     UENs are the corroborating evidence.
 *   - The entity-type code whitelist is snapshotted from python-stdnum master at
 *     the v2.2 release date and should be re-verified annually.
 *   - Cat B's year check mirrors python-stdnum exactly: `year <= currentYear`.
 *     It deliberately does NOT reject years < 1900 (no `>= 1900` lower bound),
 *     for parity with the oracle.
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { normalizeSgId } from "./_shared.ts";

const CAT_A_REGEX = /^\d{8}[A-Z]$/; // Business (ROB)
const CAT_B_REGEX = /^\d{9}[A-Z]$/; // Local Company (ROC)
const CAT_C_REGEX = /^[RST]\d{2}[A-Z]{2}\d{4}[A-Z]$/; // Other Entity

/** Union of the three category shapes (used for the spec's `rawRegex`). */
const UEN_RAW_REGEX = /^(?:\d{8}[A-Z]|\d{9}[A-Z]|[RST]\d{2}[A-Z]{2}\d{4}[A-Z])$/;

const CODE = "SG_UEN";

// --- Category A (Business) ---------------------------------------------------
const CAT_A_WEIGHTS = [10, 4, 9, 3, 8, 2, 7, 1] as const;
const CAT_A_TABLE = "XMKECAWLJDB";

// --- Category B (Local Company) ----------------------------------------------
const CAT_B_WEIGHTS = [10, 8, 6, 4, 9, 7, 5, 3, 1] as const;
const CAT_B_TABLE = "ZKCMDNERGWH";

// --- Category C (Other Entity) -----------------------------------------------
/** 32-char alphabet, omits `I` and `O` for visual disambiguation. */
const CAT_C_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWX0123456789";
const CAT_C_WEIGHTS = [4, 3, 5, 3, 10, 2, 2, 5, 7] as const;
/** Constant subtracted before taking mod 11. */
const CAT_C_OFFSET = 5;

/**
 * Entity-type code whitelist for Category C — 38 codes, verbatim from
 * `OTHER_UEN_ENTITY_TYPES` in python-stdnum/stdnum/sg/uen.py master
 * (snapshot 2026-05-24). Re-verify annually.
 */
const ENTITY_TYPES: ReadonlySet<string> = new Set([
  "CC",
  "CD",
  "CH",
  "CL",
  "CM",
  "CP",
  "CS",
  "CX",
  "DP",
  "FB",
  "FC",
  "FM",
  "FN",
  "GA",
  "GB",
  "GS",
  "HS",
  "LL",
  "LP",
  "MB",
  "MC",
  "MD",
  "MH",
  "MM",
  "MQ",
  "NB",
  "NR",
  "PA",
  "PB",
  "PF",
  "RF",
  "RP",
  "SM",
  "SS",
  "TC",
  "TU",
  "VH",
  "XL",
]);

/** Clock function injected for testability. Defaults to `() => new Date()`. */
export type Clock = () => Date;

const defaultClock: Clock = () => new Date();

function currentYear(now: Clock): number {
  return now().getUTCFullYear();
}

function catABusinessValid(value: string): boolean {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += (value.charCodeAt(i) - 48) * (CAT_A_WEIGHTS[i] as number);
  }
  const r = sum % 11;
  return CAT_A_TABLE.charAt(r) === value.charAt(8);
}

function catBLocalCompanyValid(value: string, now: Clock): boolean {
  // python-stdnum parity: reject only when the leading 4-digit year exceeds the
  // current year. No lower bound (years < 1900 are accepted).
  const year = parseInt(value.slice(0, 4), 10);
  if (year > currentYear(now)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += (value.charCodeAt(i) - 48) * (CAT_B_WEIGHTS[i] as number);
  }
  const r = sum % 11;
  return CAT_B_TABLE.charAt(r) === value.charAt(9);
}

function catCOtherEntityValid(value: string): boolean {
  const entityType = value.slice(3, 5);
  if (!ENTITY_TYPES.has(entityType)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const idx = CAT_C_ALPHABET.indexOf(value.charAt(i));
    if (idx < 0) return false;
    sum += idx * (CAT_C_WEIGHTS[i] as number);
  }
  const r = (((sum - CAT_C_OFFSET) % 11) + 11) % 11;
  return CAT_C_ALPHABET.charAt(r) === value.charAt(9);
}

function checksumValid(value: string, now: Clock): boolean {
  if (CAT_A_REGEX.test(value)) return catABusinessValid(value);
  if (CAT_B_REGEX.test(value)) return catBLocalCompanyValid(value, now);
  if (CAT_C_REGEX.test(value)) return catCOtherEntityValid(value);
  return false;
}

/**
 * Internal validator with an injectable clock — exported for the cross-validation
 * suite to pin Category B's `year <= currentYear` behaviour at a fixed date.
 * The public `uenSpec.validate` uses the system clock.
 */
export function validateUen(input: string, now: Clock = defaultClock): boolean {
  const cleaned = normalizeSgId(input);
  if (!UEN_RAW_REGEX.test(cleaned)) return false;
  return checksumValid(cleaned, now);
}

export const uenSpec: DocumentSpec = {
  code: CODE,
  country: "SG",
  scope: "tax",
  labelKey: "documents.SG_UEN.label",
  rawRegex: UEN_RAW_REGEX,
  formattedRegex: UEN_RAW_REGEX,
  mask: "*********",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeSgId(input);
  },

  validate(input: string): boolean {
    return validateUen(input, defaultClock);
  },

  format(input: string): string {
    const cleaned = normalizeSgId(input);
    if (!UEN_RAW_REGEX.test(cleaned)) return input;
    return cleaned;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeSgId(trimmed);
    if (cleaned.length < 9) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 10) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!UEN_RAW_REGEX.test(cleaned))
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    if (!checksumValid(cleaned, defaultClock))
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: cleaned,
      confidence: "high",
    };
  },
};
