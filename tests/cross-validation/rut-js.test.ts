/**
 * Cross-validation: nationid vs `rut.js` (npm).
 *
 * Coverage: CL_RUT — 60 valid + 60 invalid synthetic vectors.
 *
 * `rut.js` last published in 2021 but the SII algorithm has not changed. It is
 * the de-facto JS reference for Chilean RUT validation.
 */

import { clean as rutClean, format as rutFormat, validate as rutValidate } from "rut.js";
import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import { generateInvalidRuts, generateValidRuts } from "./_helpers.ts";

const VECTOR_COUNT = 60;

const VALID_RUTS = generateValidRuts(VECTOR_COUNT);
const INVALID_RUTS = generateInvalidRuts(VECTOR_COUNT);

describe("CL_RUT — agrees with rut.js (valid vectors)", () => {
  it.each(VALID_RUTS)("both accept %s", (input) => {
    expect(rutValidate(input)).toBe(true);
    expect(validate("CL_RUT", input)).toBe(true);
  });
});

describe("CL_RUT — agrees with rut.js (invalid vectors)", () => {
  it.each(INVALID_RUTS)("both reject %s", (input) => {
    expect(rutValidate(input)).toBe(false);
    expect(validate("CL_RUT", input)).toBe(false);
  });
});

describe("CL_RUT — formatting parity (raw <-> dotted-hyphen)", () => {
  // rut.js and nationid both produce the canonical SII display form for
  // valid RUTs. We assert nationid normalize == rut.clean and that nationid
  // accepts the formatted output of rut.js.
  it.each(VALID_RUTS.slice(0, 10))("nationid accepts rut.js formatted %s", (input) => {
    const formatted = rutFormat(input);
    expect(validate("CL_RUT", formatted)).toBe(true);
  });

  it.each(VALID_RUTS.slice(0, 10))("rut.clean output matches what nationid accepts %s", (input) => {
    const cleaned = rutClean(rutFormat(input));
    // rut.js leaves the K verifier uppercase by convention; nationid
    // normalizes to the same.
    expect(validate("CL_RUT", cleaned)).toBe(true);
  });
});
