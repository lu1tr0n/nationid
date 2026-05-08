/**
 * Colombia — Pasaporte (`CO_PASAPORTE`).
 *
 * Issuer: Cancillería — Ministerio de Relaciones Exteriores.
 * Source: https://www.cancilleria.gov.co/
 *
 * Format: 6-12 alphanumeric characters, uppercase. The Cancillería has used
 * several issuance formats over the years (e.g. 2 letters + 6 digits, 8-9
 * digits, alphanumeric mix); the union of historic patterns is captured by
 * the 6-12 alphanumeric range.
 *
 * Check digit: **none** (passports are validated cryptographically via the
 * MRZ on the document data page; the printed number itself has no checksum).
 * For MRZ validation see the optional `mrz` peer integration; this spec
 * validates only the printed number.
 *
 * Confidence: unconfirmed. There is no first-party publication of the format
 * rules and historic passports use varying schemes. Treat this as a string
 * shape check only.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z0-9]{6,12}$/;

export const pasaporteSpec: DocumentSpec = {
  code: "CO_PASAPORTE",
  country: "CO",
  scope: "personal",
  labelKey: "documents.CO_PASAPORTE.label",
  rawRegex: RAW_REGEX,
  mask: "************",
  hasCheckDigit: false,
  confidence: "unconfirmed",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned);
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned) ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "CO_PASAPORTE", reason: { kind: "empty" } };
    }
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 6) {
      return { ok: false, code: "CO_PASAPORTE", reason: { kind: "too_short" } };
    }
    if (cleaned.length > 12) {
      return { ok: false, code: "CO_PASAPORTE", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: "CO_PASAPORTE", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "CO_PASAPORTE",
      normalized: cleaned,
      formatted: cleaned,
      confidence: "unconfirmed",
    };
  },
};
