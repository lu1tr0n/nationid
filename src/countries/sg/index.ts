/**
 * Singapore document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/sg'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { finSpec } from "./fin.ts";
import { nricSpec } from "./nric.ts";
import { uenSpec } from "./uen.ts";

export { finSpec, nricSpec, uenSpec };

const SPECS = {
  SG_NRIC: nricSpec,
  SG_FIN: finSpec,
  SG_UEN: uenSpec,
} as const;

/** Union of SG document type codes accepted by the country-scoped helpers. */
export type SGDocumentType = keyof typeof SPECS;

type ShortCode = "NRIC" | "FIN" | "UEN";

/**
 * Validate a Singapore (SG) identity / tax document.
 *
 * @param code - Fully-qualified (`SG_NRIC`) or short (`NRIC`).
 * @param input - Raw document string (separators tolerated).
 */
export function validate(code: SGDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: SGDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: SGDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: SGDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: SGDocumentType | ShortCode): DocumentSpec {
  if (code === "NRIC") return nricSpec;
  if (code === "FIN") return finSpec;
  if (code === "UEN") return uenSpec;
  return SPECS[code];
}

export const sgBundle = {
  country: "SG",
  personal: [nricSpec, finSpec],
  tax: [uenSpec],
  defaultPersonal: "SG_NRIC",
  defaultTax: "SG_UEN",
} as const satisfies CountryDocumentBundle;
