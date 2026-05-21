/**
 * Germany document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/de'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { steuerIdSpec } from "./steuer-id.ts";
import { steuernummerSpec } from "./steuernummer.ts";
import { ustidSpec } from "./ustid.ts";

export { steuerIdSpec, steuernummerSpec, ustidSpec };

const SPECS = {
  DE_STEUER_ID: steuerIdSpec,
  DE_STEUERNUMMER: steuernummerSpec,
  DE_USTID: ustidSpec,
} as const;

/** Union of DE document type codes accepted by the country-scoped helpers. */
export type DEDocumentType = keyof typeof SPECS;

type ShortCode = "STEUER_ID" | "IDNR" | "STEUERNUMMER" | "USTID" | "UST_ID" | "VAT";

/**
 * Validate a German (DE) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`DE_STEUER_ID`, `DE_STEUERNUMMER`, `DE_USTID`) or short (`STEUER_ID`, `IDNR`, `STEUERNUMMER`, `USTID`, `UST_ID`, `VAT`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes DE-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/de";
 * validate("DE_STEUER_ID", "65 929 970 489"); // true
 * validate("USTID", "DE123456788");
 * ```
 */
export function validate(code: DEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a German (DE) document into its canonical display form. */
export function format(code: DEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a German (DE) document by stripping separators. */
export function normalize(code: DEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a German (DE) document into a structured `ParseResult`. */
export function parse(code: DEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: DEDocumentType | ShortCode): DocumentSpec {
  if (code === "STEUER_ID" || code === "IDNR") return steuerIdSpec;
  if (code === "STEUERNUMMER") return steuernummerSpec;
  if (code === "USTID" || code === "UST_ID" || code === "VAT") return ustidSpec;
  return SPECS[code];
}

/** Germany (DE) document bundle for orchestrator registration. */
export const deBundle = {
  country: "DE",
  // Steuer-ID is the lifelong personal tax ID; it is the only personal-scope
  // document we ship for Germany.
  personal: [steuerIdSpec],
  // Tax: USt-IdNr for VAT, Steuernummer for the Land-issued tax number,
  // Steuer-ID also doubles as a tax ID for individuals.
  tax: [ustidSpec, steuernummerSpec, steuerIdSpec],
  defaultPersonal: "DE_STEUER_ID",
  defaultTax: "DE_USTID",
} as const satisfies CountryDocumentBundle;
