/**
 * Out-of-process oracle adapter for `python-stdnum` (LGPL).
 *
 * `python-stdnum` is the gold-standard ID/tax-ID library across ~120
 * countries and serves as the second-pass cross-validation reference for
 * `nationid` v0.1.0. We deliberately do NOT take a runtime or dev-time
 * dependency on it — it is LGPL, Python-only, and brings 120+ country
 * modules we don't need at runtime. Instead, this adapter shells out to
 * `python3 -c "import stdnum.<cc> ..."` only during cross-validation tests.
 *
 * Design notes (SOLID / dependency inversion):
 *   - Test files depend on the `stdnumIsValid()` abstraction below.
 *   - No `child_process` import appears in test files directly.
 *   - The python interpreter is checked once at module load; on any failure
 *     the helper returns a sentinel that signals "skip the suite".
 *   - Per-(module, fn, input) results are memoized in-process to keep test
 *     suites fast (otherwise each spawn is ~30ms and a 40-vector test
 *     suite for one document would burn ~1.2s on python startup alone).
 *
 * Synthetic-only guarantee: this helper never reads from a filesystem path
 * other than the test runner's cwd; it never sends user input through
 * `python3` other than already-validated digit/letter strings produced by
 * the test fixtures.
 */

import { execFileSync, spawnSync } from "node:child_process";

/** Result for a single oracle probe. */
export type OracleResult = "true" | "false" | "skip";

/** Return value of `probeStdnum()`: are the modules we need usable? */
export interface StdnumAvailability {
  readonly ok: boolean;
  readonly reason: string;
}

const cache = new Map<string, boolean>();

/**
 * Single-shot probe: does the local `python3` understand `import stdnum`
 * and can it import each of the modules listed in `modules`? Returns
 * `{ ok: true }` when everything imports, otherwise `{ ok: false, reason }`.
 *
 * Test files call this once at top-level and `describe.skip` the entire
 * suite if it returns `ok: false`.
 */
export function probeStdnum(modules: ReadonlyArray<string>): StdnumAvailability {
  // First, can we run python3 at all?
  try {
    const probe = spawnSync("python3", ["-c", "import stdnum; print(stdnum.__version__)"], {
      timeout: 5_000,
      encoding: "utf8",
    });
    if (probe.status !== 0) {
      return {
        ok: false,
        reason: `python3 -c "import stdnum" failed: ${probe.stderr || probe.stdout}`,
      };
    }
  } catch (err) {
    return { ok: false, reason: `python3 not found: ${(err as Error).message}` };
  }

  // Then try importing each of the requested modules in one process.
  const importLines = modules.map((m) => `import ${m}`).join("; ");
  const code = `${importLines}; print("ok")`;
  const result = spawnSync("python3", ["-c", code], { timeout: 5_000, encoding: "utf8" });
  if (result.status !== 0 || !result.stdout.includes("ok")) {
    return {
      ok: false,
      reason: `python-stdnum module import failed: ${result.stderr.trim() || result.stdout.trim()}`,
    };
  }
  return { ok: true, reason: "" };
}

/**
 * Call `<pythonModule>.<fn>(input, ...args)` via `python3 -c` and return
 * `true` / `false`. Cached per `(pythonModule, fn, args, input)` key.
 *
 * `args` is appended after the input as additional positional args, useful
 * e.g. for `mx.rfc.is_valid(rfc, validate_check_digits=True)` — pass
 * `args = ["validate_check_digits=True"]` and they become Python keyword
 * arguments interpolated literally.
 *
 * The `input` is sent through Python's `repr()`-style escape — we wrap it
 * in `r"..."` raw-string and reject inputs that contain a literal `"`,
 * a backslash, or a newline. All of our test fixtures are alphanumeric
 * with at most `-`, `.`, `&`, ` `, so this is safe.
 *
 * Returns `false` on any python error too — this matches the contract of
 * `is_valid()` (any unexpected input → false).
 */
export function stdnumIsValid(
  pythonModule: string,
  fn: string,
  input: string,
  args: ReadonlyArray<string> = [],
): boolean {
  if (input.includes('"') || input.includes("\\") || input.includes("\n")) {
    throw new Error(`stdnumIsValid: refused unsafe input ${JSON.stringify(input)}`);
  }
  const key = `${pythonModule}::${fn}::${args.join(",")}::${input}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const argList = args.length > 0 ? `, ${args.join(", ")}` : "";
  const code = `from ${pythonModule} import ${fn}\nprint("T" if ${fn}(r"${input}"${argList}) else "F")`;
  let stdout: string;
  try {
    stdout = execFileSync("python3", ["-c", code], {
      encoding: "utf8",
      timeout: 5_000,
    }).trim();
  } catch {
    cache.set(key, false);
    return false;
  }
  const value = stdout === "T";
  cache.set(key, value);
  return value;
}

/**
 * Convenience helper for the common `<module>.is_valid(input)` shape.
 */
export function stdnumOracle(pythonModule: string): (input: string) => boolean {
  return (input: string) => stdnumIsValid(pythonModule, "is_valid", input);
}

/**
 * Batched probe: ask python-stdnum about a whole list of inputs in a single
 * subprocess. Returns a `Map<input, boolean>`. Each test file uses this once
 * at module scope to avoid hundreds of `python3` spawns.
 *
 * `args` is appended literally after the input as additional positional /
 * keyword args, identical semantics to `stdnumIsValid`.
 */
export function batchStdnumIsValid(
  pythonModule: string,
  fn: string,
  inputs: ReadonlyArray<string>,
  args: ReadonlyArray<string> = [],
): Map<string, boolean> {
  if (inputs.length === 0) return new Map();
  for (const input of inputs) {
    if (input.includes('"') || input.includes("\\") || input.includes("\n")) {
      throw new Error(`batchStdnumIsValid: refused unsafe input ${JSON.stringify(input)}`);
    }
  }
  const argList = args.length > 0 ? `, ${args.join(", ")}` : "";
  const inputArrayLiteral = `[${inputs.map((i) => `r"${i}"`).join(", ")}]`;
  const code = [
    `from ${pythonModule} import ${fn}`,
    `inputs = ${inputArrayLiteral}`,
    `for x in inputs:`,
    `    try:`,
    `        print("T" if ${fn}(x${argList}) else "F")`,
    `    except Exception:`,
    `        print("F")`,
  ].join("\n");
  let stdout: string;
  try {
    stdout = execFileSync("python3", ["-c", code], {
      encoding: "utf8",
      timeout: 30_000,
    });
  } catch (err) {
    throw new Error(`batchStdnumIsValid: python3 failed: ${(err as Error).message}`);
  }
  const lines = stdout.split("\n").filter((l) => l === "T" || l === "F");
  if (lines.length !== inputs.length) {
    throw new Error(
      `batchStdnumIsValid: expected ${inputs.length} lines, got ${lines.length}. Stdout: ${stdout}`,
    );
  }
  const out = new Map<string, boolean>();
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const line = lines[i];
    if (input === undefined || line === undefined) continue;
    out.set(input, line === "T");
  }
  return out;
}
