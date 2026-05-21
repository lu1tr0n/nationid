/**
 * Region (tipo de contribuyente) extractor for `PE_RUC`.
 *
 * SUNAT does not encode geography in the RUC — the 2-digit prefix instead
 * declares the type of taxpayer:
 *   - `10` — persona natural con negocio.
 *   - `15` — sucesión indivisa (treated as "natural" — a deceased natural
 *     person whose estate retained the RUC).
 *   - `16` — no domiciliado especial (natural).
 *   - `17` — no domiciliado (natural).
 *   - `20` — persona jurídica.
 *
 * We expose this through the `Region` shape with `kind: "tax_region"` because
 * the prompt explicitly maps "tax purpose" onto the region channel for parity
 * with other countries that *do* use prefixes for geography. The `code` is the
 * documented bucket name (`"natural"` / `"juridica"`) rather than the raw
 * prefix digits, because consumer apps rendering "Tipo de contribuyente" will
 * usually want the bucket label.
 *
 * Cross-validated 2026-05-09 against SUNAT "Tipos de RUC" public page.
 */

import { rucSpec } from "../../countries/pe/ruc.ts";
import type { Region } from "../types.ts";

const NATURAL_PREFIXES: ReadonlySet<string> = new Set(["10", "15", "16", "17"]);
const JURIDICAL_PREFIXES: ReadonlySet<string> = new Set(["20"]);

export function extractRucRegion(input: string): Region | null {
  const result = rucSpec.parse(input);
  if (!result.ok) return null;
  const prefix = result.normalized.slice(0, 2);
  if (NATURAL_PREFIXES.has(prefix)) return { code: "natural", kind: "tax_region" };
  if (JURIDICAL_PREFIXES.has(prefix)) return { code: "juridica", kind: "tax_region" };
  return null;
}
