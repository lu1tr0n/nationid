/**
 * Bolivia document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/bo'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ciSpec } from "./ci.ts";
import { nitSpec } from "./nit.ts";
import { passportSpec } from "./passport.ts";

export { ciSpec, nitSpec, passportSpec };

const SPECS = {
  BO_CI: ciSpec,
  BO_NIT: nitSpec,
  BO_PASAPORTE: passportSpec,
} as const;

/** Union of BO document type codes accepted by the country-scoped helpers. */
export type BODocumentType = keyof typeof SPECS;

type ShortCode = "CI" | "NIT" | "PASAPORTE";

/**
 * Validate a Bolivian (BO) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`BO_CI`, `BO_NIT`, `BO_PASAPORTE`) or short (`CI`, `NIT`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes BO-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/bo";
 * validate("BO_CI", "1234567");
 * validate("NIT", "1023456023");
 * ```
 */
export function validate(code: BODocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a Bolivian (BO) document into its canonical display form. */
export function format(code: BODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a Bolivian (BO) document by stripping separators. */
export function normalize(code: BODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a Bolivian (BO) document into a structured `ParseResult`. */
export function parse(code: BODocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: BODocumentType | ShortCode): DocumentSpec {
  if (code === "CI") return ciSpec;
  if (code === "NIT") return nitSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

/** Bolivia (BO) document bundle for orchestrator registration. */
export const boBundle = {
  country: "BO",
  personal: [ciSpec, passportSpec],
  tax: [nitSpec],
  defaultPersonal: "BO_CI",
  defaultTax: "BO_NIT",
} as const satisfies CountryDocumentBundle;