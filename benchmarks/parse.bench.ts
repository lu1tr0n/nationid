/**
 * `parse()` throughput across every nationid document code.
 *
 * No reference library exposes an equivalent "parse to discriminated union"
 * API, so this file measures the absolute cost of `parse()` per code and
 * compares it against `validate()` on the same inputs as a self-baseline:
 * parsing is allowed to be slower than validate (it allocates a result
 * object), and this number quantifies the gap.
 */

import { Bench } from "tinybench";
import { normalize, parse, validate } from "../src/index.ts";
import type { DocumentTypeCode } from "../src/index.ts";
import {
  generateValidCnpjs,
  generateValidCoNits,
  generateValidCpfs,
  generateValidCrCedulasFisicas,
  generateValidCrCedulasJuridicas,
  generateValidCuits,
  generateValidCurps,
  generateValidDnis,
  generateValidDoCedulas,
  generateValidDoRncs,
  generateValidEins,
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
  persist,
  printTable,
  toRecord,
} from "./_helpers.ts";

const SAMPLE_SIZE = 1_000;
const TIME_PER_TASK_MS = 1_000;

interface BenchPlanEntry {
  readonly code: DocumentTypeCode;
  readonly vectors: ReadonlyArray<string>;
}

function preNormalize(code: DocumentTypeCode, raw: ReadonlyArray<string>): string[] {
  return raw.map((v) => normalize(code, v));
}

/**
 * Codes covered: every one for which a synthetic-valid generator exists in
 * `tests/cross-validation/_helpers.ts`. This is the same surface the
 * cross-validation suite exercises, which keeps benchmark scope honest.
 */
const BENCH_PLAN: ReadonlyArray<BenchPlanEntry> = [
  { code: "BR_CPF", vectors: preNormalize("BR_CPF", generateValidCpfs(SAMPLE_SIZE)) },
  { code: "BR_CNPJ", vectors: preNormalize("BR_CNPJ", generateValidCnpjs(SAMPLE_SIZE)) },
  { code: "CL_RUT", vectors: preNormalize("CL_RUT", generateValidRuts(SAMPLE_SIZE)) },
  { code: "ES_DNI", vectors: preNormalize("ES_DNI", generateValidDnis(SAMPLE_SIZE)) },
  { code: "ES_NIE", vectors: preNormalize("ES_NIE", generateValidNies(SAMPLE_SIZE)) },
  { code: "ES_NIF_PJ", vectors: preNormalize("ES_NIF_PJ", generateValidNifPjs(SAMPLE_SIZE)) },
  { code: "AR_CUIT", vectors: preNormalize("AR_CUIT", generateValidCuits(SAMPLE_SIZE)) },
  { code: "MX_CURP", vectors: preNormalize("MX_CURP", generateValidCurps(SAMPLE_SIZE)) },
  { code: "MX_RFC_PF", vectors: preNormalize("MX_RFC_PF", generateValidRfcPfs(SAMPLE_SIZE)) },
  { code: "MX_RFC_PM", vectors: preNormalize("MX_RFC_PM", generateValidRfcPms(SAMPLE_SIZE)) },
  { code: "CO_NIT", vectors: preNormalize("CO_NIT", generateValidCoNits(SAMPLE_SIZE)) },
  { code: "PE_RUC", vectors: preNormalize("PE_RUC", generateValidRucs(SAMPLE_SIZE)) },
  { code: "PE_DNI", vectors: preNormalize("PE_DNI", generateValidPeDnis(SAMPLE_SIZE)) },
  { code: "DO_CEDULA", vectors: preNormalize("DO_CEDULA", generateValidDoCedulas(SAMPLE_SIZE)) },
  { code: "DO_RNC", vectors: preNormalize("DO_RNC", generateValidDoRncs(SAMPLE_SIZE)) },
  { code: "GT_NIT", vectors: preNormalize("GT_NIT", generateValidGtNits(SAMPLE_SIZE)) },
  {
    code: "CR_CEDULA_FISICA",
    vectors: preNormalize("CR_CEDULA_FISICA", generateValidCrCedulasFisicas(SAMPLE_SIZE)),
  },
  {
    code: "CR_CEDULA_JURIDICA",
    vectors: preNormalize("CR_CEDULA_JURIDICA", generateValidCrCedulasJuridicas(SAMPLE_SIZE)),
  },
  { code: "US_SSN", vectors: preNormalize("US_SSN", generateValidSsns(SAMPLE_SIZE)) },
  { code: "US_ITIN", vectors: preNormalize("US_ITIN", generateValidItins(SAMPLE_SIZE)) },
  { code: "US_EIN", vectors: preNormalize("US_EIN", generateValidEins(SAMPLE_SIZE)) },
];

async function main(): Promise<void> {
  const bench = new Bench({ time: TIME_PER_TASK_MS });

  for (const entry of BENCH_PLAN) {
    const vectors = entry.vectors;

    bench.add(`${entry.code} · parse`, () => {
      let acc = 0;
      for (let i = 0; i < vectors.length; i++) {
        // biome-ignore lint/style/noNonNullAssertion: dense
        const v = vectors[i]!;
        const r = parse(entry.code, v);
        if (r.ok) acc++;
      }
      if (acc === -1) throw new Error("unreachable");
    });

    bench.add(`${entry.code} · validate (baseline)`, () => {
      let acc = 0;
      for (let i = 0; i < vectors.length; i++) {
        // biome-ignore lint/style/noNonNullAssertion: dense
        const v = vectors[i]!;
        if (validate(entry.code, v)) acc++;
      }
      if (acc === -1) throw new Error("unreachable");
    });
  }

  await bench.run();

  const record = toRecord("parse", bench);
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
