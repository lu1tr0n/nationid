/**
 * Costa Rica document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/cr'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaFisicaSpec } from "./cedula-fisica.ts";
import { cedulaJuridicaSpec } from "./cedula-juridica.ts";
import { dimexSpec } from "./dimex.ts";
import { passportSpec } from "./passport.ts";

export { cedulaFisicaSpec, cedulaJuridicaSpec, dimexSpec, passportSpec };

const SPECS = {
  CR_CEDULA_FISICA: cedulaFisicaSpec,
  CR_DIMEX: dimexSpec,
  CR_CEDULA_JURIDICA: cedulaJuridicaSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `CR_PASAPORTE` after all v0.5 agents complete.
  CR_PASAPORTE: passportSpec,
} as const;

/** Union of CR document type codes accepted by the country-scoped helpers. */
export type CRDocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA_FISICA" | "DIMEX" | "CEDULA_JURIDICA" | "PASAPORTE";

/**
 * Validate a Costa Rican (CR) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`CR_CEDULA_FISICA`, `CR_DIMEX`, ...) or short (`CEDULA_FISICA`, `DIMEX`, `CEDULA_JURIDICA`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes CR-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/cr";
 * validate("CR_CEDULA_FISICA", "1-1234-5678"); // true
 * validate("CEDULA_JURIDICA", "3-101-123456");
 * ```
 */
export function validate(code: CRDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a Costa Rican (CR) document into its canonical display form. */
export function format(code: CRDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a Costa Rican (CR) document by stripping separators. */
export function normalize(code: CRDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a Costa Rican (CR) document into a structured `ParseResult`. */
export function parse(code: CRDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: CRDocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA_FISICA") return cedulaFisicaSpec;
  if (code === "DIMEX") return dimexSpec;
  if (code === "CEDULA_JURIDICA") return cedulaJuridicaSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

/** Costa Rica (CR) document bundle for orchestrator registration. */
export const crBundle: CountryDocumentBundle = {
  country: "CR",
  personal: [cedulaFisicaSpec, dimexSpec, passportSpec],
  tax: [cedulaJuridicaSpec, cedulaFisicaSpec],
  defaultPersonal: "CR_CEDULA_FISICA",
  defaultTax: "CR_CEDULA_JURIDICA",
};
