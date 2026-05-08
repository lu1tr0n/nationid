/**
 * Cross-validation: nationid vs `@brazilian-utils/brazilian-utils` (npm).
 *
 * `brazilian-utils` is the second well-known JS library for BR documents and
 * an additional independent implementation against which to validate. We use
 * the same synthetic vectors as the `cpf-cnpj-validator` suite to keep the
 * "agreement" comparison apples-to-apples.
 */

import { isValidCnpj, isValidCpf } from "@brazilian-utils/brazilian-utils";
import { describe, expect, it } from "vitest";
import { validate } from "../../src/index.ts";
import {
  generateInvalidCnpjs,
  generateInvalidCpfs,
  generateValidCnpjs,
  generateValidCpfs,
} from "./_helpers.ts";

const VECTOR_COUNT = 60;

const VALID_CPFS = generateValidCpfs(VECTOR_COUNT);
const INVALID_CPFS = generateInvalidCpfs(VECTOR_COUNT);
const VALID_CNPJS = generateValidCnpjs(VECTOR_COUNT);
const INVALID_CNPJS = generateInvalidCnpjs(VECTOR_COUNT);

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
