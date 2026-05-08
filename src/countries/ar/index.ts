/**
 * Argentina document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ar'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cuilSpec } from "./cuil.ts";
import { cuitSpec } from "./cuit.ts";
import { dniSpec } from "./dni.ts";

export { cuilSpec, cuitSpec, dniSpec };

const SPECS = {
  AR_DNI: dniSpec,
  AR_CUIL: cuilSpec,
  AR_CUIT: cuitSpec,
} as const;

export type ARDocumentType = keyof typeof SPECS;

type ShortCode = "DNI" | "CUIL" | "CUIT";

/** Country-scoped validate: pass either `AR_DNI` or just `DNI`. */
export function validate(code: ARDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: ARDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: ARDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: ARDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: ARDocumentType | ShortCode): DocumentSpec {
  if (code === "DNI") return dniSpec;
  if (code === "CUIL") return cuilSpec;
  if (code === "CUIT") return cuitSpec;
  return SPECS[code];
}

export const arBundle: CountryDocumentBundle = {
  country: "AR",
  personal: [dniSpec, cuilSpec],
  tax: [cuitSpec, cuilSpec],
  defaultPersonal: "AR_DNI",
  defaultTax: "AR_CUIT",
};
