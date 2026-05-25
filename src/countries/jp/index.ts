/**
 * Japan document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/jp'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { corporateNumberSpec } from "./corporate-number.ts";
import { myNumberSpec } from "./my-number.ts";

export { corporateNumberSpec, myNumberSpec };

const SPECS = {
  JP_MY_NUMBER: myNumberSpec,
  JP_CORPORATE_NUMBER: corporateNumberSpec,
} as const;

/** Union of JP document type codes accepted by the country-scoped helpers. */
export type JPDocumentType = keyof typeof SPECS;

type ShortCode = "MY_NUMBER" | "CORPORATE_NUMBER";

/**
 * Validate a Japanese (JP) identity / tax document.
 *
 * @param code - Fully-qualified (`JP_MY_NUMBER`) or short (`MY_NUMBER`).
 * @param input - Raw document string (separators tolerated).
 */
export function validate(code: JPDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: JPDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: JPDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: JPDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: JPDocumentType | ShortCode): DocumentSpec {
  if (code === "MY_NUMBER") return myNumberSpec;
  if (code === "CORPORATE_NUMBER") return corporateNumberSpec;
  return SPECS[code];
}

export const jpBundle = {
  country: "JP",
  personal: [myNumberSpec],
  tax: [corporateNumberSpec],
  defaultPersonal: "JP_MY_NUMBER",
  defaultTax: "JP_CORPORATE_NUMBER",
} as const satisfies CountryDocumentBundle;
