# v1.0 audit — Test coverage + flakiness

_Generated 2026-05-20 against nationid @ v0.6.0 (working tree)._
_Tooling: vitest 4.1.5 + @vitest/coverage-v8 4.1.5 + fast-check 4.0.0._

## Coverage summary

| Metric          | Value           | Target (v1.0)   | Status |
|-----------------|-----------------|-----------------|--------|
| Test files      | 67 (all in `tests/`, none in `src/`) | n/a    | ok     |
| `it()` blocks   | 1,616           | n/a             | ok     |
| `expect()` calls| 3,674           | n/a             | ok     |
| Tests run       | 6,377 passed    | n/a             | ok     |
| Run duration    | ~135s (full) / ~138s (coverage) | <300s | ok     |
| Source files    | 142 in `src/` (excluding `index.ts`) | n/a | ok     |
| Files @ 100% line | 61 / 142 (43%) | n/a            | info   |
| Lines           | 96.45% (3,678/3,813) | 95%        | pass   |
| Branches        | 86.73% (2,118/2,442) | 90%        | **miss (-3.27pp)** |
| Functions       | 99.84% (633/634)     | 90%        | pass   |
| Statements      | 93.21% (4,056/4,351) | 90%        | pass   |

Vitest config thresholds (`vitest.config.ts`): lines 90, functions 90, branches 85, statements 90 — currently all met. Bumping to v1.0 targets (95/90/95/90) would only require touching `src/algorithms/mod11.ts` (line) plus a focused branch-coverage pass on Swiss/French/Polish VAT modules to hit branch ≥ 90.

Counts are deterministic: the test suite ran twice (regular + coverage) and produced identical pass counts.

## Coverage gaps (priority)

Only **2 files** are below the 90% line target. The full set below 90% branch is broader (24 files) but every entry is a defensive `if (x === undefined) return null` guard required by `noUncheckedIndexedAccess`, not a missing test of business behavior. The list is ordered by impact.

### File: `src/algorithms/mod11.ts` — line: 47.36% / branch: 50%
- Uncovered lines: 27 (length-mismatch throw), 35 (non-digit throw), 40 (missing-weight throw), 56-64 (entire `cycleWeights` function).
- What they do: `mod11WeightedSum` is the primitive shared by 12 country specs (BR CPF/CNPJ, AR CUIT/CUIL, CL RUT, CO NIT, DK CPR/CVR, DO RNC, FI Y-tunnus, GT DPI, NO FNR/D-nr, etc). It is also re-exported from `nationid/algorithms`. `cycleWeights` is used by CL RUT.
- Why it's low: there is no `tests/algorithms/mod11.test.ts`. The function is only exercised through country specs that always pre-validate inputs, so the error branches and `cycleWeights` are never reached.
- Proposed tests (15 min, single new file `tests/algorithms/mod11.test.ts`):
  - `mod11WeightedSum` happy path — `("12345678", [3,2,7,6,5,4,3,2])` → known sum (regression vector from CO NIT).
  - `mod11WeightedSum` throws on `digits.length !== weights.length` (covers line 27).
  - `mod11WeightedSum` throws on `"12a45678"` non-digit at position 2 (covers line 35).
  - `mod11WeightedSum` throws when a weight is `undefined` — exercise via `[1,2,undefined as unknown as number,4]` (covers line 40).
  - `cycleWeights([2,3,4,5,6,7], 9)` → `[4,3,2,7,6,5,4,3,2]` (matches docblock example, covers 55-64 happy path).
  - `cycleWeights([2,3,4,5,6,7], 6)` → exact `[7,6,5,4,3,2]` (no cycling).
  - `cycleWeights([], 3)` throws (`"empty base array"`, line 60).

### File: `src/extract/pe/ruc.ts` — line: 87.50% / branch: 83.33%
- Uncovered lines: 35 (fallthrough `return null` when prefix is neither natural nor juridical).
- What it does: maps 2-digit RUC prefix to taxpayer-type bucket.
- Why it's low: tests only feed valid `"10"` / `"20"` prefixed RUCs. The fallthrough on, e.g., a malformed-but-parseable RUC prefix never fires.
- Proposed tests (5 min, in `tests/extract/pe.test.ts`):
  - Add a malformed-but-spec-passing fixture (synthetic RUC with prefix outside `10/15/16/17/20`) and assert `extractRegion("PE_RUC", x) === null`. If no spec allows such a prefix, document the dead branch with `c8 ignore`.

### Files between 90% and 92% line — informational, not blockers

Every file in this band has uncovered lines that match one of three patterns:

