/**
 * México document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/mx'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { claveElectorSpec } from "./clave-elector.ts";
import { curpSpec } from "./curp.ts";
import { nssSpec } from "./nss.ts";
import { passportSpec } from "./passport.ts";
import { rfcPfSpec } from "./rfc-pf.ts";
import { rfcPmSpec } from "./rfc-pm.ts";

export { claveElectorSpec, curpSpec, nssSpec, passportSpec, rfcPfSpec, rfcPmSpec };

const SPECS = {
  MX_CURP: curpSpec,
  MX_RFC_PF: rfcPfSpec,
  MX_RFC_PM: rfcPmSpec,
  MX_CLAVE_ELECTOR: claveElectorSpec,
  // `src/core/types.ts` `DocumentTypeCode`. Keying the SPECS map by the
  // string literal keeps the lookup table tree-shakable.
  MX_NSS: nssSpec,
  MX_PASAPORTE: passportSpec,
} as const;

/** Union of MX document type codes accepted by the country-scoped helpers. */
export type MXDocumentType = keyof typeof SPECS;

type ShortCode = "CURP" | "RFC_PF" | "RFC_PM" | "CLAVE_ELECTOR" | "INE" | "NSS" | "PASAPORTE";

/**
 * Validate a Mexican (MX) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`MX_CURP`, `MX_RFC_PF`) or short (`CURP`, `RFC_PF`, `RFC_PM`, `CLAVE_ELECTOR`, `INE`, `NSS`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes MX-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/mx";
 * validate("MX_CURP", "HEGG560427MVZRRL04");
 * validate("RFC_PF", "VECJ880326XXX");
 * ```
 */
export function validate(code: MXDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/**
 * Format a Mexican (MX) document into its canonical display form.
 *
 * @param code - MX document type or short alias.
 * @param input - Raw document string.
 * @returns Canonical formatted representation.
 */
export function format(code: MXDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/**
 * Normalize a Mexican (MX) document by stripping separators and casing.
 *
 * @param code - MX document type or short alias.
 * @param input - Raw document string.
 * @returns Storage-friendly normalized representation.
 */
export function normalize(code: MXDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/**
 * Parse a Mexican (MX) document into a structured `ParseResult`.
 *
 * @param code - MX document type or short alias.
 * @param input - Raw document string.
 * @returns Parse result with validity, normalized value, and any spec-specific metadata.
 */
export function parse(code: MXDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: MXDocumentType | ShortCode): DocumentSpec {
  if (code === "CURP") return curpSpec;
  if (code === "RFC_PF") return rfcPfSpec;
  if (code === "RFC_PM") return rfcPmSpec;
  if (code === "NSS") return nssSpec;
  if (code === "PASAPORTE") return passportSpec;
  // `CLAVE_ELECTOR` and `INE` are both colloquial names for the same INE-issued
  // Clave de Elector printed on the credencial INE/IFE.
  if (code === "CLAVE_ELECTOR" || code === "INE") return claveElectorSpec;
  return SPECS[code];
}

export const mxBundle = {
  country: "MX",
  // NSS sits in `personal` (purpose: social_security) alongside CURP and the
  // Clave de Elector. RFC remains the only tax-scope MX doc family.
  personal: [curpSpec, claveElectorSpec, nssSpec, passportSpec],
  tax: [rfcPfSpec, rfcPmSpec],
  defaultPersonal: "MX_CURP",
  defaultTax: "MX_RFC_PF",
} as const satisfies CountryDocumentBundle;