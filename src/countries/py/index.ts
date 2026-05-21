/**
 * Paraguay document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/py'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ciSpec } from "./ci.ts";
import { passportSpec } from "./passport.ts";
import { rucSpec } from "./ruc.ts";

export { ciSpec, passportSpec, rucSpec };

const SPECS = {
  PY_CI: ciSpec,
  PY_RUC: rucSpec,
  PY_PASAPORTE: passportSpec,
} as const;

/** Union of PY document type codes accepted by the country-scoped helpers. */
export type PYDocumentType = keyof typeof SPECS;

type ShortCode = "CI" | "RUC" | "PASAPORTE";

/**
 * Validate a Paraguayan (PY) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`PY_CI`, `PY_RUC`) or short (`CI`, `RUC`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes PY-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/py";
 * validate("PY_CI", "1234567");
 * validate("RUC", "80012345-6");
 * ```
 */
export function validate(code: PYDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Paraguayan (PY) document into its canonical display form.
 *
 * @param code - PY document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: PYDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Paraguayan (PY) document by stripping separators and casing.
 *
 * @param code - PY document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: PYDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Paraguayan (PY) document into a structured `ParseResult`.
 *
 * @param code - PY document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: PYDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: PYDocumentType | ShortCode): DocumentSpec {
  if (code === "CI") return ciSpec;
  if (code === "RUC") return rucSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const pyBundle = {
  country: "PY",
  personal: [ciSpec, passportSpec],
  tax: [rucSpec],
  defaultPersonal: "PY_CI",
  defaultTax: "PY_RUC",
} as const satisfies CountryDocumentBundle;