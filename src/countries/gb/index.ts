/**
 * United Kingdom document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/gb'`.
 */

import type {
  CountryCode,
  CountryDocumentBundle,
  DocumentSpec,
  DocumentTypeCode,
  ParseResult,
} from "../../core/types.ts";
import { nhsSpec } from "./nhs.ts";
import { ninoSpec } from "./nino.ts";
import { utrSpec } from "./utr.ts";
import { vatSpec } from "./vat.ts";

export { nhsSpec, ninoSpec, utrSpec, vatSpec };

const SPECS = {
  // TODO(v0.6-integration): orchestrator extends `DocumentTypeCode` with these.
  GB_NINO: ninoSpec,
  GB_UTR: utrSpec,
  GB_VAT: vatSpec,
  GB_NHS: nhsSpec,
} as const;

export type GBDocumentType = keyof typeof SPECS;

type ShortCode = "NINO" | "UTR" | "VAT" | "NHS";

/** Country-scoped validate: pass either `GB_NINO` or just `NINO`. */
export function validate(code: GBDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: GBDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: GBDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: GBDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: GBDocumentType | ShortCode): DocumentSpec {
  if (code === "NINO") return ninoSpec;
  if (code === "UTR") return utrSpec;
  if (code === "VAT") return vatSpec;
  if (code === "NHS") return nhsSpec;
  return SPECS[code];
}

export const gbBundle: CountryDocumentBundle = {
  country: "GB" as CountryCode,
  personal: [ninoSpec, nhsSpec],
  // NINO is also tax-relevant for individuals; UTR / VAT identify
  // self-employed and incorporated taxpayers respectively.
  tax: [utrSpec, vatSpec, ninoSpec],
  // TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
  defaultPersonal: "GB_NINO" as DocumentTypeCode,
  defaultTax: "GB_UTR" as DocumentTypeCode,
};
