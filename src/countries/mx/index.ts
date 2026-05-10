/**
 * México document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/mx'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { claveElectorSpec } from "./clave-elector.ts";
import { curpSpec } from "./curp.ts";
import { rfcPfSpec } from "./rfc-pf.ts";
import { rfcPmSpec } from "./rfc-pm.ts";

export { claveElectorSpec, curpSpec, rfcPfSpec, rfcPmSpec };

const SPECS = {
  MX_CURP: curpSpec,
  MX_RFC_PF: rfcPfSpec,
  MX_RFC_PM: rfcPmSpec,
  MX_CLAVE_ELECTOR: claveElectorSpec,
} as const;

export type MXDocumentType = keyof typeof SPECS;

type ShortCode = "CURP" | "RFC_PF" | "RFC_PM" | "CLAVE_ELECTOR" | "INE";

/** Country-scoped validate: pass either `MX_CURP` or just `CURP`. */
export function validate(code: MXDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: MXDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: MXDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: MXDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: MXDocumentType | ShortCode): DocumentSpec {
  if (code === "CURP") return curpSpec;
  if (code === "RFC_PF") return rfcPfSpec;
  if (code === "RFC_PM") return rfcPmSpec;
  // `CLAVE_ELECTOR` and `INE` are both colloquial names for the same INE-issued
  // Clave de Elector printed on the credencial INE/IFE.
  if (code === "CLAVE_ELECTOR" || code === "INE") return claveElectorSpec;
  return SPECS[code];
}

export const mxBundle: CountryDocumentBundle = {
  country: "MX",
  personal: [curpSpec, claveElectorSpec],
  tax: [rfcPfSpec, rfcPmSpec],
  defaultPersonal: "MX_CURP",
  defaultTax: "MX_RFC_PF",
};
