# v1.1 Quality Roadmap — Code quality tooling & static analysis

> Read-only audit of the developer tooling story for `nationid@1.1.0` from the perspective of a future contributor (or future-self) opening the repo cold. Scope: linters, formatters, type checkers, codegen, dev experience, dead-code detection, editor configuration, devcontainer support, pre-commit hooks, bench plumbing. Out of scope (covered by sibling audits): community governance, supply-chain security, CI/CD release, community adoption, library-functional issues from v1.1-functional-audit.

## Current score: 7.5 / 10

The tooling baseline is already above-median for an npm library at v1.1. Biome 2.4.14 covers lint + format in a single canonical file, TypeScript strictness is dialled all the way up (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `verbatimModuleSyntax`, `isolatedModules`), `pnpm verify` exists as a single load-bearing aggregate command, the build pipeline emits dual ESM/CJS + DTS via tsup, and a separate `vitest.dist.config.ts` runs the suite against the *built* artifact instead of `src/` — a credibility move that catches packaging bugs the average library does not catch.

The gap between today and a 10/10 is not the absence of tools; it is the **absence of guardrails between the tools the maintainer runs locally and the tools that enforce the contract**. Specifically: no pre-commit hook (every guard runs only in CI or when the maintainer remembers `pnpm verify`), no type-level test suite to lock in the v1.0 narrowing wins, no dead-code detector to catch the unused exports that 161 cast-cleanup commits inevitably stranded, no `assist` block in `biome.json` (so the documented "organize-imports is on" is, in fact, *not* enforced under Biome 2), no `.editorconfig` or `.vscode/` for zero-config onboarding, no devcontainer for Codespaces, and a few specific Biome rules that would catch real footguns in this codebase (`useExhaustiveSwitchCases`, `useImportType`, `noConsole` scoped to src, `noFloatingPromises`) are simply not enabled.

None of these gaps are critical and none are breaking — every recommendation in this document is additive and can ship one at a time. The library *works*; the developer experience around it has well-defined room to tighten before the next contributor lands.

## What works well

