/**
 * Italy document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/it'`.
 */

import type {
  CountryCode,
  CountryDocumentBundle,
  DocumentSpec,
  DocumentTypeCode,
  ParseResult,
} from "../../core/types.ts";
import { cfSpec } from "./cf.ts";
import { pivaSpec } from "./piva.ts";

export { cfSpec, pivaSpec };

const SPECS = {
  // TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
  IT_CF: cfSpec,
  IT_PIVA: pivaSpec,
} as const;

export type ITDocumentType = keyof typeof SPECS;

type ShortCode = "CF" | "CODICE_FISCALE" | "PIVA" | "P_IVA" | "VAT";

/** Country-scoped validate: pass `IT_CF` or just `CF`. */
export function validate(code: ITDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: ITDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: ITDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: ITDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: ITDocumentType | ShortCode): DocumentSpec {
  if (code === "CF" || code === "CODICE_FISCALE") return cfSpec;
  if (code === "PIVA" || code === "P_IVA" || code === "VAT") return pivaSpec;
  return SPECS[code];
}

export const itBundle: CountryDocumentBundle = {
  country: "IT" as CountryCode,
  // CF for naturali; the entity 11-digit CF coincides with PIVA.
  personal: [cfSpec],
  // PIVA is the intra-EU VAT identifier; CF doubles as a tax ID for individuals.
  tax: [pivaSpec, cfSpec],
  // TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
  defaultPersonal: "IT_CF" as DocumentTypeCode,
  defaultTax: "IT_PIVA" as DocumentTypeCode,
};
