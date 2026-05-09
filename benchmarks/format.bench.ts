/**
 * `format()` throughput, nationid vs ref libs that expose a formatter.
 *
 * Only `cpf-cnpj-validator` (cpf.format / cnpj.format) and `rut.js` (format)
 * publish a documented format API. validator.js does not expose one and is
 * therefore out of scope for this file.
 *
 * Inputs are normalized first (storage form, no separators), to mirror the
 * realistic "pull from DB, render for UI" path applications take.
 */

import { cnpj, cpf } from "cpf-cnpj-validator";
import { format as rutFormat } from "rut.js";
import { Bench } from "tinybench";
import { format, normalize } from "../src/index.ts";
import type { DocumentTypeCode } from "../src/index.ts";
import {
  generateValidCnpjs,
  generateValidCpfs,
  generateValidRuts,
  persist,
  printTable,
  toRecord,
} from "./_helpers.ts";

const SAMPLE_SIZE = 1_000;
const TIME_PER_TASK_MS = 1_000;

interface Contestant {
  readonly label: string;
  readonly run: (input: string) => string;
}

interface BenchPlanEntry {
  readonly code: DocumentTypeCode;
  readonly vectors: ReadonlyArray<string>;
  readonly contestants: ReadonlyArray<Contestant>;
}

function preNormalize(code: DocumentTypeCode, raw: ReadonlyArray<string>): string[] {
  return raw.map((v) => normalize(code, v));
}

const VEC_CPF = preNormalize("BR_CPF", generateValidCpfs(SAMPLE_SIZE));
const VEC_CNPJ = preNormalize("BR_CNPJ", generateValidCnpjs(SAMPLE_SIZE));
const VEC_RUT = preNormalize("CL_RUT", generateValidRuts(SAMPLE_SIZE));

const BENCH_PLAN: ReadonlyArray<BenchPlanEntry> = [
  {
    code: "BR_CPF",
    vectors: VEC_CPF,
    contestants: [
      { label: "nationid", run: (v) => format("BR_CPF", v) },
      { label: "cpf-cnpj-validator", run: (v) => cpf.format(v) },
    ],
  },
  {
    code: "BR_CNPJ",
    vectors: VEC_CNPJ,
    contestants: [
      { label: "nationid", run: (v) => format("BR_CNPJ", v) },
      { label: "cpf-cnpj-validator", run: (v) => cnpj.format(v) },
    ],
  },
  {
    code: "CL_RUT",
    vectors: VEC_RUT,
    contestants: [
      { label: "nationid", run: (v) => format("CL_RUT", v) },
      { label: "rut.js", run: (v) => rutFormat(v) },
    ],
  },
];

async function main(): Promise<void> {
  const bench = new Bench({ time: TIME_PER_TASK_MS });
  for (const entry of BENCH_PLAN) {
    const vectors = entry.vectors;
    for (const c of entry.contestants) {
      const taskName = `${entry.code} · ${c.label}`;
      bench.add(taskName, () => {
        let acc = 0;
        for (let i = 0; i < vectors.length; i++) {
          // biome-ignore lint/style/noNonNullAssertion: dense
          const v = vectors[i]!;
          const out = c.run(v);
          if (out.length === -1) acc++;
        }
        if (acc === -1) throw new Error("unreachable");
      });
    }
  }

  await bench.run();

  const record = toRecord("format", bench);
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