1. **`if (w === undefined) return null` defenders** — required by TS `noUncheckedIndexedAccess`, unreachable at runtime given upstream length checks. Examples: `countries/ar/{cuit,cuil,cdi,dni}.ts` line ~63-65, `countries/br/cnh.ts:124,137`, all `passport.ts` files line ~45-65.
2. **`return null` fallthroughs after exhaustive `if/else` ladders** — e.g. `extract/mx/curp.ts:37,61,84` (homoclave case handling), `extract/gt/dpi.ts:26-33` (department-range defender).
3. **Country `shared.ts` helper branches** — `countries/{ar,co,es,mx,us}/shared.ts` — each has a defensive `return null` that fires only on inputs the calling spec has already rejected.

Recommendation: leave these as-is for v1.0. They are correctness scaffolding, not behavior. Adding `/* c8 ignore next */` annotations is an option but creates churn for every future contributor; leaving v8 at 96.45% line is honest.

### Notable files at 100% line coverage

`countries/hn/*` (100/100/100/100), `countries/uy/*` (100% lines), `countries/{br/cpf,br/cnh,es/dni,es/nie,es/nif-pj}` (100% lines after the property/cross-validation suites). These are good benchmarks for "what shippable v1 looks like."

## Flakiness audit

### Timing dependence
- **One source-level time bomb**: `src/extract/mx/rfc.ts:30-31` — `currentTwoDigitYear()` calls `new Date().getUTCFullYear() % 100` to disambiguate 2-digit RFC years. The corresponding test (`tests/extract/mx.test.ts:101-105`, vector `GODE561231GR8` → 1956) is implicitly time-dependent: it works while current YY < 56 (i.e., until **2056-01-01**). Not a v1.0 blocker, but the test does not mock `Date`, so a CI runner with a wildly skewed clock could flip the result. **Recommended fix before v1.0**: inject a clock via an optional second arg (`extractRfcDOB(input, opts?: { now?: () => Date })`) and have the test pin `now: () => new Date("2026-05-20Z")`. Zero behavior change for callers; removes the only time-bomb in the suite.
- No other `Date.now`, `performance.now`, `setTimeout`, `setInterval`, or `new Date()` calls exist in `src/` (verified by grep). `validateCalendar` uses `Date.UTC()` which is pure.

### Shared / global state
- Grep finds **zero** `beforeAll` / `beforeEach` / `afterAll` / `afterEach` blocks in `tests/`. Every test constructs its own data. No mutable module-level fixtures.
- The cross-validation generators in `tests/cross-validation/_helpers.ts` use a deterministic mulberry32 PRNG keyed per code (documented in `_arbitraries.ts:18-22`). Seeds are constant. No global RNG.

### Non-deterministic data
- `Math.random` — **not used** anywhere in `src/` or `tests/` (verified by grep).
- fast-check property tests use a single fixed seed `PROPERTY_TEST_SEED = 0x6e6164_6964` and `PROPERTY_NUM_RUNS = 100`, applied to every `fc.assert(..., { seed, numRuns })` call. 14 property assertions across 8 files all pass the same options object — no drift.
- `fc.string({ maxLength: 30 })` is bounded; no unbounded fuzz.
- `fc.nat({ max: 1024 })` / `fc.integer({ min: 0, max: 9 })` etc — all bounded.

**Verdict**: zero observed flaky patterns. The RFC date-year time-bomb is the single risk to address before tagging v1.0.

## Property-based tests

Currently using fast-check: **yes** (`fast-check ^4.0.0` in devDeps).

8 property test files / ~14 `fc.assert` blocks (`tests/property/*.test.ts`):

- `parse-validate-consistency.test.ts` — `parse().ok === validate()` invariant.
- `parse-success-invariants.test.ts` — `parse()` success implies formatted/normalized fields populated.
- `normalize.test.ts` — `normalize()` is idempotent and strips noise.
- `whitespace-resilience.test.ts` — whitespace insertion preserves validity (P7).
- `format-stability.test.ts` — `format(normalize(x)) === format(x)`.
- `mask-format-alignment.test.ts` — mask boundaries align with format separators.
- `extract.test.ts` — extracted DOB/sex/region are stable across whitespace + casing.
- `registry-self-consistency.test.ts` — every registered code has matching helper exports.

The arbitrary library (`_arbitraries.ts`) already generates per-spec valid bodies for ~22 codes — solid foundation.

