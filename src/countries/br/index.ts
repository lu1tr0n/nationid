/**
 * Brasil document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/br'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cnpjSpec } from "./cnpj.ts";
import { cpfSpec } from "./cpf.ts";

export { cnpjSpec, cpfSpec };

const SPECS = {
  BR_CPF: cpfSpec,
  BR_CNPJ: cnpjSpec,
} as const;

export type BRDocumentType = keyof typeof SPECS;

/** Country-scoped validate: pass either `BR_CPF` or just `CPF`. */
export function validate(code: BRDocumentType | "CPF" | "CNPJ", input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: BRDocumentType | "CPF" | "CNPJ", input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: BRDocumentType | "CPF" | "CNPJ", input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: BRDocumentType | "CPF" | "CNPJ", input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: BRDocumentType | "CPF" | "CNPJ"): DocumentSpec {
  if (code === "CPF") return cpfSpec;
  if (code === "CNPJ") return cnpjSpec;
  return SPECS[code];
}

export const brBundle: CountryDocumentBundle = {
  country: "BR",
  personal: [cpfSpec],
  tax: [cnpjSpec, cpfSpec],
  defaultPersonal: "BR_CPF",
  defaultTax: "BR_CNPJ",
};
