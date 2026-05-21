/**
 * Public type system for nationid.
 *
 * All types are stable contracts. Renaming or repurposing any of them is a
 * breaking change. New countries / document codes are additive.
 */

/** ISO 3166-1 alpha-2 — 22 countries through v0.5 + 12 European countries added in v0.6.0 */
export type CountryCode =
  // v0.1.0
  | "SV"
  | "MX"
  | "CO"
  | "BR"
  | "PE"
  | "AR"
  | "CL"
  | "DO"
  | "GT"
  | "HN"
  | "CR"
  | "ES"
  | "US"
  // v0.4.0 — 9 new
  | "BO"
  | "EC"
  | "PY"
  | "NI"
  | "PA"
  | "UY"
  | "CA"
  | "PT"
  | "VE"
  // v0.6.0 — 12 European countries
  | "GB"
  | "FR"
  | "DE"
  | "IT"
  | "NL"
  | "BE"
  | "CH"
  | "PL"
  | "SE"
  | "NO"
  | "DK"
  | "FI";

/**
 * Stable code persisted in DB. Format: `{ISO-2}_{TYPE}`.
 *
 * MUST never be renamed or repurposed once shipped — downstream consumers
 * persist these strings.
 */
export type DocumentTypeCode =
  // El Salvador
  | "SV_DUI"
  | "SV_NIT"
  // México
  | "MX_CURP"
  | "MX_RFC_PF"
  | "MX_RFC_PM"
  | "MX_CLAVE_ELECTOR"
  // Colombia
  | "CO_CC"
  | "CO_CE"
  | "CO_TI"
  | "CO_PASAPORTE"
  | "CO_NIT"
  | "CO_PEP"
  | "CO_PPT"
  // Brasil
  | "BR_CPF"
  | "BR_CNPJ"
  | "BR_CNH"
  | "BR_TITULO_ELEITOR"
  | "BR_PIS"
  // Perú
  | "PE_DNI"
  | "PE_CE"
  | "PE_RUC"
  // Argentina
  | "AR_DNI"
  | "AR_CUIL"
  | "AR_CUIT"
  | "AR_CDI"
  // Chile
  | "CL_RUT"
  // República Dominicana
  | "DO_CEDULA"
  | "DO_RNC"
  // Guatemala
  | "GT_DPI"
  | "GT_NIT"
  // Honduras
  | "HN_DNI"
  | "HN_RTN"
  // Costa Rica
  | "CR_CEDULA_FISICA"
  | "CR_DIMEX"
  | "CR_CEDULA_JURIDICA"
  // España
  | "ES_DNI"
  | "ES_NIE"
  | "ES_NIF_PJ"
  | "ES_NUSS"
  // United States
  | "US_SSN"
  | "US_ITIN"
  | "US_EIN"
  // v0.4.0 — Bolivia
  | "BO_CI"
  | "BO_NIT"
  // v0.4.0 — Ecuador
  | "EC_CEDULA"
  | "EC_RUC"
  // v0.4.0 — Paraguay
  | "PY_CI"
  | "PY_RUC"
  // v0.4.0 — Nicaragua
  | "NI_CEDULA"
  | "NI_RUC"
  // v0.4.0 — Panamá
  | "PA_CEDULA"
  | "PA_RUC"
  // v0.4.0 — Uruguay
  | "UY_CI"
  | "UY_RUT"
  // v0.4.0 — Canadá
  | "CA_SIN"
  | "CA_BN"
  // v0.4.0 — Portugal
  | "PT_NIF"
  | "PT_CC"
  // v0.4.0 — Venezuela
  | "VE_CEDULA"
  | "VE_RIF"
  // v0.5.0 — México (new social security code)
  | "MX_NSS"
  // v0.5.0 — Passport family (CO_PASAPORTE already shipped above)
  | "SV_PASAPORTE"
  | "MX_PASAPORTE"
  | "BR_PASAPORTE"
  | "PE_PASAPORTE"
  | "AR_PASAPORTE"
  | "CL_PASAPORTE"
  | "DO_PASAPORTE"
  | "GT_PASAPORTE"
  | "HN_PASAPORTE"
  | "CR_PASAPORTE"
  | "ES_PASAPORTE"
  | "US_PASAPORTE"
  | "BO_PASAPORTE"
  | "EC_PASAPORTE"
  | "PY_PASAPORTE"
  | "NI_PASAPORTE"
  | "PA_PASAPORTE"
  | "UY_PASAPORTE"
  | "CA_PASAPORTE"
  | "PT_PASAPORTE"
  | "VE_PASAPORTE"
  // v0.6.0 — United Kingdom
  | "GB_NINO"
  | "GB_UTR"
  | "GB_VAT"
  | "GB_NHS"
  // v0.6.0 — France
  | "FR_NIR"
  | "FR_SIREN"
  | "FR_SIRET"
  | "FR_TVA"
  // v0.6.0 — Germany
  | "DE_STEUER_ID"
  | "DE_STEUERNUMMER"
  | "DE_USTID"
  // v0.6.0 — Italy
  | "IT_CF"
  | "IT_PIVA"
  // v0.6.0 — Netherlands
  | "NL_BSN"
  | "NL_BTW"
  // v0.6.0 — Belgium
  | "BE_NRN"
  | "BE_BTW"
  // v0.6.0 — Switzerland
  | "CH_AHV"
  | "CH_UID"
  | "CH_MWST"
  // v0.6.0 — Poland
  | "PL_PESEL"
  | "PL_NIP"
  | "PL_REGON"
  // v0.6.0 — Sweden
  | "SE_PERSONNUMMER"
  | "SE_ORGNR"
  | "SE_VAT"
  // v0.6.0 — Norway
  | "NO_FNR"
  | "NO_DNR"
  | "NO_ORGNR"
  | "NO_MVA"
  // v0.6.0 — Denmark
  | "DK_CPR"
  | "DK_CVR"
  | "DK_VAT"
  // v0.6.0 — Finland
  | "FI_HETU"
  | "FI_YTUNNUS"
  | "FI_VAT";

