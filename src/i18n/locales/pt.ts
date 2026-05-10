/**
 * Portuguese (pt) error message templates for `ParseError`.
 *
 * Standalone module — safe to import from `nationid/i18n/pt` without pulling
 * the rest of the catalog. Each template uses `{document}` as the single
 * interpolation slot. Consumers should call `getErrorMessage()` for proper
 * substitution and locale fallback.
 *
 * Orthographic note: tildes (ã, õ) e cedilhas (ç) e acentos (á, é, í, ó, ú,
 * â, ê, ô) são intencionais. Não remover.
 */
export const errors = {
  empty: "Insira um valor.",
  too_short: "O {document} é muito curto.",
  too_long: "O {document} é muito longo.",
  invalid_format: "O formato do {document} não é válido.",
  invalid_checksum: "O {document} não é válido (dígito verificador incorreto).",
} as const;

/**
 * Neutral fallback used when `getErrorMessage` is called without a
 * `documentName` argument. The phrase replaces `o {document}` (and the
 * contraction `do {document}`) so the rendered sentence flows in Portuguese.
 */
export const neutralDocument = "documento";

export type ErrorTemplates = typeof errors;
