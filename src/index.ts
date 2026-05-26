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
import { atBundle } from "./countries/at/index.ts";
import { beBundle } from "./countries/be/index.ts";
import { bgBundle } from "./countries/bg/index.ts";
import { boBundle } from "./countries/bo/index.ts";
import { brBundle } from "./countries/br/index.ts";
import { caBundle } from "./countries/ca/index.ts";
import { chBundle } from "./countries/ch/index.ts";
import { clBundle } from "./countries/cl/index.ts";
import { coBundle } from "./countries/co/index.ts";
import { crBundle } from "./countries/cr/index.ts";
import { cyBundle } from "./countries/cy/index.ts";
import { czBundle } from "./countries/cz/index.ts";
import { deBundle } from "./countries/de/index.ts";
import { dkBundle } from "./countries/dk/index.ts";
import { doBundle } from "./countries/do/index.ts";
import { ecBundle } from "./countries/ec/index.ts";
import { eeBundle } from "./countries/ee/index.ts";
import { esBundle } from "./countries/es/index.ts";
import { fiBundle } from "./countries/fi/index.ts";
import { frBundle } from "./countries/fr/index.ts";
import { gbBundle } from "./countries/gb/index.ts";
import { grBundle } from "./countries/gr/index.ts";
import { gtBundle } from "./countries/gt/index.ts";
import { hnBundle } from "./countries/hn/index.ts";
import { hrBundle } from "./countries/hr/index.ts";
import { huBundle } from "./countries/hu/index.ts";
import { ieBundle } from "./countries/ie/index.ts";
import { inBundle } from "./countries/in/index.ts";
import { isBundle } from "./countries/is/index.ts";
import { itBundle } from "./countries/it/index.ts";
import { jpBundle } from "./countries/jp/index.ts";
import { ltBundle } from "./countries/lt/index.ts";
import { luBundle } from "./countries/lu/index.ts";
import { lvBundle } from "./countries/lv/index.ts";
import { mtBundle } from "./countries/mt/index.ts";
import { mxBundle } from "./countries/mx/index.ts";
import { niBundle } from "./countries/ni/index.ts";
import { nlBundle } from "./countries/nl/index.ts";
import { noBundle } from "./countries/no/index.ts";
import { paBundle } from "./countries/pa/index.ts";
import { peBundle } from "./countries/pe/index.ts";
import { plBundle } from "./countries/pl/index.ts";
import { ptBundle } from "./countries/pt/index.ts";
import { pyBundle } from "./countries/py/index.ts";
import { roBundle } from "./countries/ro/index.ts";
import { seBundle } from "./countries/se/index.ts";
import { siBundle } from "./countries/si/index.ts";
import { skBundle } from "./countries/sk/index.ts";
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
 * Adding a new country requires updating every place that derives from the
 * country/document code unions:
 *   1. Create `src/countries/<cc>/index.ts` exporting a `CountryDocumentBundle`.
 *   2. Import the bundle here and append it to `BUNDLES` below.
 *   3. Extend the `CountryCode` and `DocumentTypeCode` unions in
 *      `core/types.ts`.
 *   4. Add a subpath export entry in `package.json` and a matching entry in
 *      `tsup.config.ts`.
 *   5. Register the alpha-2 → alpha-3 + display fallback in
 *      `src/catalog/countries.ts` and the per-locale strings in
 *      `src/catalog/data/{common,en,es,pt}.ts`.
 *   6. Add the new doc codes to `src/pii/spec-table.ts` so `pii/mask`,
 *      `pii/hash`, `pii/lastN` know about them.
 *   7. Add property-test arbitraries in
 *      `tests/property/_arbitraries/<cc>.ts` and wire them into the spec-driven
 *      fast-check generator registry.
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
  // v0.6.0 — 12 European countries
  gbBundle,
  frBundle,
  deBundle,
  itBundle,
  nlBundle,
  beBundle,
  chBundle,
  plBundle,
  seBundle,
  noBundle,
  dkBundle,
  fiBundle,
  // v1.2.0 — Asia phase 1
  inBundle,
  // v2.1.0 — Asia phase 2: Japan
  jpBundle,
  // v2.0.0 — EU-VAT complete (16 EU + 1 EEA)
  ieBundle,
  atBundle,
  luBundle,
  grBundle,
  czBundle,
  huBundle,
  roBundle,
  bgBundle,
  hrBundle,
  skBundle,
  siBundle,
  ltBundle,
  lvBundle,
  eeBundle,
  mtBundle,
  cyBundle,
  isBundle,
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
 * Useful when you need direct access to the spec's regex, mask, country, or
 * confidence metadata without going through the wrapped `validate`/`format`
 * helpers. The returned spec is the same singleton instance held in the
 * internal registry; do not mutate it.
 *
 * Generic over the document type code: passing a literal narrows the returned
 * spec to `DocumentSpec<"MX_CURP">` so `.code` keeps its literal type instead
 * of widening to the whole `DocumentTypeCode` union. The runtime invariant
 * `REGISTRY.get(code).code === code` justifies the cast at the boundary.
 *
 * @typeParam C - The literal `DocumentTypeCode` of the requested spec.
 * @param code - Stable `DocumentTypeCode` such as `"SV_DUI"` or `"BR_CNPJ"`.
 * @returns The `DocumentSpec<C>` registered for `code`, with a code-narrowed
 *   return type for richer IDE inference.
 * @throws {Error} if `code` is not registered. Call `listSupportedCodes()` to
 *   inspect the set of known codes.
 * @example
 * ```ts
 * import { getSpec } from "nationid";
 *
 * const dui = getSpec("SV_DUI");
 * dui.code;                    // "SV_DUI" — literal, not the whole union
 * console.log(dui.country);    // "SV"
 * console.log(dui.confidence); // "moderate"
 * ```
 */
