/**
 * Ecuador document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ec'`.
 *
 * TODO(v0.4-integration): orchestrator will register `EC_CEDULA` and
 * `EC_RUC` codes in src/core/types.ts and root barrel src/index.ts after
 * all v0.4 agents complete.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cedulaSpec } from "./cedula.ts";
import { passportSpec } from "./passport.ts";
import { rucSpec } from "./ruc.ts";

export { cedulaSpec, passportSpec, rucSpec };

const SPECS = {
  EC_CEDULA: cedulaSpec,
  EC_RUC: rucSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `EC_PASAPORTE` after all v0.5 agents complete.
  EC_PASAPORTE: passportSpec,
} as const;

export type ECDocumentType = keyof typeof SPECS;

type ShortCode = "CEDULA" | "RUC" | "PASAPORTE";

/** Country-scoped validate: pass either `EC_CEDULA` or just `CEDULA`. */
export function validate(code: ECDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: ECDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: ECDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: ECDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: ECDocumentType | ShortCode): DocumentSpec {
  if (code === "CEDULA") return cedulaSpec;
  if (code === "RUC") return rucSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const ecBundle: CountryDocumentBundle = {
  country: "EC",
  personal: [cedulaSpec, passportSpec],
  // RUC for naturales reuses cédula DV; expose cédula as a tax option too.
  tax: [rucSpec, cedulaSpec],
  defaultPersonal: "EC_CEDULA",
  defaultTax: "EC_RUC",
};
