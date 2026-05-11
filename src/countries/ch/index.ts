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

export type CHDocumentType = keyof typeof SPECS;

type ShortCode = "AHV" | "AVS" | "UID" | "IDE" | "MWST" | "TVA" | "IVA" | "VAT";

export function validate(code: CHDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: CHDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: CHDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: CHDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: CHDocumentType | ShortCode): DocumentSpec {
  if (code === "AHV" || code === "AVS") return ahvSpec;
  if (code === "UID" || code === "IDE") return uidSpec;
  if (code === "MWST" || code === "TVA" || code === "IVA" || code === "VAT") return mwstSpec;
  return SPECS[code];
}

export const chBundle: CountryDocumentBundle = {
  country: "CH" as CountryDocumentBundle["country"],
  personal: [ahvSpec],
  tax: [uidSpec, mwstSpec],
  defaultPersonal: "CH_AHV" as CountryDocumentBundle["defaultPersonal"],
  defaultTax: "CH_UID" as CountryDocumentBundle["defaultTax"],
};
