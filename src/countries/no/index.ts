/**
 * Norway document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/no'`.
 *
 * Country code `NO` and document codes `NO_FNR`, `NO_DNR`, `NO_ORGNR`,
 * `NO_MVA` are added to `CountryCode` / `DocumentTypeCode` by the
 * orchestrator at v0.6 integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { dnrSpec } from "./dnr.ts";
import { fnrSpec } from "./fnr.ts";
import { mvaSpec } from "./mva.ts";
import { orgnrSpec } from "./orgnr.ts";

export { dnrSpec, fnrSpec, mvaSpec, orgnrSpec };

const SPECS = {
  NO_FNR: fnrSpec,
  NO_DNR: dnrSpec,
  NO_ORGNR: orgnrSpec,
  NO_MVA: mvaSpec,
} as const;

export type NODocumentType = keyof typeof SPECS;

type ShortCode = "FNR" | "FODSELSNUMMER" | "DNR" | "ORGNR" | "ORG" | "MVA" | "VAT";

export function validate(code: NODocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: NODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: NODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: NODocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: NODocumentType | ShortCode): DocumentSpec {
  if (code === "FNR" || code === "FODSELSNUMMER") return fnrSpec;
  if (code === "DNR") return dnrSpec;
  if (code === "ORGNR" || code === "ORG") return orgnrSpec;
  if (code === "MVA" || code === "VAT") return mvaSpec;
  return SPECS[code];
}

export const noBundle: CountryDocumentBundle = {
  country: "NO" as CountryDocumentBundle["country"],
  personal: [fnrSpec, dnrSpec],
  // FNR / DNR double as natural-person tax IDs; orgnr / MVA for legal entities.
  tax: [fnrSpec, dnrSpec, orgnrSpec, mvaSpec],
  defaultPersonal: "NO_FNR" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "NO_ORGNR" as CountryDocumentBundle["defaultTax"],
};
