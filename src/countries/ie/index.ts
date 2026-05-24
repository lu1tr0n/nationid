/**
 * Ireland document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ie'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = { IE_VAT: vatSpec } as const;
export type IEDocumentType = keyof typeof SPECS;
type ShortCode = "VAT";

export function validate(code: IEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: IEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: IEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: IEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: IEDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT") return vatSpec;
  return SPECS[code];
}

export const ieBundle = {
  country: "IE",
  personal: [],
  tax: [vatSpec],
  defaultTax: "IE_VAT",
} as const satisfies CountryDocumentBundle;
