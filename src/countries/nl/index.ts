/**
 * Netherlands document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/nl'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { bsnSpec } from "./bsn.ts";
import { btwSpec } from "./btw.ts";

export { bsnSpec, btwSpec };

const SPECS = {
  NL_BSN: bsnSpec,
  NL_BTW: btwSpec,
} as const;

/** Union of NL document type codes accepted by the country-scoped helpers. */
export type NLDocumentType = keyof typeof SPECS;

type ShortCode = "BSN" | "BTW" | "VAT";

/**
 * Validate a Dutch (NL) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`NL_BSN`, `NL_BTW`) or short (`BSN`, `BTW`, `VAT`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes NL-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/nl";
 * validate("NL_BSN", "111222333");
 * validate("BTW", "NL123456789B01");
 * ```
 */
export function validate(code: NLDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Dutch (NL) document into its canonical display form.
 *
 * @param code - NL document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: NLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Dutch (NL) document by stripping separators and casing.
 *
 * @param code - NL document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: NLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Dutch (NL) document into a structured `ParseResult`.
 *
 * @param code - NL document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: NLDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: NLDocumentType | ShortCode): DocumentSpec {
  if (code === "BSN") return bsnSpec;
  if (code === "BTW" || code === "VAT") return btwSpec;
  return SPECS[code];
}

export const nlBundle = {
  country: "NL",
  personal: [bsnSpec],
  tax: [btwSpec, bsnSpec],
  defaultPersonal: "NL_BSN",
  defaultTax: "NL_BTW",
} as const satisfies CountryDocumentBundle;