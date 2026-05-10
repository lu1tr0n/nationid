/**
 * Localized error-message catalog for `ParseError`.
 *
 * Public API:
 *   - `getErrorMessage(error, locale?, documentName?)` — full message with
 *     optional document-name interpolation and locale fallback.
 *   - `getErrorTemplate(kind, locale?)` — raw template (no interpolation).
 *   - `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `Locale` type.
 *
 * Locale strings live in `./locales/{es,en,pt}.ts` as standalone modules so
 * downstream consumers can import a single locale via `nationid/i18n/{lang}`
 * and pay only for what they use.
 *
 * @packageDocumentation
 */

import type { ParseError } from "../core/types.ts";

import { errors as enErrors, neutralDocument as enNeutral } from "./locales/en.ts";
import { errors as esErrors, neutralDocument as esNeutral } from "./locales/es.ts";
import { errors as ptErrors, neutralDocument as ptNeutral } from "./locales/pt.ts";

/** Supported locale tags shipped with v0.3. New locales land in v0.5 (EU). */
export type Locale = "es" | "en" | "pt";

export const SUPPORTED_LOCALES: readonly Locale[] = ["es", "en", "pt"] as const;

export const DEFAULT_LOCALE: Locale = "en";

/** Subset of `ParseError["kind"]` values we have hand-written templates for. */
type KnownKind = ParseError["kind"];

/** Shape every locale module satisfies. */
type LocaleBundle = {
  readonly errors: Readonly<Record<KnownKind, string>>;
  readonly neutralDocument: string;
};

const CATALOG: Readonly<Record<Locale, LocaleBundle>> = {
  es: { errors: esErrors, neutralDocument: esNeutral },
  en: { errors: enErrors, neutralDocument: enNeutral },
  pt: { errors: ptErrors, neutralDocument: ptNeutral },
};

/**
 * Forward-compatible generic fallback per locale, returned when an unknown
 * `kind` is supplied (e.g. when consumer code is older than the lib version).
 */
const GENERIC_FALLBACK: Readonly<Record<Locale, string>> = {
  es: "El {document} no es válido.",
  en: "The {document} is not valid.",
  pt: "O {document} não é válido.",
};

const TEMPLATE_SLOT = "{document}";

function resolveLocale(locale: Locale | undefined): Locale {
  if (locale && SUPPORTED_LOCALES.includes(locale)) {
    return locale;
  }
  return DEFAULT_LOCALE;
}

function isKnownKind(kind: string): kind is KnownKind {
  // Keep this list in lockstep with `ParseError["kind"]` in core/types.ts.
  return (
    kind === "empty" ||
    kind === "too_short" ||
    kind === "too_long" ||
    kind === "invalid_format" ||
    kind === "invalid_checksum"
  );
}

/**
 * Replace every `{document}` slot with the supplied substitute. Uses split/join
 * (not RegExp) to avoid re-escaping user-provided strings.
 */
function interpolate(template: string, substitute: string): string {
  if (!template.includes(TEMPLATE_SLOT)) {
    return template;
  }
  return template.split(TEMPLATE_SLOT).join(substitute);
}

/**
 * Returns a localized human-readable error message for a `ParseError`.
 *
 * Falls back to `DEFAULT_LOCALE` when `locale` is unsupported, and to a
 * generic per-locale message when the error `kind` is unknown (forward-compat
 * with future kinds added in core/types.ts).
 *
 * When `documentName` is omitted, the message uses neutral phrasing
 * ("the document" / "el documento" / "o documento").
 *
 * @example
 * getErrorMessage({ kind: "too_short" }, "es", "DUI")
 * // → "El DUI es demasiado corto."
 *
 * getErrorMessage({ kind: "empty" }, "en")
 * // → "Please enter a value."
 *
 * getErrorMessage({ kind: "invalid_format" }, "pt", "CPF")
 * // → "O formato do CPF não é válido."
 */
export function getErrorMessage(error: ParseError, locale?: Locale, documentName?: string): string {
  const lang = resolveLocale(locale);
  const bundle = CATALOG[lang];

  // `error.kind` is typed by `ParseError`, but the function may be called
  // from JS or with a future kind not yet represented in TS. Guard at runtime.
  const kind: string = (error as { kind: string }).kind;
  const template = isKnownKind(kind) ? bundle.errors[kind] : GENERIC_FALLBACK[lang];

  const trimmed = documentName?.trim();
  const slot = trimmed && trimmed.length > 0 ? trimmed : bundle.neutralDocument;
  return interpolate(template, slot);
}

/**
 * Returns the raw template string for `kind` in `locale` (no interpolation).
 *
 * The returned string still contains `{document}` for kinds other than
 * `empty`. Use `getErrorMessage` if you want substitution.
 */
export function getErrorTemplate(kind: ParseError["kind"], locale?: Locale): string {
  const lang = resolveLocale(locale);
  const bundle = CATALOG[lang];
  return isKnownKind(kind) ? bundle.errors[kind] : GENERIC_FALLBACK[lang];
}
