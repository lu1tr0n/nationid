/**
 * Belgium document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/be'`.
 *
 * Country code `BE` and document codes `BE_NRN`, `BE_BTW` are added to
 * `CountryCode` / `DocumentTypeCode` by the orchestrator at integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { btwSpec } from "./btw.ts";
import { nrnSpec } from "./nrn.ts";

export { btwSpec, nrnSpec };

const SPECS = {
  BE_NRN: nrnSpec,
  BE_BTW: btwSpec,
} as const;

export type BEDocumentType = keyof typeof SPECS;

type ShortCode = "NRN" | "RRN" | "BTW" | "TVA" | "VAT";

/** Country-scoped validate. Accepts `BE_NRN`, `BE_BTW`, plus short forms. */
export function validate(code: BEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: BEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: BEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: BEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: BEDocumentType | ShortCode): DocumentSpec {
  if (code === "NRN" || code === "RRN") return nrnSpec;
  if (code === "BTW" || code === "TVA" || code === "VAT") return btwSpec;
  return SPECS[code];
}

export const beBundle: CountryDocumentBundle = {
  country: "BE" as CountryDocumentBundle["country"],
  personal: [nrnSpec],
  tax: [btwSpec, nrnSpec],
  defaultPersonal: "BE_NRN" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "BE_BTW" as CountryDocumentBundle["defaultTax"],
};
