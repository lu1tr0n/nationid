/**
 * Venezuela document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ve'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { passportSpec } from "./passport.ts";
import type { RIFHolderType } from "./rif.ts";
import { rifHolderType, rifSpec } from "./rif.ts";

export type { RIFHolderType };
export { cedulaSpec, passportSpec, rifHolderType, rifSpec };

const SPECS = {
  VE_CEDULA: cedulaSpec,
  VE_RIF: rifSpec,
  VE_PASAPORTE: passportSpec,
} as const;

/** Union of VE document type codes accepted by the country-scoped helpers. */
export type VEDocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RIF" | "PASAPORTE";

/**
 * Validate a Venezuelan (VE) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`VE_CEDULA`, `VE_RIF`) or short (`CEDULA`, `RIF`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes VE-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/ve";
 * validate("VE_CEDULA", "V-12345678");
 * validate("RIF", "J-12345678-9");
 * ```
 */
export function validate(code: VEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Venezuelan (VE) document into its canonical display form.
 *
 * @param code - VE document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: VEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Venezuelan (VE) document by stripping separators and casing.
 *
 * @param code - VE document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: VEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Venezuelan (VE) document into a structured `ParseResult`.
 *
 * @param code - VE document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: VEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: VEDocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA") return cedulaSpec;
  if (code === "RIF") return rifSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const veBundle = {
  country: "VE",
  personal: [cedulaSpec, passportSpec],
  tax: [rifSpec],
  defaultPersonal: "VE_CEDULA",
  defaultTax: "VE_RIF",
} as const satisfies CountryDocumentBundle;
