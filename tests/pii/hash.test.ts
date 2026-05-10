/**
 * Tests for `hash()` — deterministic hex digest of normalized identity input.
 *
 * Test vectors are computed against Node's `crypto` module (separate
 * implementation from the SubtleCrypto we exercise in production) to catch
 * any divergence in our normalization or hex-encoding paths.
 */

import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hash } from "../../src/pii/index.ts";

/** Helper: reference hex digest using node's `crypto`, for cross-checking. */
function refHash(algo: string, input: string): string {
  return createHash(algo).update(input).digest("hex");
}

describe("pii.hash — determinism", () => {
  it("produces the same digest for the same input", async () => {
    const a = await hash("BR_CPF", "12345678901");
    const b = await hash("BR_CPF", "12345678901");
    expect(a).toBe(b);
  });

  it("normalizes input before hashing — formatted == raw", async () => {
    const formatted = await hash("BR_CPF", "123.456.789-01");
    const raw = await hash("BR_CPF", "12345678901");
    expect(formatted).toBe(raw);
  });

  it("normalizes ES_DNI letter case before hashing", async () => {
    const lower = await hash("ES_DNI", "12345678z");
    const upper = await hash("ES_DNI", "12345678Z");
    expect(lower).toBe(upper);
  });

  it("normalizes BR_CNPJ separators before hashing", async () => {
    const formatted = await hash("BR_CNPJ", "12.345.678/0001-90");
    const raw = await hash("BR_CNPJ", "12345678000190");
    expect(formatted).toBe(raw);
  });
});

describe("pii.hash — algorithm + salt", () => {
  it("salt changes the output", async () => {
    const unsalted = await hash("BR_CPF", "12345678901");
    const salted = await hash("BR_CPF", "12345678901", { salt: "pepper" });
    expect(unsalted).not.toBe(salted);
  });

  it("different salts produce different digests", async () => {
    const a = await hash("BR_CPF", "12345678901", { salt: "alpha" });
    const b = await hash("BR_CPF", "12345678901", { salt: "beta" });
    expect(a).not.toBe(b);
  });

  it("algorithm changes the digest length", async () => {
    const sha256 = await hash("BR_CPF", "12345678901");
    const sha512 = await hash("BR_CPF", "12345678901", { algorithm: "SHA-512" });
    expect(sha256).toHaveLength(64);
    expect(sha512).toHaveLength(128);
  });

  it("default algorithm is SHA-256 (64 hex chars)", async () => {
    const out = await hash("BR_CPF", "12345678901");
    expect(out).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("pii.hash — known test vectors", () => {
  it("matches node:crypto SHA-256 for an unsalted normalized input", async () => {
    expect(await hash("BR_CPF", "12345678901")).toBe(refHash("sha256", "12345678901"));
  });

  it("matches node:crypto SHA-256 with salt prepended", async () => {
    expect(await hash("BR_CPF", "12345678901", { salt: "pepper" })).toBe(
      refHash("sha256", "pepper12345678901"),
    );
  });

  it("matches node:crypto SHA-512", async () => {
    expect(await hash("BR_CPF", "12345678901", { algorithm: "SHA-512" })).toBe(
      refHash("sha512", "12345678901"),
    );
  });

  it("matches node:crypto SHA-1 of empty string for empty input", async () => {
    // Empty CPF input → normalize() → "" → SHA-1("") known constant.
    expect(await hash("BR_CPF", "", { algorithm: "SHA-1" })).toBe(refHash("sha1", ""));
  });
});

describe("pii.hash — error path", () => {
  it("throws on an unknown code", async () => {
    await expect(
      // @ts-expect-error — intentionally outside the union to test runtime guard
      hash("XX_UNKNOWN", "12345"),
    ).rejects.toThrow(/no spec registered/);
  });
});
