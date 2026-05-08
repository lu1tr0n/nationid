/**
 * Property tests for registry self-consistency.
 *
 * Covered invariants:
 *   - P9: `getSpec(spec.code) === spec` for every registered spec — the
 *     registry must round-trip through its own primary key. This is trivial
 *     in spirit but catches a real failure mode: a country bundle that
 *     accidentally re-exports two different `DocumentSpec` objects under the
 *     same `code` (e.g. via copy-paste during a migration).
 *
 * No fast-check arbitraries here — the test space is the finite, runtime-
 * enumerable set of registered codes, so a deterministic loop is more direct
 * and faster than property generation.
 */

import { describe, expect, it } from "vitest";

import { getSpec, listSupportedCodes } from "../../src/index.ts";

describe("property — P9 registry is self-consistent", () => {
  it("getSpec(spec.code) returns the same spec object for every registered code", () => {
    for (const code of listSupportedCodes()) {
      const spec = getSpec(code);
      const roundtrip = getSpec(spec.code);
      expect(spec.code, `spec.code mismatch on lookup for ${code}`).toBe(code);
      expect(roundtrip).toBe(spec);
    }
  });

  it("listSupportedCodes() yields a deduplicated set", () => {
    const codes = listSupportedCodes();
    expect(new Set(codes).size, "duplicate DocumentTypeCode in registry").toBe(codes.length);
  });

  it("every registered spec exposes a non-empty mask and labelKey", () => {
    for (const code of listSupportedCodes()) {
      const spec = getSpec(code);
      expect(spec.mask.length, `${code}: empty mask`).toBeGreaterThan(0);
      expect(spec.labelKey.length, `${code}: empty labelKey`).toBeGreaterThan(0);
    }
  });
});
