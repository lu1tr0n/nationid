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

export type CODocumentType = keyof typeof SPECS;

type ShortCode = "CC" | "CE" | "TI" | "PASAPORTE" | "NIT" | "PEP" | "PPT";

/** Country-scoped validate: pass either `CO_CC` or just `CC`. */
export function validate(code: CODocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: CODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: CODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

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

export const coBundle: CountryDocumentBundle = {
  country: "CO",
  personal: [ccSpec, ceSpec, tiSpec, pasaporteSpec, pepSpec, pptSpec],
  tax: [nitSpec, ccSpec],
  defaultPersonal: "CO_CC",
  defaultTax: "CO_NIT",
};
