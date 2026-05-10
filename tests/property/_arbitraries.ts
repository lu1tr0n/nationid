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

/* MX_CLAVE_ELECTOR — 18 chars: 6 letters + YY + entidad(01..32) + MM + DD + sex + 3 digits. */
function generateValidClaveElectors(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_MX_CLAVE_ELECTOR"));
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const out: string[] = [];
  while (out.length < count) {
    let prefix = "";
    for (let i = 0; i < 6; i++) prefix += letters.charAt(randInt(rng, letters.length));
    const yy = randDigits(rng, 2);
    // Entidad numeric 01..32.
    const entidad = String(1 + randInt(rng, 32)).padStart(2, "0");
    // Month 01..12.
    const mm = String(1 + randInt(rng, 12)).padStart(2, "0");
    // Day 01..28 (avoid month-end edge cases — spec only checks <= 31, but 28
    // is universally valid across all months).
    const dd = String(1 + randInt(rng, 28)).padStart(2, "0");
    const sex = rng() < 0.5 ? "H" : "M";
    const homo = randDigits(rng, 3);
    out.push(prefix + yy + entidad + mm + dd + sex + homo);
  }
  return out;
}

/* CO_PEP — 15 digits, no checksum. */
function generateValidCoPeps(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_CO_PEP"));
  const out: string[] = [];
  while (out.length < count) {
    out.push(randDigits(rng, 15));
  }
  return out;
}

/* CO_PPT — 7..11 alphanumeric uppercase. */
function generateValidCoPpts(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_CO_PPT"));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const out: string[] = [];
  while (out.length < count) {
    const len = 7 + randInt(rng, 5); // 7..11
    let s = "";
    for (let i = 0; i < len; i++) s += alphabet.charAt(randInt(rng, alphabet.length));
    out.push(s);
  }
  return out;
}

/* BR_CNH — 11 digits with mod-11 dual DV (CONTRAN). */
function generateValidBrCnhs(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_BR_CNH"));
  const w1 = [9, 8, 7, 6, 5, 4, 3, 2, 1];
  const w2 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const out: string[] = [];
  while (out.length < count) {
    const body9 = randDigits(rng, 9);
    if (/^(\d)\1+$/.test(body9)) continue;
    let sum1 = 0;
    for (let i = 0; i < 9; i++) sum1 += (body9.charCodeAt(i) - 48) * (w1[i] ?? 0);
    const r1 = sum1 % 11;
    const dv1 = r1 >= 10 ? 0 : r1;
    const dsc = r1 >= 10 ? 2 : 0;
    let sum2 = 0;
    for (let i = 0; i < 9; i++) sum2 += (body9.charCodeAt(i) - 48) * (w2[i] ?? 0);
    let r2 = (sum2 - dsc) % 11;
    if (r2 < 0) r2 += 11;
    const dv2 = r2 >= 10 ? 0 : r2;
    const full = `${body9}${dv1}${dv2}`;
    if (/^(\d)\1+$/.test(full)) continue;
    out.push(full);
  }
  return out;
}

/* BR_TITULO_ELEITOR — 12 digits with TSE mod-11 dual DV; UF in 01..28. */
function generateValidBrTitulos(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_BR_TITULO_ELEITOR"));
  const w1 = [2, 3, 4, 5, 6, 7, 8, 9];
  const out: string[] = [];
  while (out.length < count) {
    const body8 = randDigits(rng, 8);
    if (/^(\d)\1+$/.test(body8)) continue;
    const ufNum = 1 + randInt(rng, 28); // 01..28
    const uf = String(ufNum).padStart(2, "0");
    let sum1 = 0;
    for (let i = 0; i < 8; i++) sum1 += (body8.charCodeAt(i) - 48) * (w1[i] ?? 0);
    const r1 = sum1 % 11;
    const dv1 = r1 === 10 ? 0 : r1 === 0 && (uf === "01" || uf === "02") ? 1 : r1;
    const sum2 = (uf.charCodeAt(0) - 48) * 7 + (uf.charCodeAt(1) - 48) * 8 + dv1 * 9;
    const r2 = sum2 % 11;
    const dv2 = r2 === 10 ? 0 : r2 === 0 && (uf === "01" || uf === "02") ? 1 : r2;
    const full = `${body8}${uf}${dv1}${dv2}`;
    if (/^(\d)\1+$/.test(full)) continue;
    out.push(full);
  }
  return out;
}

