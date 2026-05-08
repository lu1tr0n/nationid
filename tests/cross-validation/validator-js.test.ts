/**
 * Cross-validation: nationid vs `validator.js` (npm).
 *
 * Coverage:
 *   - ES_DNI via `isIdentityCard('ES')` AND `isTaxID('es-ES')`.
 *   - ES_NIE via `isIdentityCard('ES')` AND `isTaxID('es-ES')`.
 *   - AR_CUIT via `isTaxID('es-AR')`.
 *   - BR_CPF via `isTaxID('pt-BR')`.
 *   - BR_CNPJ via `isTaxID('pt-BR')` (raw 14-digit form only — see notes).
 *   - US_EIN via `isTaxID('en-US')`.
 *
 * Out of scope for validator.js (no agreement check possible):
 *   - ES_NIF_PJ (CIF entity NIF). validator.js `es-ES` regex covers personal
 *     NIFs only (`/^(\d{0,8}|[XYZKLM]\d{7})[A-HJ-NP-TV-Z]$/i`).
 *   - US_SSN, US_ITIN. validator.js `en-US` covers EIN prefix lookup only.
 *   - All non-EU/non-AR/non-BR LATAM documents (SV, MX, CO, PE, GT, HN, CR,
 *     DO, CL via this lib).
 *
 * Documented divergences (failures here are EXPECTED, not bugs):
 *   - AR_CUIT prefixes `25, 26`: nationid accepts (per AFIP RG 10/97);
 *     validator.js rejects (regex omission). Asserted with explicit "nationid
 *     accepts, validator rejects" tests.
 *   - AR_CUIT bodies whose mod-11 produces dv === 10: nationid invalidates
 *     (AFIP § 4 — those bodies are reissued with a different prefix);
 *     validator.js silently rewrites dv to 9 and accepts. Our generator
 *     skips dv-10 bodies so the apples-to-apples comparison stays clean.
 *   - BR_CNPJ formatted with dots/slashes: validator.js rejects (regex
 *     restriction). We feed the unformatted 14-digit form so behavior
 *     comparison is on algorithm, not on regex shape.
 */

import validator from "validator";
import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import {
  CUIT_PREFIXES_NATIONID_ONLY,
  generateInvalidCnpjs,
  generateInvalidCpfs,
  generateInvalidCuits,
  generateInvalidDnis,
  generateInvalidEins,
  generateInvalidNies,
  generateValidCnpjs,
  generateValidCpfs,
  generateValidCuits,
  generateValidCuitsNationidOnly,
  generateValidDnis,
  generateValidEins,
  generateValidNies,
} from "./_helpers.ts";

const VECTOR_COUNT = 60;

const VALID_DNIS = generateValidDnis(VECTOR_COUNT);
const INVALID_DNIS = generateInvalidDnis(VECTOR_COUNT);
const VALID_NIES = generateValidNies(VECTOR_COUNT);
const INVALID_NIES = generateInvalidNies(VECTOR_COUNT);
const VALID_CUITS = generateValidCuits(VECTOR_COUNT);
const INVALID_CUITS = generateInvalidCuits(VECTOR_COUNT);
const VALID_CPFS = generateValidCpfs(VECTOR_COUNT);
const INVALID_CPFS = generateInvalidCpfs(VECTOR_COUNT);
const VALID_CNPJS = generateValidCnpjs(VECTOR_COUNT);
const INVALID_CNPJS = generateInvalidCnpjs(VECTOR_COUNT);
const VALID_EINS = generateValidEins(VECTOR_COUNT);
const INVALID_EINS = generateInvalidEins(VECTOR_COUNT);

/* ------------------------------------------------------------------ */
/* ES_DNI                                                              */
/* ------------------------------------------------------------------ */

describe("ES_DNI — agrees with validator.isIdentityCard('ES') (valid)", () => {
  it.each(VALID_DNIS)("both accept %s", (input) => {
    expect(validator.isIdentityCard(input, "ES")).toBe(true);
    expect(validate("ES_DNI", input)).toBe(true);
  });
});

describe("ES_DNI — agrees with validator.isIdentityCard('ES') (invalid)", () => {
  it.each(INVALID_DNIS)("both reject %s", (input) => {
    expect(validator.isIdentityCard(input, "ES")).toBe(false);
    expect(validate("ES_DNI", input)).toBe(false);
  });
});

describe("ES_DNI — agrees with validator.isTaxID('es-ES') (valid)", () => {
  it.each(VALID_DNIS)("both accept %s", (input) => {
    expect(validator.isTaxID(input, "es-ES")).toBe(true);
    expect(validate("ES_DNI", input)).toBe(true);
  });
});

