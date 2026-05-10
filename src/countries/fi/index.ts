/**
 * Finland document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/fi'`.
 *
 * Country code `FI` and document codes `FI_HETU`, `FI_YTUNNUS`, `FI_VAT`
 * are added to `CountryCode` / `DocumentTypeCode` by the orchestrator at
 * v0.6 integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { hetuSpec } from "./hetu.ts";
import { vatSpec } from "./vat.ts";
import { ytunnusSpec } from "./ytunnus.ts";

export { hetuSpec, vatSpec, ytunnusSpec };

const SPECS = {
  FI_HETU: hetuSpec,
  FI_YTUNNUS: ytunnusSpec,
  FI_VAT: vatSpec,
} as const;

export type FIDocumentType = keyof typeof SPECS;

type ShortCode = "HETU" | "YTUNNUS" | "Y" | "VAT" | "ALV";

export function validate(code: FIDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: FIDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: FIDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: FIDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: FIDocumentType | ShortCode): DocumentSpec {
  if (code === "HETU") return hetuSpec;
  if (code === "YTUNNUS" || code === "Y") return ytunnusSpec;
  if (code === "VAT" || code === "ALV") return vatSpec;
  return SPECS[code];
}

export const fiBundle: CountryDocumentBundle = {
  country: "FI" as CountryDocumentBundle["country"],
  personal: [hetuSpec],
  // HETU doubles as natural-person tax ID (Verohallinto); Y-tunnus / VAT for
  // legal entities.
  tax: [hetuSpec, ytunnusSpec, vatSpec],
  defaultPersonal: "FI_HETU" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "FI_YTUNNUS" as CountryDocumentBundle["defaultTax"],
};