/* BR_PIS — 11 digits with single mod-11 DV (Caixa weights 3,2,9..2). */
function generateValidBrPis(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_BR_PIS"));
  const W = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const out: string[] = [];
  while (out.length < count) {
    const body10 = randDigits(rng, 10);
    if (/^(\d)\1+$/.test(body10)) continue;
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += (body10.charCodeAt(i) - 48) * (W[i] ?? 0);
    const r = sum % 11;
    const dv = r < 2 ? 0 : 11 - r;
    const full = `${body10}${dv}`;
    if (/^(\d)\1+$/.test(full)) continue;
    out.push(full);
  }
  return out;
}

/* AR_CDI — same mod-11 algorithm as CUIT/CUIL, restricted to prefix 50. */
function generateValidArCdis(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_AR_CDI"));
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;
  const out: string[] = [];
  while (out.length < count) {
    const body8 = randDigits(rng, 8);
    const body10 = `50${body8}`;
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
    if (raw === 10) continue; // CUIT/CDI skip dv=10 (RG AFIP 10/97 § 4).
    const dv = raw === 11 ? 0 : raw;
    out.push(body10 + String(dv));
  }
  return out;
}

/* ES_NUSS — 12 digits: 2 provincia + 8 correlativo + 2 DV (= first10 mod 97). */
function generateValidEsNusses(count: number): string[] {
  const rng = mulberry32(seedFromString("PROP_ES_NUSS"));
  const out: string[] = [];
  while (out.length < count) {
    const body10 = randDigits(rng, 10);
    let r = 0;
    for (let i = 0; i < 10; i++) {
      r = (r * 10 + (body10.charCodeAt(i) - 48)) % 97;
    }
    const dv = String(r).padStart(2, "0");
    out.push(body10 + dv);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Brute-force generator for v0.4 specs                                */
/*                                                                    */
/* Some v0.4 country specs (BO, EC, PY, NI, PA, UY, CA, PT, VE) ship  */
/* without a hand-written valid-sample generator. Rather than block   */
/* the release on per-spec generators, we brute-force samples by      */
/* generating mask-shaped candidates and filtering through            */
/* spec.validate(). For format-only specs the acceptance rate is ~1;  */
/* for mod-10/mod-11 specs it's ~1/10. Capped attempts protect tests  */
/* from infinite loops if a future spec change makes acceptance ~0.   */
/* ------------------------------------------------------------------ */

import { getSpec } from "../../src/index.ts";

/**
 * Build a randomly-shaped candidate using the spec's mask pattern.
 * `0` → digit, `A` → uppercase letter, `*` → alphanumeric, others verbatim.
 */
function shapeFromMask(mask: string, rng: () => number): string {
  let out = "";
  for (const ch of mask) {
    if (ch === "0") {
      out += Math.floor(rng() * 10).toString();
    } else if (ch === "A") {
      out += String.fromCharCode(65 + Math.floor(rng() * 26));
    } else if (ch === "*") {
      const n = Math.floor(rng() * 36);
      out += n < 10 ? n.toString() : String.fromCharCode(55 + n);
    } else {
      out += ch;
    }
  }
  return out;
}

function generateBruteForceValid(code: DocumentTypeCode, n: number): ReadonlyArray<string> {
  const spec = getSpec(code);
  const rng = mulberry32(seedFromString(`v0.4-${code}`));
  const out: string[] = [];
  const maxAttempts = n * 500;
  for (let i = 0; i < maxAttempts && out.length < n; i++) {
    const candidate = shapeFromMask(spec.mask, rng);
    if (spec.validate(candidate)) {
      out.push(spec.normalize(candidate));
    }
  }
  // If brute force fails entirely (acceptance ~0), surface as empty array;
  // arbitraryValid() will throw a clear error rather than hang silently.
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
  MX_CLAVE_ELECTOR: generateValidClaveElectors(VALID_SAMPLES_PER_CODE),
  CO_CC: generateValidCoCcs(VALID_SAMPLES_PER_CODE),
  CO_CE: generateValidCoCes(VALID_SAMPLES_PER_CODE),
  CO_TI: generateValidCoTis(VALID_SAMPLES_PER_CODE),
  CO_PASAPORTE: generateValidCoPasaportes(VALID_SAMPLES_PER_CODE),
  CO_NIT: generateValidCoNits(VALID_SAMPLES_PER_CODE),
  CO_PEP: generateValidCoPeps(VALID_SAMPLES_PER_CODE),
  CO_PPT: generateValidCoPpts(VALID_SAMPLES_PER_CODE),
  BR_CPF: generateValidCpfs(VALID_SAMPLES_PER_CODE),
  BR_CNPJ: generateValidCnpjs(VALID_SAMPLES_PER_CODE),
  BR_CNH: generateValidBrCnhs(VALID_SAMPLES_PER_CODE),
  BR_TITULO_ELEITOR: generateValidBrTitulos(VALID_SAMPLES_PER_CODE),
  BR_PIS: generateValidBrPis(VALID_SAMPLES_PER_CODE),
  PE_DNI: generateValidPeDnis(VALID_SAMPLES_PER_CODE),
  PE_CE: generateValidPeCes(VALID_SAMPLES_PER_CODE),
  PE_RUC: generateValidRucs(VALID_SAMPLES_PER_CODE),
  AR_DNI: generateValidArDnis(VALID_SAMPLES_PER_CODE),
  AR_CUIL: generateValidArCuils(VALID_SAMPLES_PER_CODE),
  AR_CUIT: generateValidCuits(VALID_SAMPLES_PER_CODE),
  AR_CDI: generateValidArCdis(VALID_SAMPLES_PER_CODE),
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
  ES_NUSS: generateValidEsNusses(VALID_SAMPLES_PER_CODE),
  US_SSN: generateValidSsns(VALID_SAMPLES_PER_CODE),
  US_ITIN: generateValidItins(VALID_SAMPLES_PER_CODE),
  US_EIN: generateValidEins(VALID_SAMPLES_PER_CODE),
  // v0.4.0 — brute-force generated via spec.validate(). See generateBruteForceValid below.
  BO_CI: generateBruteForceValid("BO_CI", VALID_SAMPLES_PER_CODE),
  BO_NIT: generateBruteForceValid("BO_NIT", VALID_SAMPLES_PER_CODE),
  EC_CEDULA: generateBruteForceValid("EC_CEDULA", VALID_SAMPLES_PER_CODE),
  EC_RUC: generateBruteForceValid("EC_RUC", VALID_SAMPLES_PER_CODE),
  PY_CI: generateBruteForceValid("PY_CI", VALID_SAMPLES_PER_CODE),
  PY_RUC: generateBruteForceValid("PY_RUC", VALID_SAMPLES_PER_CODE),
  NI_CEDULA: generateBruteForceValid("NI_CEDULA", VALID_SAMPLES_PER_CODE),
  NI_RUC: generateBruteForceValid("NI_RUC", VALID_SAMPLES_PER_CODE),
  PA_CEDULA: generateBruteForceValid("PA_CEDULA", VALID_SAMPLES_PER_CODE),
  PA_RUC: generateBruteForceValid("PA_RUC", VALID_SAMPLES_PER_CODE),
  UY_CI: generateBruteForceValid("UY_CI", VALID_SAMPLES_PER_CODE),
  UY_RUT: generateBruteForceValid("UY_RUT", VALID_SAMPLES_PER_CODE),
  CA_SIN: generateBruteForceValid("CA_SIN", VALID_SAMPLES_PER_CODE),
  CA_BN: generateBruteForceValid("CA_BN", VALID_SAMPLES_PER_CODE),
  PT_NIF: generateBruteForceValid("PT_NIF", VALID_SAMPLES_PER_CODE),
  PT_CC: generateBruteForceValid("PT_CC", VALID_SAMPLES_PER_CODE),
  VE_CEDULA: generateBruteForceValid("VE_CEDULA", VALID_SAMPLES_PER_CODE),
  VE_RIF: generateBruteForceValid("VE_RIF", VALID_SAMPLES_PER_CODE),
  // v0.5.0 — MX_NSS (Luhn) + 21 new passport specs (CO_PASAPORTE already in v0.1).
  MX_NSS: generateBruteForceValid("MX_NSS", VALID_SAMPLES_PER_CODE),
  SV_PASAPORTE: generateBruteForceValid("SV_PASAPORTE", VALID_SAMPLES_PER_CODE),
  MX_PASAPORTE: generateBruteForceValid("MX_PASAPORTE", VALID_SAMPLES_PER_CODE),
  BR_PASAPORTE: generateBruteForceValid("BR_PASAPORTE", VALID_SAMPLES_PER_CODE),
  PE_PASAPORTE: generateBruteForceValid("PE_PASAPORTE", VALID_SAMPLES_PER_CODE),
  AR_PASAPORTE: generateBruteForceValid("AR_PASAPORTE", VALID_SAMPLES_PER_CODE),
  CL_PASAPORTE: generateBruteForceValid("CL_PASAPORTE", VALID_SAMPLES_PER_CODE),
  DO_PASAPORTE: generateBruteForceValid("DO_PASAPORTE", VALID_SAMPLES_PER_CODE),
  GT_PASAPORTE: generateBruteForceValid("GT_PASAPORTE", VALID_SAMPLES_PER_CODE),
  HN_PASAPORTE: generateBruteForceValid("HN_PASAPORTE", VALID_SAMPLES_PER_CODE),
  CR_PASAPORTE: generateBruteForceValid("CR_PASAPORTE", VALID_SAMPLES_PER_CODE),
  ES_PASAPORTE: generateBruteForceValid("ES_PASAPORTE", VALID_SAMPLES_PER_CODE),
  US_PASAPORTE: generateBruteForceValid("US_PASAPORTE", VALID_SAMPLES_PER_CODE),
  BO_PASAPORTE: generateBruteForceValid("BO_PASAPORTE", VALID_SAMPLES_PER_CODE),
  EC_PASAPORTE: generateBruteForceValid("EC_PASAPORTE", VALID_SAMPLES_PER_CODE),
  PY_PASAPORTE: generateBruteForceValid("PY_PASAPORTE", VALID_SAMPLES_PER_CODE),
  NI_PASAPORTE: generateBruteForceValid("NI_PASAPORTE", VALID_SAMPLES_PER_CODE),
  PA_PASAPORTE: generateBruteForceValid("PA_PASAPORTE", VALID_SAMPLES_PER_CODE),
  UY_PASAPORTE: generateBruteForceValid("UY_PASAPORTE", VALID_SAMPLES_PER_CODE),
  CA_PASAPORTE: generateBruteForceValid("CA_PASAPORTE", VALID_SAMPLES_PER_CODE),
  PT_PASAPORTE: generateBruteForceValid("PT_PASAPORTE", VALID_SAMPLES_PER_CODE),
  VE_PASAPORTE: generateBruteForceValid("VE_PASAPORTE", VALID_SAMPLES_PER_CODE),
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
