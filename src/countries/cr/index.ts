/**
 * Costa Rica document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/cr'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaFisicaSpec } from "./cedula-fisica.ts";
import { cedulaJuridicaSpec } from "./cedula-juridica.ts";
import { dimexSpec } from "./dimex.ts";
import { passportSpec } from "./passport.ts";

export { cedulaFisicaSpec, cedulaJuridicaSpec, dimexSpec, passportSpec };

const SPECS = {
  CR_CEDULA_FISICA: cedulaFisicaSpec,
  CR_DIMEX: dimexSpec,
  CR_CEDULA_JURIDICA: cedulaJuridicaSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `CR_PASAPORTE` after all v0.5 agents complete.
  CR_PASAPORTE: passportSpec,
} as const;

export type CRDocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA_FISICA" | "DIMEX" | "CEDULA_JURIDICA" | "PASAPORTE";

/** Country-scoped validate: pass either `CR_CEDULA_FISICA` or `CEDULA_FISICA`. */
export function validate(code: CRDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: CRDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: CRDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: CRDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: CRDocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA_FISICA") return cedulaFisicaSpec;
  if (code === "DIMEX") return dimexSpec;
  if (code === "CEDULA_JURIDICA") return cedulaJuridicaSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const crBundle: CountryDocumentBundle = {
  country: "CR",
  personal: [cedulaFisicaSpec, dimexSpec, passportSpec],
  tax: [cedulaJuridicaSpec, cedulaFisicaSpec],
  defaultPersonal: "CR_CEDULA_FISICA",
  defaultTax: "CR_CEDULA_JURIDICA",
};
