/**
 * Nicaragua document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ni'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { rucSpec } from "./ruc.ts";

export { cedulaSpec, rucSpec };

const SPECS = {
  NI_CEDULA: cedulaSpec,
  NI_RUC: rucSpec,
} as const;

export type NIDocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RUC";

/** Country-scoped validate: pass either `NI_CEDULA` or just `CEDULA`. */
export function validate(code: NIDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: NIDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: NIDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: NIDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: NIDocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA") return cedulaSpec;
  if (code === "RUC") return rucSpec;
  return SPECS[code];
}

export const niBundle: CountryDocumentBundle = {
  country: "NI",
  personal: [cedulaSpec],
  tax: [rucSpec, cedulaSpec],
  defaultPersonal: "NI_CEDULA",
  defaultTax: "NI_RUC",
};
