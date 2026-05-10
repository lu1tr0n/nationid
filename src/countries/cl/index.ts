/**
 * Chile document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/cl'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { passportSpec } from "./passport.ts";
import { rutSpec } from "./rut.ts";

export { passportSpec, rutSpec };

const SPECS = {
  CL_RUT: rutSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `CL_PASAPORTE` after all v0.5 agents complete.
  CL_PASAPORTE: passportSpec,
} as const;

export type CLDocumentType = keyof typeof SPECS;

type ShortCode = "RUT" | "RUN" | "PASAPORTE";

/** Country-scoped validate: pass either `CL_RUT` or just `RUT` / `RUN`. */
export function validate(code: CLDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: CLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: CLDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: CLDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: CLDocumentType | ShortCode): DocumentSpec {
  if (code === "RUT" || code === "RUN") return rutSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const clBundle: CountryDocumentBundle = {
  country: "CL",
  personal: [rutSpec, passportSpec],
  tax: [rutSpec],
  defaultPersonal: "CL_RUT",
  defaultTax: "CL_RUT",
};
