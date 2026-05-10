/**
 * Honduras document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/hn'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { dniSpec } from "./dni.ts";
import { passportSpec } from "./passport.ts";
import { rtnSpec } from "./rtn.ts";

export { dniSpec, passportSpec, rtnSpec };

const SPECS = {
  HN_DNI: dniSpec,
  HN_RTN: rtnSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `HN_PASAPORTE` after all v0.5 agents complete.
  HN_PASAPORTE: passportSpec,
} as const;

export type HNDocumentType = keyof typeof SPECS;

type ShortCode = "DNI" | "RTN" | "PASAPORTE";

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
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const hnBundle: CountryDocumentBundle = {
  country: "HN",
  personal: [dniSpec, passportSpec],
  tax: [rtnSpec, dniSpec],
  defaultPersonal: "HN_DNI",
  defaultTax: "HN_RTN",
};
