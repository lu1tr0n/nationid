/**
 * Brasil document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/br'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { cnhSpec } from "./cnh.ts";
import { cnpjSpec } from "./cnpj.ts";
import { cpfSpec } from "./cpf.ts";
import { passportSpec } from "./passport.ts";
import { pisSpec } from "./pis.ts";
import { tituloEleitorSpec } from "./titulo-eleitor.ts";

export { cnhSpec, cnpjSpec, cpfSpec, passportSpec, pisSpec, tituloEleitorSpec };

const SPECS = {
  BR_CPF: cpfSpec,
  BR_CNPJ: cnpjSpec,
  BR_CNH: cnhSpec,
  BR_TITULO_ELEITOR: tituloEleitorSpec,
  BR_PIS: pisSpec,
  BR_PASAPORTE: passportSpec,
} as const;

/** Union of BR document type codes accepted by the country-scoped helpers. */
export type BRDocumentType = keyof typeof SPECS;

/** Short-alias union accepted by the country-scoped helpers. */
type BRShortCode = "CPF" | "CNPJ" | "CNH" | "TITULO_ELEITOR" | "PIS" | "PASAPORTE";

/**
 * Validate a Brazilian (BR) identity or tax document.
 *
 * @param code - Document type, either fully-qualified (`BR_CPF`, `BR_CNPJ`, ...) or short (`CPF`, `CNPJ`, `CNH`, `TITULO_ELEITOR`, `PIS`, `PASAPORTE`).
 * @param input - Raw document string (formatting tolerated).
 * @returns `true` if the value passes BR-specific validation rules.
 * @example
 * ```ts
 * import { validate } from "nationid/br";
 * validate("BR_CPF", "111.444.777-35"); // true
 * validate("CNPJ", "11.222.333/0001-81");
 * ```
 */
export function validate(code: BRDocumentType | BRShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

/** Format a Brazilian (BR) document into its canonical display form. */
export function format(code: BRDocumentType | BRShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

/** Normalize a Brazilian (BR) document by stripping separators. */
export function normalize(code: BRDocumentType | BRShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

/** Parse a Brazilian (BR) document into a structured `ParseResult`. */
export function parse(code: BRDocumentType | BRShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: BRDocumentType | BRShortCode): DocumentSpec {
  if (code === "CPF") return cpfSpec;
  if (code === "CNPJ") return cnpjSpec;
  if (code === "CNH") return cnhSpec;
  if (code === "TITULO_ELEITOR") return tituloEleitorSpec;
  if (code === "PIS") return pisSpec;
  if (code === "PASAPORTE") return passportSpec;
  return SPECS[code];
}

/** Brasil (BR) document bundle for orchestrator registration. */
export const brBundle = {
  country: "BR",
  personal: [cpfSpec, cnhSpec, tituloEleitorSpec, pisSpec, passportSpec],
  tax: [cnpjSpec, cpfSpec, pisSpec],
  defaultPersonal: "BR_CPF",
  defaultTax: "BR_CNPJ",
} as const satisfies CountryDocumentBundle;
