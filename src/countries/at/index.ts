/**
 * Austria document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/at'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { uidSpec } from "./uid.ts";

export { uidSpec };

const SPECS = {
  AT_UID: uidSpec,
} as const;

export type ATDocumentType = keyof typeof SPECS;

type ShortCode = "UID" | "VAT" | "USTID";

export function validate(code: ATDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: ATDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: ATDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: ATDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: ATDocumentType | ShortCode): DocumentSpec {
  if (code === "UID" || code === "VAT" || code === "USTID") return uidSpec;
  return SPECS[code];
}

export const atBundle = {
  country: "AT",
  personal: [],
  tax: [uidSpec],
  defaultTax: "AT_UID",
} as const satisfies CountryDocumentBundle;
