/**
 * Argentina document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ar'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cdiSpec } from "./cdi.ts";
import { cuilSpec } from "./cuil.ts";
import { cuitSpec } from "./cuit.ts";
import { dniSpec } from "./dni.ts";
import { passportSpec } from "./passport.ts";

export { cdiSpec, cuilSpec, cuitSpec, dniSpec, passportSpec };

const SPECS = {
  AR_DNI: dniSpec,
  AR_CUIL: cuilSpec,
  AR_CUIT: cuitSpec,
  AR_CDI: cdiSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `AR_PASAPORTE` after all v0.5 agents complete.
  AR_PASAPORTE: passportSpec,
} as const;

/** Union of AR document type codes accepted by the country-scoped helpers. */
export type ARDocumentType = keyof typeof SPECS;

type ShortCode = "DNI" | "CUIL" | "CUIT" | "CDI" | "PASAPORTE";

/**
 * Validate an Argentine (AR) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`AR_DNI`) or short (`DNI`, `CUIL`, `CUIT`, `CDI`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes AR-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/ar";
 * validate("AR_DNI", "33.456.789"); // true
 * validate("CUIT", "20-12345678-3");
 * ```
 */
export function validate(code: ARDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format an Argentine (AR) document into its canonical display form.
 *
 * @param code - AR document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: ARDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize an Argentine (AR) document by stripping separators and casing.
 *
 * @param code - AR document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: ARDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse an Argentine (AR) document into a structured `ParseResult`.
 *
 * @param code - AR document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: ARDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: ARDocumentType | ShortCode): DocumentSpec {
  if (code === "DNI") return dniSpec;
  if (code === "CUIL") return cuilSpec;
  if (code === "CUIT") return cuitSpec;
  if (code === "CDI") return cdiSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

/** Argentina (AR) document bundle for orchestrator registration. */
export const arBundle: CountryDocumentBundle = {
  country: "AR",
  personal: [dniSpec, cuilSpec, passportSpec],
  // CUIT remains the primary tax doc; CUIL doubles as labor tax id; CDI is
  // ARCA's fallback identifier when a person has no CUIT/CUIL.
  tax: [cuitSpec, cuilSpec, cdiSpec],
  defaultPersonal: "AR_DNI",
  defaultTax: "AR_CUIT",
};
