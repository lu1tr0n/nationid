/**
 * Property-test arbitraries (fast-check generators) for nationid.
 *
 * Two layers of generators live here:
 *
 *   1. Universal arbitraries — random strings, whitespace injectors, and the
 *      `arbitraryCode` distribution over the runtime-registered set of
 *      `DocumentTypeCode` values. These never know about a specific spec; they
 *      are reused across every property test file.
 *
 *   2. Per-code valid generators — given a `DocumentTypeCode`, produce a
 *      uniform-ish stream of structurally and checksum-correct synthetic
 *      inputs. Where a generator already exists in
 *      `tests/cross-validation/_helpers.ts`, this module REUSES it (DRY).
 *      Where no generator exists yet, we add it locally here, never touching
 *      the existing cross-validation generators or their RNG seeds (to avoid
 *      shifting the cross-validation fixture stream and breaking the existing
 *      3,314-test baseline).
 *
 * Synthetic-only guarantee: every body is generated from a deterministic PRNG
 * (mulberry32 keyed by the `DocumentTypeCode` label). No real PII is ever
 * referenced.
 *
 * Reproducibility: a single fixed `PROPERTY_TEST_SEED` is exported so failing
 * counter-examples shrunk by fast-check can be reproduced in CI by replaying
 * the same seed.
 */

import * as fc from "fast-check";
import type { DocumentTypeCode } from "../../src/index.ts";
import { listSupportedCodes } from "../../src/index.ts";

import {
  generateValidCnpjs,
  generateValidCoNits,
  generateValidCpfs,
  generateValidCrCedulasFisicas,
  generateValidCrCedulasJuridicas,
  generateValidCuits,
  generateValidCurps,
  generateValidDoCedulas,
  generateValidDoRncs,
  generateValidEins,
  generateValidDnis as generateValidEsDnis,
  generateValidGtNits,
  generateValidItins,
  generateValidNies,
  generateValidNifPjs,
  generateValidPeDnis,
  generateValidRfcPfs,
  generateValidRfcPms,
  generateValidRucs,
  generateValidRuts,
  generateValidSsns,
} from "../cross-validation/_helpers.ts";

/* ------------------------------------------------------------------ */
/* Reproducibility                                                    */
/* ------------------------------------------------------------------ */

/**
 * Fixed seed used by every property test in this directory.
 *
 * fast-check derives shrunk counter-example reproduction paths from the seed
 * AND the run path. Using a constant seed across runs means that a failure
 * found locally is identically reproducible in CI. Bump this only when
 * intentionally rotating the input space.
 */
export const PROPERTY_TEST_SEED = 0x6e6164_6964; // "nadid" — arbitrary stable hex

/** Number of fast-check trials per property × spec. Default fast-check is 100. */
export const PROPERTY_NUM_RUNS = 100;

/* ------------------------------------------------------------------ */
/* Universal arbitraries                                              */
/* ------------------------------------------------------------------ */

/**
 * Arbitrary user-supplied input — any string up to 30 chars.
 *
 * fast-check's default `fc.string()` mixes printable ASCII, control chars,
 * digits, and a few unicode points; this is exactly the noisy space we want
 * to verify the library defends against without throwing.
 */
export const arbitraryInput: fc.Arbitrary<string> = fc.string({ maxLength: 30 });

/**
 * Whitespace tokens injected by `withRandomWhitespace`. Tabs and newlines are
 * uncommon in user input but must still be stripped by `normalize` to satisfy
 * P7 (whitespace insertion does not change validity).
 */
const WHITESPACE_TOKENS = [" ", "\t", "\n", "  "] as const;

/**
 * Given a known string `s`, return an arbitrary that yields `s` with random
 * whitespace tokens spliced at arbitrary positions. The base string is always
 * preserved character-by-character; only whitespace is inserted between
 * characters.
 *
 * P7 invariant: if `validate(s)` is true, then `validate(insertWhitespace(s))`
 * must also be true.
 */
export const withRandomWhitespace = (s: string): fc.Arbitrary<string> =>
  fc.array(fc.constantFrom(...WHITESPACE_TOKENS), { maxLength: s.length + 4 }).map((tokens) => {
    // Walk through `s`, prefixing each character with the next token, then
    // appending any leftover tokens at the end. This guarantees coverage of
    // both leading and inner positions.
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const t = tokens[i];
      if (t !== undefined) out += t;
      out += s.charAt(i);
    }
    for (let i = s.length; i < tokens.length; i++) {
      const t = tokens[i];
      if (t !== undefined) out += t;
    }
    return out;
  });

/**
 * Uniform distribution over every `DocumentTypeCode` registered at runtime.
 *
 * Reading from `listSupportedCodes()` keeps the property tests Open/Closed:
 * adding a new country to the registry automatically exercises every property
 * against the new spec without editing this file.
 */
