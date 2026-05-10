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
import type { RIFHolderType } from "./rif.ts";
import { rifHolderType, rifSpec } from "./rif.ts";

export type { RIFHolderType };
export { cedulaSpec, rifHolderType, rifSpec };

const SPECS = {
  VE_CEDULA: cedulaSpec,
  VE_RIF: rifSpec,
} as const;

export type VEDocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RIF";

/** Country-scoped validate. Accepts `VE_CEDULA`, `VE_RIF`, `CEDULA`, `RIF`. */
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
  return SPECS[code];
}

export const veBundle: CountryDocumentBundle = {
  country: "VE" as CountryDocumentBundle["country"],
  personal: [cedulaSpec],
  tax: [rifSpec],
  defaultPersonal: "VE_CEDULA" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "VE_RIF" as CountryDocumentBundle["defaultTax"],
};
