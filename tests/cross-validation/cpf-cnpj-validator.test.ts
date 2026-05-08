/**
 * Cross-validation: nationid vs `cpf-cnpj-validator` (npm).
 *
 * Coverage:
 *   - BR_CPF: 60 algorithmically-valid + 60 invalid synthetic vectors.
 *   - BR_CNPJ: 60 algorithmically-valid + 60 invalid synthetic vectors
 *     (numeric format only — alphanumeric CNPJ support arrives in Receita's
 *     July 2026 rollout and is tracked under nationid ADR-001).
 *
 * Goal: prove that for every input where both libraries are in scope, both
 * agree. Fixtures are generated from the canonical mod-11 algorithm
 * independently from either library's source code.
 *
 * Reference: cpf-cnpj-validator README, BR Receita Federal IN RFB nº 2.229/2024.
 */

import { cnpj, cpf } from "cpf-cnpj-validator";
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

describe("BR_CPF — agrees with cpf-cnpj-validator (valid vectors)", () => {
  it.each(VALID_CPFS)("both accept %s", (input) => {
    expect(cpf.isValid(input)).toBe(true);
    expect(validate("BR_CPF", input)).toBe(true);
  });
});

describe("BR_CPF — agrees with cpf-cnpj-validator (invalid vectors)", () => {
  it.each(INVALID_CPFS)("both reject %s", (input) => {
    expect(cpf.isValid(input)).toBe(false);
    expect(validate("BR_CPF", input)).toBe(false);
  });
});

describe("BR_CNPJ — agrees with cpf-cnpj-validator (valid vectors)", () => {
  it.each(VALID_CNPJS)("both accept %s", (input) => {
    expect(cnpj.isValid(input)).toBe(true);
    expect(validate("BR_CNPJ", input)).toBe(true);
  });
});

describe("BR_CNPJ — agrees with cpf-cnpj-validator (invalid vectors)", () => {
  it.each(INVALID_CNPJS)("both reject %s", (input) => {
    expect(cnpj.isValid(input)).toBe(false);
    expect(validate("BR_CNPJ", input)).toBe(false);
  });
});

describe("BR — placeholder rejection (both libs reject all-same-digit)", () => {
  // Both libraries reject repeated-digit placeholders by convention even
  // though they pass the bare DV math. Documented in nationid src/countries/br.
  const placeholders = [
    "00000000000",
    "11111111111",
    "22222222222",
    "99999999999",
    "00000000000000",
    "11111111111111",
    "99999999999999",
  ];

  it.each(placeholders)("both reject placeholder %s", (input) => {
    if (input.length === 11) {
      expect(cpf.isValid(input)).toBe(false);
      expect(validate("BR_CPF", input)).toBe(false);
    } else {
      expect(cnpj.isValid(input)).toBe(false);
      expect(validate("BR_CNPJ", input)).toBe(false);
    }
  });
});