export const arbitraryCode: fc.Arbitrary<DocumentTypeCode> = fc.constantFrom(
  ...listSupportedCodes(),
);

/* ------------------------------------------------------------------ */
/* Per-code valid generators                                          */
/*                                                                    */
/* Each `validInputsFor[code]` returns a finite array of synthetic    */
/* valid inputs for the spec. Property tests pull a uniformly random  */
/* element from the array via `fc.constantFrom`. We materialise the   */
/* arrays once per process so trials stay cheap.                      */
/* ------------------------------------------------------------------ */

/**
 * How many synthetic valid samples to materialise per code. Generous to keep
 * the input distribution diverse; small enough that JIT-compilation and
 * fixture-cache memory remain trivial.
 */
const VALID_SAMPLES_PER_CODE = 200;

/* --- Local generators for codes WITHOUT a cross-validation helper --- */

/**
 * mulberry32 — deterministic 32-bit PRNG. Mirrors `_helpers.ts` so generators
 * here are just as reproducible. A fresh PRNG is keyed off each generator's
 * unique label below.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(label: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < label.length; i++) {
    h = Math.imul(h ^ label.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}

function randInt(rng: () => number, max: number): number {
  return Math.floor(rng() * max);
}

function randDigits(rng: () => number, n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += String(randInt(rng, 10));
  return out;
}

/* SV_DUI — 8 body digits + 1 mod-10 DV. */
function generateValidSvDuis(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_SV_DUI"));
  const out: string[] = [];
  while (out.length < count) {
    const body8 = randDigits(rng, 8);
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += (body8.charCodeAt(i) - 48) * (9 - i);
    }
    const dv = (10 - (sum % 10)) % 10;
    out.push(body8 + String(dv));
  }
  return out;
}

/* SV_NIT — 13 body digits + 1 mod-11 DV (weights 14..2). */
function generateValidSvNits(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_SV_NIT"));
  const weights = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as const;
  const out: string[] = [];
  while (out.length < count) {
    const body = randDigits(rng, 13);
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      const w = weights[i];
      if (w === undefined) {
        sum = -1;
        break;
      }
      sum += (body.charCodeAt(i) - 48) * w;
    }
    if (sum < 0) continue;
    const mod = sum % 11;
    let dv: number;
    if (mod === 0) dv = 0;
    else if (mod === 1) dv = 1;
    else dv = 11 - mod;
    out.push(body + String(dv));
  }
  return out;
}

/* AR_DNI — 7 or 8 random digits, format-only. */
function generateValidArDnis(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_AR_DNI"));
  const out: string[] = [];
  while (out.length < count) {
    const len = 7 + randInt(rng, 2); // 7 or 8
    out.push(randDigits(rng, len));
  }
  return out;
}

/* AR_CUIL — same algorithm as CUIT but restricted to ANSES labor-regime prefixes.
 * The src CUIL_PREFIXES set is {20, 23, 24, 27}; prefixes 25/26 are CUIT-only. */
function generateValidArCuils(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_AR_CUIL"));
  const cuilPrefixes = ["20", "23", "24", "27"] as const;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;
  const out: string[] = [];
  while (out.length < count) {
    const prefix = cuilPrefixes[randInt(rng, cuilPrefixes.length)];
    if (prefix === undefined) continue;
    const body8 = randDigits(rng, 8);
    const body10 = prefix + body8;
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      const w = weights[i];
      if (w === undefined) {
        sum = -1;
        break;
      }
      sum += (body10.charCodeAt(i) - 48) * w;
    }
    if (sum < 0) continue;
    const r = sum % 11;
    const raw = 11 - r;
    if (raw === 10) continue; // CUIT skips dv=10 (issued under different prefix).
    const dv = raw === 11 ? 0 : raw;
    out.push(body10 + String(dv));
  }
  return out;
}

/* CO_CC — 6-10 random digits, no checksum. */
function generateValidCoCcs(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_CO_CC"));
  const out: string[] = [];
  while (out.length < count) {
    const len = 6 + randInt(rng, 5); // 6..10
    out.push(randDigits(rng, len));
  }
  return out;
}

/* CO_CE — 6-8 digits, no checksum. */
function generateValidCoCes(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_CO_CE"));
  const out: string[] = [];
  while (out.length < count) {
    const len = 6 + randInt(rng, 3); // 6..8
    out.push(randDigits(rng, len));
  }
  return out;
}

/* CO_TI — 10-11 digits, no checksum. */
function generateValidCoTis(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_CO_TI"));
  const out: string[] = [];
  while (out.length < count) {
    const len = 10 + randInt(rng, 2); // 10 or 11
    out.push(randDigits(rng, len));
  }
  return out;
}

