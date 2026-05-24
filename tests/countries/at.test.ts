/**
 * Austria UID (AT_UID) tests.
 *
 * Canonical anchor `ATU13585627` from VERIFICATION.md §AT.
 */

import { describe, expect, it } from "vitest";

import { format, normalize, parse, validate } from "../../src/countries/at/index.ts";

describe("AT_UID — Luhn-variant mod-10 over body, ATU prefix", () => {
  it.each([
    "ATU13585627",
    "ATU88929562",
    "ATU94850297",
    "ATU51623710",
    "ATU87743755",
    "ATU16921320",
  ])("validates %s", (v) => {
    expect(validate("UID", v)).toBe(true);
    expect(validate("AT_UID", v)).toBe(true);
    expect(validate("VAT", v)).toBe(true);
  });

  it("normalize tolerates spaces + lowercase", () => {
    expect(normalize("UID", "atu 1358 5627")).toBe("ATU13585627");
  });

  it("format groups as ATU NNNN NNNN", () => {
    expect(format("UID", "ATU13585627")).toBe("ATU 1358 5627");
  });

  it("rejects invalid check", () => {
    expect(validate("UID", "ATU13585628")).toBe(false);
  });

  it("normalize promotes bare AT<8-digit> to ATU canonical form", () => {
    // The library is intentionally tolerant — AT13585627 normalizes to
    // ATU13585627. See `normalizeUid` in at/uid.ts.
    expect(normalize("UID", "AT13585627")).toBe("ATU13585627");
    expect(validate("UID", "AT13585627")).toBe(true);
  });

  it("parse returns invalid_checksum", () => {
    const r = parse("UID", "ATU13585620");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason.kind).toBe("invalid_checksum");
  });

  it("parse confidence is high", () => {
    const r = parse("UID", "ATU13585627");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.confidence).toBe("high");
  });
});
