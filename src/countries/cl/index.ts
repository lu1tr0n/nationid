/**
 * Chile document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/cl'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { rutSpec } from "./rut.ts";

export { rutSpec };

const SPECS = {
  CL_RUT: rutSpec,
} as const;

export type CLDocumentType = keyof typeof SPECS;

/** Country-scoped validate: pass either `CL_RUT` or just `RUT` / `RUN`. */
export function validate(code: CLDocumentType | "RUT" | "RUN", input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: CLDocumentType | "RUT" | "RUN", input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: CLDocumentType | "RUT" | "RUN", input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: CLDocumentType | "RUT" | "RUN", input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: CLDocumentType | "RUT" | "RUN"): DocumentSpec {
  if (code === "RUT" || code === "RUN") return rutSpec;
  return SPECS[code];
}

export const clBundle: CountryDocumentBundle = {
  country: "CL",
  personal: [rutSpec],
  tax: [rutSpec],
  defaultPersonal: "CL_RUT",
  defaultTax: "CL_RUT",
};
