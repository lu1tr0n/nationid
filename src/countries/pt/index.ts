/**
 * Portugal document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/pt'`.
 *
 * Country code `PT` and document codes `PT_NIF`, `PT_CC` are added to
 * `CountryCode` / `DocumentTypeCode` by the orchestrator at integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ccSpec } from "./cc.ts";
import type { NIFHolderType } from "./nif.ts";
import { nifHolderType, nifSpec } from "./nif.ts";
import { passportSpec } from "./passport.ts";

export type { NIFHolderType };
export { ccSpec, nifHolderType, nifSpec, passportSpec };

const SPECS = {
  PT_NIF: nifSpec,
  PT_CC: ccSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `PT_PASAPORTE` after all v0.5 agents complete.
  PT_PASAPORTE: passportSpec,
} as const;

export type PTDocumentType = keyof typeof SPECS;

type ShortCode = "NIF" | "NIPC" | "CC" | "PASAPORTE";

/**
 * Country-scoped validate. Accepts `PT_NIF`, `PT_CC` plus the short forms
 * `NIF`, `NIPC` (alias for jurídicas), `CC`, and `PASAPORTE`.
 */
export function validate(code: PTDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: PTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: PTDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: PTDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: PTDocumentType | ShortCode): DocumentSpec {
  if (code === "NIF" || code === "NIPC") return nifSpec;
  if (code === "CC") return ccSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

export const ptBundle: CountryDocumentBundle = {
  country: "PT" as CountryDocumentBundle["country"],
  personal: [ccSpec, passportSpec],
  // NIF doubles as the tax ID for both naturales and coletivos.
  tax: [nifSpec],
  defaultPersonal: "PT_CC" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "PT_NIF" as CountryDocumentBundle["defaultTax"],
};
