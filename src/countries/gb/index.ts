/**
 * United Kingdom document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/gb'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { nhsSpec } from "./nhs.ts";
import { ninoSpec } from "./nino.ts";
import { utrSpec } from "./utr.ts";
import { vatSpec } from "./vat.ts";

export { nhsSpec, ninoSpec, utrSpec, vatSpec };

const SPECS = {
  GB_NINO: ninoSpec,
  GB_UTR: utrSpec,
  GB_VAT: vatSpec,
  GB_NHS: nhsSpec,
} as const;

/** Union of GB document type codes accepted by the country-scoped helpers. */
export type GBDocumentType = keyof typeof SPECS;

type ShortCode = "NINO" | "UTR" | "VAT" | "NHS";

/**
 * Validate a UK (GB) identity, tax, VAT or NHS document.
 *
 * @param code - Document type, either fully-qualified (`GB_NINO`, `GB_UTR`, `GB_VAT`, `GB_NHS`) or short (`NINO`, `UTR`, `VAT`, `NHS`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes GB-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/gb";
 * validate("GB_NINO", "QQ 12 34 56 C"); // true
 * validate("VAT", "GB 123 4567 89");
 * ```
 */
export function validate(code: GBDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a UK (GB) document into its canonical display form. */
export function format(code: GBDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a UK (GB) document by stripping separators and casing. */
export function normalize(code: GBDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a UK (GB) document into a structured `ParseResult`. */
export function parse(code: GBDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: GBDocumentType | ShortCode): DocumentSpec {
  if (code === "NINO") return ninoSpec;
  if (code === "UTR") return utrSpec;
  if (code === "VAT") return vatSpec;
  if (code === "NHS") return nhsSpec;
  return SPECS[code];
}

/** United Kingdom (GB) document bundle for orchestrator registration. */
export const gbBundle = {
  country: "GB",
  personal: [ninoSpec, nhsSpec],
  // NINO is also tax-relevant for individuals; UTR / VAT identify
  // self-employed and incorporated taxpayers respectively.
  tax: [utrSpec, vatSpec, ninoSpec],
  defaultPersonal: "GB_NINO",
  defaultTax: "GB_UTR",
} as const satisfies CountryDocumentBundle;
