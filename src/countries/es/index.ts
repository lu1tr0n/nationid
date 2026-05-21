/**
 * España document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/es'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { dniSpec } from "./dni.ts";
import { nieSpec } from "./nie.ts";
import { nifPjSpec } from "./nif-pj.ts";
import { nussSpec } from "./nuss.ts";
import { passportSpec } from "./passport.ts";

export { dniSpec, nieSpec, nifPjSpec, nussSpec, passportSpec };

const SPECS = {
  ES_DNI: dniSpec,
  ES_NIE: nieSpec,
  ES_NIF_PJ: nifPjSpec,
  ES_NUSS: nussSpec,
  ES_PASAPORTE: passportSpec,
} as const;

/** Union of ES document type codes accepted by the country-scoped helpers. */
export type ESDocumentType = keyof typeof SPECS;

type ShortCode = "DNI" | "NIE" | "NIF_PJ" | "CIF" | "NUSS" | "PASAPORTE";

/**
 * Validate a Spanish (ES) identity, tax or social-security document.
 *
 * @param code - Document type, either fully-qualified (`ES_DNI`, `ES_NIE`, `ES_NIF_PJ`, `ES_NUSS`, `ES_PASAPORTE`) or short (`DNI`, `NIE`, `NIF_PJ`, `CIF`, `NUSS`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes ES-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/es";
 * validate("ES_DNI", "12345678Z"); // true
 * validate("NIF_PJ", "A58818501");
 * ```
 */
export function validate(code: ESDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a Spanish (ES) document into its canonical display form. */
export function format(code: ESDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a Spanish (ES) document by stripping separators and casing. */
export function normalize(code: ESDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a Spanish (ES) document into a structured `ParseResult`. */
export function parse(code: ESDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: ESDocumentType | ShortCode): DocumentSpec {
  if (code === "DNI") return dniSpec;
  if (code === "NIE") return nieSpec;
  // `CIF` is the legacy alias for `NIF_PJ`; both resolve to the same spec.
  if (code === "NIF_PJ" || code === "CIF") return nifPjSpec;
  if (code === "NUSS") return nussSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

/** España (ES) document bundle for orchestrator registration. */
export const esBundle = {
  country: "ES",
  // NUSS identifies the natural person within the Seguridad Social system; it
  // is not a NIF and never doubles as one — kept on `personal` only.
  personal: [dniSpec, nieSpec, nussSpec, passportSpec],
  // DNI/NIE double as NIF for naturales/extranjeros; NIF_PJ for jurídicas.
  tax: [nifPjSpec, dniSpec, nieSpec],
  defaultPersonal: "ES_DNI",
  defaultTax: "ES_NIF_PJ",
} as const satisfies CountryDocumentBundle;
