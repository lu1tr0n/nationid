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
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `BR_PASAPORTE` after all v0.5 agents complete.
  BR_PASAPORTE: passportSpec,
} as const;

export type BRDocumentType = keyof typeof SPECS;

/** Short-alias union accepted by the country-scoped helpers. */
type BRShortCode = "CPF" | "CNPJ" | "CNH" | "TITULO_ELEITOR" | "PIS" | "PASAPORTE";

/** Country-scoped validate: pass either `BR_CPF` or just `CPF`. */
export function validate(code: BRDocumentType | BRShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: BRDocumentType | BRShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: BRDocumentType | BRShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

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

export const brBundle: CountryDocumentBundle = {
  country: "BR",
  personal: [cpfSpec, cnhSpec, tituloEleitorSpec, pisSpec, passportSpec],
  tax: [cnpjSpec, cpfSpec, pisSpec],
  defaultPersonal: "BR_CPF",
  defaultTax: "BR_CNPJ",
};
