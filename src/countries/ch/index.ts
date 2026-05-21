/**
 * Switzerland document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/ch'`.
 *
 * Country code `CH` and document codes `CH_AHV`, `CH_UID`, `CH_MWST` are
 * added to `CountryCode` / `DocumentTypeCode` by the orchestrator at
 * integration time.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ahvSpec } from "./ahv.ts";
import { mwstSpec } from "./mwst.ts";
import { uidSpec } from "./uid.ts";

export { ahvSpec, mwstSpec, uidSpec };

const SPECS = {
  CH_AHV: ahvSpec,
  CH_UID: uidSpec,
  CH_MWST: mwstSpec,
} as const;

/** Union of CH document type codes accepted by the country-scoped helpers. */
export type CHDocumentType = keyof typeof SPECS;

type ShortCode = "AHV" | "AVS" | "UID" | "IDE" | "MWST" | "TVA" | "IVA" | "VAT";

/**
 * Validate a Swiss (CH) identity, business or VAT document.
 *
 * Accepts fully-qualified codes (`CH_AHV`, `CH_UID`, `CH_MWST`) and language aliases
 * (`AVS`, `IDE`, `TVA`, `IVA`, `VAT`).
 *
 * @param code - CH document type or short alias.
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes CH-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/ch";
 * validate("CH_AHV", "756.1234.5678.97"); // true
 * validate("UID", "CHE-123.456.788");
 * ```
 */
export function validate(code: CHDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a Swiss (CH) document into its canonical display form. */
export function format(code: CHDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a Swiss (CH) document by stripping separators. */
export function normalize(code: CHDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a Swiss (CH) document into a structured `ParseResult`. */
export function parse(code: CHDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: CHDocumentType | ShortCode): DocumentSpec {
  if (code === "AHV" || code === "AVS") return ahvSpec;
  if (code === "UID" || code === "IDE") return uidSpec;
  if (code === "MWST" || code === "TVA" || code === "IVA" || code === "VAT") return mwstSpec;
  return SPECS[code];
}

/** Switzerland (CH) document bundle for orchestrator registration. */
export const chBundle = {
  country: "CH",
  personal: [ahvSpec],
  tax: [uidSpec, mwstSpec],
  defaultPersonal: "CH_AHV",
  defaultTax: "CH_UID",
} as const satisfies CountryDocumentBundle;
