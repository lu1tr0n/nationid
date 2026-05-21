/**
 * Honduras document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/hn'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { dniSpec } from "./dni.ts";
import { passportSpec } from "./passport.ts";
import { rtnSpec } from "./rtn.ts";

export { dniSpec, passportSpec, rtnSpec };

const SPECS = {
  HN_DNI: dniSpec,
  HN_RTN: rtnSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `HN_PASAPORTE` after all v0.5 agents complete.
  HN_PASAPORTE: passportSpec,
} as const;

/** Union of HN document type codes accepted by the country-scoped helpers. */
export type HNDocumentType = keyof typeof SPECS;

type ShortCode = "DNI" | "RTN" | "PASAPORTE";

/**
 * Validate a Honduran (HN) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`HN_DNI`) or short (`DNI`, `RTN`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes HN-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/hn";
 * validate("HN_DNI", "0801-1990-12345");
 * validate("RTN", "08011990123456");
 * ```
 */
export function validate(code: HNDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Honduran (HN) document into its canonical display form.
 *
 * @param code - HN document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: HNDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Honduran (HN) document by stripping separators and casing.
 *
 * @param code - HN document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: HNDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Honduran (HN) document into a structured `ParseResult`.
 *
 * @param code - HN document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: HNDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: HNDocumentType | ShortCode): DocumentSpec {
  if (code === "DNI") return dniSpec;
  if (code === "RTN") return rtnSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const hnBundle: CountryDocumentBundle = {
  country: "HN",
  personal: [dniSpec, passportSpec],
  tax: [rtnSpec, dniSpec],
  defaultPersonal: "HN_DNI",
  defaultTax: "HN_RTN",
};
