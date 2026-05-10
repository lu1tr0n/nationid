/**
 * Public types for the `nationid/extract` sub-module.
 *
 * These types are stable contracts. Renaming or repurposing them is a breaking
 * change. Adding new `ExtractKind` variants is additive and must include matching
 * entries in `SUPPORT_TABLE` (see `./index.ts`).
 */

/** Categories of structured data we attempt to lift from a normalized document. */
export type ExtractKind = "dob" | "sex" | "region";

/**
 * A calendar date *as encoded in the document*.
 *
 * We deliberately avoid `Date` to side-step JavaScript's timezone semantics:
 * a CURP "born on YYMMDD" is a calendar date, not an instant. Consumers who
 * need a `Date` can build one explicitly with `new Date(Date.UTC(year, month-1, day))`.
 *
 * - `year` is always 4-digit (no two-digit shorthand).
 * - `month` is 1-based (1..12), matching how humans write dates.
 * - `day` is 1-based (1..31). Calendar plausibility is checked before returning.
 */
export type DateOfBirth = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
};

/**
 * Sex / gender marker as encoded in the document.
 *
 * - `"M"` masculino — birth-certificate male.
 * - `"F"` femenino — birth-certificate female.
 * - `"X"` not-applicable / non-binary / persona jurídica. Used when the
 *   document encodes a non-physical-person entity (Argentine PJ prefixes
 *   `30/33/34`) or a non-binary marker.
 *
 * Specs that do not encode any sex information return `null` from
 * `extractSex`, never a fabricated `"X"`.
 */
export type Sex = "M" | "F" | "X";

/**
 * Region encoded in the document. The `code` is the raw token from the
 * normalized form (no translation to ISO codes) so callers can decide whether
 * to canonicalize via their own catalog.
 *
 * `kind` discriminates the administrative level so consumers can render the
 * correct label ("Departamento de Guatemala" vs "Estado de Jalisco") without
 * needing to know which spec emitted it.
 */
export type Region = {
  readonly code: string;
  readonly kind: "state" | "province" | "department" | "municipality" | "tax_region";
};
