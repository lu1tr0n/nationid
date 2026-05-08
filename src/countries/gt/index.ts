/**
 * Guatemala document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/gt'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { dpiSpec } from "./dpi.ts";
import { nitSpec } from "./nit.ts";

export { dpiSpec, nitSpec };

const SPECS = {
  GT_DPI: dpiSpec,
  GT_NIT: nitSpec,
} as const;

export type GTDocumentType = keyof typeof SPECS;

type ShortCode = "DPI" | "CUI" | "NIT";

/** Country-scoped validate: pass either `GT_DPI` or just `DPI` / `CUI`. */
export function validate(code: GTDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: GTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: GTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: GTDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: GTDocumentType | ShortCode): DocumentSpec {
  // CUI is a synonym for DPI used by RENAP.
  if (code === "DPI" || code === "CUI") return dpiSpec;
  if (code === "NIT") return nitSpec;
  return SPECS[code];
}

export const gtBundle: CountryDocumentBundle = {
  country: "GT",
  personal: [dpiSpec],
  tax: [nitSpec, dpiSpec],
  defaultPersonal: "GT_DPI",
  defaultTax: "GT_NIT",
};
