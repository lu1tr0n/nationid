/**
 * Cross-validation test helpers.
 *
 * Synthetic vector generators for every code we cross-check against an
 * external reference library. Each generator produces structurally valid
 * inputs whose check digits are computed via the canonical algorithm — i.e.
 * the same math the reference library is supposed to implement. We do NOT
 * borrow the algorithm from the reference lib; we re-implement the math here
 * from the published spec so that "agreement" between the two sides is a
 * meaningful signal.
 *
 * Design notes (SOLID / interface segregation):
 *   - Each generator pair lives next to its document scope (e.g. `cpf`),
 *     keeping helpers focused on a single document type.
 *   - All generators are deterministic given a seed, so suites are
 *     reproducible across CI runs.
 *
 * Synthetic-only guarantee: every body is generated from a deterministic PRNG
 * (mulberry32 seeded by document code), never imported from any list. No real
 * person or company document is referenced anywhere in this module.
 */

/* ---------- Deterministic PRNG ---------- */

/**
 * mulberry32 — 32-bit PRNG. Tiny, deterministic, good enough for fixture
 * generation. We only need an even spread of bodies, not crypto.
 */
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

/** Hash a string to a stable 32-bit seed (FNV-1a). */
function seedFromString(label: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < label.length; i++) {
    h = Math.imul(h ^ label.charCodeAt(i), 0x01000193);
  }
  return h >>> 0;
}

/** Random integer in [0, max). */
function randInt(rng: () => number, max: number): number {
  return Math.floor(rng() * max);
}

/** Random N-digit decimal string (may contain leading zeros). */
function randDigits(rng: () => number, n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += String(randInt(rng, 10));
  return out;
}

/* ---------- Common predicates ---------- */

/** Is this string composed entirely of one repeated character? */
function isAllSame(s: string): boolean {
  if (s.length === 0) return false;
  for (let i = 1; i < s.length; i++) {
    if (s.charCodeAt(i) !== s.charCodeAt(0)) return false;
  }
  return true;
}

/* ---------- BR CPF ---------- */

/**
 * Compute BR CPF DV for a body of 9 or 10 digits.
 * Weights: from `n+1` down to 2 over body of length n.
 * r = (sum * 10) mod 11; r in {10,11} => 0.
 */
function cpfDV(body: string): number {
  let sum = 0;
  const start = body.length + 1;
  for (let i = 0; i < body.length; i++) {
    sum += (body.charCodeAt(i) - 48) * (start - i);
  }
  const r = (sum * 10) % 11;
  return r === 10 || r === 11 ? 0 : r;
}

