/**
 * Uruguay document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/uy'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ciSpec } from "./ci.ts";
import { rutSpec } from "./rut.ts";

export { ciSpec, rutSpec };

const SPECS = {
  UY_CI: ciSpec,
  UY_RUT: rutSpec,
} as const;

export type UYDocumentType = keyof typeof SPECS;

type ShortCode = "CI" | "RUT";

/** Country-scoped validate: pass either `UY_CI` or just `CI`. */
export function validate(code: UYDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: UYDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: UYDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: UYDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: UYDocumentType | ShortCode): DocumentSpec {
  if (code === "CI") return ciSpec;
  if (code === "RUT") return rutSpec;
  return SPECS[code];
}

export const uyBundle: CountryDocumentBundle = {
  country: "UY",
  personal: [ciSpec],
  tax: [rutSpec, ciSpec],
  defaultPersonal: "UY_CI",
  defaultTax: "UY_RUT",
};