describe("ES_DNI — agrees with validator.isTaxID('es-ES') (invalid)", () => {
  it.each(INVALID_DNIS)("both reject %s", (input) => {
    expect(validator.isTaxID(input, "es-ES")).toBe(false);
    expect(validate("ES_DNI", input)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* ES_NIE                                                              */
/* ------------------------------------------------------------------ */

describe("ES_NIE — agrees with validator.isIdentityCard('ES') (valid)", () => {
  it.each(VALID_NIES)("both accept %s", (input) => {
    expect(validator.isIdentityCard(input, "ES")).toBe(true);
    expect(validate("ES_NIE", input)).toBe(true);
  });
});

describe("ES_NIE — agrees with validator.isIdentityCard('ES') (invalid)", () => {
  it.each(INVALID_NIES)("both reject %s", (input) => {
    expect(validator.isIdentityCard(input, "ES")).toBe(false);
    expect(validate("ES_NIE", input)).toBe(false);
  });
});

describe("ES_NIE — agrees with validator.isTaxID('es-ES') (valid)", () => {
  it.each(VALID_NIES)("both accept %s", (input) => {
    expect(validator.isTaxID(input, "es-ES")).toBe(true);
    expect(validate("ES_NIE", input)).toBe(true);
  });
});

describe("ES_NIE — agrees with validator.isTaxID('es-ES') (invalid)", () => {
  it.each(INVALID_NIES)("both reject %s", (input) => {
    expect(validator.isTaxID(input, "es-ES")).toBe(false);
    expect(validate("ES_NIE", input)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* AR_CUIT                                                             */
/* ------------------------------------------------------------------ */

describe("AR_CUIT — agrees with validator.isTaxID('es-AR') (valid, shared prefixes)", () => {
  it.each(VALID_CUITS)("both accept %s", (input) => {
    expect(validator.isTaxID(input, "es-AR")).toBe(true);
    expect(validate("AR_CUIT", input)).toBe(true);
  });
});

describe("AR_CUIT — agrees with validator.isTaxID('es-AR') (invalid)", () => {
  it.each(INVALID_CUITS)("both reject %s", (input) => {
    expect(validator.isTaxID(input, "es-AR")).toBe(false);
    expect(validate("AR_CUIT", input)).toBe(false);
  });
});

describe("AR_CUIT — documented divergence on prefixes 25 and 26", () => {
  // AFIP RG 10/97 lists `25` and `26` as valid CUIT prefixes for personas
  // físicas. validator.js's regex omits them. nationid follows AFIP, the
  // authoritative issuer, and accepts; validator.js rejects.
  const VALID_NATIONID_ONLY = generateValidCuitsNationidOnly(20);

  it("scope sanity: every vector starts with 25 or 26", () => {
    for (const v of VALID_NATIONID_ONLY) {
      expect(CUIT_PREFIXES_NATIONID_ONLY).toContain(v.slice(0, 2));
    }
  });

  it.each(VALID_NATIONID_ONLY)("nationid accepts and validator.js rejects %s", (input) => {
    expect(validate("AR_CUIT", input)).toBe(true);
    expect(validator.isTaxID(input, "es-AR")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* BR_CPF                                                              */
/* ------------------------------------------------------------------ */

describe("BR_CPF — agrees with validator.isTaxID('pt-BR') (valid)", () => {
  it.each(VALID_CPFS)("both accept %s", (input) => {
    expect(validator.isTaxID(input, "pt-BR")).toBe(true);
    expect(validate("BR_CPF", input)).toBe(true);
  });
});

describe("BR_CPF — agrees with validator.isTaxID('pt-BR') (invalid)", () => {
  it.each(INVALID_CPFS)("both reject %s", (input) => {
    expect(validator.isTaxID(input, "pt-BR")).toBe(false);
    expect(validate("BR_CPF", input)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* BR_CNPJ — unformatted only; pt-BR regex rejects dotted form         */
/* ------------------------------------------------------------------ */

describe("BR_CNPJ — agrees with validator.isTaxID('pt-BR') (valid, raw form)", () => {
  it.each(VALID_CNPJS)("both accept raw %s", (input) => {
    expect(validator.isTaxID(input, "pt-BR")).toBe(true);
    expect(validate("BR_CNPJ", input)).toBe(true);
  });
});

describe("BR_CNPJ — agrees with validator.isTaxID('pt-BR') (invalid, raw form)", () => {
  it.each(INVALID_CNPJS)("both reject raw %s", (input) => {
    expect(validator.isTaxID(input, "pt-BR")).toBe(false);
    expect(validate("BR_CNPJ", input)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* US_EIN                                                              */
/* ------------------------------------------------------------------ */

describe("US_EIN — agrees with validator.isTaxID('en-US') (valid)", () => {
  it.each(VALID_EINS)("both accept %s", (input) => {
    expect(validator.isTaxID(input, "en-US")).toBe(true);
    expect(validate("US_EIN", input)).toBe(true);
  });
});

describe("US_EIN — agrees with validator.isTaxID('en-US') (invalid)", () => {
  it.each(INVALID_EINS)("both reject %s", (input) => {
    expect(validator.isTaxID(input, "en-US")).toBe(false);
    expect(validate("US_EIN", input)).toBe(false);
  });
});
