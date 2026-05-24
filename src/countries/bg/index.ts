/**
 * Bulgaria document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/bg'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = { BG_VAT: vatSpec } as const;
export type BGDocumentType = keyof typeof SPECS;
type ShortCode = "VAT";

export function validate(code: BGDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: BGDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: BGDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: BGDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: BGDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT") return vatSpec;
  return SPECS[code];
}

export const bgBundle = {
  country: "BG",
  personal: [],
  tax: [vatSpec],
  defaultTax: "BG_VAT",
} as const satisfies CountryDocumentBundle;
