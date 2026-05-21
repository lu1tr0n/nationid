/**
 * Belgium document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/be'`.
 *
 * Country code `BE` and document codes `BE_NRN`, `BE_BTW` are added to
 * `CountryCode` / `DocumentTypeCode` by the orchestrator at integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { btwSpec } from "./btw.ts";
import { nrnSpec } from "./nrn.ts";

export { btwSpec, nrnSpec };

const SPECS = {
  BE_NRN: nrnSpec,
  BE_BTW: btwSpec,
} as const;

/** Union of BE document type codes accepted by the country-scoped helpers. */
export type BEDocumentType = keyof typeof SPECS;

type ShortCode = "NRN" | "RRN" | "BTW" | "TVA" | "VAT";

/**
 * Validate a Belgian (BE) identity or VAT document.
 *
 * @param code - Document type, either fully-qualified (`BE_NRN`, `BE_BTW`) or short (`NRN`, `RRN`, `BTW`, `TVA`, `VAT`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes BE-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/be";
 * validate("BE_NRN", "93.05.18-223.61"); // true
 * validate("VAT", "BE 0123.456.749");
 * ```
 */
export function validate(code: BEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a Belgian (BE) document into its canonical display form. */
export function format(code: BEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a Belgian (BE) document by stripping separators. */
export function normalize(code: BEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a Belgian (BE) document into a structured `ParseResult`. */
export function parse(code: BEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: BEDocumentType | ShortCode): DocumentSpec {
  if (code === "NRN" || code === "RRN") return nrnSpec;
  if (code === "BTW" || code === "TVA" || code === "VAT") return btwSpec;
  return SPECS[code];
}

/** Belgium (BE) document bundle for orchestrator registration. */
export const beBundle: CountryDocumentBundle = {
  country: "BE" as CountryDocumentBundle["country"],
  personal: [nrnSpec],
  tax: [btwSpec, nrnSpec],
  defaultPersonal: "BE_NRN" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "BE_BTW" as CountryDocumentBundle["defaultTax"],
};
