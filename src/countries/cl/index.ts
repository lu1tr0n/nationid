/**
 * Chile document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/cl'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { passportSpec } from "./passport.ts";
import { rutSpec } from "./rut.ts";

export { passportSpec, rutSpec };

const SPECS = {
  CL_RUT: rutSpec,
  CL_PASAPORTE: passportSpec,
} as const;

/** Union of CL document type codes accepted by the country-scoped helpers. */
export type CLDocumentType = keyof typeof SPECS;

type ShortCode = "RUT" | "RUN" | "PASAPORTE";

/**
 * Validate a Chilean (CL) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`CL_RUT`, `CL_PASAPORTE`) or short (`RUT`, `RUN`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes CL-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/cl";
 * validate("CL_RUT", "12.345.678-5"); // true
 * validate("RUN", "11111111-1");
 * ```
 */
export function validate(code: CLDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a Chilean (CL) document into its canonical display form. */
export function format(code: CLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a Chilean (CL) document by stripping separators. */
export function normalize(code: CLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a Chilean (CL) document into a structured `ParseResult`. */
export function parse(code: CLDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: CLDocumentType | ShortCode): DocumentSpec {
  if (code === "RUT" || code === "RUN") return rutSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

/** Chile (CL) document bundle for orchestrator registration. */
export const clBundle = {
  country: "CL",
  personal: [rutSpec, passportSpec],
  tax: [rutSpec],
  defaultPersonal: "CL_RUT",
  defaultTax: "CL_RUT",
} as const satisfies CountryDocumentBundle;