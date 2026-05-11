/**
 * France document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/fr'`.
 */

import type {
  CountryCode,
  CountryDocumentBundle,
  DocumentSpec,
  DocumentTypeCode,
  ParseResult,
} from "../../core/types.ts";
import { nirSpec } from "./nir.ts";
import { sirenSpec } from "./siren.ts";
import { siretSpec } from "./siret.ts";
import { tvaSpec } from "./tva.ts";

export { nirSpec, sirenSpec, siretSpec, tvaSpec };

const SPECS = {
  // TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
  FR_NIR: nirSpec,
  FR_SIREN: sirenSpec,
  FR_SIRET: siretSpec,
  FR_TVA: tvaSpec,
} as const;

export type FRDocumentType = keyof typeof SPECS;

type ShortCode = "NIR" | "SIREN" | "SIRET" | "TVA";

/** Country-scoped validate: pass either `FR_NIR` or just `NIR`. */
export function validate(code: FRDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: FRDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: FRDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: FRDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: FRDocumentType | ShortCode): DocumentSpec {
  if (code === "NIR") return nirSpec;
  if (code === "SIREN") return sirenSpec;
  if (code === "SIRET") return siretSpec;
  if (code === "TVA") return tvaSpec;
  return SPECS[code];
}

export const frBundle: CountryDocumentBundle = {
  country: "FR" as CountryCode,
  personal: [nirSpec],
  // SIREN identifies the legal entity; SIRET the establishment; TVA the
  // intra-EU VAT registration. NIR doubles as a tax ID for self-employed.
  tax: [sirenSpec, siretSpec, tvaSpec, nirSpec],
  // TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
  defaultPersonal: "FR_NIR" as DocumentTypeCode,
  defaultTax: "FR_SIREN" as DocumentTypeCode,
};
