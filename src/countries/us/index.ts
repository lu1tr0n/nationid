/**
 * United States document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/us'`.
 *
 * Note: SSN and ITIN share the same 9-digit namespace; use the area-prefix
 * rule (`9xx` => ITIN; otherwise SSN) to disambiguate when the document
 * type is unknown at the call site.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { einSpec } from "./ein.ts";
import { itinSpec } from "./itin.ts";
import { passportSpec } from "./passport.ts";
import { ssnSpec } from "./ssn.ts";

export { einSpec, itinSpec, passportSpec, ssnSpec };

const SPECS = {
  US_SSN: ssnSpec,
  US_ITIN: itinSpec,
  US_EIN: einSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `US_PASAPORTE` after all v0.5 agents complete.
  US_PASAPORTE: passportSpec,
} as const;

/** Union of US document type codes accepted by the country-scoped helpers. */
export type USDocumentType = keyof typeof SPECS;

type ShortCode = "SSN" | "ITIN" | "EIN" | "PASAPORTE" | "PASSPORT";

/**
 * Validate a United States (US) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`US_SSN`, `US_ITIN`, `US_EIN`) or short (`SSN`, `ITIN`, `EIN`, `PASSPORT`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes US-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/us";
 * validate("US_SSN", "123-45-6789");
 * validate("EIN", "12-3456789");
 * ```
 */
export function validate(code: USDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a United States (US) document into its canonical display form.
 *
 * @param code - US document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: USDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a United States (US) document by stripping separators and casing.
 *
 * @param code - US document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: USDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a United States (US) document into a structured `ParseResult`.
 *
 * @param code - US document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: USDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: USDocumentType | ShortCode): DocumentSpec {
  if (code === "SSN") return ssnSpec;
  if (code === "ITIN") return itinSpec;
  if (code === "EIN") return einSpec;
  // English-language alias `PASSPORT` is convenient for the US bundle.
  if (code === "PASAPORTE" || code === "PASSPORT") return passportSpec;
  return SPECS[code];
}

export const usBundle: CountryDocumentBundle = {
  country: "US",
  personal: [ssnSpec, itinSpec, passportSpec],
  tax: [einSpec, itinSpec, ssnSpec],
  defaultPersonal: "US_SSN",
  defaultTax: "US_EIN",
};
