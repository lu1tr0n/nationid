/**
 * El Salvador document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/sv'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { duiSpec } from "./dui.ts";
import { nitSpec } from "./nit.ts";

export { duiSpec, nitSpec };

const SPECS = {
  SV_DUI: duiSpec,
  SV_NIT: nitSpec,
} as const;

export type SVDocumentType = keyof typeof SPECS;

/** Country-scoped validate: pass either `SV_DUI` or just `DUI`. */
export function validate(code: SVDocumentType | "DUI" | "NIT", input: string): boolean {
  const spec = resolveSpec(code);
  return spec.validate(input);
}

export function format(code: SVDocumentType | "DUI" | "NIT", input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: SVDocumentType | "DUI" | "NIT", input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: SVDocumentType | "DUI" | "NIT", input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: SVDocumentType | "DUI" | "NIT"): DocumentSpec {
  if (code === "DUI") return duiSpec;
  if (code === "NIT") return nitSpec;
  return SPECS[code];
}

export const svBundle: CountryDocumentBundle = {
  country: "SV",
  personal: [duiSpec],
  tax: [nitSpec, duiSpec],
  defaultPersonal: "SV_DUI",
  defaultTax: "SV_NIT",
};
