/**
 * Cross-validation: nationid vs `@brazilian-utils/brazilian-utils` (npm).
 *
 * `brazilian-utils` is the second well-known JS library for BR documents and
 * an additional independent implementation against which to validate. We use
 * the same synthetic vectors as the `cpf-cnpj-validator` suite to keep the
 * "agreement" comparison apples-to-apples.
 *
 * Coverage:
 *   - BR_CPF (`isValidCpf`)
 *   - BR_CNPJ (`isValidCnpj`)
 *   - BR_CNH (`isValidCnh`)
 *   - BR_TITULO_ELEITOR (`isValidVoterId`)
 *   - BR_PIS (`isValidPis`)
 */

import {
  isValidCnh,
  isValidCnpj,
  isValidCpf,
  isValidPis,
  isValidVoterId,
} from "@brazilian-utils/brazilian-utils";
import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import {
  generateInvalidCnhs,
  generateInvalidCnpjs,
  generateInvalidCpfs,
  generateInvalidPis,
  generateInvalidTitulos,
  generateValidCnhs,
  generateValidCnpjs,
  generateValidCpfs,
  generateValidPis,
  generateValidTitulos,
} from "./_helpers.ts";

const VECTOR_COUNT = 60;

const VALID_CPFS = generateValidCpfs(VECTOR_COUNT);
const INVALID_CPFS = generateInvalidCpfs(VECTOR_COUNT);
const VALID_CNPJS = generateValidCnpjs(VECTOR_COUNT);
const INVALID_CNPJS = generateInvalidCnpjs(VECTOR_COUNT);
const VALID_CNHS = generateValidCnhs(VECTOR_COUNT);
const INVALID_CNHS = generateInvalidCnhs(VECTOR_COUNT);
const VALID_TITULOS = generateValidTitulos(VECTOR_COUNT);
const INVALID_TITULOS = generateInvalidTitulos(VECTOR_COUNT);
const VALID_PIS = generateValidPis(VECTOR_COUNT);
const INVALID_PIS = generateInvalidPis(VECTOR_COUNT);

describe("BR_CPF — agrees with brazilian-utils (valid vectors)", () => {
  it.each(VALID_CPFS)("both accept %s", (input) => {
    expect(isValidCpf(input)).toBe(true);
    expect(validate("BR_CPF", input)).toBe(true);
  });
});

describe("BR_CPF — agrees with brazilian-utils (invalid vectors)", () => {
  it.each(INVALID_CPFS)("both reject %s", (input) => {
    expect(isValidCpf(input)).toBe(false);
    expect(validate("BR_CPF", input)).toBe(false);
  });
});

describe("BR_CNPJ — agrees with brazilian-utils (valid vectors)", () => {
  it.each(VALID_CNPJS)("both accept %s", (input) => {
    expect(isValidCnpj(input)).toBe(true);
    expect(validate("BR_CNPJ", input)).toBe(true);
  });
});

describe("BR_CNPJ — agrees with brazilian-utils (invalid vectors)", () => {
  it.each(INVALID_CNPJS)("both reject %s", (input) => {
    expect(isValidCnpj(input)).toBe(false);
    expect(validate("BR_CNPJ", input)).toBe(false);
  });
});

describe("BR_CNH — agrees with brazilian-utils (valid vectors)", () => {
  it.each(VALID_CNHS)("both accept %s", (input) => {
    expect(isValidCnh(input)).toBe(true);
    expect(validate("BR_CNH", input)).toBe(true);
  });
});

describe("BR_CNH — agrees with brazilian-utils (invalid vectors)", () => {
  it.each(INVALID_CNHS)("both reject %s", (input) => {
    expect(isValidCnh(input)).toBe(false);
    expect(validate("BR_CNH", input)).toBe(false);
  });
});

describe("BR_TITULO_ELEITOR — agrees with brazilian-utils (valid vectors)", () => {
  it.each(VALID_TITULOS)("both accept %s", (input) => {
    expect(isValidVoterId(input)).toBe(true);
    expect(validate("BR_TITULO_ELEITOR", input)).toBe(true);
  });
});

describe("BR_TITULO_ELEITOR — agrees with brazilian-utils (invalid vectors)", () => {
  it.each(INVALID_TITULOS)("both reject %s", (input) => {
    expect(isValidVoterId(input)).toBe(false);
    expect(validate("BR_TITULO_ELEITOR", input)).toBe(false);
  });
});

describe("BR_PIS — agrees with brazilian-utils (valid vectors)", () => {
  it.each(VALID_PIS)("both accept %s", (input) => {
    expect(isValidPis(input)).toBe(true);
    expect(validate("BR_PIS", input)).toBe(true);
  });
});

describe("BR_PIS — agrees with brazilian-utils (invalid vectors)", () => {
  it.each(INVALID_PIS)("both reject %s", (input) => {
    expect(isValidPis(input)).toBe(false);
    expect(validate("BR_PIS", input)).toBe(false);
  });
});
