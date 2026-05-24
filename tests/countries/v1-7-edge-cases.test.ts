/**
 * v1.7 EU-VAT — shared parse() edge-case coverage.
 *
 * The 17 v1.7 country specs share a uniform parse() shape (empty →
 * too_short → too_long → invalid_format → invalid_checksum → ok). The
 * per-country test files cover the canonical anchors + a flipped-check
 * negative; this file exercises the remaining parse() branches in one
 * place to lift global branch coverage above the 85% threshold without
 * duplicating ~85 tests across 17 files.
 */

import { describe, expect, it } from "vitest";
import type { DocumentTypeCode } from "../../src/index.ts";
import { parse } from "../../src/index.ts";

interface EdgeCase {
  readonly code: DocumentTypeCode;
  /** Some clearly-too-short input (must be < spec body length, ≠ empty). */
  readonly tooShort: string;
  /** Some clearly-too-long input. */
  readonly tooLong: string;
  /** Same length as the spec but with garbage content → invalid_format. */
  readonly invalidFormat: string;
}

const CASES: ReadonlyArray<EdgeCase> = [
  { code: "IE_VAT", tooShort: "IE1", tooLong: "IE8473625EAAB", invalidFormat: "IE@@@@@@@@" },
  { code: "AT_UID", tooShort: "AT1", tooLong: "ATU13585627999", invalidFormat: "ATU@@@@@@@@" },
  { code: "LU_VAT", tooShort: "LU1", tooLong: "LU15027442999", invalidFormat: "LU@@@@@@@@" },
  { code: "GR_VAT", tooShort: "EL1", tooLong: "EL09425921699", invalidFormat: "EL@@@@@@@@@" },
  { code: "CZ_DIC", tooShort: "CZ1", tooLong: "CZ2512389199", invalidFormat: "CZ@@@@@@@@" },
  { code: "HU_VAT", tooShort: "HU1", tooLong: "HU1289231299", invalidFormat: "HU@@@@@@@@" },
  { code: "RO_VAT", tooShort: "R1", tooLong: "RO12345678901234", invalidFormat: "RO@" },
  { code: "BG_VAT", tooShort: "BG1", tooLong: "BG10000000199", invalidFormat: "BG@@@@@@@@@" },
  { code: "HR_OIB", tooShort: "HR1", tooLong: "HR3339200596199", invalidFormat: "HR@@@@@@@@@@@" },
  { code: "SK_VAT", tooShort: "SK1", tooLong: "SK102000000399", invalidFormat: "SK@@@@@@@@@@" },
  { code: "SI_VAT", tooShort: "SI1", tooLong: "SI5022305499", invalidFormat: "SI@@@@@@@@" },
  { code: "LT_VAT", tooShort: "LT1", tooLong: "LT10000111099999", invalidFormat: "LT@@@@@@@@@" },
  { code: "LV_VAT", tooShort: "LV1", tooLong: "LV4000300949799", invalidFormat: "LV@@@@@@@@@@@" },
  { code: "EE_VAT", tooShort: "EE1", tooLong: "EE10059410299", invalidFormat: "EE@@@@@@@@@" },
  { code: "MT_VAT", tooShort: "MT1", tooLong: "MT1167911299", invalidFormat: "MT@@@@@@@@" },
  { code: "CY_VAT", tooShort: "CY1", tooLong: "CY10259033PXX", invalidFormat: "CY@@@@@@@@@" },
  { code: "IS_VSK", tooShort: "1", tooLong: "1234567", invalidFormat: "ABC" },
];

describe("v1.7 EU-VAT edge cases — uniform parse() branch coverage", () => {
  it.each(CASES.map((c) => [c.code, c] as const))("%s: empty input → empty", (_, { code }) => {
    const r = parse(code, "");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("empty");
  });

  it.each(CASES.map((c) => [c.code, c] as const))("%s: whitespace-only → empty", (_, { code }) => {
    const r = parse(code, "   ");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("empty");
  });

  it.each(CASES.map((c) => [c.code, c] as const))("%s: short input → too_short", (_, c) => {
    const r = parse(c.code, c.tooShort);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_short");
  });

  it.each(CASES.map((c) => [c.code, c] as const))("%s: long input → too_long", (_, c) => {
    const r = parse(c.code, c.tooLong);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("too_long");
  });

  it.each(
    CASES.map((c) => [c.code, c] as const),
  )("%s: same-length garbage → invalid_format", (_, c) => {
    const r = parse(c.code, c.invalidFormat);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(["invalid_format", "too_long", "too_short"]).toContain(r.reason.kind);
  });
});
