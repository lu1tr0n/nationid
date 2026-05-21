/**
 * Perú document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/pe'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ceSpec } from "./ce.ts";
import { dniSpec } from "./dni.ts";
import { passportSpec } from "./passport.ts";
import { rucSpec } from "./ruc.ts";

export { ceSpec, dniSpec, passportSpec, rucSpec };

const SPECS = {
  PE_DNI: dniSpec,
  PE_CE: ceSpec,
  PE_RUC: rucSpec,
  PE_PASAPORTE: passportSpec,
} as const;

/** Union of PE document type codes accepted by the country-scoped helpers. */
export type PEDocumentType = keyof typeof SPECS;

type ShortCode = "DNI" | "CE" | "RUC" | "PASAPORTE";

/**
 * Validate a Peruvian (PE) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`PE_DNI`, `PE_RUC`) or short (`DNI`, `CE`, `RUC`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes PE-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/pe";
 * validate("PE_DNI", "12345678");
 * validate("RUC", "20100070970");
 * ```
 */
export function validate(code: PEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Peruvian (PE) document into its canonical display form.
 *
 * @param code - PE document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: PEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Peruvian (PE) document by stripping separators and casing.
 *
 * @param code - PE document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: PEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Peruvian (PE) document into a structured `ParseResult`.
 *
 * @param code - PE document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: PEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: PEDocumentType | ShortCode): DocumentSpec {
  if (code === "DNI") return dniSpec;
  if (code === "CE") return ceSpec;
  if (code === "RUC") return rucSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const peBundle = {
  country: "PE",
  personal: [dniSpec, ceSpec, passportSpec],
  tax: [rucSpec],
  defaultPersonal: "PE_DNI",
  defaultTax: "PE_RUC",
} as const satisfies CountryDocumentBundle;
