/**
 * Lithuania document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/lt'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = { LT_VAT: vatSpec } as const;
export type LTDocumentType = keyof typeof SPECS;
type ShortCode = "VAT" | "PVM";

export function validate(code: LTDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: LTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: LTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: LTDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: LTDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT" || code === "PVM") return vatSpec;
  return SPECS[code];
}

export const ltBundle = {
  country: "LT",
  personal: [],
  tax: [vatSpec],
  defaultTax: "LT_VAT",
} as const satisfies CountryDocumentBundle;
