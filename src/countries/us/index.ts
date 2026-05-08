/**
 * United States document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/us'`.
 *
 * Note: SSN and ITIN share the same 9-digit namespace; use the area-prefix
 * rule (`9xx` => ITIN; otherwise SSN) to disambiguate when the document
 * type is unknown at the call site.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { einSpec } from "./ein.ts";
import { itinSpec } from "./itin.ts";
import { ssnSpec } from "./ssn.ts";

export { einSpec, itinSpec, ssnSpec };

const SPECS = {
  US_SSN: ssnSpec,
  US_ITIN: itinSpec,
  US_EIN: einSpec,
} as const;

export type USDocumentType = keyof typeof SPECS;

type ShortCode = "SSN" | "ITIN" | "EIN";

/** Country-scoped validate: pass either `US_SSN` or just `SSN` / `ITIN` / `EIN`. */
export function validate(code: USDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: USDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: USDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: USDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: USDocumentType | ShortCode): DocumentSpec {
  if (code === "SSN") return ssnSpec;
  if (code === "ITIN") return itinSpec;
  if (code === "EIN") return einSpec;
  return SPECS[code];
}

export const usBundle: CountryDocumentBundle = {
  country: "US",
  personal: [ssnSpec, itinSpec],
  tax: [einSpec, itinSpec, ssnSpec],
  defaultPersonal: "US_SSN",
  defaultTax: "US_EIN",
};
