/**
 * Bench helpers.
 *
 * Re-exports the synthetic vector generators from the cross-validation suite.
 * We never duplicate fixture code: agreement on input space across tests AND
 * benchmarks is what makes the per-lib ops/sec numbers comparable.
 *
 * In addition this module hosts the printer/serializer used by every bench
 * file so all three (`validate`, `format`, `parse`) share output shape.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { cpus } from "node:os";
import { join } from "node:path";
import type { Bench } from "tinybench";

export {
  generateInvalidCnpjs,
  generateInvalidCoNits,
  generateInvalidCpfs,
  generateInvalidCuits,
  generateInvalidDnis,
  generateInvalidDoCedulas,
  generateInvalidDoRncs,
  generateInvalidEins,
  generateInvalidGtNits,
  generateInvalidNies,
  generateInvalidNifPjs,
  generateInvalidRfcPfs,
  generateInvalidRfcPms,
  generateInvalidRucs,
  generateInvalidRuts,
  generateInvalidSsns,
  generateInvalidCurps,
  generateInvalidItins,
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
} from "../tests/cross-validation/_helpers.ts";

/** Captured numbers for a single bench task, normalized for serialization. */
export interface BenchTaskRecord {
  readonly name: string;
  /** Mean ops/sec (hz) — primary headline number. */
  readonly hz: number;
  /** Mean execution time per iteration, in nanoseconds. */
  readonly meanNs: number;
  /** Relative margin of error (%) — tinybench `rme`. */
  readonly rmePct: number;
  /** Number of timed iterations. */
  readonly samples: number;
}

/** Captured output for a whole bench file. */
export interface BenchFileRecord {
  readonly file: string;
  readonly node: string;
  readonly platform: string;
  readonly arch: string;
  readonly cpus: number;
  readonly timestampIso: string;
  readonly tasks: ReadonlyArray<BenchTaskRecord>;
}

/**
 * Convert a finished `tinybench` Bench instance into the storage record.
 * Avoids `any` and missing-field surprises by reading via known accessors.
 */
export function toRecord(file: string, bench: Bench): BenchFileRecord {
  const tasks: BenchTaskRecord[] = bench.tasks.map((task) => {
    const result = task.result;
    const hz = result?.hz ?? 0;
    const meanNs = result?.mean !== undefined ? result.mean * 1_000_000 : 0;
    const rmePct = result?.rme ?? 0;
    const samples = result?.samples?.length ?? 0;
    return {
      name: task.name,
      hz,
      meanNs,
      rmePct,
      samples,
    };
  });
  return {
    file,
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpus: getCpuCount(),
    timestampIso: new Date().toISOString(),
    tasks,
  };
}

function getCpuCount(): number {
  try {
    return cpus().length;
  } catch {
    return 0;
  }
}

/** Print the bench result as a console table, one row per task. */
export function printTable(record: BenchFileRecord): void {
  // biome-ignore lint/suspicious/noConsole: bench output
  console.log(
    `\n# ${record.file}  ·  ${record.node}  ·  ${record.platform}/${record.arch}  ·  ${record.cpus} CPU`,
  );
  // biome-ignore lint/suspicious/noConsole: bench output
  console.table(
    record.tasks.map((t) => ({
      task: t.name,
      "ops/sec": Math.round(t.hz).toLocaleString("en-US"),
      "ns/op": t.meanNs.toFixed(0),
      "±rme%": t.rmePct.toFixed(2),
      samples: t.samples,
    })),
  );
}

/** Persist the record to `benchmarks/results/<timestamp>-<file>.json`. */
export function persist(record: BenchFileRecord): string {
  const dir = join(process.cwd(), "benchmarks", "results");
  mkdirSync(dir, { recursive: true });
  const stamp = record.timestampIso.replace(/[:.]/g, "-");
  const path = join(dir, `${stamp}-${record.file}.json`);
  writeFileSync(path, `${JSON.stringify(record, null, 2)}\n`);
  return path;
}
