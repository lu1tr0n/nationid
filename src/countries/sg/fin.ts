/**
 * Singapore — FIN (Foreign Identification Number) (`SG_FIN`).
 *
 * Issuer: ICA (long-term passes) and MOM (work passes). Both share a single
 *         FIN number space; the prefix letter does NOT distinguish the issuer.
 * Source: https://sso.agc.gov.sg/Act/NRA1965 (National Registration Act 1965 §5)
 *         https://www.ica.gov.sg/
 *         https://www.ica.gov.sg/reside
 *         https://www.mom.gov.sg/passes-and-permits
 *         https://userapps.support.sap.com/sap/support/knowledge/en/2572734
 *         (SAP KBA #2572734 — vendor spec covering all FIN prefixes including
 *         the M-series table; all verified live 2026-05-24).
 * Statute: National Registration Act 1965 (Act referenced at the SSO URL above).
 *
 * Format: 9 chars — a prefix letter, 7 digits, and a check letter:
 *   - prefix `F`: FIN issued before 2000-01-01.
 *   - prefix `G`: FIN issued 2000-01-01 … 2021-12-31.
 *   - prefix `M`: FIN issued on/after 2022-01-01 (M-series reform).
 *
 * Check letter: weighted mod-11. Weight the 7 body digits with
 * `(2, 7, 6, 5, 4, 3, 2)` (identical to NRIC), add a prefix offset
 * (`F` → 0, `G` → 4, `M` → 3), take `R = (sum + offset) mod 11`, then index the
 * prefix-specific 11-char table. F/G use `"XWUTRQPNMLK"`; M uses
 * `"XWUTRQPNJLK"` (differs from F/G only at R=8, where it is `J` not `M`).
 *
 * Confidence: high. F/G are corroborated by four independent sources (samliew,
 * Jqnxyz, IonBazan, SAP). M is corroborated by three (samliew, IonBazan, SAP),
 * all encoding the same M-table and +3 offset and all validating `M5012345J`.
 *
 * Open question: ICA's 2021-12 M-series media release is no longer reachable at
 * its original URL and has no Wayback snapshot. The strongest M-prefix citation
 * (SAP note 3111689) is behind a customer login; the public SAP KBA #2572734
 * documents the M-table and is treated as the primary written reference here.
 */

import type { DocumentSpec, ParseResult } from "../../core/types.ts";
import { normalizeSgId, nricFinWeightedSum } from "./_shared.ts";

const RAW_REGEX = /^[FGM]\d{7}[A-Z]$/;
const CODE = "SG_FIN";

/** R-indexed check-letter table for the F and G prefixes. */
const FG_TABLE = "XWUTRQPNMLK";
/** R-indexed check-letter table for the M prefix (differs from F/G at R=8). */
const M_TABLE = "XWUTRQPNJLK";

const PREFIX_OFFSET: Readonly<Record<string, number>> = { F: 0, G: 4, M: 3 };

function tableFor(prefix: string): string {
  return prefix === "M" ? M_TABLE : FG_TABLE;
}

function expectedCheckLetter(prefix: string, body7: string): string {
  const offset = PREFIX_OFFSET[prefix] ?? 0;
  const r = (nricFinWeightedSum(body7) + offset) % 11;
  return tableFor(prefix).charAt(r);
}

function checksumValid(value: string): boolean {
  const prefix = value.charAt(0);
  const body7 = value.slice(1, 8);
  const check = value.charAt(8);
  return expectedCheckLetter(prefix, body7) === check;
}

export const finSpec: DocumentSpec = {
  code: CODE,
  country: "SG",
  scope: "personal",
  labelKey: "documents.SG_FIN.label",
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
