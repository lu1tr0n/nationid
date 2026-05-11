/**
 * Sweden document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/se'`.
 *
 * Country code `SE` and document codes `SE_PERSONNUMMER`, `SE_ORGNR`,
 * `SE_VAT` are added to `CountryCode` / `DocumentTypeCode` by the
 * orchestrator at v0.6 integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { orgnrSpec } from "./orgnr.ts";
import { personnummerSpec } from "./personnummer.ts";
import { vatSpec } from "./vat.ts";

export { orgnrSpec, personnummerSpec, vatSpec };

const SPECS = {
  SE_PERSONNUMMER: personnummerSpec,
  SE_ORGNR: orgnrSpec,
  SE_VAT: vatSpec,
} as const;

export type SEDocumentType = keyof typeof SPECS;

type ShortCode = "PERSONNUMMER" | "PNR" | "ORGNR" | "ORG" | "VAT" | "MOMS";

/**
 * Country-scoped validate. Accepts fully-qualified codes (`SE_PERSONNUMMER`,
 * `SE_ORGNR`, `SE_VAT`) and short forms `PERSONNUMMER`, `PNR`, `ORGNR`,
 * `ORG`, `VAT`, `MOMS`.
 */
export function validate(code: SEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: SEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: SEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: SEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: SEDocumentType | ShortCode): DocumentSpec {
  if (code === "PERSONNUMMER" || code === "PNR") return personnummerSpec;
  if (code === "ORGNR" || code === "ORG") return orgnrSpec;
  if (code === "VAT" || code === "MOMS") return vatSpec;
  return SPECS[code];
}

export const seBundle: CountryDocumentBundle = {
  country: "SE" as CountryDocumentBundle["country"],
  personal: [personnummerSpec],
  // Personnummer doubles as natural-person tax ID (Skatteverket); orgnr / VAT
  // for legal entities.
  tax: [personnummerSpec, orgnrSpec, vatSpec],
  defaultPersonal: "SE_PERSONNUMMER" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "SE_ORGNR" as CountryDocumentBundle["defaultTax"],
};
