# Benchmarks

Local-only performance harness for nationid. Files in this directory are
**never published** to npm (see `package.json` `files` allow-list).

## Run

```sh
pnpm bench           # runs validate + format + parse, ~60–90s wall time
pnpm bench:validate  # just validate.bench.ts
pnpm bench:format    # just format.bench.ts
pnpm bench:parse     # just parse.bench.ts
```

Each run prints a console table per file and writes a JSON snapshot to
`benchmarks/results/<iso-timestamp>-<file>.json` for reproducibility.

## What is measured

- **`validate.bench.ts`** — `validate()` ops/sec for every code where at
  least one reference library exists (BR_CPF, BR_CNPJ, CL_RUT, ES_DNI,
  ES_NIE, AR_CUIT, US_EIN). Each contestant sees the same pre-normalized
  input vectors (separators stripped via `nationid.normalize()`) so no
  library is penalized for separator handling.
- **`format.bench.ts`** — `format()` ops/sec for codes whose ref libs ship
  a public formatter (`cpf-cnpj-validator` for CPF/CNPJ, `rut.js` for RUT).
- **`parse.bench.ts`** — `parse()` ops/sec across all 21 cross-validatable
  nationid codes, each paired with its `validate()` baseline so the cost of
  the discriminated-union allocation is visible per-code.

## Methodology

- `tinybench` v2 with default warmup. 1s timed window per task.
- Per-iteration loop runs over 1000 vectors; reported numbers are scaled to
  per-document ops/sec (`tinybench.hz × 1000`).
- Vectors come straight from `tests/cross-validation/_helpers.ts` so test
  agreement and benchmark workload share the same inputs.
- One run on a single development machine. Cross-machine numbers are not
  fabricated. To compare hardware, re-run on the target box.

## Updating `BENCHMARKS.md`

After a clean run on representative hardware:

1. `pnpm bench` and confirm no warnings.
2. Copy the printed tables into `BENCHMARKS.md`.
3. Note the Node version, OS, CPU, and sample timestamp at the top of the
   document so the numbers are reproducible.
4. Do **not** delete older JSON snapshots from `benchmarks/results/`; they
   are useful for tracking trends across releases.

## Adding a new code

`validate.bench.ts` and `format.bench.ts` iterate over a `BENCH_PLAN`
list — a new entry is the only edit required when a new country ships.
The driver loop never changes (open/closed). For `parse.bench.ts`, add a
`{ code, vectors }` row in the `BENCH_PLAN` array.
