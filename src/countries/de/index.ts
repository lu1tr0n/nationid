/**
 * Germany document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/de'`.
 */

import type {
  CountryCode,
  CountryDocumentBundle,
  DocumentSpec,
  DocumentTypeCode,
  ParseResult,
} from "../../core/types.ts";
import { steuerIdSpec } from "./steuer-id.ts";
import { steuernummerSpec } from "./steuernummer.ts";
import { ustidSpec } from "./ustid.ts";

export { steuerIdSpec, steuernummerSpec, ustidSpec };

const SPECS = {
  // TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
  DE_STEUER_ID: steuerIdSpec,
  DE_STEUERNUMMER: steuernummerSpec,
  DE_USTID: ustidSpec,
} as const;

export type DEDocumentType = keyof typeof SPECS;

type ShortCode = "STEUER_ID" | "IDNR" | "STEUERNUMMER" | "USTID" | "UST_ID" | "VAT";

/** Country-scoped validate: pass `DE_STEUER_ID` or just `IDNR`/`USTID`. */
export function validate(code: DEDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: DEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: DEDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: DEDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: DEDocumentType | ShortCode): DocumentSpec {
  if (code === "STEUER_ID" || code === "IDNR") return steuerIdSpec;
  if (code === "STEUERNUMMER") return steuernummerSpec;
  if (code === "USTID" || code === "UST_ID" || code === "VAT") return ustidSpec;
  return SPECS[code];
}

export const deBundle: CountryDocumentBundle = {
  country: "DE" as CountryCode,
  // Steuer-ID is the lifelong personal tax ID; it is the only personal-scope
  // document we ship for Germany.
  personal: [steuerIdSpec],
  // Tax: USt-IdNr for VAT, Steuernummer for the Land-issued tax number,
  // Steuer-ID also doubles as a tax ID for individuals.
  tax: [ustidSpec, steuernummerSpec, steuerIdSpec],
  // TODO(v0.6-integration): orchestrator extends `DocumentTypeCode`.
  defaultPersonal: "DE_STEUER_ID" as DocumentTypeCode,
  defaultTax: "DE_USTID" as DocumentTypeCode,
};
