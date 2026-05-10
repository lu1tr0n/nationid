/**
 * Spanish (es) error message templates for `ParseError`.
 *
 * Standalone module — safe to import from `nationid/i18n/es` without pulling
 * the rest of the catalog. Each template uses `{document}` as the single
 * interpolation slot. Consumers should call `getErrorMessage()` for proper
 * substitution and locale fallback.
 *
 * Orthographic note: tildes are intentional. Do not "simplify" them.
 */
export const errors = {
  empty: "Ingresa un valor.",
  too_short: "El {document} es demasiado corto.",
  too_long: "El {document} es demasiado largo.",
  invalid_format: "El formato del {document} no es válido.",
  invalid_checksum: "El {document} no es válido (dígito verificador incorrecto).",
} as const;

/**
 * Neutral fallback used when `getErrorMessage` is called without a
 * `documentName` argument. The phrase replaces `el {document}` (and the
 * contraction `del {document}`) so the rendered sentence flows in Spanish.
 */
export const neutralDocument = "documento";

export type ErrorTemplates = typeof errors;
