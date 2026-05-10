/**
 * Panamá document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/pa'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { passportSpec } from "./passport.ts";
import { rucSpec } from "./ruc.ts";

export { cedulaSpec, passportSpec, rucSpec };

const SPECS = {
  PA_CEDULA: cedulaSpec,
  PA_RUC: rucSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `PA_PASAPORTE` after all v0.5 agents complete.
  PA_PASAPORTE: passportSpec,
} as const;

export type PADocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RUC" | "PASAPORTE";

/** Country-scoped validate: pass either `PA_CEDULA` or just `CEDULA`. */
export function validate(code: PADocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: PADocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: PADocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: PADocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: PADocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA") return cedulaSpec;
  if (code === "RUC") return rucSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const paBundle: CountryDocumentBundle = {
  country: "PA",
  personal: [cedulaSpec, passportSpec],
  tax: [rucSpec, cedulaSpec],
  defaultPersonal: "PA_CEDULA",
  defaultTax: "PA_RUC",
};
