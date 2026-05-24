/**
 * Latvia document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/lv'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = { LV_VAT: vatSpec } as const;
export type LVDocumentType = keyof typeof SPECS;
type ShortCode = "VAT" | "PVN";

export function validate(code: LVDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: LVDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: LVDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: LVDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: LVDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT" || code === "PVN") return vatSpec;
  return SPECS[code];
}

export const lvBundle = {
  country: "LV",
  personal: [],
  tax: [vatSpec],
  defaultTax: "LV_VAT",
} as const satisfies CountryDocumentBundle;
