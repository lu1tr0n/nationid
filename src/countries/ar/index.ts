/**
 * Argentina document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ar'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cdiSpec } from "./cdi.ts";
import { cuilSpec } from "./cuil.ts";
import { cuitSpec } from "./cuit.ts";
import { dniSpec } from "./dni.ts";
import { passportSpec } from "./passport.ts";

export { cdiSpec, cuilSpec, cuitSpec, dniSpec, passportSpec };

const SPECS = {
  AR_DNI: dniSpec,
  AR_CUIL: cuilSpec,
  AR_CUIT: cuitSpec,
  AR_CDI: cdiSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `AR_PASAPORTE` after all v0.5 agents complete.
  AR_PASAPORTE: passportSpec,
} as const;

export type ARDocumentType = keyof typeof SPECS;

type ShortCode = "DNI" | "CUIL" | "CUIT" | "CDI" | "PASAPORTE";

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
  if (code === "CDI") return cdiSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const arBundle: CountryDocumentBundle = {
  country: "AR",
  personal: [dniSpec, cuilSpec, passportSpec],
  // CUIT remains the primary tax doc; CUIL doubles as labor tax id; CDI is
  // ARCA's fallback identifier when a person has no CUIT/CUIL.
  tax: [cuitSpec, cuilSpec, cdiSpec],
  defaultPersonal: "AR_DNI",
  defaultTax: "AR_CUIT",
};
