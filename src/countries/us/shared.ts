/**
 * Shared structural-prefix tables for US identifiers.
 *
 * The US doesn't use embedded check digits on its three primary IDs
 * (SSN, ITIN, EIN). Validation relies on published structural rules:
 *   - SSN: SSA randomization (since 2011-06-25) + always-invalid ranges.
 *   - ITIN: IRS-published "9##-##-####" group ranges (Pub. 1915).
 *   - EIN: IRS-published 2-digit campus prefix list.
 *
 * Sources:
 *   - SSA Pub. No. 05-10002.
 *   - SSA randomization announcement:
 *     https://www.ssa.gov/employer/randomization.html
 *   - IRS Pub. 1915 (ITIN group ranges).
 *   - IRS valid EIN prefixes:
 *     https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes
 */

/** SSN areas the SSA never issues. */
export const SSN_INVALID_AREAS: ReadonlySet<string> = new Set(["000", "666"]);

/** True iff `area` (3 chars) is in the always-invalid 900-999 range. */
export function isSsnReservedArea(area: string): boolean {
  if (!/^\d{3}$/.test(area)) return false;
  return area.charCodeAt(0) === 57; // '9'
}

/**
 * Build the set of valid ITIN group values (the 4th-5th digits).
 *
 * Per IRS Pub. 1915, an ITIN's group is one of:
 *   50-65, 70-88, 90-92, 94-99.
 *
 * Group `93` is intentionally excluded — it was never assigned.
 */
function buildItinGroups(): ReadonlySet<string> {
  const groups = new Set<string>();
  const ranges: ReadonlyArray<readonly [number, number]> = [
    [50, 65],
    [70, 88],
    [90, 92],
    [94, 99],
  ];
  for (const range of ranges) {
    const lo = range[0];
    const hi = range[1];
    for (let g = lo; g <= hi; g++) {
      groups.add(String(g).padStart(2, "0"));
    }
  }
  return groups;
}

export const ITIN_VALID_GROUPS: ReadonlySet<string> = buildItinGroups();

/**
 * Build the set of valid EIN 2-digit campus prefixes per IRS published list.
 *
 * Ranges (inclusive):
 *   01-06, 10-16, 20-27, 30-48, 50-77, 80-88, 90-99.
 *
 * Reserved/never-issued: 07, 08, 09, 17, 18, 19, 28, 29, 49, 78, 79, 89.
 * Prefix `00` is reserved.
 */
function buildEinPrefixes(): ReadonlySet<string> {
  const prefixes = new Set<string>();
  const ranges: ReadonlyArray<readonly [number, number]> = [
    [1, 6],
    [10, 16],
    [20, 27],
    [30, 48],
    [50, 77],
    [80, 88],
    [90, 99],
  ];
  for (const range of ranges) {
    const lo = range[0];
    const hi = range[1];
    for (let p = lo; p <= hi; p++) {
      prefixes.add(String(p).padStart(2, "0"));
    }
  }
  return prefixes;
}

export const EIN_VALID_PREFIXES: ReadonlySet<string> = buildEinPrefixes();