/** Whether the document identifies a natural person, a tax entity, or both. */
export type DocumentScope = "personal" | "tax" | "both";

/**
 * Confidence in the validation algorithm we ship for a given document.
 *
 * - `high`: official source AND mature library agree.
 * - `moderate`: one official source OR mature library agrees; the other is missing.
 * - `low`: only community / reverse-engineered source. We validate format only.
 * - `unconfirmed`: format checked but no algorithm verified. Format-only validation.
 */
export type Confidence = "high" | "moderate" | "low" | "unconfirmed";

/**
 * Discriminated union returned by `parse()`.
 *
 * Parametrized over the document type code so the public root `parse<C>(code, input)`
 * can narrow `result.code` to the exact `C` the caller passed in (instead of the
 * whole `DocumentTypeCode` union). The default `C = DocumentTypeCode` keeps
 * unparametrized references (`ParseResult` with no type argument) backwards
 * compatible — they behave exactly as they did pre-v1.0.
 *
 * No exceptions are thrown from public API.
 */
export type ParseResult<C extends DocumentTypeCode = DocumentTypeCode> =
  | {
      readonly ok: true;
      readonly code: C;
      readonly normalized: string;
      readonly formatted: string;
      readonly confidence: Confidence;
    }
  | {
      readonly ok: false;
      readonly code: C;
      readonly reason: ParseError;
    };

export type ParseError =
  | { readonly kind: "empty" }
  | { readonly kind: "too_short" }
  | { readonly kind: "too_long" }
  | { readonly kind: "invalid_format" }
  | { readonly kind: "invalid_checksum" };

/**
 * Definition of one document type.
 *
 * Each country file under `src/countries/<cc>/` exports one or more specs.
 *
 * Parametrized over the document type code so the public root `getSpec<C>(code)`
 * can narrow the returned spec to the exact `C` the caller passed in. Existing
 * country files annotate their specs as `: DocumentSpec` (no type argument),
 * which resolves to `DocumentSpec<DocumentTypeCode>` via the default — no
 * per-country changes required.
 */
export interface DocumentSpec<C extends DocumentTypeCode = DocumentTypeCode> {
  readonly code: C;
  readonly country: CountryCode;
  readonly scope: DocumentScope;
  /** i18n key path, e.g. `documents.SV_DUI.label`. UI consumers resolve to localized text. */
  readonly labelKey: string;
  /** Regex matching the normalized form (no separators, uppercase). */
  readonly rawRegex: RegExp;
  /** Optional regex matching the formatted form a user might paste. */
  readonly formattedRegex?: RegExp;
  /** Mask pattern (cleave-style: `0`=digit, `A`=uppercase letter, `*`=alphanumeric). */
  readonly mask: string;
  /** True iff the spec includes a check-digit algorithm we trust to enforce. */
  readonly hasCheckDigit: boolean;
  readonly confidence: Confidence;
  /** Returns true iff input passes regex AND (when applicable) check digit. */
  validate(input: string): boolean;
  /** Strip separators, uppercase, trim. Idempotent. */
  normalize(input: string): string;
  /** Reverse of normalize, applies the canonical mask. Returns input unchanged if invalid. */
  format(input: string): string;
  /** Detailed parse with discriminated result. */
  parse(input: string): ParseResult<C>;
}

/**
 * Bundle of all specs for a country, plus convenience defaults.
 *
 * Each `src/countries/<cc>/index.ts` exports one of these.
 */
export interface CountryDocumentBundle {
  readonly country: CountryCode;
  /** All personal-scope specs for this country. */
  readonly personal: ReadonlyArray<DocumentSpec>;
  /** All tax-scope specs. */
  readonly tax: ReadonlyArray<DocumentSpec>;
  /** Default personal document type to surface in UI when none is selected. */
  readonly defaultPersonal: DocumentTypeCode;
  /** Default tax document type. */
  readonly defaultTax: DocumentTypeCode;
}
