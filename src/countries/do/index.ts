/**
 * República Dominicana document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/do'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { rncSpec } from "./rnc.ts";

export { cedulaSpec, rncSpec };

const SPECS = {
  DO_CEDULA: cedulaSpec,
  DO_RNC: rncSpec,
} as const;

export type DODocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RNC";

/** Country-scoped validate: pass either `DO_CEDULA` or just `CEDULA`. */
export function validate(code: DODocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: DODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: DODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: DODocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: DODocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA") return cedulaSpec;
  if (code === "RNC") return rncSpec;
  return SPECS[code];
}

export const doBundle: CountryDocumentBundle = {
  country: "DO",
  personal: [cedulaSpec],
  tax: [rncSpec, cedulaSpec],
  defaultPersonal: "DO_CEDULA",
  defaultTax: "DO_RNC",
};
