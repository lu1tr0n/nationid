/**
 * Croatia document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/hr'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { oibSpec } from "./oib.ts";

export { oibSpec };

const SPECS = { HR_OIB: oibSpec } as const;
export type HRDocumentType = keyof typeof SPECS;
type ShortCode = "OIB" | "VAT" | "PDV";

export function validate(code: HRDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}
export function format(code: HRDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}
export function normalize(code: HRDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}
export function parse(code: HRDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}
function resolveSpec(code: HRDocumentType | ShortCode): DocumentSpec {
  if (code === "OIB" || code === "VAT" || code === "PDV") return oibSpec;
  return SPECS[code];
}

export const hrBundle = {
  country: "HR",
  personal: [oibSpec],
  tax: [oibSpec],
  defaultPersonal: "HR_OIB",
  defaultTax: "HR_OIB",
} as const satisfies CountryDocumentBundle;
