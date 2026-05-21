/**
 * Norway document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/no'`.
 *
 * Country code `NO` and document codes `NO_FNR`, `NO_DNR`, `NO_ORGNR`,
 * `NO_MVA` are added to `CountryCode` / `DocumentTypeCode` by the
 * orchestrator at v0.6 integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { dnrSpec } from "./dnr.ts";
import { fnrSpec } from "./fnr.ts";
import { mvaSpec } from "./mva.ts";
import { orgnrSpec } from "./orgnr.ts";

export { dnrSpec, fnrSpec, mvaSpec, orgnrSpec };

const SPECS = {
  NO_FNR: fnrSpec,
  NO_DNR: dnrSpec,
  NO_ORGNR: orgnrSpec,
  NO_MVA: mvaSpec,
} as const;

/** Union of NO document type codes accepted by the country-scoped helpers. */
export type NODocumentType = keyof typeof SPECS;

type ShortCode = "FNR" | "FODSELSNUMMER" | "DNR" | "ORGNR" | "ORG" | "MVA" | "VAT";

/**
 * Validate a Norwegian (NO) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`NO_FNR`, `NO_DNR`, `NO_ORGNR`, `NO_MVA`) or short (`FNR`, `FODSELSNUMMER`, `DNR`, `ORGNR`, `ORG`, `MVA`, `VAT`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes NO-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/no";
 * validate("NO_FNR", "01012055555");
 * validate("ORGNR", "123456785");
 * ```
 */
export function validate(code: NODocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Norwegian (NO) document into its canonical display form.
 *
 * @param code - NO document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: NODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Norwegian (NO) document by stripping separators and casing.
 *
 * @param code - NO document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: NODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Norwegian (NO) document into a structured `ParseResult`.
 *
 * @param code - NO document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: NODocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: NODocumentType | ShortCode): DocumentSpec {
  if (code === "FNR" || code === "FODSELSNUMMER") return fnrSpec;
  if (code === "DNR") return dnrSpec;
  if (code === "ORGNR" || code === "ORG") return orgnrSpec;
  if (code === "MVA" || code === "VAT") return mvaSpec;
  return SPECS[code];
}

export const noBundle = {
  country: "NO",
  personal: [fnrSpec, dnrSpec],
  // FNR / DNR double as natural-person tax IDs; orgnr / MVA for legal entities.
  tax: [fnrSpec, dnrSpec, orgnrSpec, mvaSpec],
  defaultPersonal: "NO_FNR",
  defaultTax: "NO_ORGNR",
} as const satisfies CountryDocumentBundle;
