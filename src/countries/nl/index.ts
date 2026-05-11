/**
 * Netherlands document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/nl'`.
 *
 * Country code `NL` and document codes `NL_BSN`, `NL_BTW` are added to
 * `CountryCode` / `DocumentTypeCode` by the orchestrator at integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { bsnSpec } from "./bsn.ts";
import { btwSpec } from "./btw.ts";

export { bsnSpec, btwSpec };

const SPECS = {
  NL_BSN: bsnSpec,
  NL_BTW: btwSpec,
} as const;

export type NLDocumentType = keyof typeof SPECS;

type ShortCode = "BSN" | "BTW" | "VAT";

/** Country-scoped validate. Accepts `NL_BSN`, `NL_BTW`, `BSN`, `BTW`, `VAT`. */
export function validate(code: NLDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: NLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: NLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: NLDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: NLDocumentType | ShortCode): DocumentSpec {
  if (code === "BSN") return bsnSpec;
  if (code === "BTW" || code === "VAT") return btwSpec;
  return SPECS[code];
}

export const nlBundle: CountryDocumentBundle = {
  country: "NL" as CountryDocumentBundle["country"],
  personal: [bsnSpec],
  tax: [btwSpec, bsnSpec],
  defaultPersonal: "NL_BSN" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "NL_BTW" as CountryDocumentBundle["defaultTax"],
};
