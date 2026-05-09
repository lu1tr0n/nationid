# Benchmarks

Throughput for `nationid` v0.1 alongside every reference library it
cross-validates against. Numbers are from a single run on the development
machine (see methodology) and are illustrative of the order of magnitude —
re-run `pnpm bench` on the target hardware for site-specific numbers.

## TL;DR

For every cross-validatable code, `nationid` is in the same order of
magnitude as the dedicated single-country library. We are faster than some
references on some codes, slower on others. The point of v0.1 is breadth
with correctness — 13 countries cross-validated against `validator.js`,
`cpf-cnpj-validator`, `@brazilian-utils`, `rut.js`, AND `python-stdnum` — at
performance that does not demand a second look.

## Reproduction

```sh
pnpm install
pnpm bench
```

Total wall time on the dev machine: **~82 seconds** for all three files
(`validate`, `format`, `parse`). Each file emits a console table and writes
a JSON snapshot to `benchmarks/results/<iso>-<file>.json`.

## Methodology

| Setting | Value |
| --- | --- |
| Tool | `tinybench@2.9.0` (default warmup, JIT not pinned) |
| Time per task | 1000 ms |
| Vectors per task | 1000 (synthetic, deterministic mulberry32 PRNG) |
| Inputs | Pre-normalized via `nationid.normalize()` so no library is taxed for separator stripping |
| Node | v24.13.0 |
| OS / arch | Linux / x64 (WSL2) |
| CPUs visible | 4 |
| Date | 2026-05-09 |
| nationid version | v0.1 release-gate (commit `HEAD`) |

### Why pre-normalize?

Reference libraries vary in how aggressively they auto-strip separators.
Feeding every contender the same normalized form (`52998224725`, not
`529.982.247-25`) makes the comparison about the **algorithm**, not the
upstream regex shape. nationid's own `validate()` is idempotent over the
normalize step, so the call is fair.

### Reference library versions

| Library | Version | License |
| --- | --- | --- |
| `validator` | 13.15.35 | MIT |
| `cpf-cnpj-validator` | 2.1.0 | MIT |
| `@brazilian-utils/brazilian-utils` | 2.3.0 | MIT |
| `rut.js` | 2.1.0 | MIT |

`python-stdnum` is part of the cross-validation correctness suite (see
`docs/CROSS_VALIDATION.md`) but is out of scope for this latency benchmark
because we shell out to `python3` in tests; the per-call IPC dominates and
distorts the comparison.

## `validate()` results

Source: `benchmarks/validate.bench.ts` · numbers are docs validated per
second (`tinybench.hz × 1000`).

### BR_CPF

| Library | ops/sec | ns/op | ±rme % | vs nationid |
| --- | ---: | ---: | ---: | ---: |
| @brazilian-utils | 5,907,254 | 169 | 0.73 | 1.31× |
| cpf-cnpj-validator | 5,122,865 | 195 | 0.70 | 1.13× |
| **nationid** | **4,526,976** | **221** | **0.73** | **1.00×** |
| validator.js (`pt-BR`) | 2,628,966 | 380 | 1.02 | 0.58× |

### BR_CNPJ

| Library | ops/sec | ns/op | ±rme % | vs nationid |
| --- | ---: | ---: | ---: | ---: |
| **nationid** | **3,362,260** | **297** | **0.91** | **1.00×** |
| @brazilian-utils | 2,686,141 | 372 | 0.83 | 0.80× |
| validator.js (`pt-BR`) | 2,438,425 | 410 | 0.64 | 0.73× |
| cpf-cnpj-validator | 2,209,818 | 453 | 0.84 | 0.66× |

### CL_RUT

| Library | ops/sec | ns/op | ±rme % | vs nationid |
| --- | ---: | ---: | ---: | ---: |
| **nationid** | **4,995,380** | **200** | **0.68** | **1.00×** |
| rut.js | 3,663,908 | 273 | 0.70 | 0.73× |

### ES_DNI

| Library | ops/sec | ns/op | ±rme % | vs nationid |
| --- | ---: | ---: | ---: | ---: |
| **nationid** | **3,863,808** | **259** | **0.69** | **1.00×** |
| validator.js (`isIdentityCard ES`) | 3,500,367 | 286 | 0.70 | 0.91× |
| validator.js (`isTaxID es-ES`) | 1,985,301 | 504 | 0.89 | 0.51× |

### ES_NIE

| Library | ops/sec | ns/op | ±rme % | vs nationid |
| --- | ---: | ---: | ---: | ---: |
| **nationid** | **3,255,724** | **307** | **0.70** | **1.00×** |
| validator.js (`isIdentityCard ES`) | 2,052,869 | 487 | 1.10 | 0.63× |
| validator.js (`isTaxID es-ES`) | 1,656,422 | 604 | 0.85 | 0.51× |

### AR_CUIT

| Library | ops/sec | ns/op | ±rme % | vs nationid |
| --- | ---: | ---: | ---: | ---: |
| **nationid** | **5,060,258** | **198** | **0.64** | **1.00×** |
| validator.js (`es-AR`) | 3,310,092 | 302 | 0.67 | 0.65× |

### US_EIN

| Library | ops/sec | ns/op | ±rme % | vs nationid |
| --- | ---: | ---: | ---: | ---: |
| **nationid** | **6,460,900** | **155** | **0.58** | **1.00×** |
| validator.js (`en-US`) | 863,420 | 1158 | 1.32 | 0.13× |

The validator.js `en-US` regex performs a linear membership check over the
~70-entry IRS campus prefix list on every call. nationid hoists the prefix
table into a `Set` lookup, hence the gap.

## `format()` results

Source: `benchmarks/format.bench.ts`.

### BR_CPF

