/**
 * Guatemala document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/gt'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { dpiSpec } from "./dpi.ts";
import { nitSpec } from "./nit.ts";
import { passportSpec } from "./passport.ts";

export { dpiSpec, nitSpec, passportSpec };

const SPECS = {
  GT_DPI: dpiSpec,
  GT_NIT: nitSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `GT_PASAPORTE` after all v0.5 agents complete.
  GT_PASAPORTE: passportSpec,
} as const;

/** Union of GT document type codes accepted by the country-scoped helpers. */
export type GTDocumentType = keyof typeof SPECS;

type ShortCode = "DPI" | "CUI" | "NIT" | "PASAPORTE";

/**
 * Validate a Guatemalan (GT) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`GT_DPI`) or short (`DPI`, `CUI`, `NIT`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes GT-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/gt";
 * validate("GT_DPI", "1234 56789 0101");
 * validate("NIT", "1234567-8");
 * ```
 */
export function validate(code: GTDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Guatemalan (GT) document into its canonical display form.
 *
 * @param code - GT document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: GTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Guatemalan (GT) document by stripping separators and casing.
 *
 * @param code - GT document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: GTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Guatemalan (GT) document into a structured `ParseResult`.
 *
 * @param code - GT document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: GTDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: GTDocumentType | ShortCode): DocumentSpec {
  // CUI is a synonym for DPI used by RENAP.
  if (code === "DPI" || code === "CUI") return dpiSpec;
  if (code === "NIT") return nitSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const gtBundle: CountryDocumentBundle = {
  country: "GT",
  personal: [dpiSpec, passportSpec],
  tax: [nitSpec, dpiSpec],
  defaultPersonal: "GT_DPI",
  defaultTax: "GT_NIT",
};
