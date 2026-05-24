/**
 * Estonia document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ee'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { vatSpec } from "./vat.ts";

export { vatSpec };

const SPECS = {
  EE_VAT: vatSpec,
} as const;

export type EEDocumentType = keyof typeof SPECS;

type ShortCode = "VAT" | "KMKR";

export function validate(code: EEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: EEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: EEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: EEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: EEDocumentType | ShortCode): DocumentSpec {
  if (code === "VAT" || code === "KMKR") return vatSpec;
  return SPECS[code];
}

export const eeBundle = {
  country: "EE",
  personal: [],
  tax: [vatSpec],
  defaultTax: "EE_VAT",
} as const satisfies CountryDocumentBundle;
