/**
 * Switzerland — UID (Unternehmens-Identifikationsnummer / IDE / IDI).
 *
 * Issuer: Bundesamt für Statistik (BFS) / Office fédéral de la statistique.
 * Source: https://www.uid.admin.ch/
 * Legal basis: Bundesgesetz über die Unternehmens-Identifikationsnummer (2010).
 *
 * Format: `CHE` + 9 digits. Visual `CHE-123.456.789`.
 *   - 9 digits = 8 sequential digits + 1 check digit.
 *
 * Check digit:
 *   weights = [5, 4, 3, 2, 7, 6, 5, 4]
 *   sum = sum(weights[i] * digit[i])  for i in 0..7
 *   r = sum mod 11
 *   if r == 0  -> dv = 0
 *   if r == 1  -> UID is invalid (cannot be issued)
 *   else       -> dv = 11 - r
 *
 * The same UID is reused as the VAT number when the holder is registered
 * with the FTA / AFC: the UID is suffixed with `MWST`, `TVA` or `IVA`
 * (see `mwstSpec`).
 *
 * Confidence: high. Algorithm published by BFS and reproduced verbatim in
 * `python-stdnum.ch.uid` and `validator.js isVAT('CH')`.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^CHE\d{9}$/;
const FORMATTED_REGEX = /^CHE-\d{3}\.\d{3}\.\d{3}$/;
const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4] as const;
const COUNTRY = "CH" as CountryCode;
// TODO(v0.6-integration): orchestrator extends `DocumentTypeCode` with `CH_UID`.
const CODE = "CH_UID" as DocumentTypeCode;

export const uidSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.CH_UID.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "CHE-000.000.000",
  hasCheckDigit: true,
  confidence: "high",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    return checkUid(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    const body = cleaned.slice(3);
    return `CHE-${body.slice(0, 3)}.${body.slice(3, 6)}.${body.slice(6, 9)}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 12) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 12) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkUid(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    const body = cleaned.slice(3);
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `CHE-${body.slice(0, 3)}.${body.slice(3, 6)}.${body.slice(6, 9)}`,
      confidence: "high",
    };
  },
};

export function checkUid(cleaned: string): boolean {
  if (!RAW_REGEX.test(cleaned)) return false;
  const body = cleaned.slice(3); // 9 digits
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const d = body.charCodeAt(i) - 48;
    const w = WEIGHTS[i];
    if (w === undefined) return false;
    sum += d * w;
  }
  const r = sum % 11;
  if (r === 1) return false; // UID never issued.
  const expected = r === 0 ? 0 : 11 - r;
  return expected === body.charCodeAt(8) - 48;
}
