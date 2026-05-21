/**
 * Colombia document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/co'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ccSpec } from "./cc.ts";
import { ceSpec } from "./ce.ts";
import { nitSpec } from "./nit.ts";
import { pasaporteSpec } from "./pasaporte.ts";
import { pepSpec } from "./pep.ts";
import { pptSpec } from "./ppt.ts";
import { tiSpec } from "./ti.ts";

export { ccSpec, ceSpec, nitSpec, pasaporteSpec, pepSpec, pptSpec, tiSpec };

const SPECS = {
  CO_CC: ccSpec,
  CO_CE: ceSpec,
  CO_TI: tiSpec,
  CO_PASAPORTE: pasaporteSpec,
  CO_NIT: nitSpec,
  CO_PEP: pepSpec,
  CO_PPT: pptSpec,
} as const;

/** Union of CO document type codes accepted by the country-scoped helpers. */
export type CODocumentType = keyof typeof SPECS;

type ShortCode = "CC" | "CE" | "TI" | "PASAPORTE" | "NIT" | "PEP" | "PPT";

/**
 * Validate a Colombian (CO) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`CO_CC`, `CO_NIT`, ...) or short (`CC`, `CE`, `TI`, `PASAPORTE`, `NIT`, `PEP`, `PPT`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes CO-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/co";
 * validate("CO_CC", "1.020.304.050"); // true
 * validate("NIT", "900.123.456-1");
 * ```
 */
export function validate(code: CODocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a Colombian (CO) document into its canonical display form. */
export function format(code: CODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a Colombian (CO) document by stripping separators. */
export function normalize(code: CODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a Colombian (CO) document into a structured `ParseResult`. */
export function parse(code: CODocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: CODocumentType | ShortCode): DocumentSpec {
  if (code === "CC") return ccSpec;
  if (code === "CE") return ceSpec;
  if (code === "TI") return tiSpec;
  if (code === "PASAPORTE") return pasaporteSpec;
  if (code === "NIT") return nitSpec;
  if (code === "PEP") return pepSpec;
  if (code === "PPT") return pptSpec;
  return SPECS[code];
}

/** Colombia (CO) document bundle for orchestrator registration. */
export const coBundle: CountryDocumentBundle = {
  country: "CO",
  personal: [ccSpec, ceSpec, tiSpec, pasaporteSpec, pepSpec, pptSpec],
  tax: [nitSpec, ccSpec],
  defaultPersonal: "CO_CC",
  defaultTax: "CO_NIT",
};