| Library | ops/sec | ns/op | ±rme % | vs nationid |
| --- | ---: | ---: | ---: | ---: |
| **nationid** | **7,345,372** | **136** | **0.62** | **1.00×** |
| cpf-cnpj-validator | 1,506,674 | 664 | 1.07 | 0.21× |

### BR_CNPJ

| Library | ops/sec | ns/op | ±rme % | vs nationid |
| --- | ---: | ---: | ---: | ---: |
| **nationid** | **5,942,950** | **168** | **0.64** | **1.00×** |
| cpf-cnpj-validator | 1,269,694 | 788 | 0.90 | 0.21× |

### CL_RUT

| Library | ops/sec | ns/op | ±rme % | vs nationid |
| --- | ---: | ---: | ---: | ---: |
| rut.js | 6,225,990 | 161 | 0.81 | 1.60× |
| **nationid** | **3,899,704** | **256** | **0.77** | **1.00×** |

`rut.js` wins format on RUT: it formats only the validated body and uses a
tight regex insertion. nationid's `format()` re-validates first
(idempotency contract) and re-runs the mask state machine. Both well within
sub-microsecond — irrelevant for any real UI.

## `parse()` results

`parse()` returns a discriminated union (`{ ok: true, code, normalized,
formatted, confidence }` or `{ ok: false, code, reason }`). No reference
library exposes an equivalent — the column compares against nationid's own
`validate()` baseline so the result-allocation overhead is visible.

| Code | parse ops/sec | validate baseline ops/sec | parse / validate |
| --- | ---: | ---: | ---: |
| BR_CPF | 3,400,092 | 4,377,915 | 0.78× |
| BR_CNPJ | 2,937,922 | 3,631,181 | 0.81× |
| CL_RUT | 2,945,757 | 5,336,229 | 0.55× |
| ES_DNI | 3,750,944 | 3,366,092 | 1.11× |
| ES_NIE | 2,643,232 | 3,197,563 | 0.83× |
| ES_NIF_PJ | 2,748,190 | 2,913,591 | 0.94× |
| AR_CUIT | 4,036,351 | 4,557,830 | 0.89× |
| MX_CURP | 2,111,839 | 2,207,478 | 0.96× |
| MX_RFC_PF | 1,668,424 | 1,636,310 | 1.02× |
| MX_RFC_PM | 1,828,638 | 1,982,945 | 0.92× |
| CO_NIT | 3,160,335 | 3,660,871 | 0.86× |
| PE_RUC | 5,114,538 | 5,501,855 | 0.93× |
| PE_DNI | 8,639,604 | 9,883,782 | 0.87× |
| DO_CEDULA | 4,293,629 | 5,110,618 | 0.84× |
| DO_RNC | 6,406,191 | 5,538,231 | 1.16× |
| GT_NIT | 3,408,914 | 4,321,778 | 0.79× |
| CR_CEDULA_FISICA | 5,449,908 | 9,517,260 | 0.57× |
| CR_CEDULA_JURIDICA | 5,698,787 | 9,235,860 | 0.62× |
| US_SSN | 4,015,551 | 4,406,960 | 0.91× |
| US_ITIN | 5,820,395 | 6,618,616 | 0.88× |
| US_EIN | 6,409,445 | 6,315,680 | 1.01× |

Across 21 codes, `parse()` runs at 0.55× to 1.16× of `validate()`. The
worst cases are format-only codes (CL_RUT, CR_*) where `validate()` is
nearly free but `parse()` still pays for separator-stripping plus result
construction. The best cases are codes whose `validate()` shares the
`parse()` codepath (e.g. DO_RNC).

## Per-code summary

| Code | nationid vs ref(s) | Note |
| --- | --- | --- |
| BR_CPF | slower than the two BR-only libs (0.77×–0.88×), 1.7× faster than validator.js | mod-11 in tight loop — both BR libs are hand-optimized |
| BR_CNPJ | fastest of the four | nationid uses `Uint8Array`-style index walk over the weight table |
| CL_RUT | 1.36× rut.js | format-only path is short |
| ES_DNI | 1.10× validator.js id-card, 1.95× validator.js tax | letter table is a string indexOf |
| ES_NIE | 1.59× validator.js id-card, 1.97× validator.js tax | same code-path as DNI plus prefix mapping |
| AR_CUIT | 1.53× validator.js es-AR | both walk the mod-11 weights once |
| US_EIN | 7.5× validator.js en-US | nationid hoists the campus-prefix list into a `Set` |

## Disclaimer

These numbers are illustrative. Real-world apps validate documents during
form submission or DB ingest — both budget in **milliseconds**, not
nanoseconds. The smallest difference you can measure here (~100ns/op
between CPF libraries) disappears the moment a network call enters the
picture. We publish them to **prove the order of magnitude is competitive**,
not to claim a crown.

If you need to validate ten million CPFs in a single batch, all four
libraries finish in under three seconds. Choose your library based on
**country coverage** and **type-safety**, then come back to performance
only when a profiler tells you to.

## What `nationid` actually optimizes

The architecture (`nationid-research/ARCHITECTURE.md`) describes the
positioning explicitly: **"wide and deep" — 13 countries with proper
checksums, vs the existing JS ecosystem which spans 1–6 countries each.**
Performance parity with single-country libraries is a side-effect of
zero-dependency, pure-function design — not the pitch.

## Updating these numbers

After running `pnpm bench` on a representative machine:

1. Copy the printed tables into the per-code sections above.
2. Update the **methodology** block (Node version, OS, CPU count, date).
3. Keep the JSON files in `benchmarks/results/` available locally for
   regression spotting; they are gitignored (per-run noise).

See `benchmarks/README.md` for adding a new code or a new reference
library to the suite.
