/**
 * Perú document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/pe'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ceSpec } from "./ce.ts";
import { dniSpec } from "./dni.ts";
import { rucSpec } from "./ruc.ts";

export { ceSpec, dniSpec, rucSpec };

const SPECS = {
  PE_DNI: dniSpec,
  PE_CE: ceSpec,
  PE_RUC: rucSpec,
} as const;

export type PEDocumentType = keyof typeof SPECS;

type ShortCode = "DNI" | "CE" | "RUC";

/** Country-scoped validate: pass either `PE_DNI` or just `DNI`. */
export function validate(code: PEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: PEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: PEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: PEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: PEDocumentType | ShortCode): DocumentSpec {
  if (code === "DNI") return dniSpec;
  if (code === "CE") return ceSpec;
  if (code === "RUC") return rucSpec;
  return SPECS[code];
}

export const peBundle: CountryDocumentBundle = {
  country: "PE",
  personal: [dniSpec, ceSpec],
  tax: [rucSpec],
  defaultPersonal: "PE_DNI",
  defaultTax: "PE_RUC",
};
