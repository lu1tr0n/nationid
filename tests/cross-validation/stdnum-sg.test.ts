/**
 * Cross-validation: nationid vs an independent re-implementation of the
 * Singapore NRIC / FIN / UEN algorithms (the test's own oracle).
 *
 * Unlike the other cross-validation suites, there is no python `stdnum.sg.nric`
 * module (it does not exist upstream), so we do NOT probe a python oracle here.
 * Instead we re-implement all five algorithms FROM THE SPEC
 * (docs/research/v2.2-source-of-truth/sg.md) — NRIC, FIN, and the three UEN
 * categories — generate bodies deterministically, and assert nationid's
 * `validate()` agrees. The UEN constants in the oracle are the same ones
 * documented in python-stdnum/stdnum/sg/uen.py; the four doctest fixtures
 * (00192200M, 197401143C, S16FC0121D, T01FC6132D) are pinned as explicit
 * anchor assertions.
 *
 * Synthetic-only guarantee: every body is generated from a deterministic PRNG,
 * never imported from a list. The real-world UENs in the anchor block
 * (196800306E DBS, 199201624D Singtel) are public ACRA registrations, not PII.
 */

import { describe, expect, it } from "vitest";

import { validate } from "../../src/index.ts";

/* ------------------------------------------------------------------ */
/* Deterministic PRNG (mulberry32, mirrors _helpers.ts)               */
/* ------------------------------------------------------------------ */

function mulberry32(seedInput: number): () => number {
  let state = seedInput >>> 0;
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

const VECTOR_COUNT = 50;

/* ------------------------------------------------------------------ */
/* NRIC / FIN oracle                                                  */
/* ------------------------------------------------------------------ */

const NRIC_FIN_WEIGHTS = [2, 7, 6, 5, 4, 3, 2];
const NRIC_TABLE = "JZIHGFEDCBA";
const FG_TABLE = "XWUTRQPNMLK";
const M_TABLE = "XWUTRQPNJLK";

function nricFinSum(body7: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(body7[i] as string, 10) * (NRIC_FIN_WEIGHTS[i] as number);
  }
  return sum;
}

function nricCheck(prefix: string, body7: string): string {
  const offset = prefix === "T" ? 4 : 0;
  return NRIC_TABLE.charAt((nricFinSum(body7) + offset) % 11);
}

function finCheck(prefix: string, body7: string): string {
  const offset = prefix === "G" ? 4 : prefix === "M" ? 3 : 0;
  const table = prefix === "M" ? M_TABLE : FG_TABLE;
  return table.charAt((nricFinSum(body7) + offset) % 11);
}

