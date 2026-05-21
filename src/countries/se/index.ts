/**
 * Sweden document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/se'`.
 *
 * Country code `SE` and document codes `SE_PERSONNUMMER`, `SE_ORGNR`,
 * `SE_VAT` are added to `CountryCode` / `DocumentTypeCode` by the
 * orchestrator at v0.6 integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { orgnrSpec } from "./orgnr.ts";
import { personnummerSpec } from "./personnummer.ts";
import { vatSpec } from "./vat.ts";

export { orgnrSpec, personnummerSpec, vatSpec };

const SPECS = {
  SE_PERSONNUMMER: personnummerSpec,
  SE_ORGNR: orgnrSpec,
  SE_VAT: vatSpec,
} as const;

/** Union of SE document type codes accepted by the country-scoped helpers. */
export type SEDocumentType = keyof typeof SPECS;

type ShortCode = "PERSONNUMMER" | "PNR" | "ORGNR" | "ORG" | "VAT" | "MOMS";

/**
 * Validate a Swedish (SE) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`SE_PERSONNUMMER`, `SE_ORGNR`, `SE_VAT`) or short (`PERSONNUMMER`, `PNR`, `ORGNR`, `ORG`, `VAT`, `MOMS`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes SE-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/se";
 * validate("SE_PERSONNUMMER", "811228-9874");
 * validate("ORGNR", "556016-0680");
 * ```
 */
export function validate(code: SEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Swedish (SE) document into its canonical display form.
 *
 * @param code - SE document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: SEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Swedish (SE) document by stripping separators and casing.
 *
 * @param code - SE document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: SEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Swedish (SE) document into a structured `ParseResult`.
 *
 * @param code - SE document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: SEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: SEDocumentType | ShortCode): DocumentSpec {
  if (code === "PERSONNUMMER" || code === "PNR") return personnummerSpec;
  if (code === "ORGNR" || code === "ORG") return orgnrSpec;
  if (code === "VAT" || code === "MOMS") return vatSpec;
  return SPECS[code];
}

export const seBundle = {
  country: "SE",
  personal: [personnummerSpec],
  // Personnummer doubles as natural-person tax ID (Skatteverket); orgnr / VAT
  // for legal entities.
  tax: [personnummerSpec, orgnrSpec, vatSpec],
  defaultPersonal: "SE_PERSONNUMMER",
  defaultTax: "SE_ORGNR",
} as const satisfies CountryDocumentBundle;
