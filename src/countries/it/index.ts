/**
 * Italy document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/it'`.
 */

import type {
  CountryCode,
  CountryDocumentBundle,
  DocumentSpec,
  DocumentTypeCode,
  ParseResult,
} from "../../core/types.ts";
import { cfSpec } from "./cf.ts";
import { pivaSpec } from "./piva.ts";

export { cfSpec, pivaSpec };

const SPECS = {
  // TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
  IT_CF: cfSpec,
  IT_PIVA: pivaSpec,
} as const;

/** Union of IT document type codes accepted by the country-scoped helpers. */
export type ITDocumentType = keyof typeof SPECS;

type ShortCode = "CF" | "CODICE_FISCALE" | "PIVA" | "P_IVA" | "VAT";

/**
 * Validate an Italian (IT) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`IT_CF`, `IT_PIVA`) or short (`CF`, `CODICE_FISCALE`, `PIVA`, `P_IVA`, `VAT`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes IT-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/it";
 * validate("IT_CF", "RSSMRA80A01H501U");
 * validate("PIVA", "12345670017");
 * ```
 */
export function validate(code: ITDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format an Italian (IT) document into its canonical display form.
 *
 * @param code - IT document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: ITDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize an Italian (IT) document by stripping separators and casing.
 *
 * @param code - IT document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: ITDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse an Italian (IT) document into a structured `ParseResult`.
 *
 * @param code - IT document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: ITDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: ITDocumentType | ShortCode): DocumentSpec {
  if (code === "CF" || code === "CODICE_FISCALE") return cfSpec;
  if (code === "PIVA" || code === "P_IVA" || code === "VAT") return pivaSpec;
  return SPECS[code];
}

export const itBundle: CountryDocumentBundle = {
  country: "IT" as CountryCode,
  // CF for naturali; the entity 11-digit CF coincides with PIVA.
  personal: [cfSpec],
  // PIVA is the intra-EU VAT identifier; CF doubles as a tax ID for individuals.
  tax: [pivaSpec, cfSpec],
  // TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
  defaultPersonal: "IT_CF" as DocumentTypeCode,
  defaultTax: "IT_PIVA" as DocumentTypeCode,
};