- **Single canonical config per tool.** Biome owns lint + format from one file. tsup owns build from one file. vitest owns test from two (runtime + dist). TypeScript owns typecheck from one. No fragmentation, no per-directory overrides, no `.eslintrc` shadow config to compete with the Biome one.
- **TypeScript at maximum strictness, deliberately documented.** `tsconfig.json` does not just set `"strict": true` and call it a day; it layers on the four "strict-plus" flags (`noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `exactOptionalPropertyTypes`) plus `verbatimModuleSyntax` and `isolatedModules`. The `ignoreDeprecations: "6.0"` line is commented to explain *why* it exists and what would let it be removed — exactly the kind of documentation that survives a maintainer handover.
- **`pnpm verify` is the single source of truth.** Lint → typecheck → test → build → test:dist, in that order. `prepublishOnly` runs it. The release workflow runs it again before changesets publishes. Anything green here is publishable; anything red is not. This is the right shape for a small library and rare for solo-maintained projects.
- **`test:dist` runs the suite against the BUILT package via the `exports` map** (`vitest.dist.config.ts`). This catches broken subpath exports, missing types entries, ESM/CJS interop bugs, and `paths`-config drift — the failure modes that bite libraries the moment they're consumed by anyone but the author. Most v1.0 npm libraries do not do this.
- **Size budgets are enforced and granular.** `package.json#size-limit` has 11 entries (full registry, four single-country pickers, algorithms primitives, four `v0.3` subpaths). The granularity is per-subpath, not just "the whole library" — exactly what a tree-shakable, 34-country library needs. Run from CI on `ubuntu-latest + node 22`.
- **Cross-platform line endings are nailed down.** `.gitattributes` forces LF for every text extension explicitly (not just the default `* text=auto`), with a comment explaining that Windows `core.autocrlf=true` would otherwise produce CRLF and Biome treats CRLF as a format error. This is a class of CI flake the maintainer has clearly already paid for once.
- **CI matrix is honest.** Three OSes × three Node majors (20/22/24), all running the full `verify` pipeline. Not just "ubuntu/node 20" with a footnote about Windows support. Bundle size + docs-check gated to one matrix cell to keep CI minutes down — the right tradeoff.
- **Benchmarks have a runner that fits the project shape.** `tinybench` + a per-code plan table + `tsx`-driven invocation. `BENCHMARKS.md` documents methodology. Results are persisted as JSON snapshots but `.gitignore`d (the docs are the source of truth). This is a defensible setup.
- **Typedoc is wired with `docs:check`** (`typedoc --emit none`), runs in CI per the workflow, with strict `invalidLink: true` and `rewrittenLink: true` — broken JSDoc references fail CI, not just the local build. Validation flags are deliberately tuned (`notExported: false`, `notDocumented: false`) so the gate is "no broken refs" not "every internal type is documented," which would be noise.
- **Changesets baseline is correctly configured for a single-package repo.** `commit: false` (lets the maintainer review the version bump PR), `access: "public"`, `baseBranch: "main"`, no `fixed`/`linked` groups. The release workflow uses `pnpm run version` not `pnpm version` and there is an inline comment explaining the trap — that comment will save somebody a half-day in three months.
- **Governance test enforces a project-specific invariant** that a generic linter could never catch: `tests/governance/confidence-citations.test.ts` walks every spec file and refuses the build if a `confidence: "high"` spec is missing a first-party citation in its JSDoc header. This is the spirit of "custom lint rule for project-specific patterns" but implemented as a vitest test — appropriate for the project size (no need to ship a custom Biome plugin yet).

## Gaps

Each gap is independently shippable, additive, and non-breaking. Severity reflects "how much sand a real contributor would feel in the gears."

### Gap 1 — No pre-commit hook; the only guard is `pnpm verify` (manual) and CI (post-push)

The package has zero local pre-commit guards. No `husky`, no `lefthook`, no `simple-git-hooks`, no `package.json#prepare`. A contributor who clones the repo, fixes a typo, and runs `git commit` gets nothing — no lint, no format, no typecheck on staged files. The next signal they receive is a red CI on the PR three minutes after pushing. That round-trip is the single largest DX gap in the repo.

The minimum viable hook for this library:

1. `biome check --staged --no-errors-on-unmatched` (lint + format only the staged files — sub-second).
2. `pnpm typecheck` *only if any `.ts` file is staged* (typecheck is the slow one; gate it conditionally or accept ~3s).

**Severity:** medium-high. The single biggest "first PR experience" friction.
**Effort:** 30 minutes. Pick one of: `simple-git-hooks` (zero runtime, two-line install), `lefthook` (Go binary, fastest), `husky` v9 (most familiar but `prepare`-script dance). For a single-package zero-dependency-philosophy library, `simple-git-hooks` is the right fit — it's a dev-only dependency, ~10 LOC of `package.json` config, no runtime overhead.
**Non-breaking:** yes (developer-side only; CI is unchanged).
**Fix:** add `simple-git-hooks` + `lint-staged` (or `mrm-format-package-json`-style direct invocation), wire a `prepare` script, document the bypass `--no-verify` for emergencies in `CONTRIBUTING.md`.

### Gap 2 — Biome 2's `assist` action (organize-imports) is NOT enabled

`biome.json` has no `assist` block. Under Biome 2, organize-imports moved from `linter.rules.organizeImports` to its own top-level `assist` action that must be opted in explicitly. The current config relies on Biome's defaults, which means imports are *not* sorted/grouped on `biome check --write`. The "imports are organized" assertion in the v1.0 audit memory is no longer accurate under Biome 2.4 — it was true under Biome 1.x semantics.

Empirical check: `src/index.ts` has 34 country-bundle imports in a single group, alphabetical only by coincidence (the maintainer ordered them). Without `assist`, a contributor's editor-side organize-imports may or may not match what Biome would do — guaranteed to produce a CI churn on the next PR that touches imports.

**Severity:** medium.
**Effort:** 10 minutes.
**Non-breaking:** yes (no runtime effect; reformats imports only).
**Fix:** add to `biome.json`:

```json
"assist": {
  "enabled": true,
  "actions": {
    "source": {
      "organizeImports": "on",
      "useSortedKeys": "off"
    }
  }
}
```

Then run `pnpm exec biome check --write .` once on `main` to land the canonical sort, commit that as a single "chore: enable Biome assist organize-imports" PR, and from there CI enforces it.

### Gap 3 — No type-level tests; v1.0's narrowing wins are not protected

The v1.0 audit landed a major narrowing improvement: `getSpec<C extends DocumentTypeCode>(code: C): DocumentSpec<C>` and `parse<C extends DocumentTypeCode>(code: C, input: string): ParseResult<C>`. The runtime tests cannot verify that `parse("MX_CURP", x).code` narrows to the literal `"MX_CURP"` rather than the full `DocumentTypeCode` union — that's a *compile-time* assertion and TypeScript erases it.

Two consequences: (a) a future refactor could silently widen the return type and every runtime test would still pass green; (b) the *value* of the v1.0 narrowing work (which the README explicitly markets in JSDoc examples) is unverified by the test suite.

**Severity:** medium. Important specifically *because* nationid sells type safety as a feature.
**Effort:** 1 hour for the initial scaffold + ~15 mins per locked-in invariant.
**Non-breaking:** yes (test-only addition).
**Fix:** add `expect-type` (zero-runtime cost; pure type-level assertions inside `it()` blocks). Or `tsd` (separate `*.test-d.ts` files run by `tsd` command). `expect-type` integrates better with the existing vitest suite — no second runner. Sample assertions to lock in:

```ts
import { expectTypeOf } from "expect-type";
import { parse, getSpec } from "../src/index.ts";

it("parse() narrows result.code to literal", () => {
  const r = parse("MX_CURP", "GOMC850315HDFRRR07");
  expectTypeOf(r.code).toEqualTypeOf<"MX_CURP">();
});

it("getSpec() narrows .code to literal", () => {
  const spec = getSpec("BR_CPF");
  expectTypeOf(spec.code).toEqualTypeOf<"BR_CPF">();
});

it("listSupportedCodes() returns readonly", () => {
  expectTypeOf(listSupportedCodes()).toEqualTypeOf<ReadonlyArray<DocumentTypeCode>>();
});
```

Drop these in `tests/types/narrowing.test-d.ts` and they will fail compilation the day someone widens the generics. Cost: zero runtime; ~50 LOC.

### Gap 4 — No dead-code / unused-export detector

After v1.0's 161-cast cleanup and the v0.3 → v0.6 country additions, the registry surface area grew significantly. There are 187 `.ts` files under `src/` and 30+ subpath exports in `package.json`. Without `knip` or `ts-prune`, an export that is *publicly declared* but no longer referenced internally — or a helper that is exported `export` but only used inside its own module — sits invisible. `noUnusedVariables` / `noUnusedImports` are on (good) but they only catch the *module-local* case; they cannot see across the public API boundary.

Concrete examples worth running `knip` against:

- The `algorithms/index.ts` re-exports — is every export actually consumed by some country file, or has a refactor stranded one?
- The `extract/<cc>.ts` helpers — does every country listed in v0.3's extract surface actually back a public export?
- The `i18n/locales/<loc>.ts` files — every key declared in `es.ts` should appear in `en.ts` and `pt.ts`. `knip` can be configured to flag locale drift as unused-export.

**Severity:** medium-low (no current bug; preventive).
**Effort:** 1–2 hours including initial cleanup of whatever it surfaces.
**Non-breaking:** yes (analysis-only).
**Fix:** add `knip` as dev-dep with a `knip.json` entrypoint list mirroring the `tsup` entry config, wire `pnpm knip` into `verify` as a soft warning (`|| true`) at first to assess churn, then promote to hard fail after the initial cleanup.

### Gap 5 — No `.editorconfig`; no `.vscode/` recommendations

The repo has no `.editorconfig` and no `.vscode/` directory. The Biome config encodes 2-space indent, LF endings, line width 100 — but a contributor opening the repo in VS Code (or Cursor, or Zed) with their default 4-space-tab settings will mis-format every file on save until they realize Biome's format-on-save extension is what they need. `.gitignore` already excludes `.vscode/` (line 7), so a `.vscode/settings.json` committed in cannot leak personal preferences. But `.vscode/extensions.json` (which Git tracks specifically because of how VS Code reads it) and a project-level `.editorconfig` would close the loop for non-VS Code editors.

**Severity:** medium-low for adoption.
**Effort:** 15 minutes.
**Non-breaking:** yes (additive config files).
**Fix:**
1. Add `.editorconfig` with the four lines that match Biome: `indent_style = space`, `indent_size = 2`, `end_of_line = lf`, `insert_final_newline = true`. Most editors honour this out of the box.
2. Remove `.vscode/` from `.gitignore` and add `.vscode/extensions.json` recommending `biomejs.biome`, `vitest.explorer`, `streetsidesoftware.code-spell-checker` (with a project dictionary for `DUI`, `NIT`, `CURP`, `CPF`, `CNPJ`, `RFC`, `RUC`, …). Optionally add a minimal `.vscode/settings.json` setting `editor.formatOnSave: true`, `editor.defaultFormatter: "biomejs.biome"`.

### Gap 6 — No devcontainer / Codespaces support

For an OSS library aiming at a global contributor base (Latin American, European, Asian countries are all in scope as new specs land), the "clone and start" path through GitHub Codespaces is a meaningful adoption lever. There is no `.devcontainer/devcontainer.json`. A first-time contributor on a Chromebook or a corp-locked laptop cannot one-click into a working environment.

**Severity:** low (nice-to-have, not blocking).
**Effort:** 30 minutes.
**Non-breaking:** yes.
**Fix:** add `.devcontainer/devcontainer.json` with the official TypeScript image, `corepack enable && pnpm install` as `postCreateCommand`, and the VS Code extensions from Gap 5. Codespaces prebuilds (free for public repos up to 60h/month per user) cache the install step. Document the "Open in Codespaces" badge in `CONTRIBUTING.md`.

### Gap 7 — Missing high-value Biome lint rules

The current `biome.json` has six explicit `linter.rules` entries on top of `recommended: true`. Biome 2.4.14 has shipped several rules that would catch real footguns in this codebase but are not opted in:

| Rule | Why it matters here | Severity |
|---|---|---|
| `correctness.useExhaustiveSwitchCases` | The narrow-typed `parse(code, ...)` returns ParseResult discriminated on `.error.kind`. A future `switch (r.error.kind)` without `default` should be a compile error if a new error kind is added. | medium |
| `style.useImportType` | Currently only `verbatimModuleSyntax` enforces this at the TS layer. Belt-and-suspenders with Biome's auto-fix is cheap. | low |
| `complexity.noBarrelFile` | This is a *tree-shakable* library. `src/index.ts` is intentionally a barrel for the root entry — but enabling `noBarrelFile` and `biome-ignore`-ing root index gives you an explicit list of every barrel and forces a sources comment on each. | low |
| `suspicious.noConsole` (scoped to `src/**/*.ts`) | Library code should never `console.log`. Currently nothing prevents it. Benchmarks legitimately log, so scope this with an `overrides` block to `src/**` only. | medium |
| `suspicious.noFloatingPromises` | Defensive — there are currently no async functions in src, but the moment someone adds one without `await` this fires. | low |
| `correctness.useExhaustiveDependencies` | N/A — that's a React hook rule. Skip. | n/a |
| `nursery.useThrowOnlyError` | `getSpec()` does `throw new Error(...)`. The rule enforces that only `Error`-deriving values are thrown. Already compliant; turning it on prevents regression. | low |
| `style.noNonNullAssertion` | Currently explicitly `off`. There are ~9 `biome-ignore` for non-null assertions in benchmarks/src. Worth re-examining whether they can be replaced with `// biome-ignore` removed via real narrowing; if not, document why on a per-site basis. | low |

**Severity:** medium aggregate.
**Effort:** 1 hour to enable + audit current code against each.
**Non-breaking:** yes (lint-only; auto-fix where applicable).

### Gap 8 — No bundle-composition visualization

`size-limit` is configured and enforces budgets (good). But when a budget *fails*, the only signal is "you exceeded 45 KB by 2 KB" — not *why*. A bundle-composition tool (`@size-limit/preset-small-lib` is already there, and it supports `--why` to dump esbuild metafile output) would close the diagnosis loop.

**Severity:** low.
**Effort:** 15 minutes.
**Non-breaking:** yes.
**Fix:** add a `size:why` script: `size-limit --why`, and document it in `BENCHMARKS.md` or `STYLE_GUIDE.md` under "investigating bundle regressions."

### Gap 9 — No TypeScript project references

`src/algorithms`, `src/countries`, `src/core`, `src/extract`, `src/pii`, `src/i18n`, `src/catalog` are all compiled as a single `tsc --noEmit` pass. For 187 source files this is fast (~3s) but for incremental editing in a large IDE session, splitting into project references lets `tsc -b --watch` rebuild only the changed subgraph. The DAG is naturally acyclic: `algorithms` is leaf, `core` depends only on `algorithms`, every `countries/*` depends on `core + algorithms`, `extract`/`pii`/`i18n`/`catalog` depend on `core` + their relevant `countries/*`.

**Severity:** very low (not a real bottleneck at current scale).
**Effort:** 4–6 hours (it's fiddly and you need to keep tsup + vitest + typedoc working).
**Non-breaking:** yes, but mechanically intrusive.
**Fix:** defer until the library hits ~500 files or typecheck exceeds 10s. Note in `STYLE_GUIDE.md` as a future option.

### Gap 10 — No codegen for repetitive per-country index/exports

There are three places where the same list of 34 country codes must stay in sync:

1. `src/index.ts` — 34 `import { xxBundle } from "./countries/xx/index.ts"` lines + a `BUNDLES` array.
2. `tsup.config.ts` — `ALL_COUNTRIES` array.
3. `package.json` — 34 `exports` entries with the country subpath.

Plus `src/core/types.ts` has the `CountryCode` and `DocumentTypeCode` unions, which are *also* hand-maintained.

This is the textbook "five-edit-points-per-new-country" pattern that codegen exists to eliminate. A single `scripts/sync-countries.ts` reading a manifest (or doing filesystem discovery, the same way `tsup.config.ts` already filters by `existsSync`) could regenerate the four downstream files and a `pnpm verify` step could diff the regenerated output against committed and fail on drift.

**Severity:** medium when the next 5+ country PR lands (each PR has to update 4–5 files in lockstep; this is exactly where contributor PRs go stale).
**Effort:** 4 hours for the codegen + diff-in-CI guard.
**Non-breaking:** yes (generates the same files that already exist by hand).
**Fix:** write `scripts/sync-countries.ts` that produces:
- `src/_generated/country-registry.ts` (the `BUNDLES` array)
- diff-only check on `package.json#exports` (assert every `./xx` exists)
- diff-only check on `tsup.config.ts#ALL_COUNTRIES`

Each generated file gets a header `// AUTO-GENERATED by scripts/sync-countries.ts — DO NOT EDIT`. Add `pnpm codegen:check` to `verify`.

### Gap 11 — No README code-block testing (doctest)

`README.md`, `README.es.md`, `README.pt.md` each contain ~30 `import { validate } from "nationid"` examples. There is no mechanism that asserts those code blocks actually compile and run. If a future API rename (or a v2 breaking change) misses one README, three localized READMEs ship with broken examples.

**Severity:** medium (correctness of marketing material).
**Effort:** 1–2 hours.
**Non-breaking:** yes (test-only).
**Fix:** ship a `tests/docs/readme.test.ts` that uses a markdown parser (`mdast-util-from-markdown`) to extract all `ts` / `typescript` fenced blocks, writes each to a temp file, and runs `tsc --noEmit` on the lot. Or simpler: use `docs-ts` / `eslint-plugin-markdown` to lint READMEs through Biome (Biome can lint markdown code blocks since 2.x but requires opt-in).

### Gap 12 — No `madge` / circular-dependency detection

187 files, deeply layered. The natural DAG (algorithms → core → countries → root) *should* be acyclic but nothing enforces it. A future contributor adding a country that needs a `getSpec()`-style lookup back into `src/index.ts` would introduce a cycle, and the only signal would be subtle test failures.

**Severity:** low-medium.
**Effort:** 20 minutes.
**Non-breaking:** yes.
**Fix:** add `madge` as dev-dep, add `pnpm graph:check` running `madge --circular src/index.ts` and wire it into `verify`. Treat any circular dep as a hard failure.

### Gap 13 — `prepublishOnly` lacks `knip` / `madge` / `attw` / `publint`

`prepublishOnly` is "lint + typecheck + test + build + test:dist." That misses the class of bugs caught by:
- `@arethetypesright/cli` (`attw --pack .`) — verifies the published package's `types`/`exports` map resolves correctly in every Node module mode (CJS, ESM, dual). For a dual-ESM/CJS library shipping 30+ subpath exports this is the *most likely* place for a publication regression.
- `publint` — catches `package.json` schema bugs that npm doesn't flag.

**Severity:** medium (high specifically because this library exports 30+ subpaths and uses dual ESM/CJS — the exact configuration most likely to ship a broken `exports` map).
**Effort:** 30 minutes.
**Non-breaking:** yes.
**Fix:** add `attw` and `publint` as devDeps; add to `verify`:
```
"verify": "pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:dist && pnpm exec attw --pack . && pnpm exec publint"
```

### Gap 14 — No `useNamingConvention` rule; relies on style guide only

`docs/STYLE_GUIDE.md` documents the convention (PascalCase types, camelCase functions, SCREAMING_SNAKE_CASE constants, kebab-case files). None of it is enforced by tooling. Biome's `style.useNamingConvention` can enforce all of those with the right `conventions` config. Currently a contributor naming a function `do_thing` would pass lint.

**Severity:** low (the existing code is consistent because it's solo-maintained; this becomes important the day there's a second contributor).
**Effort:** 30 minutes (config + audit existing for false positives).
**Non-breaking:** lint-only; may surface a handful of existing naming inconsistencies — fixing them is mechanical.

### Gap 15 — No CI cache for the Biome / tsc tool outputs

CI uses `cache: pnpm` (good — that caches `node_modules` install). But neither `tsc`'s `.tsbuildinfo` (incremental typecheck cache) nor Biome's internal cache are persisted between CI runs. Each PR re-types-checks every file from scratch.

**Severity:** very low. Current CI runs in ~2 minutes. The cache hit would maybe save 30s per matrix cell × 9 cells = ~4 minutes total. Not worth the complexity of cache-key stamping.
**Fix:** defer. Worth revisiting if CI exceeds 5 minutes.

## Tool inventory & maturity

| Tool | Configured | Score | Notes |
|---|---|---:|---|
| Biome (lint) | ✅ | 7/10 | Recommended on + 6 explicit rules. Gaps in §7. |
| Biome (format) | ✅ | 9/10 | 100-col, LF, double quotes, semicolons, trailing commas all set explicitly. Solid. |
| Biome (assist / organize-imports) | ❌ | 0/10 | Not configured under Biome 2 — see Gap 2. |
| TypeScript strict | ✅ | 10/10 | Max strictness with deliberate flags. Best-in-class. |
| TypeScript project refs | ❌ | n/a | Not needed at current scale. Defer. |
| `tsc --noEmit` typecheck | ✅ | 9/10 | Single command, runs in CI. No incremental cache (low priority). |
| `tsup` build | ✅ | 9/10 | Dual ESM/CJS, DTS resolve, tree-shake, country-list filtering for partial drafts. |
| `vitest` runtime tests | ✅ | 9/10 | Coverage thresholds set (90/85/90/90), v8 provider, explicit dist exclude. |
| `vitest --bench` / `tinybench` | ✅ (tinybench) | 7/10 | Standalone runners, not integrated with vitest's `--bench` mode. Acceptable. |
| `vitest.dist.config.ts` (built-artifact tests) | ✅ | 10/10 | Above-median for the ecosystem. |
| Pre-commit hook | ❌ | 0/10 | Single biggest DX gap. See Gap 1. |
| Type-level tests (`expect-type` / `tsd`) | ❌ | 0/10 | v1.0 narrowing wins not protected. See Gap 3. |
| Dead-code detection (`knip` / `ts-prune`) | ❌ | 0/10 | See Gap 4. |
| Circular-dep check (`madge`) | ❌ | 0/10 | See Gap 12. |
| `attw` (Are The Types Wrong) | ❌ | 0/10 | Critical for 30+ subpath dual-export library. See Gap 13. |
| `publint` | ❌ | 0/10 | See Gap 13. |
| `size-limit` | ✅ | 10/10 | 11 granular budgets. Best-in-class. |
| `size-limit --why` (composition viz) | ❌ | 0/10 | See Gap 8. |
| `typedoc` | ✅ | 9/10 | Strict link validation, wired into CI as `docs:check`. |
| Doctest (README code blocks) | ❌ | 0/10 | See Gap 11. |
| `.editorconfig` | ❌ | 0/10 | See Gap 5. |
| `.vscode/extensions.json` | ❌ | 0/10 | See Gap 5. |
| `.devcontainer/` | ❌ | 0/10 | See Gap 6. |
| `.gitattributes` (line endings) | ✅ | 10/10 | Exemplary — every text ext explicit + commented rationale. |
| Changesets | ✅ | 9/10 | Single-package config, `commit: false`, correct script wiring. |
| Codegen (per-country sync) | ❌ | 0/10 | Five hand-edited surfaces per new country. See Gap 10. |
| Custom rule (governance test) | ✅ | 9/10 | `confidence-citations.test.ts` enforces project-specific invariant. Excellent. |
| CI matrix (OS × Node) | ✅ | 10/10 | 3×3 = 9 cells. Above industry baseline for solo project. |

## Top 10 recommendations, ranked by (impact × likelihood of being shipped)

| # | Recommendation | Effort | Score lift | Why this rank |
|---|---|---|---|---|
| 1 | Add Biome 2 `assist.organizeImports` block | 10 min | +0.3 | Tiny effort, fixes a real (silent) drift |
| 2 | Add `simple-git-hooks` + lint-staged pre-commit (lint+format on staged only) | 30 min | +0.5 | Biggest DX leap; closes the "first PR experience" gap |
| 3 | Add `attw` + `publint` to `verify` / `prepublishOnly` | 30 min | +0.4 | Highest-leverage for a 30+ subpath dual-export library |
| 4 | Add `expect-type` type-level tests for `parse()`/`getSpec()` narrowing | 1 h | +0.4 | Locks in v1.0's headline feature |
| 5 | Add `knip` (initial soft warning, then enforced) | 1–2 h | +0.3 | After 161 cast cleanups + 12 new countries, dead code is inevitable |
| 6 | Enable `noConsole` (scoped to `src/**`), `useExhaustiveSwitchCases`, `useImportType` in Biome | 1 h | +0.3 | Three real footguns for library code |
| 7 | Add `.editorconfig` + `.vscode/extensions.json` (and stop ignoring `.vscode/`) | 15 min | +0.2 | Zero-config onboarding |
| 8 | Add `madge --circular` to `verify` | 20 min | +0.2 | Cheap insurance for a deeply layered codebase |
| 9 | Codegen `scripts/sync-countries.ts` + drift-check in CI | 4 h | +0.4 | Removes the 5-files-per-new-country burden — pays off on every PR |
| 10 | Add `.devcontainer/devcontainer.json` for Codespaces | 30 min | +0.2 | Adoption lever for global contributors |

Cumulative effort if all 10 are shipped: ~10 hours. Cumulative score lift: from 7.5 to roughly 9.2 — top-decile DX for a single-maintainer npm library.

## Bottom line

The tooling story for `nationid@1.1.0` is one of **good bones with no nervous system**: the individual tools (Biome, TypeScript, tsup, vitest, size-limit, typedoc, changesets) are correctly configured at the file level, but they are not connected by automation that would make them enforce one another. `pnpm verify` exists and is correct — but it only runs when someone types it. There is no pre-commit guard, no type-level safety net, no dead-code or circular-import detection, no `attw` to catch the broken `exports` map that this library is most likely to ship by accident, and no codegen for the five-edit-points-per-new-country pattern that every PR currently fights against.

The fix list is unusually concrete and unusually small. Two configuration changes (Biome `assist`, pre-commit hook) and three new dev-dependencies (`expect-type`, `knip`, `attw`+`publint`) close roughly 70% of the gap. Codegen and devcontainer close the rest. None of it is breaking, none of it is exotic — it's the same shape the top-decile maintainers in the ecosystem (Sindre Sorhus, antfu, Wes Bos's libraries) reach for at v1.0–v1.1. The library has already earned the right to invest there.

The single change with the highest ROI is **adding `attw --pack . && publint` to `prepublishOnly`**: a 30-minute change that protects every future publish of a dual-ESM/CJS, 30-subpath library against the most common class of npm-publish bug. Ship that one this week even if nothing else from this list lands.
