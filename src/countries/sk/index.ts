/**
 * Slovakia document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/sk'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = {
  SK_VAT: vatSpec,
} as const;

export type SKDocumentType = keyof typeof SPECS;

type ShortCode = "VAT" | "DPH" | "IC_DPH";

export function validate(code: SKDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: SKDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: SKDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: SKDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: SKDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT" || code === "DPH" || code === "IC_DPH") return vatSpec;
  return SPECS[code];
}

export const skBundle = {
  country: "SK",
  personal: [],
  tax: [vatSpec],
  defaultTax: "SK_VAT",
} as const satisfies CountryDocumentBundle;
