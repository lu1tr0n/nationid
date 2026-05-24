/**
 * Luxembourg document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/lu'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = {
  LU_VAT: vatSpec,
} as const;

export type LUDocumentType = keyof typeof SPECS;

type ShortCode = "VAT" | "TVA";

export function validate(code: LUDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: LUDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: LUDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: LUDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: LUDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT" || code === "TVA") return vatSpec;
  return SPECS[code];
}

export const luBundle = {
  country: "LU",
  personal: [],
  tax: [vatSpec],
  defaultTax: "LU_VAT",
} as const satisfies CountryDocumentBundle;