function generateValidNrics(count: number): string[] {
  const rng = mulberry32(seedFromString("SG_NRIC_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = randInt(rng, 2) === 0 ? "S" : "T";
    const body = randDigits(rng, 7);
    out.push(prefix + body + nricCheck(prefix, body));
  }
  return out;
}

function generateValidFins(count: number): string[] {
  const rng = mulberry32(seedFromString("SG_FIN_VALID"));
  const prefixes = ["F", "G", "M"];
  const out: string[] = [];
  while (out.length < count) {
    const prefix = prefixes[randInt(rng, 3)] as string;
    const body = randDigits(rng, 7);
    out.push(prefix + body + finCheck(prefix, body));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* UEN oracle (constants from python-stdnum sg/uen.py)               */
/* ------------------------------------------------------------------ */

const CAT_A_WEIGHTS = [10, 4, 9, 3, 8, 2, 7, 1];
const CAT_A_TABLE = "XMKECAWLJDB";
const CAT_B_WEIGHTS = [10, 8, 6, 4, 9, 7, 5, 3, 1];
const CAT_B_TABLE = "ZKCMDNERGWH";
const CAT_C_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWX0123456789";
const CAT_C_WEIGHTS = [4, 3, 5, 3, 10, 2, 2, 5, 7];
const ENTITY_TYPES = [
  "CC",
  "CD",
  "CH",
  "CL",
  "CM",
  "CP",
  "CS",
  "CX",
  "DP",
  "FB",
  "FC",
  "FM",
  "FN",
  "GA",
  "GB",
  "GS",
  "HS",
  "LL",
  "LP",
  "MB",
  "MC",
  "MD",
  "MH",
  "MM",
  "MQ",
  "NB",
  "NR",
  "PA",
  "PB",
  "PF",
  "RF",
  "RP",
  "SM",
  "SS",
  "TC",
  "TU",
  "VH",
  "XL",
];

function catACheck(digits8: string): string {
  let sum = 0;
  for (let i = 0; i < 8; i++)
    sum += parseInt(digits8[i] as string, 10) * (CAT_A_WEIGHTS[i] as number);
  return CAT_A_TABLE.charAt(sum % 11);
}

function catBCheck(digits9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i++)
    sum += parseInt(digits9[i] as string, 10) * (CAT_B_WEIGHTS[i] as number);
  return CAT_B_TABLE.charAt(sum % 11);
}

function catCCheck(body9: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i++)
    sum += CAT_C_ALPHABET.indexOf(body9.charAt(i)) * (CAT_C_WEIGHTS[i] as number);
  const r = (((sum - 5) % 11) + 11) % 11;
  return CAT_C_ALPHABET.charAt(r);
}

function generateValidUenCatA(count: number): string[] {
  const rng = mulberry32(seedFromString("SG_UEN_A_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const digits8 = randDigits(rng, 8);
    out.push(digits8 + catACheck(digits8));
  }
  return out;
}

function generateValidUenCatB(count: number): string[] {
  const rng = mulberry32(seedFromString("SG_UEN_B_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    // Year in [1900, 2000] keeps us safely <= current year (the oracle's only
    // year constraint). Sequence is 5 digits.
    const year = 1900 + randInt(rng, 101);
    const seq = randDigits(rng, 5);
    const digits9 = String(year) + seq;
    out.push(digits9 + catBCheck(digits9));
  }
  return out;
}

function generateValidUenCatC(count: number): string[] {
  const rng = mulberry32(seedFromString("SG_UEN_C_VALID"));
  const eras = ["R", "S", "T"];
  const out: string[] = [];
  while (out.length < count) {
    const era = eras[randInt(rng, 3)] as string;
    const yy = randDigits(rng, 2);
    const type = ENTITY_TYPES[randInt(rng, ENTITY_TYPES.length)] as string;
    const seq = randDigits(rng, 4);
    const body9 = era + yy + type + seq;
    out.push(body9 + catCCheck(body9));
  }
  return out;
}

const VALID_NRIC = generateValidNrics(VECTOR_COUNT);
const VALID_FIN = generateValidFins(VECTOR_COUNT);
const VALID_UEN_A = generateValidUenCatA(VECTOR_COUNT);
const VALID_UEN_B = generateValidUenCatB(VECTOR_COUNT);
const VALID_UEN_C = generateValidUenCatC(VECTOR_COUNT);

describe("SG cross-validation (independent spec re-implementation)", () => {
  describe("python-stdnum doctest anchors (SG_UEN)", () => {
    it.each([
      ["00192200M", true],
      ["197401143C", true],
      ["S16FC0121D", true],
      ["T01FC6132D", true],
    ] as const)("nationid validates the stdnum doctest fixture %s", (input, expected) => {
      expect(validate("SG_UEN", input)).toBe(expected);
    });
  });

  describe("SG_NRIC — nationid agrees with the spec oracle", () => {
    it.each(VALID_NRIC)("accepts %s", (input) => {
      expect(validate("SG_NRIC", input)).toBe(true);
    });
  });

  describe("SG_FIN — nationid agrees with the spec oracle", () => {
    it.each(VALID_FIN)("accepts %s", (input) => {
      expect(validate("SG_FIN", input)).toBe(true);
    });
  });

  describe("SG_UEN Category A (Business) — nationid agrees with the spec oracle", () => {
    it.each(VALID_UEN_A)("accepts %s", (input) => {
      expect(validate("SG_UEN", input)).toBe(true);
    });
  });

  describe("SG_UEN Category B (Local Company) — nationid agrees with the spec oracle", () => {
    it.each(VALID_UEN_B)("accepts %s", (input) => {
      expect(validate("SG_UEN", input)).toBe(true);
    });
  });

  describe("SG_UEN Category C (Other Entity) — nationid agrees with the spec oracle", () => {
    it.each(VALID_UEN_C)("accepts %s", (input) => {
      expect(validate("SG_UEN", input)).toBe(true);
    });
  });
});
