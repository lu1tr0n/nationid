/**
 * México document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/mx'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { claveElectorSpec } from "./clave-elector.ts";
import { curpSpec } from "./curp.ts";
import { nssSpec } from "./nss.ts";
import { passportSpec } from "./passport.ts";
import { rfcPfSpec } from "./rfc-pf.ts";
import { rfcPmSpec } from "./rfc-pm.ts";

export { claveElectorSpec, curpSpec, nssSpec, passportSpec, rfcPfSpec, rfcPmSpec };

const SPECS = {
  MX_CURP: curpSpec,
  MX_RFC_PF: rfcPfSpec,
  MX_RFC_PM: rfcPmSpec,
  MX_CLAVE_ELECTOR: claveElectorSpec,
  // TODO(v0.5-integration): drop the cast once `MX_NSS` lands in
  // `src/core/types.ts` `DocumentTypeCode`. Keying the SPECS map by the
  // string literal keeps the lookup table tree-shakable.
  MX_NSS: nssSpec,
  // TODO(v0.5-integration): orchestrator extends `DocumentTypeCode` with
  // `MX_PASAPORTE` after all v0.5 agents complete.
  MX_PASAPORTE: passportSpec,
} as const;

export type MXDocumentType = keyof typeof SPECS;

type ShortCode = "CURP" | "RFC_PF" | "RFC_PM" | "CLAVE_ELECTOR" | "INE" | "NSS" | "PASAPORTE";

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
  if (code === "NSS") return nssSpec;
  if (code === "PASAPORTE") return passportSpec;
  // `CLAVE_ELECTOR` and `INE` are both colloquial names for the same INE-issued
  // Clave de Elector printed on the credencial INE/IFE.
  if (code === "CLAVE_ELECTOR" || code === "INE") return claveElectorSpec;
  return SPECS[code];
}

export const mxBundle: CountryDocumentBundle = {
  country: "MX",
  // NSS sits in `personal` (purpose: social_security) alongside CURP and the
  // Clave de Elector. RFC remains the only tax-scope MX doc family.
  personal: [curpSpec, claveElectorSpec, nssSpec, passportSpec],
  tax: [rfcPfSpec, rfcPmSpec],
  defaultPersonal: "MX_CURP",
  defaultTax: "MX_RFC_PF",
};
