/**
 * India document validators.
 *
 * Tree-shakable subpath: `import { validate } from 'nationid/in'`.
 */

import type { CountryDocumentBundle, DocumentSpec, ParseResult } from "../../core/types.ts";
import { aadhaarSpec } from "./aadhaar.ts";
import { epicSpec } from "./epic.ts";
import { gstinSpec } from "./gstin.ts";
import { panSpec } from "./pan.ts";
import { vidSpec } from "./vid.ts";

export { aadhaarSpec, epicSpec, gstinSpec, panSpec, vidSpec };

const SPECS = {
  IN_AADHAAR: aadhaarSpec,
  IN_PAN: panSpec,
  IN_GSTIN: gstinSpec,
  IN_EPIC: epicSpec,
  IN_VID: vidSpec,
} as const;

/** Union of IN document type codes accepted by the country-scoped helpers. */
export type INDocumentType = keyof typeof SPECS;

type ShortCode = "AADHAAR" | "PAN" | "GSTIN" | "EPIC" | "VID";

/**
 * Validate an Indian (IN) identity / tax document.
 *
 * @param code - Fully-qualified (`IN_AADHAAR`) or short (`AADHAAR`).
 * @param input - Raw document string (separators tolerated).
 */
export function validate(code: INDocumentType | ShortCode, input: string): boolean {
  return resolveSpec(code).validate(input);
}

export function format(code: INDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).format(input);
}

export function normalize(code: INDocumentType | ShortCode, input: string): string {
  return resolveSpec(code).normalize(input);
}

export function parse(code: INDocumentType | ShortCode, input: string): ParseResult {
  return resolveSpec(code).parse(input);
}

function resolveSpec(code: INDocumentType | ShortCode): DocumentSpec {
  if (code === "AADHAAR") return aadhaarSpec;
  if (code === "PAN") return panSpec;
  if (code === "GSTIN") return gstinSpec;
  if (code === "EPIC") return epicSpec;
  if (code === "VID") return vidSpec;
  return SPECS[code];
}

export const inBundle = {
  country: "IN",
  personal: [aadhaarSpec, vidSpec, epicSpec],
  tax: [panSpec, gstinSpec],
  defaultPersonal: "IN_AADHAAR",
  defaultTax: "IN_PAN",
} as const satisfies CountryDocumentBundle;