/** Generate `count` valid 11-digit BR CPFs (raw, no separators). */
export function generateValidCpfs(count: number): string[] {
  const rng = mulberry32(seedFromString("BR_CPF_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body9 = randDigits(rng, 9);
    if (isAllSame(body9)) continue; // would produce a placeholder
    const dv1 = cpfDV(body9);
    const body10 = body9 + String(dv1);
    const dv2 = cpfDV(body10);
    const full = body10 + String(dv2);
    if (isAllSame(full)) continue;
    out.push(full);
  }
  return out;
}

/**
 * Generate `count` invalid 11-digit BR CPFs (raw): same length, but with one
 * digit flipped so the checksum fails. We deliberately avoid repeated-digit
 * sequences here so the only failure mode is the checksum.
 */
export function generateInvalidCpfs(count: number): string[] {
  const rng = mulberry32(seedFromString("BR_CPF_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body9 = randDigits(rng, 9);
    if (isAllSame(body9)) continue;
    const dv1 = cpfDV(body9);
    const dv2 = cpfDV(body9 + String(dv1));
    // Flip the last digit by adding 1 mod 10 to dv2.
    const badDv2 = (dv2 + 1) % 10;
    const full = `${body9}${dv1}${badDv2}`;
    if (isAllSame(full)) continue;
    out.push(full);
  }
  return out;
}

/* ---------- BR CNPJ (numeric only — v0.1 scope) ---------- */

const CNPJ_W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

function cnpjDV(body: string, weights: ReadonlyArray<number>): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const w = weights[i];
    if (w === undefined) return -1;
    sum += (body.charCodeAt(i) - 48) * w;
  }
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

/** Generate `count` valid 14-digit numeric BR CNPJs. */
export function generateValidCnpjs(count: number): string[] {
  const rng = mulberry32(seedFromString("BR_CNPJ_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body12 = randDigits(rng, 12);
    if (isAllSame(body12)) continue;
    const dv1 = cnpjDV(body12, CNPJ_W1);
    const body13 = body12 + String(dv1);
    const dv2 = cnpjDV(body13, CNPJ_W2);
    const full = body13 + String(dv2);
    if (isAllSame(full)) continue;
    out.push(full);
  }
  return out;
}

/** Generate `count` invalid 14-digit BR CNPJs (last DV flipped). */
export function generateInvalidCnpjs(count: number): string[] {
  const rng = mulberry32(seedFromString("BR_CNPJ_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body12 = randDigits(rng, 12);
    if (isAllSame(body12)) continue;
    const dv1 = cnpjDV(body12, CNPJ_W1);
    const dv2 = cnpjDV(body12 + String(dv1), CNPJ_W2);
    const badDv2 = (dv2 + 1) % 10;
    const full = `${body12}${dv1}${badDv2}`;
    if (isAllSame(full)) continue;
    out.push(full);
  }
  return out;
}

/* ---------- BR CNH (mod-11 dual DV; CONTRAN/DENATRAN) ---------- */

const CNH_W1 = [9, 8, 7, 6, 5, 4, 3, 2, 1] as const;
const CNH_W2 = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function cnhDVs(body9: string): readonly [number, number] | null {
  if (body9.length !== 9) return null;
  let sum1 = 0;
  for (let i = 0; i < 9; i++) {
    const w = CNH_W1[i];
    if (w === undefined) return null;
    sum1 += (body9.charCodeAt(i) - 48) * w;
  }
  const r1 = sum1 % 11;
  const dv1 = r1 >= 10 ? 0 : r1;
  const dsc = r1 >= 10 ? 2 : 0;
  let sum2 = 0;
  for (let i = 0; i < 9; i++) {
    const w = CNH_W2[i];
    if (w === undefined) return null;
    sum2 += (body9.charCodeAt(i) - 48) * w;
  }
  let r2 = (sum2 - dsc) % 11;
  if (r2 < 0) r2 += 11;
  const dv2 = r2 >= 10 ? 0 : r2;
  return [dv1, dv2];
}

/** Generate `count` valid 11-digit BR CNHs (raw, no separators). */
export function generateValidCnhs(count: number): string[] {
  const rng = mulberry32(seedFromString("BR_CNH_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body9 = randDigits(rng, 9);
    if (isAllSame(body9)) continue;
    const dvs = cnhDVs(body9);
    if (dvs === null) continue;
    const [dv1, dv2] = dvs;
    const full = `${body9}${dv1}${dv2}`;
    if (isAllSame(full)) continue;
    out.push(full);
  }
  return out;
}

/** Generate `count` invalid 11-digit BR CNHs (DV2 flipped by +1 mod 10). */
export function generateInvalidCnhs(count: number): string[] {
  const rng = mulberry32(seedFromString("BR_CNH_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body9 = randDigits(rng, 9);
    if (isAllSame(body9)) continue;
    const dvs = cnhDVs(body9);
    if (dvs === null) continue;
    const [dv1, dv2] = dvs;
    const badDv2 = (dv2 + 1) % 10;
    const full = `${body9}${dv1}${badDv2}`;
    if (isAllSame(full)) continue;
    out.push(full);
  }
  return out;
}

/* ---------- BR Título de Eleitor (TSE mod-11 dual DV with SP/MG override) ---------- */

const TITULO_W1 = [2, 3, 4, 5, 6, 7, 8, 9] as const;

/**
 * Compute Título de Eleitor DVs given an 8-digit body and a 2-digit UF.
 * Returns null if any input is malformed; the caller guarantees shape.
 */
function tituloDVs(body8: string, uf: string): readonly [number, number] | null {
  if (body8.length !== 8 || uf.length !== 2) return null;
  let sum1 = 0;
  for (let i = 0; i < 8; i++) {
    const w = TITULO_W1[i];
    if (w === undefined) return null;
    sum1 += (body8.charCodeAt(i) - 48) * w;
  }
  const r1 = sum1 % 11;
  const dv1 = r1 === 10 ? 0 : r1 === 0 && (uf === "01" || uf === "02") ? 1 : r1;
  const sum2 = (uf.charCodeAt(0) - 48) * 7 + (uf.charCodeAt(1) - 48) * 8 + dv1 * 9;
  const r2 = sum2 % 11;
  const dv2 = r2 === 10 ? 0 : r2 === 0 && (uf === "01" || uf === "02") ? 1 : r2;
  return [dv1, dv2];
}

/** Generate `count` valid 12-digit Títulos with UF spread across 01..28. */
export function generateValidTitulos(count: number): string[] {
  const rng = mulberry32(seedFromString("BR_TITULO_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body8 = randDigits(rng, 8);
    if (isAllSame(body8)) continue;
    const ufNum = 1 + randInt(rng, 28);
    const uf = String(ufNum).padStart(2, "0");
    const dvs = tituloDVs(body8, uf);
    if (dvs === null) continue;
    const [dv1, dv2] = dvs;
    const full = `${body8}${uf}${dv1}${dv2}`;
    if (isAllSame(full)) continue;
    out.push(full);
  }
  return out;
}

/** Generate `count` invalid 12-digit Títulos (last DV flipped). */
export function generateInvalidTitulos(count: number): string[] {
  const rng = mulberry32(seedFromString("BR_TITULO_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body8 = randDigits(rng, 8);
    if (isAllSame(body8)) continue;
    const ufNum = 1 + randInt(rng, 28);
    const uf = String(ufNum).padStart(2, "0");
    const dvs = tituloDVs(body8, uf);
    if (dvs === null) continue;
    const [dv1, dv2] = dvs;
    const badDv2 = (dv2 + 1) % 10;
    const full = `${body8}${uf}${dv1}${badDv2}`;
    if (isAllSame(full)) continue;
    out.push(full);
  }
  return out;
}

/* ---------- BR PIS / PASEP / NIT / NIS (single mod-11 DV; Caixa) ---------- */

const PIS_W = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

function pisDV(body10: string): number {
  if (body10.length !== 10) return -1;
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const w = PIS_W[i];
    if (w === undefined) return -1;
    sum += (body10.charCodeAt(i) - 48) * w;
  }
  const r = sum % 11;
  return r < 2 ? 0 : 11 - r;
}

/** Generate `count` valid 11-digit BR PIS numbers. */
export function generateValidPis(count: number): string[] {
  const rng = mulberry32(seedFromString("BR_PIS_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body10 = randDigits(rng, 10);
    if (isAllSame(body10)) continue;
    const dv = pisDV(body10);
    if (dv < 0 || dv > 9) continue;
    const full = `${body10}${dv}`;
    if (isAllSame(full)) continue;
    out.push(full);
  }
  return out;
}

/** Generate `count` invalid 11-digit BR PIS numbers (DV flipped by +1 mod 10). */
export function generateInvalidPis(count: number): string[] {
  const rng = mulberry32(seedFromString("BR_PIS_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body10 = randDigits(rng, 10);
    if (isAllSame(body10)) continue;
    const dv = pisDV(body10);
    if (dv < 0 || dv > 9) continue;
    const badDv = (dv + 1) % 10;
    const full = `${body10}${badDv}`;
    if (isAllSame(full)) continue;
    out.push(full);
  }
  return out;
}

/* ---------- AR CUIT ---------- */

/**
 * AR CUIT prefixes recognized by both AFIP RG 10/97 AND validator.js es-AR.
 *
 * AFIP allows `20, 23, 24, 25, 26, 27, 30, 33, 34`. validator.js's regex
 * `(20|23|24|27|30|33|34)` omits `25` and `26`. We use the intersection so the
 * cross-validation suite measures algorithm agreement on shared input space;
 * the divergence on prefixes 25/26 is documented separately and exercised by
 * an explicit "validator.js misses these" test below.
 */
const CUIT_PREFIXES_SHARED = ["20", "23", "24", "27", "30", "33", "34"] as const;
/** Prefixes nationid accepts but validator.js rejects via regex. */
export const CUIT_PREFIXES_NATIONID_ONLY = ["25", "26"] as const;
const CUIT_W = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/** Compute AR CUIT DV; returns null when the body produces dv === 10 (invalid). */
function cuitDV(body10: string): number | null {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const w = CUIT_W[i];
    if (w === undefined) return null;
    sum += (body10.charCodeAt(i) - 48) * w;
  }
  const r = sum % 11;
  const dv = 11 - r;
  if (dv === 11) return 0;
  if (dv === 10) return null;
  return dv;
}

/**
 * Generate `count` valid 11-digit AR CUITs.
 *
 * Skips bodies whose dv is 10 (AFIP RG 10/97 § 4 reissues those with a
 * different prefix). The reference lib (validator.js) returns DV `9` for such
 * bodies — this is a known divergence, documented separately.
 */
export function generateValidCuits(count: number): string[] {
  const rng = mulberry32(seedFromString("AR_CUIT_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = CUIT_PREFIXES_SHARED[randInt(rng, CUIT_PREFIXES_SHARED.length)];
    if (prefix === undefined) continue;
    const body8 = randDigits(rng, 8);
    const body10 = prefix + body8;
    const dv = cuitDV(body10);
    if (dv === null) continue;
    out.push(body10 + String(dv));
  }
  return out;
}

/** Generate `count` invalid AR CUITs (correct prefix, wrong DV). */
export function generateInvalidCuits(count: number): string[] {
  const rng = mulberry32(seedFromString("AR_CUIT_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = CUIT_PREFIXES_SHARED[randInt(rng, CUIT_PREFIXES_SHARED.length)];
    if (prefix === undefined) continue;
    const body8 = randDigits(rng, 8);
    const body10 = prefix + body8;
    const dv = cuitDV(body10);
    if (dv === null) continue;
    const badDv = (dv + 1) % 10;
    out.push(body10 + String(badDv));
  }
  return out;
}

/**
 * Generate `count` valid CUITs whose prefix is `25` or `26` — accepted by
 * AFIP and nationid, but rejected by validator.js because its regex omits
 * those prefixes. Used to assert the documented divergence.
 */
export function generateValidCuitsNationidOnly(count: number): string[] {
  const rng = mulberry32(seedFromString("AR_CUIT_VALID_NATIONID_ONLY"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = CUIT_PREFIXES_NATIONID_ONLY[randInt(rng, CUIT_PREFIXES_NATIONID_ONLY.length)];
    if (prefix === undefined) continue;
    const body8 = randDigits(rng, 8);
    const body10 = prefix + body8;
    const dv = cuitDV(body10);
    if (dv === null) continue;
    out.push(body10 + String(dv));
  }
  return out;
}

/* ---------- CL RUT ---------- */

const RUT_W = [2, 3, 4, 5, 6, 7] as const;

/** Compute CL RUT DV: `0`-`9` or `K`. */
function rutDV(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const idx = body.length - 1 - i;
    const w = RUT_W[i % RUT_W.length];
    if (w === undefined) return "?";
    sum += (body.charCodeAt(idx) - 48) * w;
  }
  const r = sum % 11;
  const dv = 11 - r;
  if (dv === 11) return "0";
  if (dv === 10) return "K";
  return String(dv);
}

/** Generate `count` valid Chilean RUTs (raw, no dots/hyphen, body 7-8 digits). */
export function generateValidRuts(count: number): string[] {
  const rng = mulberry32(seedFromString("CL_RUT_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    // Body of 7 or 8 digits keeps us in the realistic civilian range.
    const len = 7 + randInt(rng, 2);
    let body = randDigits(rng, len);
    // Avoid leading zero — stripped naturally by issuer.
    while (body.charAt(0) === "0") body = String(randInt(rng, 9) + 1) + body.slice(1);
    out.push(body + rutDV(body));
  }
  return out;
}

/** Generate `count` invalid CL RUTs (DV flipped to a different valid char). */
export function generateInvalidRuts(count: number): string[] {
  const rng = mulberry32(seedFromString("CL_RUT_INVALID"));
  const alphabet = "0123456789K";
  const out: string[] = [];
  while (out.length < count) {
    const len = 7 + randInt(rng, 2);
    let body = randDigits(rng, len);
    while (body.charAt(0) === "0") body = String(randInt(rng, 9) + 1) + body.slice(1);
    const correct = rutDV(body);
    // Pick any char from the alphabet that is not the correct DV.
    let bad = correct;
    while (bad === correct) {
      const idx = randInt(rng, alphabet.length);
      const ch = alphabet.charAt(idx);
      bad = ch;
    }
    out.push(body + bad);
  }
  return out;
}

/* ---------- ES DNI ---------- */

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE" as const;

function dniLetter(digits8: string): string {
  const idx = Number.parseInt(digits8, 10) % 23;
  return DNI_LETTERS.charAt(idx);
}

/** Generate `count` valid ES DNI strings (8 digits + computed letter). */
export function generateValidDnis(count: number): string[] {
  const rng = mulberry32(seedFromString("ES_DNI_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body8 = randDigits(rng, 8);
    out.push(body8 + dniLetter(body8));
  }
  return out;
}

/** Generate `count` invalid ES DNIs (correct digits, wrong letter). */
export function generateInvalidDnis(count: number): string[] {
  const rng = mulberry32(seedFromString("ES_DNI_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body8 = randDigits(rng, 8);
    const correct = dniLetter(body8);
    // Replace with the next letter in the table to guarantee a mismatch.
    const correctIdx = DNI_LETTERS.indexOf(correct);
    const wrongIdx = (correctIdx + 1) % DNI_LETTERS.length;
    const wrong = DNI_LETTERS.charAt(wrongIdx);
    out.push(body8 + wrong);
  }
  return out;
}

/* ---------- ES NIE ---------- */

const NIE_PREFIXES = ["X", "Y", "Z"] as const;
const NIE_PREFIX_DIGIT: Readonly<Record<string, string>> = { X: "0", Y: "1", Z: "2" };

function nieLetter(prefix: string, body7: string): string {
  const lead = NIE_PREFIX_DIGIT[prefix];
  if (lead === undefined) return "?";
  const digits8 = lead + body7;
  return dniLetter(digits8);
}

/** Generate `count` valid ES NIE strings (`[XYZ]` + 7 digits + letter). */
export function generateValidNies(count: number): string[] {
  const rng = mulberry32(seedFromString("ES_NIE_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = NIE_PREFIXES[randInt(rng, NIE_PREFIXES.length)];
    if (prefix === undefined) continue;
    const body7 = randDigits(rng, 7);
    out.push(prefix + body7 + nieLetter(prefix, body7));
  }
  return out;
}

/** Generate `count` invalid ES NIEs (correct shape, wrong letter). */
export function generateInvalidNies(count: number): string[] {
  const rng = mulberry32(seedFromString("ES_NIE_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = NIE_PREFIXES[randInt(rng, NIE_PREFIXES.length)];
    if (prefix === undefined) continue;
    const body7 = randDigits(rng, 7);
    const correct = nieLetter(prefix, body7);
    const correctIdx = DNI_LETTERS.indexOf(correct);
    const wrongIdx = (correctIdx + 1) % DNI_LETTERS.length;
    const wrong = DNI_LETTERS.charAt(wrongIdx);
    out.push(prefix + body7 + wrong);
  }
  return out;
}

/* ---------- ES NIF_PJ (CIF) ---------- */

const CIF_DV_LETTERS = "JABCDEFGHI" as const;
const CIF_PREFIX_DIGIT_DV = ["A", "B", "E", "H"] as const;
const CIF_PREFIX_LETTER_DV = ["N", "P", "Q", "R", "S", "W"] as const;
const CIF_PREFIX_EITHER_DV = ["C", "D", "F", "G", "J", "U", "V"] as const;

function cifRemainder(body7: string): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = body7.charCodeAt(i) - 48;
    if (i % 2 === 0) {
      const x = d * 2;
      sum += x > 9 ? x - 9 : x;
    } else {
      sum += d;
    }
  }
  return (10 - (sum % 10)) % 10;
}

/** Generate `count` valid ES NIF_PJ (CIF) strings across all prefix groups. */
export function generateValidNifPjs(count: number): string[] {
  const rng = mulberry32(seedFromString("ES_NIF_PJ_VALID"));
  const all = [...CIF_PREFIX_DIGIT_DV, ...CIF_PREFIX_LETTER_DV, ...CIF_PREFIX_EITHER_DV];
  const out: string[] = [];
  while (out.length < count) {
    const prefix = all[randInt(rng, all.length)];
    if (prefix === undefined) continue;
    const body7 = randDigits(rng, 7);
    const r = cifRemainder(body7);
    let dv: string;
    if ((CIF_PREFIX_DIGIT_DV as ReadonlyArray<string>).includes(prefix)) {
      dv = String(r);
    } else if ((CIF_PREFIX_LETTER_DV as ReadonlyArray<string>).includes(prefix)) {
      dv = CIF_DV_LETTERS.charAt(r);
    } else {
      // EITHER — pick alternately to cover both branches.
      dv = out.length % 2 === 0 ? String(r) : CIF_DV_LETTERS.charAt(r);
    }
    out.push(prefix + body7 + dv);
  }
  return out;
}

/** Generate `count` invalid ES NIF_PJ strings (good shape, wrong DV). */
export function generateInvalidNifPjs(count: number): string[] {
  const rng = mulberry32(seedFromString("ES_NIF_PJ_INVALID"));
  const all = [...CIF_PREFIX_DIGIT_DV, ...CIF_PREFIX_LETTER_DV, ...CIF_PREFIX_EITHER_DV];
  const out: string[] = [];
  while (out.length < count) {
    const prefix = all[randInt(rng, all.length)];
    if (prefix === undefined) continue;
    const body7 = randDigits(rng, 7);
    const r = cifRemainder(body7);
    // Always corrupt the DV: pick a digit or letter that does NOT match the
    // expected value for either form.
    const correctDigit = String(r);
    const correctLetter = CIF_DV_LETTERS.charAt(r);
    const wrongDigit = String((r + 1) % 10);
    // Choose digit form when prefix wants letter, and vice versa, but verify
    // the chosen char does not coincidentally match the other accepted form.
    let bad = wrongDigit;
    if (bad === correctDigit || bad === correctLetter) {
      bad = String((r + 2) % 10);
    }
    out.push(prefix + body7 + bad);
  }
  return out;
}

/* ---------- US EIN ---------- */

const EIN_VALID_PREFIX_RANGES: ReadonlyArray<readonly [number, number]> = [
  [1, 6],
  [10, 16],
  [20, 27],
  [30, 48],
  [50, 68],
  [71, 77],
  [80, 88],
  [90, 95],
  [98, 99],
];

const EIN_INVALID_PREFIXES = [
  "00",
  "07",
  "08",
  "09",
  "17",
  "18",
  "19",
  "28",
  "29",
  "49",
  "69",
  "70",
  "78",
  "79",
  "89",
  "96",
  "97",
];

function buildValidEinPrefixes(): string[] {
  const out: string[] = [];
  for (const [lo, hi] of EIN_VALID_PREFIX_RANGES) {
    for (let p = lo; p <= hi; p++) out.push(String(p).padStart(2, "0"));
  }
  return out;
}

const EIN_VALID_PREFIXES = buildValidEinPrefixes();

/** Generate `count` valid US EINs (any IRS-published campus prefix). */
export function generateValidEins(count: number): string[] {
  const rng = mulberry32(seedFromString("US_EIN_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = EIN_VALID_PREFIXES[randInt(rng, EIN_VALID_PREFIXES.length)];
    if (prefix === undefined) continue;
    const serial = randDigits(rng, 7);
    out.push(prefix + serial);
  }
  return out;
}

/** Generate `count` invalid US EINs (reserved campus prefix). */
export function generateInvalidEins(count: number): string[] {
  const rng = mulberry32(seedFromString("US_EIN_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = EIN_INVALID_PREFIXES[randInt(rng, EIN_INVALID_PREFIXES.length)];
    if (prefix === undefined) continue;
    const serial = randDigits(rng, 7);
    out.push(prefix + serial);
  }
  return out;
}

/* ---------- MX CURP (synthetic — Gregorian-safe dates) ---------- */

/**
 * CURP DV alphabet matching SAT/RENAPO published table (also used by
 * `python-stdnum.stdnum.mx.curp`):
 *   `0..9` → 0..9, `A..N` → 10..23, `&` → 24, `O..Z` → 25..36, ` ` → 37,
 *   `Ñ` → 38.
 * For our generator the body never contains `&`, ` ` or `Ñ`, so the
 * specific value of those slots does not affect the sum.
 */
const CURP_DV_ALPHABET = "0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ";
/** RENAPO valid entidad federativa codes (33 = 32 states + NE). */
const CURP_ENTIDADES = [
  "AS",
  "BC",
  "BS",
  "CC",
  "CL",
  "CM",
  "CS",
  "CH",
  "DF",
  "DG",
  "GT",
  "GR",
  "HG",
  "JC",
  "MC",
  "MN",
  "MS",
  "NT",
  "NL",
  "OC",
  "PL",
  "QT",
  "QR",
  "SP",
  "SL",
  "SR",
  "TC",
  "TS",
  "TL",
  "VZ",
  "YN",
  "ZS",
  "NE",
] as const;
/** SAT/RENAPO blacklisted 4-letter prefixes (palabras altisonantes). */
const CURP_BLACKLISTED_PREFIXES: ReadonlySet<string> = new Set([
  "BACA",
  "BAKA",
  "BUEI",
  "BUEY",
  "CACA",
  "CACO",
  "CAGA",
  "CAGO",
  "CAKA",
  "CAKO",
  "COGE",
  "COGI",
  "COJA",
  "COJE",
  "COJI",
  "COJO",
  "COLA",
  "CULO",
  "FALO",
  "FETO",
  "GETA",
  "GUEI",
  "GUEY",
  "JETA",
  "JOTO",
  "KACA",
  "KACO",
  "KAGA",
  "KAGO",
  "KAKA",
  "KAKO",
  "KOGE",
  "KOGI",
  "KOJA",
  "KOJE",
  "KOJI",
  "KOJO",
  "KOLA",
  "KULO",
  "LILO",
  "LOCA",
  "LOCO",
  "LOKA",
  "LOKO",
  "MAME",
  "MAMO",
  "MEAR",
  "MEAS",
  "MEON",
  "MIAR",
  "MION",
  "MOCO",
  "MOKO",
  "MULA",
  "MULO",
  "NACA",
  "NACO",
  "PEDA",
  "PEDO",
  "PENE",
  "PIPI",
  "PITO",
  "POPO",
  "PUTA",
  "PUTO",
  "QULO",
  "RATA",
  "ROBA",
  "ROBE",
  "ROBO",
  "RUIN",
  "SENO",
  "TETA",
  "VACA",
  "VAGA",
  "VAGO",
  "VAKA",
  "VUEI",
  "VUEY",
  "WUEI",
  "WUEY",
]);

/** Compute CURP DV given the 17-char body. Mirrors RENAPO DOF 18-OCT-2014. */
function computeCurpDv(body17: string): number {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const ch = body17.charAt(i);
    const idx = CURP_DV_ALPHABET.indexOf(ch);
    if (idx < 0) return -1;
    sum += idx * (18 - i);
  }
  return (10 - (sum % 10)) % 10;
}

function randUpper(rng: () => number): string {
  return String.fromCharCode(65 + randInt(rng, 26));
}

/**
 * Generate `count` valid CURPs whose:
 *   - first 4 letters are NOT in the SAT/RENAPO blacklist (palabras
 *     altisonantes — both python-stdnum and nationid SAT-RFC reject those,
 *     but nationid CURP currently does not — keeping our generator
 *     blacklist-free keeps us in the agreement zone for both libs).
 *   - date is Gregorian-valid (YY-MM-DD with month 1-12 and day in 1-28
 *     to avoid leap-year nuance).
 *   - entidad is in the RENAPO 33-entry set (shared by both libs).
 *   - homoclave + DV are computed via the canonical algorithm.
 */
export function generateValidCurps(count: number): string[] {
  const rng = mulberry32(seedFromString("MX_CURP_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    let prefix4 = "";
    while (prefix4.length < 4) prefix4 += randUpper(rng);
    if (CURP_BLACKLISTED_PREFIXES.has(prefix4)) continue;
    const yy = String(randInt(rng, 100)).padStart(2, "0");
    const mm = String(1 + randInt(rng, 12)).padStart(2, "0");
    const dd = String(1 + randInt(rng, 28)).padStart(2, "0");
    const sex = randInt(rng, 2) === 0 ? "H" : "M";
    const entidad = CURP_ENTIDADES[randInt(rng, CURP_ENTIDADES.length)];
    if (entidad === undefined) continue;
    let cons3 = "";
    while (cons3.length < 3) cons3 += randUpper(rng);
    // Homoclave position 16: digit for pre-1996 (year ≥ 60) else uppercase letter.
    // The python-stdnum doctest uses digit when the last char is a digit. We
    // emit a letter here (post-1996 convention) — the algorithm accepts both.
    const homo = randUpper(rng);
    const body17 = prefix4 + yy + mm + dd + sex + entidad + cons3 + homo;
    const dv = computeCurpDv(body17);
    if (dv < 0) continue;
    out.push(body17 + String(dv));
  }
  return out;
}

/** Generate `count` invalid CURPs (good shape, wrong DV). */
export function generateInvalidCurps(count: number): string[] {
  const rng = mulberry32(seedFromString("MX_CURP_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    let prefix4 = "";
    while (prefix4.length < 4) prefix4 += randUpper(rng);
    if (CURP_BLACKLISTED_PREFIXES.has(prefix4)) continue;
    const yy = String(randInt(rng, 100)).padStart(2, "0");
    const mm = String(1 + randInt(rng, 12)).padStart(2, "0");
    const dd = String(1 + randInt(rng, 28)).padStart(2, "0");
    const sex = randInt(rng, 2) === 0 ? "H" : "M";
    const entidad = CURP_ENTIDADES[randInt(rng, CURP_ENTIDADES.length)];
    if (entidad === undefined) continue;
    let cons3 = "";
    while (cons3.length < 3) cons3 += randUpper(rng);
    const homo = randUpper(rng);
    const body17 = prefix4 + yy + mm + dd + sex + entidad + cons3 + homo;
    const dv = computeCurpDv(body17);
    if (dv < 0) continue;
    const badDv = (dv + 1) % 10;
    out.push(body17 + String(badDv));
  }
  return out;
}

/* ---------- MX RFC PF / PM ---------- */

/**
 * SAT Anexo 19 RFC table (post-fix B2):
 *   `0..9` → 0..9, `A..N` → 10..23, `&` → 24, `O..Z` → 25..36, ` ` → 37,
 *   `Ñ` → 38. Matches `python-stdnum.stdnum.mx.rfc._alphabet`.
 */
function rfcCharValue(ch: string): number {
  const code = ch.charCodeAt(0);
  if (code >= 48 && code <= 57) return code - 48; // '0'-'9'
  if (code >= 65 && code <= 78) return code - 55; // 'A'-'N' → 10-23
  if (ch === "&") return 24;
  if (code >= 79 && code <= 90) return code - 54; // 'O'-'Z' → 25-36
  if (ch === " ") return 37;
  if (ch === "Ñ") return 38;
  return -1;
}

/** Compute SAT homoclave DV. body12 is the 12-char string after PM-padding. */
function computeRfcDv(body12: string): string | null {
  if (body12.length !== 12) return null;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const v = rfcCharValue(body12.charAt(i));
    if (v < 0) return null;
    sum += v * (13 - i);
  }
  const r = sum % 11;
  const dv = 11 - r;
  if (dv === 11) return "0";
  if (dv === 10) return "A";
  return String(dv);
}

/**
 * Generate a homoclave first-char in `[1-9A-V]` to satisfy python-stdnum's
 * stricter regex (`^[1-9A-V][1-9A-Z][0-9A]$`) that nationid does NOT enforce.
 * Documented divergence — see CROSS_VALIDATION.md.
 */
function randHomoclave1(rng: () => number): string {
  // 9 digits 1-9 + 22 letters A-V → 31 valid chars
  const chars = "123456789ABCDEFGHIJKLMNOPQRSTUV";
  return chars.charAt(randInt(rng, chars.length));
}
function randHomoclave2(rng: () => number): string {
  // 1-9 + A-Z → 35 valid chars (excludes 0)
  const chars = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return chars.charAt(randInt(rng, chars.length));
}

/** RFC PF blacklist (SAT Anexo 1-A — palabras altisonantes). */
const RFC_PF_BLACKLIST: ReadonlySet<string> = new Set([
  "BACA",
  "BAKA",
  "BUEI",
  "BUEY",
  "CACA",
  "CACO",
  "CAGA",
  "CAGO",
  "CAKA",
  "CAKO",
  "COGE",
  "COGI",
  "COJA",
  "COJE",
  "COJI",
  "COJO",
  "COLA",
  "CULO",
  "FALO",
  "FETO",
  "GETA",
  "GUEI",
  "GUEY",
  "JETA",
  "JOTO",
  "KACA",
  "KACO",
  "KAGA",
  "KAGO",
  "KAKA",
  "KAKO",
  "KOGE",
  "KOGI",
  "KOJA",
  "KOJE",
  "KOJI",
  "KOJO",
  "KOLA",
  "KULO",
  "LILO",
  "LOCA",
  "LOCO",
  "LOKA",
  "LOKO",
  "MAME",
  "MAMO",
  "MEAR",
  "MEAS",
  "MEON",
  "MIAR",
  "MION",
  "MOCO",
  "MOKO",
  "MULA",
  "MULO",
  "NACA",
  "NACO",
  "PEDA",
  "PEDO",
  "PENE",
  "PIPI",
  "PITO",
  "POPO",
  "PUTA",
  "PUTO",
  "QULO",
  "RATA",
  "ROBA",
  "ROBE",
  "ROBO",
  "RUIN",
  "SENO",
  "TETA",
  "VACA",
  "VAGA",
  "VAGO",
  "VAKA",
  "VUEI",
  "VUEY",
  "WUEI",
  "WUEY",
]);

/** Generate `count` valid RFC PF (13-char) strings cross-acceptable to both libs. */
export function generateValidRfcPfs(count: number): string[] {
  const rng = mulberry32(seedFromString("MX_RFC_PF_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    let pre4 = "";
    while (pre4.length < 4) pre4 += randUpper(rng);
    if (RFC_PF_BLACKLIST.has(pre4)) continue;
    const yy = String(randInt(rng, 100)).padStart(2, "0");
    const mm = String(1 + randInt(rng, 12)).padStart(2, "0");
    const dd = String(1 + randInt(rng, 28)).padStart(2, "0");
    const homo2 = randHomoclave1(rng) + randHomoclave2(rng);
    const body12 = pre4 + yy + mm + dd + homo2;
    const dv = computeRfcDv(body12);
    if (dv === null) continue;
    out.push(body12 + dv);
  }
  return out;
}

/** Generate `count` invalid RFC PF (good shape, wrong DV). */
export function generateInvalidRfcPfs(count: number): string[] {
  const rng = mulberry32(seedFromString("MX_RFC_PF_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    let pre4 = "";
    while (pre4.length < 4) pre4 += randUpper(rng);
    if (RFC_PF_BLACKLIST.has(pre4)) continue;
    const yy = String(randInt(rng, 100)).padStart(2, "0");
    const mm = String(1 + randInt(rng, 12)).padStart(2, "0");
    const dd = String(1 + randInt(rng, 28)).padStart(2, "0");
    const homo2 = randHomoclave1(rng) + randHomoclave2(rng);
    const body12 = pre4 + yy + mm + dd + homo2;
    const dv = computeRfcDv(body12);
    if (dv === null) continue;
    // Pick a wrong DV character that is also in [0-9A] (the python-stdnum
    // regex constraint for the last char). Otherwise python-stdnum rejects
    // for format reasons, not checksum, but both still return false — fine.
    const candidates = "0123456789A";
    let bad = dv;
    while (bad === dv) {
      bad = candidates.charAt(randInt(rng, candidates.length));
    }
    out.push(body12 + bad);
  }
  return out;
}

/** Generate `count` valid RFC PM (12-char) strings. */
export function generateValidRfcPms(count: number): string[] {
  const rng = mulberry32(seedFromString("MX_RFC_PM_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    let pre3 = "";
    while (pre3.length < 3) pre3 += randUpper(rng);
    const yy = String(randInt(rng, 100)).padStart(2, "0");
    const mm = String(1 + randInt(rng, 12)).padStart(2, "0");
    const dd = String(1 + randInt(rng, 28)).padStart(2, "0");
    const homo2 = randHomoclave1(rng) + randHomoclave2(rng);
    const body11 = pre3 + yy + mm + dd + homo2;
    // PM padding: prepend a single space to align to 12 chars.
    const dv = computeRfcDv(` ${body11}`);
    if (dv === null) continue;
    out.push(body11 + dv);
  }
  return out;
}

/** Generate `count` invalid RFC PM (good shape, wrong DV). */
export function generateInvalidRfcPms(count: number): string[] {
  const rng = mulberry32(seedFromString("MX_RFC_PM_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    let pre3 = "";
    while (pre3.length < 3) pre3 += randUpper(rng);
    const yy = String(randInt(rng, 100)).padStart(2, "0");
    const mm = String(1 + randInt(rng, 12)).padStart(2, "0");
    const dd = String(1 + randInt(rng, 28)).padStart(2, "0");
    const homo2 = randHomoclave1(rng) + randHomoclave2(rng);
    const body11 = pre3 + yy + mm + dd + homo2;
    const dv = computeRfcDv(` ${body11}`);
    if (dv === null) continue;
    const candidates = "0123456789A";
    let bad = dv;
    while (bad === dv) {
      bad = candidates.charAt(randInt(rng, candidates.length));
    }
    out.push(body11 + bad);
  }
  return out;
}

/* ---------- CO NIT ---------- */

const DIAN_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43] as const;

function computeCoNitDv(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const fromRight = body.length - 1 - i;
    const w = DIAN_WEIGHTS[i];
    if (w === undefined) return -1;
    const d = body.charCodeAt(fromRight) - 48;
    if (d < 0 || d > 9) return -1;
    sum += d * w;
  }
  const r = sum % 11;
  return r < 2 ? r : 11 - r;
}

/** Generate `count` valid CO NITs (10 or 11 digits, including DV). */
export function generateValidCoNits(count: number): string[] {
  const rng = mulberry32(seedFromString("CO_NIT_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const bodyLen = 9 + randInt(rng, 2); // 9 or 10
    let body = randDigits(rng, bodyLen);
    // Avoid leading zero so python-stdnum doesn't perceive the body as shorter.
    while (body.charAt(0) === "0") body = String(1 + randInt(rng, 9)) + body.slice(1);
    if (isAllSame(body)) continue;
    const dv = computeCoNitDv(body);
    if (dv < 0 || dv > 9) continue;
    out.push(body + String(dv));
  }
  return out;
}

/** Generate `count` invalid CO NITs (DV flipped by 1 mod 10). */
export function generateInvalidCoNits(count: number): string[] {
  const rng = mulberry32(seedFromString("CO_NIT_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const bodyLen = 9 + randInt(rng, 2);
    let body = randDigits(rng, bodyLen);
    while (body.charAt(0) === "0") body = String(1 + randInt(rng, 9)) + body.slice(1);
    if (isAllSame(body)) continue;
    const dv = computeCoNitDv(body);
    if (dv < 0 || dv > 9) continue;
    const badDv = (dv + 1) % 10;
    out.push(body + String(badDv));
  }
  return out;
}

/* ---------- PE RUC ---------- */

/**
 * PE RUC prefixes recognized by both SUNAT (per nationid) AND python-stdnum.
 *
 * SUNAT issues `10, 15, 16, 17, 20`. python-stdnum 2.2's regex omits `16`
 * (no domiciliado especial). The agreement-rate generator uses the
 * 4-prefix intersection and the divergence is exercised by an explicit
 * "nationid accepts, stdnum rejects" test (see `stdnum-pe.test.ts`).
 */
const RUC_PREFIXES = ["10", "15", "17", "20"] as const;
/** PE RUC prefixes nationid accepts but python-stdnum 2.2 rejects. */
export const RUC_PREFIXES_NATIONID_ONLY = ["16"] as const;
const RUC_W = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

function computePeRucDv(body10: string): number {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const w = RUC_W[i];
    if (w === undefined) return -1;
    sum += (body10.charCodeAt(i) - 48) * w;
  }
  const r = sum % 11;
  let dv = 11 - r;
  if (dv === 11) dv = 0;
  else if (dv === 10) dv = 1;
  return dv;
}

/**
 * Compute the raw `sum mod 11` for a PE RUC body — used by generators to
 * skip bodies whose mod-11 result falls in the python-stdnum-divergence
 * zone (r ∈ {0, 1}, see PE_RUC documented divergence D9 in
 * `docs/CROSS_VALIDATION.md`).
 */
function rucModResidue(body10: string): number {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const w = RUC_W[i];
    if (w === undefined) return -1;
    sum += (body10.charCodeAt(i) - 48) * w;
  }
  return sum % 11;
}

/**
 * Generate `count` valid PE RUCs (11 digits with valid SUNAT prefix).
 *
 * Skips bodies whose mod-11 residue is `0` or `1` because python-stdnum 2.2
 * uses `(11 - r) % 10` which maps `r=0 → 1` and `r=1 → 0`, contradicting
 * SUNAT (RS 210-2004) which maps `r=0 → 0` and `r=1 → 1`. nationid follows
 * SUNAT. The divergence is asserted explicitly in `stdnum-pe.test.ts`.
 */
export function generateValidRucs(count: number): string[] {
  const rng = mulberry32(seedFromString("PE_RUC_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = RUC_PREFIXES[randInt(rng, RUC_PREFIXES.length)];
    if (prefix === undefined) continue;
    const body8 = randDigits(rng, 8);
    const body10 = prefix + body8;
    if (isAllSame(body10)) continue;
    const r = rucModResidue(body10);
    if (r === 0 || r === 1) continue; // skip stdnum-divergence zone
    const dv = computePeRucDv(body10);
    if (dv < 0) continue;
    out.push(body10 + String(dv));
  }
  return out;
}

/** Generate `count` invalid PE RUCs (correct prefix, wrong DV). */
export function generateInvalidRucs(count: number): string[] {
  const rng = mulberry32(seedFromString("PE_RUC_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = RUC_PREFIXES[randInt(rng, RUC_PREFIXES.length)];
    if (prefix === undefined) continue;
    const body8 = randDigits(rng, 8);
    const body10 = prefix + body8;
    if (isAllSame(body10)) continue;
    const r = rucModResidue(body10);
    if (r === 0 || r === 1) continue; // skip stdnum-divergence zone (D9)
    const dv = computePeRucDv(body10);
    if (dv < 0) continue;
    const badDv = (dv + 1) % 10;
    out.push(body10 + String(badDv));
  }
  return out;
}

/**
 * Generate `count` valid PE RUCs in the "DV-divergence zone" (r ∈ {0, 1}) —
 * SUNAT-correct DV that python-stdnum 2.2 rejects due to its `(11-r) % 10`
 * shortcut. Used to assert documented divergence D9.
 */
export function generateValidRucsDvDivergence(count: number): string[] {
  const rng = mulberry32(seedFromString("PE_RUC_DV_DIVERGENCE"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = RUC_PREFIXES[randInt(rng, RUC_PREFIXES.length)];
    if (prefix === undefined) continue;
    const body8 = randDigits(rng, 8);
    const body10 = prefix + body8;
    if (isAllSame(body10)) continue;
    const r = rucModResidue(body10);
    if (r !== 0 && r !== 1) continue;
    const dv = computePeRucDv(body10);
    if (dv < 0) continue;
    out.push(body10 + String(dv));
  }
  return out;
}

/**
 * Generate `count` valid PE RUCs whose prefix is `16` — accepted by SUNAT and
 * nationid but rejected by python-stdnum 2.2. Used to assert the documented
 * divergence.
 */
export function generateValidRucsNationidOnly(count: number): string[] {
  const rng = mulberry32(seedFromString("PE_RUC_VALID_NATIONID_ONLY"));
  const out: string[] = [];
  while (out.length < count) {
    const prefix = RUC_PREFIXES_NATIONID_ONLY[randInt(rng, RUC_PREFIXES_NATIONID_ONLY.length)];
    if (prefix === undefined) continue;
    const body8 = randDigits(rng, 8);
    const body10 = prefix + body8;
    if (isAllSame(body10)) continue;
    const dv = computePeRucDv(body10);
    if (dv < 0) continue;
    out.push(body10 + String(dv));
  }
  return out;
}

/* ---------- PE DNI (8-digit, format only) ---------- */

/** Generate `count` valid PE DNIs (8 digits; nationid format-only, no checksum). */
export function generateValidPeDnis(count: number): string[] {
  const rng = mulberry32(seedFromString("PE_DNI_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body = randDigits(rng, 8);
    out.push(body);
  }
  return out;
}

/* ---------- DO Cédula (Luhn-11) ---------- */

function luhn11Check(d: string): boolean {
  if (d.length !== 11) return false;
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    let x = d.charCodeAt(10 - i) - 48;
    if (i % 2 === 1) {
      x *= 2;
      if (x > 9) x -= 9;
    }
    sum += x;
  }
  return sum % 10 === 0;
}

/** Generate `count` valid 11-digit DO cédulas (Luhn). */
export function generateValidDoCedulas(count: number): string[] {
  const rng = mulberry32(seedFromString("DO_CEDULA_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body10 = randDigits(rng, 10);
    let dv = -1;
    for (let cd = 0; cd < 10; cd++) {
      if (luhn11Check(body10 + String(cd))) {
        dv = cd;
        break;
      }
    }
    if (dv < 0) continue;
    out.push(body10 + String(dv));
  }
  return out;
}

/** Generate `count` invalid 11-digit DO cédulas (DV flipped). */
export function generateInvalidDoCedulas(count: number): string[] {
  const rng = mulberry32(seedFromString("DO_CEDULA_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body10 = randDigits(rng, 10);
    let dv = -1;
    for (let cd = 0; cd < 10; cd++) {
      if (luhn11Check(body10 + String(cd))) {
        dv = cd;
        break;
      }
    }
    if (dv < 0) continue;
    const badDv = (dv + 1) % 10;
    out.push(body10 + String(badDv));
  }
  return out;
}

/* ---------- DO RNC (mod-11 weights 7,9,8,6,5,4,3,2) ---------- */

const DO_RNC_W = [7, 9, 8, 6, 5, 4, 3, 2] as const;

function computeDoRncDv(body8: string): number {
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const w = DO_RNC_W[i];
    if (w === undefined) return -1;
    sum += (body8.charCodeAt(i) - 48) * w;
  }
  const r = sum % 11;
  if (r === 0) return 2;
  if (r === 1) return 1;
  return 11 - r;
}

/** Generate `count` valid DO RNCs (9 digits). */
export function generateValidDoRncs(count: number): string[] {
  const rng = mulberry32(seedFromString("DO_RNC_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body8 = randDigits(rng, 8);
    if (isAllSame(body8)) continue;
    const dv = computeDoRncDv(body8);
    if (dv < 0 || dv > 9) continue;
    out.push(body8 + String(dv));
  }
  return out;
}

/** Generate `count` invalid DO RNCs (wrong DV). */
export function generateInvalidDoRncs(count: number): string[] {
  const rng = mulberry32(seedFromString("DO_RNC_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body8 = randDigits(rng, 8);
    if (isAllSame(body8)) continue;
    const dv = computeDoRncDv(body8);
    if (dv < 0 || dv > 9) continue;
    const badDv = (dv + 1) % 10;
    out.push(body8 + String(badDv));
  }
  return out;
}

/* ---------- GT NIT (mod-11, K verifier) ---------- */

function computeGtNitDv(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const idx = body.length - 1 - i;
    const d = body.charCodeAt(idx) - 48;
    if (d < 0 || d > 9) return "?";
    sum += d * (i + 2);
  }
  const r = ((-sum % 11) + 11) % 11;
  if (r === 10) return "K";
  return String(r);
}

/**
 * Generate `count` valid GT NITs (body 4-8 digits, no leading zero, not
 * all-same, in raw `BODY+DV` form). 4-digit minimum keeps both libs in
 * agreement (python-stdnum requires len >= 2 after lstrip-zeros, nationid
 * accepts 1-12 body digits).
 */
export function generateValidGtNits(count: number): string[] {
  const rng = mulberry32(seedFromString("GT_NIT_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const len = 4 + randInt(rng, 5); // 4..8
    let body = randDigits(rng, len);
    while (body.charAt(0) === "0") body = String(1 + randInt(rng, 9)) + body.slice(1);
    if (isAllSame(body)) continue;
    out.push(body + computeGtNitDv(body));
  }
  return out;
}

/** Generate `count` invalid GT NITs (DV flipped to a different valid char). */
export function generateInvalidGtNits(count: number): string[] {
  const rng = mulberry32(seedFromString("GT_NIT_INVALID"));
  const alphabet = "0123456789K";
  const out: string[] = [];
  while (out.length < count) {
    const len = 4 + randInt(rng, 5);
    let body = randDigits(rng, len);
    while (body.charAt(0) === "0") body = String(1 + randInt(rng, 9)) + body.slice(1);
    if (isAllSame(body)) continue;
    const correct = computeGtNitDv(body);
    let bad = correct;
    while (bad === correct) bad = alphabet.charAt(randInt(rng, alphabet.length));
    out.push(body + bad);
  }
  return out;
}

/* ---------- CR Cédula Física (9 digits, format only, prov 1-9) ---------- */

/**
 * Generate `count` valid CR cédulas in the 9-digit nationid form. We pick
 * provincia in [1-7] (the historically issued provincias) plus 8 (naturalizados)
 * — this matches the cross-section both libraries accept.
 */
export function generateValidCrCedulasFisicas(count: number): string[] {
  const rng = mulberry32(seedFromString("CR_CF_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const prov = String(1 + randInt(rng, 8)); // 1..8
    const tomo = randDigits(rng, 4);
    const asiento = randDigits(rng, 4);
    out.push(prov + tomo + asiento);
  }
  return out;
}

/* ---------- CR Cédula Jurídica (10 digits, prefix 3, subtype shared) ---------- */

/**
 * python-stdnum CR CPJ accepts only specific subtype codes. The set we
 * intersect with nationid (which only checks prefix `3`) is the python-stdnum
 * "class three" list: 002,003,004,005,006,007,008,009,010,011,012,013,014,
 * 101,102,103,104,105,106,107,108,109,110.
 */
const CR_CPJ_CLASS_THREE_TYPES = [
  "002",
  "003",
  "004",
  "005",
  "006",
  "007",
  "008",
  "009",
  "010",
  "011",
  "012",
  "013",
  "014",
  "101",
  "102",
  "103",
  "104",
  "105",
  "106",
  "107",
  "108",
  "109",
  "110",
] as const;

/** Generate `count` valid CR cédulas jurídicas in the shared subset. */
export function generateValidCrCedulasJuridicas(count: number): string[] {
  const rng = mulberry32(seedFromString("CR_CJ_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const subtype = CR_CPJ_CLASS_THREE_TYPES[randInt(rng, CR_CPJ_CLASS_THREE_TYPES.length)];
    if (subtype === undefined) continue;
    const correlativo = randDigits(rng, 6);
    out.push(`3${subtype}${correlativo}`);
  }
  return out;
}

/* ---------- US SSN (9-digit, format-only, area not 000/666/9xx) ---------- */

/** Pick an SSA-issuable area code in [001..899] excluding 666. */
function randSsnArea(rng: () => number): string {
  while (true) {
    const a = 1 + randInt(rng, 899);
    if (a !== 666) return String(a).padStart(3, "0");
  }
}

/** Generate `count` valid SSNs (area 001-899 except 666; group != 00; serial != 0000). */
export function generateValidSsns(count: number): string[] {
  const rng = mulberry32(seedFromString("US_SSN_VALID"));
  const out: string[] = [];
  // python-stdnum has a tiny blacklist of 3 famous SSNs; avoid hitting them.
  const blacklist = new Set(["078051120", "457555462", "219099999"]);
  while (out.length < count) {
    const area = randSsnArea(rng);
    const group = String(1 + randInt(rng, 99)).padStart(2, "0");
    const serial = String(1 + randInt(rng, 9999)).padStart(4, "0");
    const candidate = area + group + serial;
    if (blacklist.has(candidate)) continue;
    out.push(candidate);
  }
  return out;
}

/** Generate `count` invalid SSNs (area 000 or 666 or 9xx, group 00, serial 0000). */
export function generateInvalidSsns(count: number): string[] {
  const rng = mulberry32(seedFromString("US_SSN_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const r = randInt(rng, 5);
    let candidate: string;
    if (r === 0) {
      // area 000
      candidate = `000${randDigits(rng, 6)}`;
    } else if (r === 1) {
      // area 666
      candidate = `666${randDigits(rng, 6)}`;
    } else if (r === 2) {
      // area 9xx (reserved)
      const a = 900 + randInt(rng, 100);
      candidate = `${String(a)}${randDigits(rng, 6)}`;
    } else if (r === 3) {
      // group 00
      candidate = `${randSsnArea(rng)}00${randDigits(rng, 4)}`;
    } else {
      // serial 0000
      const group = String(1 + randInt(rng, 99)).padStart(2, "0");
      candidate = `${randSsnArea(rng)}${group}0000`;
    }
    out.push(candidate);
  }
  return out;
}

/* ---------- US ITIN ---------- */

/**
 * ITIN groups accepted by BOTH python-stdnum and nationid. nationid follows
 * the IRS Pub. 1915 modern range (50-65, 70-88, 90-92, 94-99) but
 * python-stdnum only accepts groups 70-99 except {89, 93}. The shared subset
 * is 70-88 ∪ 90-92 ∪ 94-99 = 28 groups.
 */
function buildSharedItinGroups(): readonly string[] {
  const out: string[] = [];
  for (let g = 70; g <= 88; g++) out.push(String(g).padStart(2, "0"));
  for (let g = 90; g <= 92; g++) out.push(String(g).padStart(2, "0"));
  for (let g = 94; g <= 99; g++) out.push(String(g).padStart(2, "0"));
  return out;
}
const SHARED_ITIN_GROUPS = buildSharedItinGroups();

/** ITIN groups accepted ONLY by nationid (50-65 — IRS Pub. 1915 modern range). */
const NATIONID_ONLY_ITIN_GROUPS = ((): readonly string[] => {
  const out: string[] = [];
  for (let g = 50; g <= 65; g++) out.push(String(g).padStart(2, "0"));
  return out;
})();

/** Generate `count` valid ITINs in the shared group range. */
export function generateValidItins(count: number): string[] {
  const rng = mulberry32(seedFromString("US_ITIN_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const area = `9${randDigits(rng, 2)}`;
    const group = SHARED_ITIN_GROUPS[randInt(rng, SHARED_ITIN_GROUPS.length)];
    if (group === undefined) continue;
    const serial = randDigits(rng, 4);
    out.push(area + group + serial);
  }
  return out;
}

/** Generate `count` ITINs nationid accepts but python-stdnum rejects (groups 50-65). */
export function generateNationidOnlyItins(count: number): string[] {
  const rng = mulberry32(seedFromString("US_ITIN_NATIONID_ONLY"));
  const out: string[] = [];
  while (out.length < count) {
    const area = `9${randDigits(rng, 2)}`;
    const group = NATIONID_ONLY_ITIN_GROUPS[randInt(rng, NATIONID_ONLY_ITIN_GROUPS.length)];
    if (group === undefined) continue;
    const serial = randDigits(rng, 4);
    out.push(area + group + serial);
  }
  return out;
}

/** Generate `count` invalid ITINs (area not 9xx, group invalid, etc.). */
export function generateInvalidItins(count: number): string[] {
  const rng = mulberry32(seedFromString("US_ITIN_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const r = randInt(rng, 3);
    if (r === 0) {
      // wrong area (1-899)
      const area = String(100 + randInt(rng, 800)).padStart(3, "0");
      out.push(area + randDigits(rng, 6));
    } else if (r === 1) {
      // 9xx but group 89 (python-stdnum rejects 89; nationid also rejects 89)
      out.push(`9${randDigits(rng, 2)}89${randDigits(rng, 4)}`);
    } else {
      // 9xx but group 93 (both libs reject 93)
      out.push(`9${randDigits(rng, 2)}93${randDigits(rng, 4)}`);
    }
  }
  return out;
}

/* ---------- NL BSN ---------- */

/**
 * NL BSN eleven-test:
 *   sum = 9d1 + 8d2 + 7d3 + 6d4 + 5d5 + 4d6 + 3d7 + 2d8 - d9
 *   valid iff sum mod 11 == 0
 *
 * To derive a valid d9 from a body of 8 digits:
 *   partial = 9d1 + 8d2 + ... + 2d8
 *   need d9 ≡ partial (mod 11)
 *   if partial mod 11 == 10 there is no valid 1-digit d9 — reject and retry.
 */
function bsnCheck(body8: string): number | null {
  let partial = 0;
  for (let i = 0; i < 8; i++) {
    const d = body8.charCodeAt(i) - 48;
    partial += d * (9 - i);
  }
  const r = partial % 11;
  return r === 10 ? null : r;
}

/** Generate `count` algorithmically-valid NL BSNs. */
export function generateValidBsns(count: number): string[] {
  const rng = mulberry32(seedFromString("NL_BSN_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body = randDigits(rng, 8);
    const dv = bsnCheck(body);
    if (dv === null) continue;
    const bsn = body + String(dv);
    if (bsn === "000000000") continue; // both libs reject this placeholder
    out.push(bsn);
  }
  return out;
}

/** Generate `count` invalid NL BSNs by flipping the check digit. */
export function generateInvalidBsns(count: number): string[] {
  const rng = mulberry32(seedFromString("NL_BSN_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body = randDigits(rng, 8);
    const dv = bsnCheck(body);
    if (dv === null) continue;
    const wrong = (dv + 1 + randInt(rng, 9)) % 10; // any digit other than dv
    if (wrong === dv) continue;
    out.push(body + String(wrong));
  }
  return out;
}

/* ---------- HR OIB ---------- */

/**
 * HR OIB check digit via ISO/IEC 7064 MOD 11,10 over the first 10 body
 * digits. Algorithm:
 *
 *   p = 10
 *   for digit d in body:
 *     s = (d + p) mod 10
 *     if s == 0: s = 10
 *     p = (s * 2) mod 11
 *   check = (11 - p) mod 10
 */
function oibCheck(body10: string): number {
  let p = 10;
  for (let i = 0; i < 10; i++) {
    const d = body10.charCodeAt(i) - 48;
    let s = (d + p) % 10;
    if (s === 0) s = 10;
    p = (s * 2) % 11;
  }
  return (11 - p) % 10;
}

/** Generate `count` algorithmically-valid HR OIBs (bare 11-digit form). */
export function generateValidOibs(count: number): string[] {
  const rng = mulberry32(seedFromString("HR_OIB_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body = randDigits(rng, 10);
    out.push(body + String(oibCheck(body)));
  }
  return out;
}

/** Generate `count` invalid HR OIBs by flipping the check digit. */
export function generateInvalidOibs(count: number): string[] {
  const rng = mulberry32(seedFromString("HR_OIB_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const body = randDigits(rng, 10);
    const dv = oibCheck(body);
    const wrong = (dv + 1 + randInt(rng, 9)) % 10;
    if (wrong === dv) continue;
    out.push(body + String(wrong));
  }
  return out;
}

/* ---------- PL PESEL ---------- */

const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3] as const;
const PESEL_CENTURY_OFFSETS = [0, 20, 40, 60, 80] as const;

/**
 * PL PESEL check digit:
 *   sum = Σ weights[i] * digit[i]  (i = 0..9, weights = [1,3,7,9,1,3,7,9,1,3])
 *   check = (10 - sum mod 10) mod 10
 */
function peselCheck(body10: string): number {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    const d = body10.charCodeAt(i) - 48;
    const w = PESEL_WEIGHTS[i];
    if (w === undefined) continue;
    sum += d * w;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Generate `count` algorithmically-valid PL PESELs across all five
 * century-offset variants. Date is restricted to day 1..28 to avoid
 * month-length collisions; this keeps both nationid's plausibility check
 * and python-stdnum happy.
 */
export function generateValidPesels(count: number): string[] {
  const rng = mulberry32(seedFromString("PL_PESEL_VALID"));
  const out: string[] = [];
  while (out.length < count) {
    const yy = randInt(rng, 100); // 0..99
    const month = 1 + randInt(rng, 12); // 1..12
    const offset = PESEL_CENTURY_OFFSETS[randInt(rng, PESEL_CENTURY_OFFSETS.length)];
    if (offset === undefined) continue;
    const mmEncoded = month + offset;
    const dd = 1 + randInt(rng, 28); // 1..28
    const yyStr = String(yy).padStart(2, "0");
    const mmStr = String(mmEncoded).padStart(2, "0");
    const ddStr = String(dd).padStart(2, "0");
    const serial = randDigits(rng, 4);
    const body = yyStr + mmStr + ddStr + serial;
    out.push(body + String(peselCheck(body)));
  }
  return out;
}

/** Generate `count` invalid PL PESELs (valid date encoding, wrong check digit). */
export function generateInvalidPesels(count: number): string[] {
  const rng = mulberry32(seedFromString("PL_PESEL_INVALID"));
  const out: string[] = [];
  while (out.length < count) {
    const yy = randInt(rng, 100);
    const month = 1 + randInt(rng, 12);
    const offset = PESEL_CENTURY_OFFSETS[randInt(rng, PESEL_CENTURY_OFFSETS.length)];
    if (offset === undefined) continue;
    const mmEncoded = month + offset;
    const dd = 1 + randInt(rng, 28);
    const yyStr = String(yy).padStart(2, "0");
    const mmStr = String(mmEncoded).padStart(2, "0");
    const ddStr = String(dd).padStart(2, "0");
    const serial = randDigits(rng, 4);
    const body = yyStr + mmStr + ddStr + serial;
    const dv = peselCheck(body);
    const wrong = (dv + 1 + randInt(rng, 9)) % 10;
    if (wrong === dv) continue;
    out.push(body + String(wrong));
  }
  return out;
}
