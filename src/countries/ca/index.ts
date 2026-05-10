/**
 * Canada document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ca'`.
 *
 * Country code `CA` and document codes `CA_SIN`, `CA_BN` are added to
 * `CountryCode` / `DocumentTypeCode` by the orchestrator at integration time.
 * Until then, individual specs cast their literal codes; consumers who import
 * via this module receive the spec objects with their declared types intact.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { bnSpec } from "./bn.ts";
import { isTemporaryResidentSIN, sinSpec } from "./sin.ts";

export { bnSpec, isTemporaryResidentSIN, sinSpec };

const SPECS = {
  CA_SIN: sinSpec,
  CA_BN: bnSpec,
} as const;

export type CADocumentType = keyof typeof SPECS;

type ShortCode = "SIN" | "NAS" | "BN";

/**
 * Country-scoped validate. Accepts the fully-qualified codes (`CA_SIN`,
 * `CA_BN`) and the short forms `SIN`, `NAS` (French alias for SIN), `BN`.
 */
export function validate(code: CADocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: CADocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: CADocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: CADocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: CADocumentType | ShortCode): DocumentSpec {
  if (code === "SIN" || code === "NAS") return sinSpec;
  if (code === "BN") return bnSpec;
  return SPECS[code];
}

export const caBundle: CountryDocumentBundle = {
  country: "CA" as CountryDocumentBundle["country"],
  personal: [sinSpec],
  // SIN doubles as the tax identifier for natural persons (CRA T1, T4 forms);
  // BN is the tax identifier for businesses.
  tax: [sinSpec, bnSpec],
  defaultPersonal: "CA_SIN" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "CA_BN" as CountryDocumentBundle["defaultTax"],
};
