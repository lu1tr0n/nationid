/**
 * Portugal document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/pt'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ccSpec } from "./cc.ts";
import type { NIFHolderType } from "./nif.ts";
import { nifHolderType, nifSpec } from "./nif.ts";
import { passportSpec } from "./passport.ts";

export type { NIFHolderType };
export { ccSpec, nifHolderType, nifSpec, passportSpec };

const SPECS = {
  PT_NIF: nifSpec,
  PT_CC: ccSpec,
  PT_PASAPORTE: passportSpec,
} as const;

/** Union of PT document type codes accepted by the country-scoped helpers. */
export type PTDocumentType = keyof typeof SPECS;

type ShortCode = "NIF" | "NIPC" | "CC" | "PASAPORTE";

/**
 * Validate a Portuguese (PT) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`PT_NIF`, `PT_CC`) or short (`NIF`, `NIPC`, `CC`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes PT-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/pt";
 * validate("PT_NIF", "123456789");
 * validate("CC", "12345678 9 ZZ4");
 * ```
 */
export function validate(code: PTDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Portuguese (PT) document into its canonical display form.
 *
 * @param code - PT document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: PTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Portuguese (PT) document by stripping separators and casing.
 *
 * @param code - PT document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: PTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Portuguese (PT) document into a structured `ParseResult`.
 *
 * @param code - PT document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: PTDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: PTDocumentType | ShortCode): DocumentSpec {
  if (code === "NIF" || code === "NIPC") return nifSpec;
  if (code === "CC") return ccSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const ptBundle = {
  country: "PT",
  personal: [ccSpec, passportSpec],
  // NIF doubles as the tax ID for both naturales and coletivos.
  tax: [nifSpec],
  defaultPersonal: "PT_CC",
  defaultTax: "PT_NIF",
} as const satisfies CountryDocumentBundle;