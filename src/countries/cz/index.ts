/**
 * Czechia document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/cz'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { dicSpec } from "./dic.ts";

export { dicSpec };

const SPECS = { CZ_DIC: dicSpec } as const;
export type CZDocumentType = keyof typeof SPECS;
type ShortCode = "DIC" | "VAT";

export function validate(code: CZDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: CZDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: CZDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: CZDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: CZDocumentType | ShortCode): DocumentSpec {
  if (code === "DIC" || code === "VAT") return dicSpec;
  return SPECS[code];
}

export const czBundle = {
  country: "CZ",
  personal: [],
  tax: [dicSpec],
  defaultTax: "CZ_DIC",
} as const satisfies CountryDocumentBundle;
