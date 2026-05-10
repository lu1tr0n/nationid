/**
 * Paraguay document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/py'`.
 *
 * TODO(v0.4-integration): orchestrator will register `PY_CI` and `PY_RUC`
 * codes in src/core/types.ts and root barrel src/index.ts after all v0.4
 * agents complete.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ciSpec } from "./ci.ts";
import { passportSpec } from "./passport.ts";
import { rucSpec } from "./ruc.ts";

export { ciSpec, passportSpec, rucSpec };

const SPECS = {
  PY_CI: ciSpec,
  PY_RUC: rucSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `PY_PASAPORTE` after all v0.5 agents complete.
  PY_PASAPORTE: passportSpec,
} as const;

export type PYDocumentType = keyof typeof SPECS;

type ShortCode = "CI" | "RUC" | "PASAPORTE";

/** Country-scoped validate: pass either `PY_CI` or just `CI`. */
export function validate(code: PYDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: PYDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: PYDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: PYDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: PYDocumentType | ShortCode): DocumentSpec {
  if (code === "CI") return ciSpec;
  if (code === "RUC") return rucSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const pyBundle: CountryDocumentBundle = {
  country: "PY",
  personal: [ciSpec, passportSpec],
  tax: [rucSpec],
  defaultPersonal: "PY_CI",
  defaultTax: "PY_RUC",
};
