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

/** Union of FI document type codes accepted by the country-scoped helpers. */
export type FIDocumentType = keyof typeof SPECS;

type ShortCode = "HETU" | "YTUNNUS" | "Y" | "VAT" | "ALV";

/**
 * Validate a Finnish (FI) identity, business or VAT document.
 *
 * @param code - Document type, either fully-qualified (`FI_HETU`, `FI_YTUNNUS`, `FI_VAT`) or short (`HETU`, `YTUNNUS`, `Y`, `VAT`, `ALV`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes FI-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/fi";
 * validate("FI_HETU", "131052-308T"); // true
 * validate("YTUNNUS", "1572860-0");
 * ```
 */
export function validate(code: FIDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a Finnish (FI) document into its canonical display form. */
export function format(code: FIDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a Finnish (FI) document by stripping separators. */
export function normalize(code: FIDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a Finnish (FI) document into a structured `ParseResult`. */
export function parse(code: FIDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: FIDocumentType | ShortCode): DocumentSpec {
  if (code === "HETU") return hetuSpec;
  if (code === "YTUNNUS" || code === "Y") return ytunnusSpec;
  if (code === "VAT" || code === "ALV") return vatSpec;
  return SPECS[code];
}

/** Finland (FI) document bundle for orchestrator registration. */
export const fiBundle = {
  country: "FI",
  personal: [hetuSpec],
  // HETU doubles as natural-person tax ID (Verohallinto); Y-tunnus / VAT for
  // legal entities.
  tax: [hetuSpec, ytunnusSpec, vatSpec],
  defaultPersonal: "FI_HETU",
  defaultTax: "FI_YTUNNUS",
} as const satisfies CountryDocumentBundle;
