/**
 * nationid — TypeScript-first, zero-dependency validator for national identity
 * and tax documents from every country.
 *
 * @packageDocumentation
 */

import type {
  CountryCode,
  CountryDocumentBundle,
  DocumentSpec,
  DocumentTypeCode,
  ParseResult,
} from "./core/types.ts";

import { arBundle } from "./countries/ar/index.ts";
import { boBundle } from "./countries/bo/index.ts";
import { brBundle } from "./countries/br/index.ts";
import { caBundle } from "./countries/ca/index.ts";
import { clBundle } from "./countries/cl/index.ts";
import { coBundle } from "./countries/co/index.ts";
import { crBundle } from "./countries/cr/index.ts";
import { doBundle } from "./countries/do/index.ts";
import { ecBundle } from "./countries/ec/index.ts";
import { esBundle } from "./countries/es/index.ts";
import { gtBundle } from "./countries/gt/index.ts";
import { hnBundle } from "./countries/hn/index.ts";
import { mxBundle } from "./countries/mx/index.ts";
import { niBundle } from "./countries/ni/index.ts";
import { paBundle } from "./countries/pa/index.ts";
import { peBundle } from "./countries/pe/index.ts";
import { ptBundle } from "./countries/pt/index.ts";
import { pyBundle } from "./countries/py/index.ts";
import { svBundle } from "./countries/sv/index.ts";
import { usBundle } from "./countries/us/index.ts";
import { uyBundle } from "./countries/uy/index.ts";
import { veBundle } from "./countries/ve/index.ts";

// Public types
export type {
  Confidence,
  CountryCode,
  CountryDocumentBundle,
  DocumentScope,
  DocumentSpec,
  DocumentTypeCode,
  ParseError,
  ParseResult,
} from "./core/types.ts";

/**
 * Country bundles registered with the root API.
 *
 * Adding a new country requires:
 *   1. Create `src/countries/<cc>/index.ts` exporting a `CountryDocumentBundle`.
 *   2. Import the bundle here and append it to this list.
 *   3. Extend the `CountryCode` and `DocumentTypeCode` unions in `core/types.ts`.
 *   4. Add a subpath export entry in `package.json` and an entry in `tsup.config.ts`.
 */
const BUNDLES: ReadonlyArray<CountryDocumentBundle> = [
  // v0.1.0
  svBundle,
  mxBundle,
  coBundle,
  brBundle,
  peBundle,
  arBundle,
  clBundle,
  doBundle,
  gtBundle,
  hnBundle,
  crBundle,
  esBundle,
  usBundle,
  // v0.4.0 — 9 new countries
  boBundle,
  ecBundle,
  pyBundle,
  niBundle,
  paBundle,
  uyBundle,
  caBundle,
  ptBundle,
  veBundle,
];

/**
 * Internal registry mapping every supported `DocumentTypeCode` to its spec.
 *
 * Specs may appear in multiple bundle lists (e.g. `BR_CPF` is both personal
 * and tax). The map dedupes by `DocumentTypeCode`.
 */
const REGISTRY: ReadonlyMap<DocumentTypeCode, DocumentSpec> = (() => {
  const map = new Map<DocumentTypeCode, DocumentSpec>();
  for (const bundle of BUNDLES) {
    for (const spec of bundle.personal) map.set(spec.code, spec);
    for (const spec of bundle.tax) map.set(spec.code, spec);
  }
  return map;
})();

/**
 * Lookup a `DocumentSpec` by its stable code.
 *
 * @throws if the code is not registered (use `listSupportedCodes()` to inspect).
 */
export function getSpec(code: DocumentTypeCode): DocumentSpec {
  const spec = REGISTRY.get(code);
  if (!spec) {
    throw new Error(`nationid: no spec registered for "${code}"`);
  }
  return spec;
}

/**
 * Validate `input` against the document type identified by `code`.
 *
 * Internally normalizes the input (strips separators, uppercases). Returns
 * `true` only if both regex shape AND check digit pass.
 *
 * @example
 * validate('SV_DUI', '04567890-3')   // true
 * validate('SV_NIT', '06141505851012')  // true
 */
export function validate(code: DocumentTypeCode, input: string): boolean {
  return getSpec(code).validate(input);
}

/**
 * Strip separators and uppercase. Idempotent. Returns the canonical storage form.
 */
export function normalize(code: DocumentTypeCode, input: string): string {
  return getSpec(code).normalize(input);
}

/**
 * Apply the canonical mask for display. If `input` is not a valid number for
 * `code`, returns `input` unchanged.
 */
export function format(code: DocumentTypeCode, input: string): string {
  return getSpec(code).format(input);
}

/**
 * Detailed parse with discriminated result. Never throws on input errors.
 */
export function parse(code: DocumentTypeCode, input: string): ParseResult {
  return getSpec(code).parse(input);
}

/** List every supported `DocumentTypeCode`. */
export function listSupportedCodes(): ReadonlyArray<DocumentTypeCode> {
  return Array.from(REGISTRY.keys());
}

/** List every supported ISO 3166-1 alpha-2 country code. */
export function listSupportedCountries(): ReadonlyArray<CountryCode> {
  const set = new Set<CountryCode>();
  for (const spec of REGISTRY.values()) {
    set.add(spec.country);
  }
  return Array.from(set);
}
