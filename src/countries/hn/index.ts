/**
 * Honduras document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/hn'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { dniSpec } from "./dni.ts";
import { rtnSpec } from "./rtn.ts";

export { dniSpec, rtnSpec };

const SPECS = {
  HN_DNI: dniSpec,
  HN_RTN: rtnSpec,
} as const;

export type HNDocumentType = keyof typeof SPECS;

type ShortCode = "DNI" | "RTN";

/** Country-scoped validate: pass either `HN_DNI` or just `DNI`. */
export function validate(code: HNDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: HNDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: HNDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: HNDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: HNDocumentType | ShortCode): DocumentSpec {
  if (code === "DNI") return dniSpec;
  if (code === "RTN") return rtnSpec;
  return SPECS[code];
}

export const hnBundle: CountryDocumentBundle = {
  country: "HN",
  personal: [dniSpec],
  tax: [rtnSpec, dniSpec],
  defaultPersonal: "HN_DNI",
  defaultTax: "HN_RTN",
};
