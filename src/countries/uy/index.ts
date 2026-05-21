/**
 * Uruguay document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/uy'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ciSpec } from "./ci.ts";
import { passportSpec } from "./passport.ts";
import { rutSpec } from "./rut.ts";

export { ciSpec, passportSpec, rutSpec };

const SPECS = {
  UY_CI: ciSpec,
  UY_RUT: rutSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `UY_PASAPORTE` after all v0.5 agents complete.
  UY_PASAPORTE: passportSpec,
} as const;

/** Union of UY document type codes accepted by the country-scoped helpers. */
export type UYDocumentType = keyof typeof SPECS;

type ShortCode = "CI" | "RUT" | "PASAPORTE";

/**
 * Validate a Uruguayan (UY) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`UY_CI`, `UY_RUT`) or short (`CI`, `RUT`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes UY-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/uy";
 * validate("UY_CI", "1.234.567-2");
 * validate("RUT", "210000020017");
 * ```
 */
export function validate(code: UYDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Uruguayan (UY) document into its canonical display form.
 *
 * @param code - UY document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: UYDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Uruguayan (UY) document by stripping separators and casing.
 *
 * @param code - UY document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: UYDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Uruguayan (UY) document into a structured `ParseResult`.
 *
 * @param code - UY document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: UYDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: UYDocumentType | ShortCode): DocumentSpec {
  if (code === "CI") return ciSpec;
  if (code === "RUT") return rutSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const uyBundle: CountryDocumentBundle = {
  country: "UY",
  personal: [ciSpec, passportSpec],
  tax: [rutSpec, ciSpec],
  defaultPersonal: "UY_CI",
  defaultTax: "UY_RUT",
};
