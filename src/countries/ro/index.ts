/**
 * Romania document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ro'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = { RO_VAT: vatSpec } as const;
export type RODocumentType = keyof typeof SPECS;
type ShortCode = "VAT" | "CUI" | "CIF" | "CF";

export function validate(code: RODocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: RODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: RODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: RODocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: RODocumentType | ShortCode): DocumentSpec {
  if (code === "VAT" || code === "CUI" || code === "CIF" || code === "CF") return vatSpec;
  return SPECS[code];
}

export const roBundle = {
  country: "RO",
  personal: [],
  tax: [vatSpec],
  defaultTax: "RO_VAT",
} as const satisfies CountryDocumentBundle;
