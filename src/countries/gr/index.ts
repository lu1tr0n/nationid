/**
 * Greece document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/gr'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = { GR_VAT: vatSpec } as const;
export type GRDocumentType = keyof typeof SPECS;
type ShortCode = "VAT" | "AFM";

export function validate(code: GRDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: GRDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: GRDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: GRDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: GRDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT" || code === "AFM") return vatSpec;
  return SPECS[code];
}

export const grBundle = {
  country: "GR",
  personal: [],
  tax: [vatSpec],
  defaultTax: "GR_VAT",
} as const satisfies CountryDocumentBundle;
