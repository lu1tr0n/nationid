/**
 * `hash` — hex-encoded SubtleCrypto digest of the canonical normalized form.
 *
 * The input is normalized first so that "12.345.678/0001-90" and
 * "12345678000190" hash to the same value, allowing equality lookups across
 * any user-provided formatting.
 *
 * Salts are NOT optional in production. A raw unsalted SHA-256 of an 11-digit
 * CPF can be brute-forced in milliseconds; use a per-tenant or per-user salt
 * to make rainbow tables impractical.
 */

import type { DocumentTypeCode } from "../core/types.ts";
import { getSpec } from "../index.ts";

// Local Web Crypto / TextEncoder ambients — narrowest possible surface so we
// don't pull `lib: ["DOM"]` into the whole project (which would mask real bugs
// in pure-Node code paths). All runtimes we target (Node 20+, Deno, Bun, modern
// browsers, edge runtimes) expose these globals.
type SubtleLike = {
  digest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer>;
};
type CryptoLike = { subtle?: SubtleLike };
type TextEncoderLike = { encode(input: string): Uint8Array };
declare const TextEncoder: { new (): TextEncoderLike };

export type HashAlgorithm = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

export type HashOptions = {
  /** Salt prepended to the normalized input. Strongly recommended. */
  readonly salt?: string;
  /** Default `"SHA-256"`. */
  readonly algorithm?: HashAlgorithm;
};

/** Default hash algorithm. SHA-256 is universally available via SubtleCrypto. */
const DEFAULT_ALGORITHM: HashAlgorithm = "SHA-256";

/**
 * Returns the hex-encoded digest of `salt + normalize(input)` using the
 * given algorithm via Web Crypto API. Works in Node 20+, Deno, Bun, modern
 * browsers, and edge runtimes.
 *
 * @throws if `globalThis.crypto.subtle` is not available (very old runtimes).
 */
export async function hash(
  code: DocumentTypeCode,
  input: string,
  opts: HashOptions = {},
): Promise<string> {
  const subtle = (globalThis as { crypto?: CryptoLike }).crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "nationid/pii.hash: globalThis.crypto.subtle is unavailable. " +
        "Use Node 20+, Deno, Bun, or a modern browser/edge runtime.",
    );
  }
  const spec = getSpec(code);
  const normalized = spec.normalize(input);
  const salt = opts.salt ?? "";
  const algorithm: HashAlgorithm = opts.algorithm ?? DEFAULT_ALGORITHM;
  const data = new TextEncoder().encode(salt + normalized);
  const digest = await subtle.digest(algorithm, data);
  return bytesToHex(new Uint8Array(digest));
}

/** Lowercase hex encoding of a Uint8Array. */
function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += (bytes[i] ?? 0).toString(16).padStart(2, "0");
  }
  return s;
}
