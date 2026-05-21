/**
 * Catalog sub-feature.
 *
 * Queryable, locale-aware metadata for every document type. UIs use this to
 * build "select your document" dropdowns showing the correct local name.
 *
 * @example
 * ```ts
 * import { listDocuments } from "nationid/catalog";
 *
 * const options = listDocuments("MX", "es");
 * // → [{ code: "MX_CURP", displayName: "CURP", … }, …]
 * ```
 */

import type { CountryCode, DocumentSpec, DocumentTypeCode } from "../core/types.ts";
import { getPiiSpec, PII_SPEC_TABLE } from "../pii/spec-table.ts";
import { catalogCommon } from "./data/common.ts";
import { catalogEn } from "./data/en.ts";
import { catalogEs } from "./data/es.ts";
import { catalogPt } from "./data/pt.ts";
import type { DocumentInfo, Locale, LocaleStrings } from "./types.ts";

export type { DocumentInfo, DocumentPurpose, Locale, LocaleStrings } from "./types.ts";

const DEFAULT_LOCALE: Locale = "en";

/**
 * Cached array of every registered `DocumentTypeCode`. Built from the local
 * spec table (not from `src/index.ts:listSupportedCodes`) so the `nationid/catalog`
 * subpath bundle does not transitively pull the root REGISTRY graph.
 *
 * The ordering matches the object-literal declaration order in `PII_SPEC_TABLE`,
 * which mirrors the registration order in `src/index.ts` for backwards parity
 * with consumers iterating the catalog.
 */
const ALL_CODES: ReadonlyArray<DocumentTypeCode> = Object.keys(
  PII_SPEC_TABLE,
) as ReadonlyArray<DocumentTypeCode>;

/**
 * Locale → strings table lookup. Centralized here so the public API never
 * dispatches on locale via long if/else chains.
 */
const LOCALE_TABLES: Readonly<Record<Locale, Record<DocumentTypeCode, LocaleStrings>>> = {
  es: catalogEs,
  en: catalogEn,
  pt: catalogPt,
};

/**
 * Resolve a single `DocumentTypeCode` into a fully-populated `DocumentInfo`.
 *
 * Returns `null` if the code is unknown (defensive: callers may pass strings
 * widened beyond the union at runtime).
 */
function resolveInfo(code: DocumentTypeCode, locale: Locale): DocumentInfo | null {
  const common = catalogCommon[code];
  const strings = LOCALE_TABLES[locale][code];
  if (!common || !strings) return null;

  const spec: DocumentSpec | undefined = getPiiSpec(code);
  if (spec === undefined) return null;

  return {
    code,
    country: spec.country,
    displayName: strings.displayName,
    longName: strings.longName,
    knownAs: common.knownAs,
    description: strings.description,
    purpose: common.purpose,
    confidence: spec.confidence,
  };
}

/**
 * List every registered document type for `country` with locale-aware names.
 *
 * Drives the "select your document" dropdown in onboarding UIs. Returns an
 * empty array for an unknown country. Specs that lack a catalog entry are
 * silently skipped — the coverage test guarantees they exist.
 *
 * @param country - ISO 3166-1 alpha-2 country code (uppercase).
 * @param locale - Display locale (default `"en"`).
 * @returns Read-only array of `DocumentInfo`, one per registered spec.
 * @example
 * ```ts
 * import { listDocuments } from "nationid/catalog";
 *
 * const options = listDocuments("MX", "es");
 * // [{ code: "MX_CURP", displayName: "CURP", longName: "Clave Única…", … }, …]
 * ```
 */
export function listDocuments(
  country: CountryCode,
  locale: Locale = DEFAULT_LOCALE,
): readonly DocumentInfo[] {
  const out: DocumentInfo[] = [];
  for (const code of ALL_CODES) {
    if (!code.startsWith(`${country}_`)) continue;
    const info = resolveInfo(code, locale);
    if (info && info.country === country) out.push(info);
  }
  return out;
}

/**
 * Resolve one document's catalog info in the requested locale.
 *
 * @param code - Stable `DocumentTypeCode` (e.g. `"BR_CPF"`).
 * @param locale - Display locale (default `"en"`).
 * @returns A `DocumentInfo` with localized names, or `null` if `code` is not
 *   registered.
 * @example
 * ```ts
 * import { getDocumentInfo } from "nationid/catalog";
 *
 * const info = getDocumentInfo("BR_CPF", "pt");
 * info?.displayName; // "CPF"
 * info?.longName;    // "Cadastro de Pessoas Físicas"
 * ```
 */
export function getDocumentInfo(
  code: DocumentTypeCode,
  locale: Locale = DEFAULT_LOCALE,
): DocumentInfo | null {
  return resolveInfo(code, locale);
}

/**
 * List every registered document of `purpose`, across all countries, in `locale`.
 *
 * Useful for global filters such as "show me every tax ID we support".
 *
 * @param purpose - Filter, e.g. `"tax"`, `"personal"`.
 * @param locale - Display locale (default `"en"`).
 * @returns Read-only array of `DocumentInfo` matching `purpose`.
 * @example
 * ```ts
 * import { listDocumentsByPurpose } from "nationid/catalog";
 *
 * const taxIds = listDocumentsByPurpose("tax", "en");
 * // [{ code: "BR_CNPJ", … }, { code: "MX_RFC_PM", … }, …]
 * ```
 */
export function listDocumentsByPurpose(
  purpose: import("./types.ts").DocumentPurpose,
  locale: Locale = DEFAULT_LOCALE,
): readonly DocumentInfo[] {
  const out: DocumentInfo[] = [];
  for (const code of ALL_CODES) {
    if (catalogCommon[code].purpose !== purpose) continue;
    const info = resolveInfo(code, locale);
    if (info) out.push(info);
  }
  return out;
}
