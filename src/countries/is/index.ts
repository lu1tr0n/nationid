/**
 * Iceland document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/is'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vskSpec } from "./vsk.ts";

export { vskSpec };

const SPECS = { IS_VSK: vskSpec } as const;
export type ISDocumentType = keyof typeof SPECS;
type ShortCode = "VSK" | "VAT";

export function validate(code: ISDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: ISDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: ISDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: ISDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: ISDocumentType | ShortCode): DocumentSpec {
  if (code === "VSK" || code === "VAT") return vskSpec;
  return SPECS[code];
}

export const isBundle = {
  country: "IS",
  personal: [],
  tax: [vskSpec],
  defaultTax: "IS_VSK",
} as const satisfies CountryDocumentBundle;