/* CO_PASAPORTE — 6-12 alphanumeric uppercase. */
function generateValidCoPasaportes(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_CO_PASAPORTE"));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const out: string[] = [];
  while (out.length < count) {
    const len = 6 + randInt(rng, 7); // 6..12
    let s = "";
    for (let i = 0; i < len; i++) s += alphabet.charAt(randInt(rng, alphabet.length));
    out.push(s);
  }
  return out;
}

/* GT_DPI — 13 digits: 8-digit base + DV (0..9 not 10) + dept 01..22 + 2 muni. */
function generateValidGtDpis(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_GT_DPI"));
  const weights = [2, 3, 4, 5, 6, 7, 8, 9] as const;
  const out: string[] = [];
  while (out.length < count) {
    const body8 = randDigits(rng, 8);
    let sum = 0;
    for (let i = 0; i < 8; i++) {
      const w = weights[i];
      if (w === undefined) {
        sum = -1;
        break;
      }
      sum += (body8.charCodeAt(i) - 48) * w;
    }
    if (sum < 0) continue;
    const dv = sum % 11;
    if (dv === 10) continue; // RENAP rejects DV=10.
    // Departamento 01..22 (Guatemala has 22 administrative departamentos).
    const dept = 1 + Math.floor(rng() * 22);
    const deptStr = dept.toString().padStart(2, "0");
    const muni = randDigits(rng, 2);
    out.push(`${body8}${dv}${deptStr}${muni}`);
  }
  return out;
}

/* HN_DNI — 13 digits with departamento 01-18 + plausible 4-digit year. */
function generateValidHnDnis(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_HN_DNI"));
  const out: string[] = [];
  while (out.length < count) {
    const dept = String(1 + randInt(rng, 18)).padStart(2, "0");
    const muni = randDigits(rng, 2);
    const year = String(1900 + randInt(rng, 200)).padStart(4, "0"); // 1900..2099
    const correlativo = randDigits(rng, 5);
    out.push(dept + muni + year + correlativo);
  }
  return out;
}

/* HN_RTN — 14 digits, not all-same. */
function generateValidHnRtns(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_HN_RTN"));
  const out: string[] = [];
  while (out.length < count) {
    const digits = randDigits(rng, 14);
    // Reject all-same to satisfy spec's allSameDigit guard.
    let allSame = true;
    for (let i = 1; i < 14; i++) {
      if (digits.charCodeAt(i) !== digits.charCodeAt(0)) {
        allSame = false;
        break;
      }
    }
    if (allSame) continue;
    out.push(digits);
  }
  return out;
}

/* CR_DIMEX — 11 or 12 digits, no checksum. */
function generateValidCrDimexes(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_CR_DIMEX"));
  const out: string[] = [];
  while (out.length < count) {
    const len = 11 + randInt(rng, 2);
    out.push(randDigits(rng, len));
  }
  return out;
}

