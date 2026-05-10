/**
 * English (en) error message templates for `ParseError`.
 *
 * Standalone module — safe to import from `nationid/i18n/en` without pulling
 * the rest of the catalog. Each template uses `{document}` as the single
 * interpolation slot. Consumers should call `getErrorMessage()` for proper
 * substitution and locale fallback.
 */
export const errors = {
  empty: "Please enter a value.",
  too_short: "The {document} is too short.",
  too_long: "The {document} is too long.",
  invalid_format: "The {document} format is not valid.",
  invalid_checksum: "The {document} is not valid (checksum failed).",
} as const;

/**
 * Neutral fallback used when `getErrorMessage` is called without a
 * `documentName` argument. The phrase replaces `the {document}` so the
 * rendered sentence reads naturally in English.
 */
export const neutralDocument = "document";

export type ErrorTemplates = typeof errors;
