/**
 * Public types for the catalog sub-feature.
 *
 * Kept in a dedicated module so locale data files can import shared types
 * without pulling in the public API barrel.
 */

import type { Confidence, CountryCode, DocumentTypeCode } from "../core/types.ts";

/** Locales bundled with v0.3. New locales additive in future minors. */
export type Locale = "es" | "en" | "pt";

/**
 * High-level use case bucket. Lets UIs filter "show me all tax IDs" without
 * dispatching on `DocumentTypeCode` themselves.
 */
export type DocumentPurpose =
  | "identity"
  | "tax"
  | "voter"
  | "social_security"
  | "migratory"
  | "driver_license";

/** Localized strings stored per-document, per-locale. */
export interface LocaleStrings {
  readonly displayName: string;
  readonly longName: string;
  readonly description: string;
}

/**
 * Resolved catalog entry.
 *
 * `country` and `confidence` are sourced from the underlying `DocumentSpec`
 * to guarantee a single source of truth.
 */
export interface DocumentInfo {
  readonly code: DocumentTypeCode;
  readonly country: CountryCode;
  /** Short, recognizable name. e.g. "CURP", "RFC (Persona Física)", "Cédula de Ciudadanía". */
  readonly displayName: string;
  /** Full official name. e.g. "Clave Única de Registro de Población". */
  readonly longName: string;
  /** Alternative known names, abbreviations. e.g. ["CURP"], ["INE", "IFE"]. */
  readonly knownAs: readonly string[];
  /** One-sentence localized description. */
  readonly description: string;
  readonly purpose: DocumentPurpose;
  readonly confidence: Confidence;
}

/**
 * Resolved country catalog entry.
 *
 * `name` is sourced from `Intl.DisplayNames` (CLDR data shipped with the
 * runtime) so any BCP 47 locale the runtime supports works — not just
 * `es/en/pt`. `flag` is computed from the ISO 3166-1 alpha-2 code via
 * Regional Indicator Symbols, so it stays correct for any future country
 * we add.
 *
 * Future v1.x minors may extend this shape with optional fields
 * (`phonePrefix`, `currency`, `continent`, etc.). Existing fields keep
 * their semantics.
 */
export interface CountryInfo {
  /** ISO 3166-1 alpha-2 code, e.g. `"MX"`, `"BR"`. */
  readonly code: CountryCode;
  /** ISO 3166-1 alpha-3 code, e.g. `"MEX"`, `"BRA"`. */
  readonly alpha3: string;
  /** Localized country name (e.g. `"México"` for `"MX"` in `"es"`). */
  readonly name: string;
  /** Flag emoji, two Regional Indicator Symbols. */
  readonly flag: string;
}