/* PE_CE — 9..12 digits, no checksum. */
function generateValidPeCes(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_PE_CE"));
  const out: string[] = [];
  while (out.length < count) {
    const len = 9 + randInt(rng, 4);
    out.push(randDigits(rng, len));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Per-code valid sample registry                                     */
/* ------------------------------------------------------------------ */

/**
 * Materialised once per process. Each entry is an array of normalized-form
 * synthetic valid inputs. Property tests `fc.constantFrom(...samples)` over
 * these arrays to keep trials O(1) per draw.
 */
const VALID_SAMPLES: Readonly<Record<DocumentTypeCode, ReadonlyArray<string>>> = {
  SV_DUI: generateValidSvDuis(VALID_SAMPLES_PER_CODE),
  SV_NIT: generateValidSvNits(VALID_SAMPLES_PER_CODE),
  MX_CURP: generateValidCurps(VALID_SAMPLES_PER_CODE),
  MX_RFC_PF: generateValidRfcPfs(VALID_SAMPLES_PER_CODE),
  MX_RFC_PM: generateValidRfcPms(VALID_SAMPLES_PER_CODE),
  CO_CC: generateValidCoCcs(VALID_SAMPLES_PER_CODE),
  CO_CE: generateValidCoCes(VALID_SAMPLES_PER_CODE),
  CO_TI: generateValidCoTis(VALID_SAMPLES_PER_CODE),
  CO_PASAPORTE: generateValidCoPasaportes(VALID_SAMPLES_PER_CODE),
  CO_NIT: generateValidCoNits(VALID_SAMPLES_PER_CODE),
  BR_CPF: generateValidCpfs(VALID_SAMPLES_PER_CODE),
  BR_CNPJ: generateValidCnpjs(VALID_SAMPLES_PER_CODE),
  PE_DNI: generateValidPeDnis(VALID_SAMPLES_PER_CODE),
  PE_CE: generateValidPeCes(VALID_SAMPLES_PER_CODE),
  PE_RUC: generateValidRucs(VALID_SAMPLES_PER_CODE),
  AR_DNI: generateValidArDnis(VALID_SAMPLES_PER_CODE),
  AR_CUIL: generateValidArCuils(VALID_SAMPLES_PER_CODE),
  AR_CUIT: generateValidCuits(VALID_SAMPLES_PER_CODE),
  CL_RUT: generateValidRuts(VALID_SAMPLES_PER_CODE),
  DO_CEDULA: generateValidDoCedulas(VALID_SAMPLES_PER_CODE),
  DO_RNC: generateValidDoRncs(VALID_SAMPLES_PER_CODE),
  GT_DPI: generateValidGtDpis(VALID_SAMPLES_PER_CODE),
  GT_NIT: generateValidGtNits(VALID_SAMPLES_PER_CODE),
  HN_DNI: generateValidHnDnis(VALID_SAMPLES_PER_CODE),
  HN_RTN: generateValidHnRtns(VALID_SAMPLES_PER_CODE),
  CR_CEDULA_FISICA: generateValidCrCedulasFisicas(VALID_SAMPLES_PER_CODE),
  CR_DIMEX: generateValidCrDimexes(VALID_SAMPLES_PER_CODE),
  CR_CEDULA_JURIDICA: generateValidCrCedulasJuridicas(VALID_SAMPLES_PER_CODE),
  ES_DNI: generateValidEsDnis(VALID_SAMPLES_PER_CODE),
  ES_NIE: generateValidNies(VALID_SAMPLES_PER_CODE),
  ES_NIF_PJ: generateValidNifPjs(VALID_SAMPLES_PER_CODE),
  US_SSN: generateValidSsns(VALID_SAMPLES_PER_CODE),
  US_ITIN: generateValidItins(VALID_SAMPLES_PER_CODE),
  US_EIN: generateValidEins(VALID_SAMPLES_PER_CODE),
};

/**
 * Returns an arbitrary that yields a known-valid synthetic input for `code`.
 *
 * Each value is in normalized form (no separators, uppercase). Property tests
 * that need a "starting from valid" input use this; tests that need raw
 * arbitrary strings use `arbitraryInput`.
 */
export function arbitraryValid(code: DocumentTypeCode): fc.Arbitrary<string> {
  const samples = VALID_SAMPLES[code];
  if (samples.length === 0) {
    throw new Error(`property tests: no valid samples generated for "${code}"`);
  }
  return fc.constantFrom(...samples);
}

/**
 * Returns an arbitrary yielding inputs likely-but-not-guaranteed to be invalid,
 * built by mutating one character of a known-valid input.
 *
 * Useful for verifying that small perturbations of a valid input never produce
 * a `parse(x).ok` result with a different `normalized` than `x`. Callers must
 * still re-check `validate(x)` because some mutations land on another valid
 * vector (especially for non-checksum specs).
 */
export function arbitraryInvalidByMutation(code: DocumentTypeCode): fc.Arbitrary<string> {
  return fc
    .tuple(arbitraryValid(code), fc.nat({ max: 1024 }), fc.nat({ max: 35 }))
    .map(([base, posSeed, charSeed]) => {
      if (base.length === 0) return base;
      const pos = posSeed % base.length;
      // Choose a replacement char from a wider alphabet than the source so the
      // mutation is more likely to leave the valid space.
      const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const replacement = alphabet.charAt(charSeed % alphabet.length);
      const orig = base.charAt(pos);
      const mutated =
        replacement === orig ? alphabet.charAt((charSeed + 1) % alphabet.length) : replacement;
      return base.slice(0, pos) + mutated + base.slice(pos + 1);
    });
}

/* ------------------------------------------------------------------ */
/* Mask substitution (P10)                                            */
/* ------------------------------------------------------------------ */

/**
 * Substitute a `cleave`-style mask:
 *   - `0` → random digit
 *   - `A` → random uppercase letter
 *   - `*` → random alphanumeric (digit or uppercase letter)
 *
 * Any other character is preserved verbatim (it represents a literal
 * separator). Returned strings are deterministic given the supplied draws.
 */
export function maskArbitrary(mask: string): fc.Arbitrary<string> {
  // Build one arbitrary per mask position, then concatenate.
  const slots: fc.Arbitrary<string>[] = [];
  for (const ch of mask) {
    if (ch === "0") {
      slots.push(fc.integer({ min: 0, max: 9 }).map(String));
    } else if (ch === "A") {
      slots.push(fc.integer({ min: 0, max: 25 }).map((n) => String.fromCharCode(65 + n)));
    } else if (ch === "*") {
      const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      slots.push(fc.integer({ min: 0, max: alphabet.length - 1 }).map((i) => alphabet.charAt(i)));
    } else {
      slots.push(fc.constant(ch));
    }
  }
  return fc.tuple(...slots).map((parts) => parts.join(""));
}
