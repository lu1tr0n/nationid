/**
 * República Dominicana document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/do'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { passportSpec } from "./passport.ts";
import { rncSpec } from "./rnc.ts";

export { cedulaSpec, passportSpec, rncSpec };

const SPECS = {
  DO_CEDULA: cedulaSpec,
  DO_RNC: rncSpec,
  DO_PASAPORTE: passportSpec,
} as const;

/** Union of DO document type codes accepted by the country-scoped helpers. */
export type DODocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RNC" | "PASAPORTE";

/**
 * Validate a Dominican Republic (DO) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`DO_CEDULA`, `DO_RNC`, `DO_PASAPORTE`) or short (`CEDULA`, `RNC`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes DO-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/do";
 * validate("DO_CEDULA", "001-1234567-8");
 * validate("RNC", "131-12345-6");
 * ```
 */
export function validate(code: DODocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a Dominican (DO) document into its canonical display form. */
export function format(code: DODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a Dominican (DO) document by stripping separators. */
export function normalize(code: DODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a Dominican (DO) document into a structured `ParseResult`. */
export function parse(code: DODocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: DODocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA") return cedulaSpec;
  if (code === "RNC") return rncSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

/** República Dominicana (DO) document bundle for orchestrator registration. */
export const doBundle = {
  country: "DO",
  personal: [cedulaSpec, passportSpec],
  tax: [rncSpec, cedulaSpec],
  defaultPersonal: "DO_CEDULA",
  defaultTax: "DO_RNC",
} as const satisfies CountryDocumentBundle;
