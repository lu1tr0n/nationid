/**
 * España document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/es'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { dniSpec } from "./dni.ts";
import { nieSpec } from "./nie.ts";
import { nifPjSpec } from "./nif-pj.ts";

export { dniSpec, nieSpec, nifPjSpec };

const SPECS = {
  ES_DNI: dniSpec,
  ES_NIE: nieSpec,
  ES_NIF_PJ: nifPjSpec,
} as const;

export type ESDocumentType = keyof typeof SPECS;

type ShortCode = "DNI" | "NIE" | "NIF_PJ" | "CIF";

/** Country-scoped validate: pass either `ES_DNI` or just `DNI` / `NIE` / `CIF`. */
export function validate(code: ESDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: ESDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: ESDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: ESDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: ESDocumentType | ShortCode): DocumentSpec {
  if (code === "DNI") return dniSpec;
  if (code === "NIE") return nieSpec;
  // `CIF` is the legacy alias for `NIF_PJ`; both resolve to the same spec.
  if (code === "NIF_PJ" || code === "CIF") return nifPjSpec;
  return SPECS[code];
}

export const esBundle: CountryDocumentBundle = {
  country: "ES",
  personal: [dniSpec, nieSpec],
  // DNI/NIE double as NIF for naturales/extranjeros; NIF_PJ for jurídicas.
  tax: [nifPjSpec, dniSpec, nieSpec],
  defaultPersonal: "ES_DNI",
  defaultTax: "ES_NIF_PJ",
};
