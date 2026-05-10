/**
 * Poland document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/pl'`.
 *
 * Country code `PL` and document codes `PL_PESEL`, `PL_NIP`, `PL_REGON`
 * are added to `CountryCode` / `DocumentTypeCode` by the orchestrator at
 * integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { nipSpec } from "./nip.ts";
import { peselSpec } from "./pesel.ts";
import { regonSpec } from "./regon.ts";

export { nipSpec, peselSpec, regonSpec };

const SPECS = {
  PL_PESEL: peselSpec,
  PL_NIP: nipSpec,
  PL_REGON: regonSpec,
} as const;

export type PLDocumentType = keyof typeof SPECS;

type ShortCode = "PESEL" | "NIP" | "REGON";

export function validate(code: PLDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: PLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: PLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: PLDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: PLDocumentType | ShortCode): DocumentSpec {
  if (code === "PESEL") return peselSpec;
  if (code === "NIP") return nipSpec;
  if (code === "REGON") return regonSpec;
  return SPECS[code];
}

export const plBundle: CountryDocumentBundle = {
  country: "PL" as CountryDocumentBundle["country"],
  personal: [peselSpec],
  tax: [nipSpec, regonSpec, peselSpec],
  defaultPersonal: "PL_PESEL" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "PL_NIP" as CountryDocumentBundle["defaultTax"],
};
