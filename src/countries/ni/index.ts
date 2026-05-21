/**
 * Nicaragua document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ni'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { passportSpec } from "./passport.ts";
import { rucSpec } from "./ruc.ts";

export { cedulaSpec, passportSpec, rucSpec };

const SPECS = {
  NI_CEDULA: cedulaSpec,
  NI_RUC: rucSpec,
  NI_PASAPORTE: passportSpec,
} as const;

/** Union of NI document type codes accepted by the country-scoped helpers. */
export type NIDocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RUC" | "PASAPORTE";

/**
 * Validate a Nicaraguan (NI) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`NI_CEDULA`, `NI_RUC`) or short (`CEDULA`, `RUC`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes NI-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/ni";
 * validate("NI_CEDULA", "001-150590-1000A");
 * validate("RUC", "J0310000000000");
 * ```
 */
export function validate(code: NIDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Nicaraguan (NI) document into its canonical display form.
 *
 * @param code - NI document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: NIDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Nicaraguan (NI) document by stripping separators and casing.
 *
 * @param code - NI document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: NIDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Nicaraguan (NI) document into a structured `ParseResult`.
 *
 * @param code - NI document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: NIDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: NIDocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA") return cedulaSpec;
  if (code === "RUC") return rucSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const niBundle = {
  country: "NI",
  personal: [cedulaSpec, passportSpec],
  tax: [rucSpec, cedulaSpec],
  defaultPersonal: "NI_CEDULA",
  defaultTax: "NI_RUC",
} as const satisfies CountryDocumentBundle;