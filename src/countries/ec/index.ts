/**
 * Ecuador document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ec'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { passportSpec } from "./passport.ts";
import { rucSpec } from "./ruc.ts";

export { cedulaSpec, passportSpec, rucSpec };

const SPECS = {
  EC_CEDULA: cedulaSpec,
  EC_RUC: rucSpec,
  EC_PASAPORTE: passportSpec,
} as const;

/** Union of EC document type codes accepted by the country-scoped helpers. */
export type ECDocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RUC" | "PASAPORTE";

/**
 * Validate an Ecuadorian (EC) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`EC_CEDULA`, `EC_RUC`, `EC_PASAPORTE`) or short (`CEDULA`, `RUC`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes EC-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/ec";
 * validate("EC_CEDULA", "1710034065");
 * validate("RUC", "1710034065001");
 * ```
 */
export function validate(code: ECDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format an Ecuadorian (EC) document into its canonical display form. */
export function format(code: ECDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize an Ecuadorian (EC) document by stripping separators. */
export function normalize(code: ECDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse an Ecuadorian (EC) document into a structured `ParseResult`. */
export function parse(code: ECDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: ECDocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA") return cedulaSpec;
  if (code === "RUC") return rucSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

/** Ecuador (EC) document bundle for orchestrator registration. */
export const ecBundle = {
  country: "EC",
  personal: [cedulaSpec, passportSpec],
  // RUC for naturales reuses cédula DV; expose cédula as a tax option too.
  tax: [rucSpec, cedulaSpec],
  defaultPersonal: "EC_CEDULA",
  defaultTax: "EC_RUC",
} as const satisfies CountryDocumentBundle;
