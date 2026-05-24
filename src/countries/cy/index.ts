/**
 * Cyprus document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/cy'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = { CY_VAT: vatSpec } as const;
export type CYDocumentType = keyof typeof SPECS;
type ShortCode = "VAT";

export function validate(code: CYDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: CYDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: CYDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: CYDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: CYDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT") return vatSpec;
  return SPECS[code];
}

export const cyBundle = {
  country: "CY",
  personal: [],
  tax: [vatSpec],
  defaultTax: "CY_VAT",
} as const satisfies CountryDocumentBundle;
