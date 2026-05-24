/**
 * Malta document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/mt'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = {
  MT_VAT: vatSpec,
} as const;

export type MTDocumentType = keyof typeof SPECS;

type ShortCode = "VAT";

export function validate(code: MTDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: MTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: MTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: MTDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: MTDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT") return vatSpec;
  return SPECS[code];
}

export const mtBundle = {
  country: "MT",
  personal: [],
  tax: [vatSpec],
  defaultTax: "MT_VAT",
} as const satisfies CountryDocumentBundle;
