/**
 * Singapore — NRIC (National Registration Identity Card number) (`SG_NRIC`).
 *
 * Issuer: Immigration & Checkpoints Authority (ICA), Ministry of Home Affairs.
 * Source: https://sso.agc.gov.sg/Act/NRA1965 (National Registration Act 1965,
 *         2020 Rev. Ed. — §6 registration, §8 identity card issuance)
 *         https://www.ica.gov.sg/
 *         https://www.ica.gov.sg/reside
 *         https://userapps.support.sap.com/sap/support/knowledge/en/2572734
 *         (SAP KBA #2572734 — the clearest written publication of the
 *         weights/offsets/tables; all verified live 2026-05-24).
 * Statute: National Registration Act 1965 (Act referenced at the SSO URL above).
 *
 * Format: 9 chars — a prefix letter, 7 digits, and a check letter:
 *   - prefix `S`: holder born before 2000-01-01 (citizens & PRs).
 *   - prefix `T`: holder born on/after 2000-01-01 (citizens & PRs).
 *
 * Check letter: weighted mod-11. Weight the 7 body digits with
 * `(2, 7, 6, 5, 4, 3, 2)`, add a prefix offset (`S` → 0, `T` → 4), take
 * `R = (sum + offset) mod 11`, then index the 11-char table `"JZIHGFEDCBA"`.
 *
 * Confidence: high. Four independent code sources (samliew/singapore-nric,
 * Jqnxyz/nric-tools-js, IonBazan/NRIC, SAP KBA #2572734) agree on the weights,
 * offsets, and literal table; the statute is citable at sso.agc.gov.sg. ICA
 * does not publish a standalone algorithm document, but the convergence is
 * overwhelming and the algorithm has been stable for 40+ years.
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { normalizeSgId, nricFinWeightedSum } from "./_shared.ts";

const RAW_REGEX = /^[ST]\d{7}[A-Z]$/;
const CODE = "SG_NRIC";

/** R-indexed check-letter table for the S and T prefixes. */
const NRIC_TABLE = "JZIHGFEDCBA";

const PREFIX_OFFSET: Readonly<Record<string, number>> = { S: 0, T: 4 };

function expectedCheckLetter(prefix: string, body7: string): string {
  const offset = PREFIX_OFFSET[prefix] ?? 0;
  const r = (nricFinWeightedSum(body7) + offset) % 11;
  return NRIC_TABLE.charAt(r);
}

function checksumValid(value: string): boolean {
  const prefix = value.charAt(0);
  const body7 = value.slice(1, 8);
  const check = value.charAt(8);
  return expectedCheckLetter(prefix, body7) === check;
}

export const nricSpec: DocumentSpec = {
  code: CODE,
  country: "SG",
  scope: "personal",
  labelKey: "documents.SG_NRIC.label",
  rawRegex: RAW_REGEX,
  formattedRegex: RAW_REGEX,
  mask: "A0000000A",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return normalizeSgId(input);
  },

  validate(input: string): boolean {
    const cleaned = normalizeSgId(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checksumValid(cleaned);
  },

  format(input: string): string {
    const cleaned = normalizeSgId(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    return cleaned;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = normalizeSgId(trimmed);
    if (cleaned.length < 9) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 9) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned))
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    if (!checksumValid(cleaned))
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