export function getSpec<C extends DocumentTypeCode>(code: C): DocumentSpec<C> {
  const spec = REGISTRY.get(code);
  if (!spec) {
    throw new Error(`nationid: no spec registered for "${code}"`);
  }
  // Safe: REGISTRY.get(code) returns the spec whose `.code === code` at runtime,
  // so its DocumentSpec<DocumentTypeCode> shape is also a valid DocumentSpec<C>.
  return spec as DocumentSpec<C>;
}

/**
 * Validate `input` against the document type identified by `code`.
 *
 * Internally normalizes the input (strips separators, uppercases). Returns
 * `true` only if both regex shape AND check digit pass. Never throws on
 * malformed input — use `parse()` if you need the failure reason.
 *
 * @param code - Document type to validate against (e.g. `"SV_DUI"`).
 * @param input - Raw user input; separators and case are tolerated.
 * @returns `true` if `input` is a syntactically and check-digit valid document.
 * @throws {Error} if `code` is not registered.
 * @example
 * ```ts
 * import { validate } from "nationid";
 *
 * validate("SV_DUI", "04567890-3");       // true
 * validate("SV_NIT", "06141505851012");   // true
 * validate("BR_CPF", "111.444.777-35");   // true
 * validate("BR_CPF", "111.444.777-00");   // false (bad check digit)
 * ```
 */
export function validate(code: DocumentTypeCode, input: string): boolean {
  return getSpec(code).validate(input);
}

/**
 * Strip separators and uppercase characters to produce the canonical storage
 * form. Idempotent: calling `normalize` twice yields the same string.
 *
 * Use the normalized form as the database column value so equality lookups
 * work regardless of how the user typed the document.
 *
 * @param code - Document type whose normalization rules apply.
 * @param input - Raw user input.
 * @returns Canonical storage form (digits/uppercase, no separators).
 * @throws {Error} if `code` is not registered.
 * @example
 * ```ts
 * normalize("BR_CNPJ", "12.345.678/0001-90"); // "12345678000190"
 * normalize("MX_CURP", "gomc850315hdfrrr07"); // "GOMC850315HDFRRR07"
 * ```
 */
export function normalize(code: DocumentTypeCode, input: string): string {
  return getSpec(code).normalize(input);
}

/**
 * Apply the canonical mask for display. If `input` is not a valid number for
 * `code`, returns `input` unchanged (soft fallback so render code never throws).
 *
 * @param code - Document type whose mask pattern applies.
 * @param input - Raw or normalized document body.
 * @returns Human-friendly formatted string with separators.
 * @throws {Error} if `code` is not registered.
 * @example
 * ```ts
 * format("BR_CNPJ", "12345678000190"); // "12.345.678/0001-90"
 * format("SV_DUI",  "045678903");      // "04567890-3"
 * ```
 */
export function format(code: DocumentTypeCode, input: string): string {
  return getSpec(code).format(input);
}

/**
 * Detailed parse with a discriminated `ParseResult`. Never throws on input
 * errors; instead returns `{ ok: false, error: { kind, ... } }` so callers can
 * branch on the failure mode (use this when you need to show a user-facing
 * error message via `nationid/i18n.getErrorMessage`).
 *
 * Generic over the document type code: passing a literal narrows the returned
 * `ParseResult<C>` so `result.code` keeps its literal type. A `switch (r.code)`
 * after the call sees only `C` as a reachable value, not the whole 124-member
 * `DocumentTypeCode` union.
 *
 * @typeParam C - The literal `DocumentTypeCode` of the document being parsed.
 * @param code - Document type to parse.
 * @param input - Raw user input.
 * @returns A discriminated union `ParseResult<C>`: `{ ok: true, value }` on
 *   success, or `{ ok: false, error }` describing why the input was rejected.
 *   `result.code` is narrowed to the literal `C`.
 * @throws {Error} if `code` is not registered (input errors do NOT throw).
 * @example
 * ```ts
 * const r = parse("BR_CPF", "111.444.777-00");
 * r.code;                       // "BR_CPF" — literal, not DocumentTypeCode
 * if (!r.ok) {
 *   console.log(r.reason.kind); // "invalid_checksum"
 * }
 * ```
 */
export function parse<C extends DocumentTypeCode>(code: C, input: string): ParseResult<C> {
  return getSpec(code).parse(input);
}

/**
 * List every supported `DocumentTypeCode` in registration order. Stable across
 * patch releases; new codes are appended (never inserted mid-list) so it is
 * safe to drive UI dropdowns from this list directly.
 *
 * @returns Read-only array of all registered document type codes.
 * @example
 * ```ts
 * listSupportedCodes().length; // 142 as of v2.1
 * listSupportedCodes().filter(c => c.startsWith("MX_")); // Mexico-only codes
 * ```
 */
export function listSupportedCodes(): ReadonlyArray<DocumentTypeCode> {
  return Array.from(REGISTRY.keys());
}

/**
 * List every supported ISO 3166-1 alpha-2 country code with at least one
 * registered document. Useful for country-pickers in UIs.
 *
 * @returns Read-only array of two-letter country codes (uppercase).
 * @example
 * ```ts
 * listSupportedCountries(); // ["SV", "MX", "CO", "BR", ...]
 * ```
 */
export function listSupportedCountries(): ReadonlyArray<CountryCode> {
  const set = new Set<CountryCode>();
  for (const spec of REGISTRY.values()) {
    set.add(spec.country);
  }
  return Array.from(set);
}
