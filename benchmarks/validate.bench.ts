/**
 * `validate()` throughput, nationid vs every cross-validatable reference lib.
 *
 * Inputs are pre-normalized via `nationid.normalize()` before the timed loop
 * so no library is penalized or advantaged by separator-stripping work that
 * is not under measurement. See BENCHMARKS.md methodology.
 *
 * Adding a new code is one entry in `BENCH_PLAN`. The iteration loop never
 * changes — open/closed.
 */

import { isValidCnpj, isValidCpf } from "@brazilian-utils/brazilian-utils";
import { cnpj, cpf } from "cpf-cnpj-validator";
import { validate as rutValidate } from "rut.js";
import { Bench } from "tinybench";
import validator from "validator";
import { normalize, validate } from "../src/index.ts";
import type { DocumentTypeCode } from "../src/index.ts";
import {
  generateValidCnpjs,
  generateValidCpfs,
  generateValidCuits,
  generateValidDnis,
  generateValidEins,
  generateValidNies,
  generateValidRuts,
  persist,
  printTable,
  toRecord,
} from "./_helpers.ts";

const SAMPLE_SIZE = 1_000;
const TIME_PER_TASK_MS = 1_000; // tinybench warms up, then runs timed for this long

/** A single contestant in the bench (one ref lib's `isValid`). */
interface Contestant {
  readonly label: string;
  readonly run: (input: string) => boolean;
}

interface BenchPlanEntry {
  readonly code: DocumentTypeCode;
  /** Pre-normalized inputs (separators stripped, uppercased). */
  readonly vectors: ReadonlyArray<string>;
  readonly contestants: ReadonlyArray<Contestant>;
}

/* ------------------------------------------------------------------ */
/* Build vectors once. All libs see the same pre-normalized strings.   */
/* ------------------------------------------------------------------ */

function preNormalize(code: DocumentTypeCode, raw: ReadonlyArray<string>): string[] {
  return raw.map((v) => normalize(code, v));
}

const VEC_CPF = preNormalize("BR_CPF", generateValidCpfs(SAMPLE_SIZE));
const VEC_CNPJ = preNormalize("BR_CNPJ", generateValidCnpjs(SAMPLE_SIZE));
const VEC_RUT = preNormalize("CL_RUT", generateValidRuts(SAMPLE_SIZE));
const VEC_DNI = preNormalize("ES_DNI", generateValidDnis(SAMPLE_SIZE));
const VEC_NIE = preNormalize("ES_NIE", generateValidNies(SAMPLE_SIZE));
const VEC_CUIT = preNormalize("AR_CUIT", generateValidCuits(SAMPLE_SIZE));
const VEC_EIN = preNormalize("US_EIN", generateValidEins(SAMPLE_SIZE));

/* ------------------------------------------------------------------ */
/* Plan: which libs validate which codes                               */
/* ------------------------------------------------------------------ */

const BENCH_PLAN: ReadonlyArray<BenchPlanEntry> = [
  {
    code: "BR_CPF",
    vectors: VEC_CPF,
    contestants: [
      { label: "nationid", run: (v) => validate("BR_CPF", v) },
      { label: "cpf-cnpj-validator", run: (v) => cpf.isValid(v) },
      { label: "@brazilian-utils", run: (v) => isValidCpf(v) },
      { label: "validator.js (pt-BR)", run: (v) => validator.isTaxID(v, "pt-BR") },
    ],
  },
  {
    code: "BR_CNPJ",
    vectors: VEC_CNPJ,
    contestants: [
      { label: "nationid", run: (v) => validate("BR_CNPJ", v) },
      { label: "cpf-cnpj-validator", run: (v) => cnpj.isValid(v) },
      { label: "@brazilian-utils", run: (v) => isValidCnpj(v) },
      { label: "validator.js (pt-BR)", run: (v) => validator.isTaxID(v, "pt-BR") },
    ],
  },
  {
    code: "CL_RUT",
    vectors: VEC_RUT,
    contestants: [
      { label: "nationid", run: (v) => validate("CL_RUT", v) },
      { label: "rut.js", run: (v) => rutValidate(v) },
    ],
  },
  {
    code: "ES_DNI",
    vectors: VEC_DNI,
    contestants: [
      { label: "nationid", run: (v) => validate("ES_DNI", v) },
      { label: "validator.js (es-ES tax)", run: (v) => validator.isTaxID(v, "es-ES") },
      { label: "validator.js (ES id-card)", run: (v) => validator.isIdentityCard(v, "ES") },
    ],
  },
  {
    code: "ES_NIE",
    vectors: VEC_NIE,
    contestants: [
      { label: "nationid", run: (v) => validate("ES_NIE", v) },
      { label: "validator.js (es-ES tax)", run: (v) => validator.isTaxID(v, "es-ES") },
      { label: "validator.js (ES id-card)", run: (v) => validator.isIdentityCard(v, "ES") },
    ],
  },
  {
    code: "AR_CUIT",
    vectors: VEC_CUIT,
    contestants: [
      { label: "nationid", run: (v) => validate("AR_CUIT", v) },
      { label: "validator.js (es-AR)", run: (v) => validator.isTaxID(v, "es-AR") },
    ],
  },
  {
    code: "US_EIN",
    vectors: VEC_EIN,
    contestants: [
      { label: "nationid", run: (v) => validate("US_EIN", v) },
      { label: "validator.js (en-US)", run: (v) => validator.isTaxID(v, "en-US") },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Drive                                                                */
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const bench = new Bench({ time: TIME_PER_TASK_MS });
  for (const entry of BENCH_PLAN) {
    const vectors = entry.vectors;
    for (const c of entry.contestants) {
      const taskName = `${entry.code} · ${c.label}`;
      bench.add(taskName, () => {
        // Run the lib over every vector once per timed iteration.
        // tinybench computes (mean per iter) / vectors.length to derive ops/vector.
        let acc = 0;
        for (let i = 0; i < vectors.length; i++) {
          // biome-ignore lint/style/noNonNullAssertion: array is densely filled
          const v = vectors[i]!;
          if (c.run(v)) acc++;
        }
        // Block dead-code elimination.
        if (acc === -1) throw new Error("unreachable");
      });
    }
  }

  await bench.run();

  // Re-shape per-iteration timings into per-document numbers.
  // tinybench `hz` is iterations/sec; each iteration validates SAMPLE_SIZE
  // documents, so per-doc ops/sec = hz * SAMPLE_SIZE.
  const record = toRecord("validate", bench);
  const scaled = {
    ...record,
    tasks: record.tasks.map((t) => ({
      ...t,
      hz: t.hz * SAMPLE_SIZE,
      meanNs: t.meanNs / SAMPLE_SIZE,
    })),
  };

  printTable(scaled);
  const path = persist(scaled);
  // biome-ignore lint/suspicious/noConsole: bench output
  console.log(`\nWrote ${path}`);
}

await main();
