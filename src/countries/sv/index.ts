/**
 * El Salvador document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/sv'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { duiSpec } from "./dui.ts";
import { nitSpec } from "./nit.ts";
import { passportSpec } from "./passport.ts";

export { duiSpec, nitSpec, passportSpec };

const SPECS = {
  SV_DUI: duiSpec,
  SV_NIT: nitSpec,
  SV_PASAPORTE: passportSpec,
} as const;

/** Union of SV document type codes accepted by the country-scoped helpers. */
export type SVDocumentType = keyof typeof SPECS;

type ShortCode = "DUI" | "NIT" | "PASAPORTE";

/**
 * Validate a Salvadoran (SV) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`SV_DUI`, `SV_NIT`) or short (`DUI`, `NIT`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes SV-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/sv";
 * validate("SV_DUI", "01234567-8");
 * validate("NIT", "0614-010190-101-1");
 * ```
 */
export function validate(code: SVDocumentType | ShortCode, input: string): boolean {
  const spec = resolveSpec(code);
  return spec.validate(input);
}

/**
 * Format a Salvadoran (SV) document into its canonical display form.
 *
 * @param code - SV document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: SVDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Salvadoran (SV) document by stripping separators and casing.
 *
 * @param code - SV document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: SVDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Salvadoran (SV) document into a structured `ParseResult`.
 *
 * @param code - SV document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: SVDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: SVDocumentType | ShortCode): DocumentSpec {
  if (code === "DUI") return duiSpec;
  if (code === "NIT") return nitSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const svBundle: CountryDocumentBundle = {
  country: "SV",
  personal: [duiSpec, passportSpec],
  tax: [nitSpec, duiSpec],
  defaultPersonal: "SV_DUI",
  defaultTax: "SV_NIT",
};
