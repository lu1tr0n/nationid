/**
 * Poland document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/pl'`.
 *
 * Country code `PL` and document codes `PL_PESEL`, `PL_NIP`, `PL_REGON`
 * are added to `CountryCode` / `DocumentTypeCode` by the orchestrator at
 * integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { nipSpec } from "./nip.ts";
import { peselSpec } from "./pesel.ts";
import { regonSpec } from "./regon.ts";

export { nipSpec, peselSpec, regonSpec };

const SPECS = {
  PL_PESEL: peselSpec,
  PL_NIP: nipSpec,
  PL_REGON: regonSpec,
} as const;

/** Union of PL document type codes accepted by the country-scoped helpers. */
export type PLDocumentType = keyof typeof SPECS;

type ShortCode = "PESEL" | "NIP" | "REGON";

/**
 * Validate a Polish (PL) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`PL_PESEL`, `PL_NIP`, `PL_REGON`) or short (`PESEL`, `NIP`, `REGON`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes PL-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/pl";
 * validate("PL_PESEL", "44051401359");
 * validate("NIP", "5260250274");
 * ```
 */
export function validate(code: PLDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Polish (PL) document into its canonical display form.
 *
 * @param code - PL document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: PLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Polish (PL) document by stripping separators and casing.
 *
 * @param code - PL document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: PLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Polish (PL) document into a structured `ParseResult`.
 *
 * @param code - PL document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: PLDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: PLDocumentType | ShortCode): DocumentSpec {
  if (code === "PESEL") return peselSpec;
  if (code === "NIP") return nipSpec;
  if (code === "REGON") return regonSpec;
  return SPECS[code];
}

export const plBundle = {
  country: "PL",
  personal: [peselSpec],
  tax: [nipSpec, regonSpec, peselSpec],
  defaultPersonal: "PL_PESEL",
  defaultTax: "PL_NIP",
} as const satisfies CountryDocumentBundle;
