/**
 * Venezuela document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ve'`.
 *
 * Country code `VE` and document codes `VE_CEDULA`, `VE_RIF` are added to
 * `CountryCode` / `DocumentTypeCode` by the orchestrator at integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { passportSpec } from "./passport.ts";
import type { RIFHolderType } from "./rif.ts";
import { rifHolderType, rifSpec } from "./rif.ts";

export type { RIFHolderType };
export { cedulaSpec, passportSpec, rifHolderType, rifSpec };

const SPECS = {
  VE_CEDULA: cedulaSpec,
  VE_RIF: rifSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `VE_PASAPORTE` after all v0.5 agents complete.
  VE_PASAPORTE: passportSpec,
} as const;

export type VEDocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RIF" | "PASAPORTE";

/** Country-scoped validate. Accepts `VE_CEDULA`, `VE_RIF`, `CEDULA`, `RIF`, `PASAPORTE`. */
export function validate(code: VEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: VEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: VEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: VEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: VEDocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA") return cedulaSpec;
  if (code === "RIF") return rifSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const veBundle: CountryDocumentBundle = {
  country: "VE" as CountryDocumentBundle["country"],
  personal: [cedulaSpec, passportSpec],
  tax: [rifSpec],
  defaultPersonal: "VE_CEDULA" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "VE_RIF" as CountryDocumentBundle["defaultTax"],
};
