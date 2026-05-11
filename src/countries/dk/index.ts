/**
 * Denmark document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/dk'`.
 *
 * Country code `DK` and document codes `DK_CPR`, `DK_CVR`, `DK_VAT` are
 * added to `CountryCode` / `DocumentTypeCode` by the orchestrator at v0.6
 * integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cprMod11Legacy, cprSpec } from "./cpr.ts";
import { cvrSpec } from "./cvr.ts";
import { vatSpec } from "./vat.ts";

export { cprMod11Legacy, cprSpec, cvrSpec, vatSpec };

const SPECS = {
  DK_CPR: cprSpec,
  DK_CVR: cvrSpec,
  DK_VAT: vatSpec,
} as const;

export type DKDocumentType = keyof typeof SPECS;

type ShortCode = "CPR" | "CVR" | "VAT" | "MOMS";

export function validate(code: DKDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: DKDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: DKDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: DKDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: DKDocumentType | ShortCode): DocumentSpec {
  if (code === "CPR") return cprSpec;
  if (code === "CVR") return cvrSpec;
  if (code === "VAT" || code === "MOMS") return vatSpec;
  return SPECS[code];
}

export const dkBundle: CountryDocumentBundle = {
  country: "DK" as CountryDocumentBundle["country"],
  personal: [cprSpec],
  // CPR doubles as natural-person tax ID (SKAT); CVR / VAT for legal entities.
  tax: [cprSpec, cvrSpec, vatSpec],
  defaultPersonal: "DK_CPR" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "DK_CVR" as CountryDocumentBundle["defaultTax"],
};
