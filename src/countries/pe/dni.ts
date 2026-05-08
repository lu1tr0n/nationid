/**
 * Perú — DNI (Documento Nacional de Identidad).
 *
 * Issuer: RENIEC (Registro Nacional de Identificación y Estado Civil).
 * Source: https://www.reniec.gob.pe/
 * Legal basis: Ley 26.497 (Ley Orgánica del RENIEC).
 *
 * Format: 8 digits, no separators.
 *
 * Check digit: **none on the printed card**. RENIEC internally maintains a
 * verifier digit/letter (the "dígito de verificación" returned by the
 * RENIEC API) but the canonical 8-digit DNI shown on the card has no
 * checksum. Most government systems and private apps store and accept the
 * 8-digit form alone.
 *
 * Confidence: low. Format-only validation. The optional 9th-character verifier
 * letter (Vigesimal Modular per RENIEC public records) is not part of the
 * stored number and is intentionally not validated here. See
 * `docs/countries/pe.md` for the algorithm if a future caller needs it.
 *
 * The DNI Electrónico (DNIe) keeps the same 8-digit number; the chip carries
 * additional cryptographic data not exposed by this API.
 */

import { stripNonDigits } from "../../core/normalize.ts";
import type { DocumentSpec, ParseResult } from "../../core/types.ts";

const RAW_REGEX = /^\d{8}$/;

export const dniSpec: DocumentSpec = {
  code: "PE_DNI",
  country: "PE",
  scope: "personal",
  labelKey: "documents.PE_DNI.label",
  rawRegex: RAW_REGEX,
  mask: "00000000",
  hasCheckDigit: false,
  confidence: "low",

  normalize(input: string): string {
    return stripNonDigits(input);
  },

  validate(input: string): boolean {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits);
  },

  format(input: string): string {
    const digits = stripNonDigits(input);
    return RAW_REGEX.test(digits) ? digits : input;
  },

  parse(input: string): ParseResult {
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return { ok: false, code: "PE_DNI", reason: { kind: "empty" } };
    }
    const digits = stripNonDigits(trimmed);
    if (digits.length < 8) {
      return { ok: false, code: "PE_DNI", reason: { kind: "too_short" } };
    }
    if (digits.length > 8) {
      return { ok: false, code: "PE_DNI", reason: { kind: "too_long" } };
    }
    if (!RAW_REGEX.test(digits)) {
      return { ok: false, code: "PE_DNI", reason: { kind: "invalid_format" } };
    }
    return {
      ok: true,
      code: "PE_DNI",
      normalized: digits,
      formatted: digits,
      confidence: "low",
    };
  },
};
