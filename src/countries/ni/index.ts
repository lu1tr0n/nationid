/**
 * Nicaragua document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ni'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { passportSpec } from "./passport.ts";
import { rucSpec } from "./ruc.ts";

export { cedulaSpec, passportSpec, rucSpec };

const SPECS = {
  NI_CEDULA: cedulaSpec,
  NI_RUC: rucSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `NI_PASAPORTE` after all v0.5 agents complete.
  NI_PASAPORTE: passportSpec,
} as const;

export type NIDocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RUC" | "PASAPORTE";

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
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const niBundle: CountryDocumentBundle = {
  country: "NI",
  personal: [cedulaSpec, passportSpec],
  tax: [rucSpec, cedulaSpec],
  defaultPersonal: "NI_CEDULA",
  defaultTax: "NI_RUC",
};
