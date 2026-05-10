/**
 * Bolivia document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/bo'`.
 *
 * TODO(v0.4-integration): orchestrator will register `BO_CI` and `BO_NIT`
 * codes in src/core/types.ts and root barrel src/index.ts after all v0.4
 * agents complete.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { ciSpec } from "./ci.ts";
import { nitSpec } from "./nit.ts";

export { ciSpec, nitSpec };

const SPECS = {
  BO_CI: ciSpec,
  BO_NIT: nitSpec,
} as const;

export type BODocumentType = keyof typeof SPECS;

type ShortCode = "CI" | "NIT";

/** Country-scoped validate: pass either `BO_CI` or just `CI`. */
export function validate(code: BODocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: BODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: BODocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: BODocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: BODocumentType | ShortCode): DocumentSpec {
  if (code === "CI") return ciSpec;
  if (code === "NIT") return nitSpec;
  return SPECS[code];
}

export const boBundle: CountryDocumentBundle = {
  country: "BO",
  personal: [ciSpec],
  tax: [nitSpec],
  defaultPersonal: "BO_CI",
  defaultTax: "BO_NIT",
};
