/**
 * El Salvador document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/sv'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { duiSpec } from "./dui.ts";
import { nitSpec } from "./nit.ts";
import { passportSpec } from "./passport.ts";

export { duiSpec, nitSpec, passportSpec };

const SPECS = {
  SV_DUI: duiSpec,
  SV_NIT: nitSpec,
  SV_PASAPORTE: passportSpec,
} as const;

export type SVDocumentType = keyof typeof SPECS;

type ShortCode = "DUI" | "NIT" | "PASAPORTE";

/** Country-scoped validate: pass either `SV_DUI` or just `DUI`. */
export function validate(code: SVDocumentType | ShortCode, input: string): boolean {
  const spec = resolveSpec(code);
  return spec.validate(input);
}

export function format(code: SVDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: SVDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: SVDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: SVDocumentType | ShortCode): DocumentSpec {
  if (code === "DUI") return duiSpec;
  if (code === "NIT") return nitSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const svBundle: CountryDocumentBundle = {
  country: "SV",
  personal: [duiSpec, passportSpec],
  tax: [nitSpec, duiSpec],
  defaultPersonal: "SV_DUI",
  defaultTax: "SV_NIT",
};
