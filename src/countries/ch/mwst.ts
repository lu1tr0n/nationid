/**
 * Switzerland — MWST / TVA / IVA (VAT registration).
 *
 * Issuer: Eidgenössische Steuerverwaltung (ESTV) / AFC.
 * Source: https://www.estv.admin.ch/
 *
 * Format: a UID (`CHE` + 9 digits) followed by a language-specific VAT
 * suffix `MWST`, `TVA`, or `IVA`. Visual: `CHE-123.456.789 MWST`.
 *
 * Validation = UID check digit (mod-11) + suffix presence. The suffix
 * carries no checksum on its own.
 *
 * Confidence: moderate. The format is documented by ESTV but the
 * algorithm we ship piggybacks on the UID check; ESTV does not publish
 * an additional suffix-specific verification.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { CountryCode, DocumentSpec, DocumentTypeCode, ParseResult } from "../../core/types.ts";
import { checkUid } from "./uid.ts";

const RAW_REGEX = /^CHE\d{9}(MWST|TVA|IVA)$/;
const FORMATTED_REGEX = /^CHE-\d{3}\.\d{3}\.\d{3}\s(MWST|TVA|IVA)$/;
const COUNTRY = "CH" as CountryCode;
// TODO(v0.6-integration): orchestrator extends `DocumentTypeCode` with `CH_MWST`.
const CODE = "CH_MWST" as DocumentTypeCode;

export const mwstSpec: DocumentSpec = {
  code: CODE,
  country: COUNTRY,
  scope: "tax",
  labelKey: "documents.CH_MWST.label",
  rawRegex: RAW_REGEX,
  formattedRegex: FORMATTED_REGEX,
  mask: "CHE-000.000.000 MWST",
  hasCheckDigit: true,
  confidence: "moderate",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    // UID check applies to chars 0..11 (CHE + 9 digits).
    return checkUid(cleaned.slice(0, 12));
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return input;
    const uid = cleaned.slice(0, 12);
    const suffix = cleaned.slice(12);
    const body = uid.slice(3);
    return `CHE-${body.slice(0, 3)}.${body.slice(3, 6)}.${body.slice(6, 9)} ${suffix}`;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: CODE, reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    // CHE + 9 digits + 3-or-4 char suffix → 15 or 16 chars.
    if (cleaned.length < 15) {
      return { ok: false, code: CODE, reason: { kind: "too_short" } };
    }
    if (cleaned.length > 16) {
      return { ok: false, code: CODE, reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (!checkUid(cleaned.slice(0, 12))) {
      return { ok: false, code: CODE, reason: { kind: "invalid_checksum" } };
    }
    const uid = cleaned.slice(0, 12);
    const suffix = cleaned.slice(12);
    const body = uid.slice(3);
    return {
      ok: true,
      code: CODE,
      normalized: cleaned,
      formatted: `CHE-${body.slice(0, 3)}.${body.slice(3, 6)}.${body.slice(6, 9)} ${suffix}`,
      confidence: "moderate",
    };
  },
};
