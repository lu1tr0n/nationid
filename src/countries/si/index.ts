/**
 * Slovenia document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/si'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = { SI_VAT: vatSpec } as const;

export type SIDocumentType = keyof typeof SPECS;
type ShortCode = "VAT" | "DDV";

export function validate(code: SIDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: SIDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: SIDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: SIDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: SIDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT" || code === "DDV") return vatSpec;
  return SPECS[code];
}

export const siBundle = {
  country: "SI",
  personal: [],
  tax: [vatSpec],
  defaultTax: "SI_VAT",
} as const satisfies CountryDocumentBundle;