**High-value places to add property tests** (post-v1.0 unless trivial):
- `algorithms/mod11.ts` — property: `mod11WeightedSum(d, w) === mod11WeightedSum(reverse(d), reverse(w))` is FALSE (weights are positional), but: `cycleWeights(base, n).length === n`, `cycleWeights(base, base.length).reverse() === base`.
- `algorithms/luhn.ts` — property: `luhnValid(body + luhnCheckDigit(body))` is always `true` for any digit body. Currently only example-tested.
- `pii/mask.ts` — property: `mask(x).length === x.length` (or matches policy), `mask(x).indexOf(x.slice(-n)) >= 0` for last-n masks. (Already covered by `mask-format-alignment` indirectly — verify before adding.)
- `extract/mx/rfc.ts` and `extract/mx/curp.ts` — property: for any generated CURP/RFC with a synthetic YYMMDD where the date is valid, `extractDOB` reconstructs the same Y/M/D. Would have caught the leap-year edge case.
- `core/normalize.ts` — property: `normalize(normalize(x)) === normalize(x)` (idempotence). Already covered for spec-level normalize; the primitive helpers `stripAndUpper` / `stripNonDigits` / `allSameDigit` are not directly tested.

## Mutation testing recommendation

Currently configured: **no**. No Stryker config, no `@stryker-mutator/*` in devDependencies, no mutation-related npm scripts.

**Recommendation for v1.0**: defer formal mutation testing to v1.1 (cost > value at this stage given 6,377-test cross-validation baseline). For v1.0, add Stryker on a narrow scope — the algorithm primitives only — to validate test quality of the most-reused code:

1. `src/algorithms/mod11.ts` (priority — currently undertested; mutation will reveal whether the new direct tests catch off-by-one in weight indexing).
2. `src/algorithms/luhn.ts` (sanity check — should already score >90%).
3. `src/algorithms/icao-9303.ts` (passport check-digit; used by every `passport.ts` spec).
4. `src/core/normalize.ts` (every spec goes through these).

Suggested config: `@stryker-mutator/core` + `@stryker-mutator/vitest-runner`, scoped via `mutate: ["src/algorithms/**/*.ts", "src/core/**/*.ts"]`. Run in a weekly CI cron, not per-PR (mutation runs are slow). Target ≥ 80% mutation score on those four files.

**Estimated mutation score with current tests**:
- `mod11.ts` — **<50%** (entire `cycleWeights` untested, error branches untested). Will jump to ~85% after the proposed `tests/algorithms/mod11.test.ts`.
- `luhn.ts` — ~85% (good example coverage, but only 3 vectors per `it()`; arithmetic mutants like `sum * 2` vs `sum + 2` would survive on the doubling step).
- `icao-9303.ts` — ~80% (well-tested but tables/positions could harbor surviving mutants).
- `core/normalize.ts` — likely ~75% (regex-based; mutating `[^A-Za-z0-9]+` to `[^A-Za-z0-9]*` would survive most tests).

For the rest of the codebase, the cross-validation suites (`tests/cross-validation/*` — 10 files comparing against `brazilian-utils`, `cpf-cnpj-validator`, `rut.js`, `validator.js`, `python-stdnum` vectors) provide stronger evidence of correctness than a synthetic mutation score would, because they detect divergence from real-world reference implementations.

## Recommendation

1. **Coverage is adequate for v1.0** in absolute terms — 96.45% line, 99.84% function, 6,377 deterministic tests, zero `skip`/`todo`. The 86.73% branch number is below the conventional 90% bar but the gap is entirely defensive `noUncheckedIndexedAccess` guards, not behavior. Document this in CHANGELOG or `STYLE_GUIDE.md` so reviewers aren't surprised.

2. **Two micro-PRs before tagging v1.0** (both <1 hour total):
   - **Add `tests/algorithms/mod11.test.ts`** — lifts mod11 from 47% → ~95% line, removes the only "this primitive has no direct tests" footgun. 7 tests, ~30 lines.
   - **Inject the clock into `extract/mx/rfc.ts`** — eliminates the 2056-01-01 time bomb in `tests/extract/mx.test.ts`. ~15 lines source + ~5 lines test.

3. **No flakiness blockers**: zero `setTimeout`/`Math.random`/global-state/shared-fixture issues. Property tests are reproducibly seeded. Cross-validation suites are deterministic. The library is genuinely well-suited for `provenance: true` v1.0 publishing.

4. **Bump vitest thresholds to encode current quality**: change `vitest.config.ts` to `lines: 95, functions: 95, branches: 85, statements: 92`. This locks in today's level without creating green-then-red churn from the branch-coverage realities above.

5. **Defer Stryker to v1.1**. Adding it now would add CI time and a new devDependency with no immediate signal that the cross-validation suites don't already give. The four algorithm primitives are the right starting scope when it does land.
