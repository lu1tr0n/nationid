/**
 * Panamá document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/pa'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { passportSpec } from "./passport.ts";
import { rucSpec } from "./ruc.ts";

export { cedulaSpec, passportSpec, rucSpec };

const SPECS = {
  PA_CEDULA: cedulaSpec,
  PA_RUC: rucSpec,
  PA_PASAPORTE: passportSpec,
} as const;

/** Union of PA document type codes accepted by the country-scoped helpers. */
export type PADocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RUC" | "PASAPORTE";

/**
 * Validate a Panamanian (PA) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`PA_CEDULA`, `PA_RUC`) or short (`CEDULA`, `RUC`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes PA-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/pa";
 * validate("PA_CEDULA", "8-123-456");
 * validate("RUC", "8-123-456-12345");
 * ```
 */
export function validate(code: PADocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Panamanian (PA) document into its canonical display form.
 *
 * @param code - PA document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: PADocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Panamanian (PA) document by stripping separators and casing.
 *
 * @param code - PA document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: PADocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Panamanian (PA) document into a structured `ParseResult`.
 *
 * @param code - PA document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: PADocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: PADocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA") return cedulaSpec;
  if (code === "RUC") return rucSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const paBundle = {
  country: "PA",
  personal: [cedulaSpec, passportSpec],
  tax: [rucSpec, cedulaSpec],
  defaultPersonal: "PA_CEDULA",
  defaultTax: "PA_RUC",
} as const satisfies CountryDocumentBundle;