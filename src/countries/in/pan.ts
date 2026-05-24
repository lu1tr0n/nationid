/**
 * India — Permanent Account Number (`IN_PAN`).
 *
 * Issuer: Income Tax Department, Ministry of Finance.
 * Source: https://www.incometaxindia.gov.in/ (CBDT portal — issuer root).
 *         https://www.incometax.gov.in/ (e-Filing portal — PAN services).
 * Statute: Income-tax Act 1961, s. 139A; Income-tax Rules 1962, Rule 114
 *          (the binding algorithm / format authority).
 *          URLs verified live 2026-05-24.
 *
 * Format: 10 chars `LLLLLNNNNL`. The 4th character encodes entity type:
 *   A (AOP), B (BOI), C (Company), F (Firm/LLP), G (Government),
 *   H (HUF), J (Artificial Juridical Person), L (Local Authority),
 *   P (Individual), T (Trust). The serial in positions 6-9 cannot be `0000`.
 *
 * Check digit: position 10 is described as a check digit by CBDT but the
 * algorithm is not published. We treat the spec as format-only
 * (`hasCheckDigit: false`); confidence stays `high` because the format
 * itself is canonical and statute-defined.
 */

import { stripAndUpper } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const ALLOWED_ENTITY_TYPES = new Set(["A", "B", "C", "F", "G", "H", "J", "L", "P", "T"]);
const CODE = "IN_PAN";

export const panSpec: DocumentSpec = {
  code: CODE,
  country: "IN",
  scope: "tax",
  labelKey: "documents.IN_PAN.label",
  rawRegex: RAW_REGEX,
  mask: "AAAAA0000A",
  hasCheckDigit: false,
  confidence: "high",

  normalize(input: string): string {
    return stripAndUpper(input);
  },

  validate(input: string): boolean {
    const cleaned = stripAndUpper(input);
    if (!RAW_REGEX.test(cleaned)) return false;
    const entityType = cleaned[3];
    if (entityType === undefined || !ALLOWED_ENTITY_TYPES.has(entityType)) return false;
    if (cleaned.slice(5, 9) === "0000") return false;
    return true;
  },

  format(input: string): string {
    const cleaned = stripAndUpper(input);
    return RAW_REGEX.test(cleaned) ? cleaned : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) return { ok: false, code: CODE, reason: { kind: "empty" } };
    const cleaned = stripAndUpper(trimmed);
    if (cleaned.length < 10) return { ok: false, code: CODE, reason: { kind: "too_short" } };
    if (cleaned.length > 10) return { ok: false, code: CODE, reason: { kind: "too_long" } };
    if (!RAW_REGEX.test(cleaned)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    const entityType = cleaned[3];
    if (entityType === undefined || !ALLOWED_ENTITY_TYPES.has(entityType)) {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
    }
    if (cleaned.slice(5, 9) === "0000") {
      return { ok: false, code: CODE, reason: { kind: "invalid_format" } };
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
