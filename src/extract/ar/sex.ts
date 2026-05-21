/**
 * Sex extractor shared across Argentine `CUIT`, `CUIL`, `CDI`.
 *
 * AFIP/ARCA assigns the 2-digit prefix per RG AFIP 10/1997:
 *   - `20`/`23`/`24`/`25`/`26` → masculino (M).
 *   - `27` → femenino (F).
 *   - `30`/`33`/`34` → persona jurídica (X — non-binary marker re-used here as
 *     the catch-all "not a natural person" semantic).
 *   - `50` (CDI only) → not assigned to a person at all (succession, minor
 *     without DNI, etc). We return `null` to avoid implying a sex.
 *
 * `23` and `24` are issued when the algorithm produces dv == 10 with prefix
 * `20`/`27` and AFIP swaps to a free prefix, sometimes losing the male/female
 * signal in the process. Treating `23/24` as M is the documented AFIP convention
 * (most `23` numbers correspond to males whose original `20` was unavailable).
 *
 * Cross-validated 2026-05-09 against AFIP help center "¿Cómo se compone el
 * CUIT/CUIL?" page (archived) and the `argentine-validations` npm package.
 */

import type { DocumentSpec, DocumentTypeCode } from "../../core/types.ts";
import { cdiSpec } from "../../countries/ar/cdi.ts";
import { cuilSpec } from "../../countries/ar/cuil.ts";
import { cuitSpec } from "../../countries/ar/cuit.ts";
import type { Sex } from "../types.ts";

const MALE_PREFIXES: ReadonlySet<string> = new Set(["20", "23", "24", "25", "26"]);
const FEMALE_PREFIXES: ReadonlySet<string> = new Set(["27"]);
const JURIDICAL_PREFIXES: ReadonlySet<string> = new Set(["30", "33", "34"]);

/**
 * Per-code spec table local to this file. Importing the per-country spec files
 * directly (instead of going through `src/index.ts:getSpec`) keeps the
 * `nationid/extract` subpath from transitively pulling the entire 33-country
 * REGISTRY into bundles that only use AR extractors.
 */
const AR_SEX_SPECS = {
  AR_CUIT: cuitSpec,
  AR_CUIL: cuilSpec,
  AR_CDI: cdiSpec,
} as const satisfies Partial<Record<DocumentTypeCode, DocumentSpec>>;

type ArSexCode = keyof typeof AR_SEX_SPECS;

/**
 * Resolve sex from the 11-digit normalized AFIP/ARCA number. Returns `null`
 * for prefixes that don't carry a sex semantic (notably CDI prefix `50`).
 */
function sexFromPrefix(digits: string): Sex | null {
  const prefix = digits.slice(0, 2);
  if (MALE_PREFIXES.has(prefix)) return "M";
  if (FEMALE_PREFIXES.has(prefix)) return "F";
  if (JURIDICAL_PREFIXES.has(prefix)) return "X";
  return null;
}

export function extractArSex(code: DocumentTypeCode, input: string): Sex | null {
  const spec = AR_SEX_SPECS[code as ArSexCode];
  if (spec === undefined) return null;
  const result = spec.parse(input);
  if (!result.ok) return null;
  return sexFromPrefix(result.normalized);
}
