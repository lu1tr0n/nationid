# v1.1 Quality Roadmap — CI/CD & release engineering

> Read-only audit of `nationid@1.1.0` pipeline ergonomics, build reproducibility,
> release engineering, post-publish validation, and deployment artifacts. Sibling
> to `01-community-governance.md`, `02-supply-chain-security.md`, and the v1.1
> functional audit. Coverage thresholds, mutation testing, test-suite gaps,
> SLSA/Sigstore/Scorecard/branch-protection are covered by sibling audits and
> are not duplicated here. Scope: how fast, how repeatable, and how reversible
> is a v1.x release from `git push` to `npm view`.

## Current score: 7.5 / 10

For a two-week-old solo-maintainer library, the pipeline is already
"this is a real product" tier: SHA-pinned actions, concurrency on the
release workflow, `pnpm install --frozen-lockfile` everywhere, a 9-combo
OS×Node matrix that catches Windows path bugs at PR time, npm provenance
via OIDC, `prepublishOnly: pnpm verify` as belt-and-suspenders, a `verify`
script that exercises the published tarball through the `exports` map,
`size-limit` armed with 11 entry checks, and a clean `changesets` flow
that already produced 8 tagged releases (v0.1 → v1.1).

The gap to "world-class" is three categories of mechanical work: **(1)** the
matrix is wasteful (9-combo full-fan-out runs lint/typecheck/docs:check 9×
for platform- and Node-invariant work); **(2)** the release pipeline has
zero post-publish validation (no clean-room install-from-npm smoke, no
tarball SHA assertion, no `npm view` poll); **(3)** observability artifacts
(`BENCHMARKS.md`, `coverage/`) are not wired into CI as regression guards.
Fixing the three biggest gaps takes a working day and lifts the score to
9 without touching a line of library code.

Headline: **the pipeline is good enough to keep shipping today; not yet
good enough for a second maintainer or a 3 a.m. security backport.**

---

## What works well

Cited by `path:line` so each can be regressed in a careless refactor.

- **`ci.yml:23-25, 29-32`** — `actions/checkout`, `pnpm/action-setup`,
  `actions/setup-node` SHA-pinned (40-hex) with `cache: pnpm` keyed on
  `pnpm-lock.yaml`. Dependabot bumps GH Actions weekly (`.github/
  dependabot.yml:20-31`).
- **`ci.yml:34-35`** — `pnpm install --frozen-lockfile`. Fails loudly on
  `package.json ↔ pnpm-lock.yaml` drift.
- **`ci.yml:52-53`** — `pnpm test:dist` runs against the built `dist/` via
  the `exports` map (`vitest.dist.config.ts`). Catches packaging bugs
  (broken exports, missing types, ESM/CJS interop) that source tests miss.
  Most underrated step in the file.
- **`ci.yml:55-57`** — `pnpm size` gated to `ubuntu + node 22`, so
  `size-limit` runs once per matrix sweep, not nine times.
- **`release.yml:7`** — concurrency on `${{ github.workflow }}-${{
  github.ref }}`. Two release runs can't publish the same `chore: release`
  commit twice — critical with changesets's single long-lived release PR.
- **`release.yml:16-22`** — least-privilege per-job permissions
  (`contents: write`, `pull-requests: write`, `id-token: write`),
  workflow-level fallback `contents: read`. Textbook.
- **`release.yml:41-42`** — `pnpm verify` runs **before**
  `changesets/action`. If verify fails, the action never publishes.
  Combined with `prepublishOnly: pnpm verify` (`package.json:293`), a
  broken build cannot reach npm even from a local manual `npm publish`.
- **`release.yml:47-50`** — the inline comment on `pnpm run version` (not
  `pnpm version`) is correct and prevents the silent-no-op trap recorded
  in memory `handoff_2026_05_09_nationid_v0_1_1.md`.
- **`docs.yml:13-15, 21-23`** — Pages concurrency
  (`cancel-in-progress: true`) plus `environment: github-pages` with `url`
  output so deployments tab shows live URLs.
- **`scorecard.yml:33-37`** — `upload-artifact` with explicit
  `retention-days: 5`. Audit trail without 90-day default cost.
- **`tsup.config.ts:48`** — `existsSync` filter on country entry points so
  partial drafts don't break the rest of the matrix.
- **`package.json:285`** — one canonical `verify` script (`lint &&
  typecheck && test && build && test:dist`). Three call-sites
  (CI, `prepublishOnly`, release), one truth source.
- **`package.json:318-321`** — `publishConfig: { access: "public",
  provenance: true }`. Publishing without provenance is impossible via
  `npm publish`.

---

## Gaps ranked by impact ÷ effort

### Gap 1 — No post-publish validation

After `changesets/action` runs `pnpm release` (= `pnpm build && changeset
publish`, `package.json:292`), the workflow exits. Nothing waits for the
npm registry to make the new version queryable, installs `nationid@$VERSION`
in a clean container, or re-runs `pnpm test:dist` against the actually-
published tarball.

`pnpm test:dist` today exercises the **local** `dist/` via the `exports`
map. Strong, but doesn't catch: registry-side metadata drift, a missed
file in `package.json:files` (6 hand-maintained entries, no test asserts
they shipped), `--ignore-scripts` consumer installs, or ESM/CJS interop
issues specific to how npm pack handles the `outExtension .cjs` rewrite
in `tsup.config.ts:78-82`.

The v0.6 → v1.0 tarball-shrink (-76%) was tracked **post-hoc** via local
`npm pack`. CI didn't flag the win and would not flag a regression if v1.2
silently inflated to 1.5 MB.

**Severity:** high — first consumer-only break ships, bisect cost is
worst-case (read the published tarball, not the source).
**Effort:** 2 hours. **Non-breaking:** ✅.

**Fix.** Add a `post-publish` job to `release.yml`, gated on
`changesets/action` outputs `published == 'true'`. It polls `npm view
nationid@$VERSION version` for up to 60 s, installs into `/tmp/smoke`,
runs `pnpm test:dist` against the installed copy, then `npm audit
signatures` to re-verify provenance. On failure: `npm deprecate
nationid@$VERSION "use $PREV"`.

---

### Gap 2 — `pnpm test:coverage` is defined but never invoked in CI

`vitest.config.ts:15-26` declares thresholds (lines/functions/statements 90,
branches 85). `package.json:277` defines `test:coverage`. `ci.yml:44` runs
`pnpm test`, not `pnpm test:coverage`. Thresholds fire only locally; there
is no coverage badge, no Codecov, no public signal.

**Severity:** medium. **Effort:** 45 min. **Non-breaking:** ✅.

**Fix.** Gate one matrix lane (`ubuntu + node 22`) to run
`pnpm test:coverage` and upload `coverage/lcov.info` to Codecov via
`codecov/codecov-action@<pin>` with `fail_ci_if_error: false` initially
(flip after baseline). Codecov is free for public repos and supports OIDC
since v5. Add the badge to README (see Gap 14). Zero-external alternative:
upload `coverage/` as a Pages sub-route from `docs.yml` — loses the per-PR
diff UI but keeps the badge story.

---

### Gap 3 — 9-combo matrix runs platform-invariant work 9 times

`ci.yml:19-20` matrix is `{ ubuntu, windows, macos } × { 20, 22, 24 }` = 9
combos, `fail-fast: false`. All 9 run `pnpm lint` (Biome, platform-invariant),
`pnpm typecheck` (`tsc --noEmit`, Node-invariant), `pnpm run docs:check`
(`typedoc --emit none`, Node-invariant), `pnpm build` (`tsup`, target
`es2022`, Node-invariant per `tsup.config.ts:76`). Estimated waste:
8 × (~30 s lint + ~20 s typecheck + ~25 s docs:check + ~25 s build) ≈
**~13 minutes of CI minutes per PR**. Free on public repos but pads the
slowest lane and makes "all green" feel slow.

**Severity:** medium (feedback-loop ergonomics). **Effort:** 1 hour.
**Non-breaking:** ✅.

**Fix.** Split `ci.yml` into two jobs: `static` (single ubuntu-22 lane
running lint, typecheck, docs:check, build, size, coverage, and uploading
`dist/` as an artifact) and `runtime` (`needs: static`, matrix 3×3,
downloads the artifact, runs only `pnpm test` and `pnpm test:dist` —
the steps that are actually platform/Node sensitive). Expected wall-time
win: 30–40% on the slowest lane.

---

### Gap 4 — Vitest is not sharded; 6488 tests run serially per lane

Vitest 4 supports `--shard=N/M` natively. Today `pnpm test` runs the full
6488-test suite (per v1.1 audit) on one worker per matrix lane at ~127 s
wall on ubuntu — the dominant cost of CI.

**Severity:** medium. **Effort:** 1.5 hours. **Non-breaking:** ✅.

**Fix.** Combine with Gap 3: in the `runtime` job, add `shard: [1, 2, 3, 4]`
to the matrix and pass `--shard=${{ matrix.shard }}/4` to `pnpm test`.
3×3×4 = 36 jobs, each ~32 s instead of ~127 s, fully parallel. Critical
path drops to ~40 s. If 36 jobs feels excessive, 2-shard is fine and still
halves the slow lane.

---

### Gap 5 — `size-limit` budgets pass/fail but no PR diff comment

`ci.yml:55-57` runs `pnpm size`. `package.json:322-378` declares 11 budgets
totaling ~135 KB. A passing build prints the budget table to the log; a
failing build fails the lane. What it doesn't do: comment on the PR with a
delta vs `main` (`-2.1 KB` ✅ / `+8.4 KB` ❌). That's the workflow that
turns budgets from gatekeeper to culture.

`andresz1/size-limit-action` is the standard wrapper: runs `size-limit` on
the PR head, runs on `main`, posts a sticky comment with the delta.

**Severity:** low/medium. **Effort:** 20 min. **Non-breaking:** ✅.

**Fix.** Add the action behind `if: github.event_name == 'pull_request'`.
The v1.0 -76% shrink would have been a flex comment on PR #31; the
opposite case is the real ROI.

---

### Gap 6 — `pnpm bench` exists but is not wired to CI

`package.json:286-289` defines four bench scripts. `BENCHMARKS.md` (9.5 KB)
documents the v0.6 baseline. `benchmarks/results/` is `.gitignore`d.
Nothing in CI compares current op/s to the committed baseline; a 10×
regression in `validate.ts` would ship unnoticed until a downstream flame
graph.

**Severity:** medium. **Effort:** 3 hours initial. **Non-breaking:** ✅.

**Fix.** Recommended: nightly + on-release bench, publish to a simple GH
Pages JSON dashboard. Less noisy than PR-time gating (GH runner variance
is ±10–15%; mitigatable with `tinybench` `samples >= 50` but rarely worth
it for solo maintainer). Auto-regenerate `BENCHMARKS.md` on each minor+
release.

---

### Gap 7 — `release.yml` has no manual recovery path

`release.yml` triggers only on `push: branches: [main]`. If
`changesets/action` fails mid-flight (npm 503, OIDC token race, registry
validation reject), the only restart path is pushing an empty commit to
main. Memory `handoff_2026_05_09_nationid_v0_1_1.md` records "7
release-pipeline gotchas" on the v0.1.1 attempt — exactly the class of
issue that benefits from a manual restart button.

**Severity:** medium. **Effort:** 15 min. **Non-breaking:** ✅.

**Fix.** Add `workflow_dispatch:` trigger to `release.yml:3`. No inputs
needed — the changesets state lives in the open release PR. `docs.yml:6`
already has this; mirror.

Note: the "two release PRs queue up" concern is theoretical — changesets
force-pushes to a fixed branch `changeset-release/main`. The v1.0 → v1.1
sequence in the git log (`05771ec`, `6c58508`) confirms they linearize
cleanly. **No fix needed for the PR-queue scenario.**

---

### Gap 8 — `ci.yml` has no `cancel-in-progress`

Push 3 commits to a PR in rapid succession and GitHub queues 3 full matrix
runs (27 jobs each today, or 36 each post-shard). The older 2 are wasted
compute and pad the "all green" wait. `release.yml:7` and `docs.yml:13-15`
already do this correctly.

**Severity:** low. **Effort:** 5 min. **Non-breaking:** ✅.

**Fix.** Add a `concurrency:` block to `ci.yml` grouped on
`${{ github.workflow }}-${{ github.ref }}`, gating `cancel-in-progress` on
`pull_request` events so main-branch runs always complete and produce
their release-relevant artifacts.

---

### Gap 9 — Built `dist/` is never uploaded as a CI artifact

If `pnpm build` produces a bad `dist/`, the only post-failure forensic
path is cloning the failing SHA and rebuilding locally — and that assumes
the build is deterministic (see Gap 15).

**Severity:** low. **Effort:** 10 min. **Non-breaking:** ✅.

**Fix.** In the `static` job from Gap 3, upload `dist/` as an artifact
with `retention-days: 14` and `if-no-files-found: error`. Bonus: this is
the same artifact `runtime` consumes (no duplicate work).

---

### Gap 10 — Showcase site deploy ungated by upstream green

`nationid_example` deploys to GH Pages on push to its own `main`, consuming
`nationid@latest` from npm. Two silent failure modes: a bad nationid
release ships → showcase auto-deploys against it → playground breaks; or
a v2 RC lands but the showcase tests `latest` with no PR-preview to smoke
the RC.

**Severity:** low/medium (playground is the primary user-facing demo).
**Effort:** 2 hours. **Non-breaking:** ✅.

**Fix.** After `post-publish` (Gap 1) succeeds, `repository_dispatch` to
`nationid_example` to rebuild against the new version. Optional: PR-preview
Pages so v2 RCs are click-testable.

---

### Gap 11 — No prerelease / canary channel documented

`changesets` supports `pre enter alpha` / `pre exit`; the maintainer has
shipped 8 stable releases and 0 prereleases. Fine for patches; not for
v2.0. A consumer who wants to test breaking changes against CI before
v2 GA has no `nationid@next` tag to pin.

**Severity:** low (only at major cadence). **Effort:** 30 min.
**Non-breaking:** ✅.

**Fix.** Document in `docs/RELEASING.md`: `pnpm changeset pre enter alpha`
→ author breaking changesets → publish under `npm dist-tag next` → `pnpm
changeset pre exit` to return to stable. Consumer: `npm install
nationid@next`.

---

### Gap 12 — `engines.node >=20` matches the matrix; Bun/Deno/edge claims untested

`README.md:17` claims "works in Node, browsers, Bun, Deno and edge
runtimes". CI tests **only** Node. The claim is plausibly true (pure TS,
zero deps, `sideEffects: false`) but unverified.

**Severity:** low. **Effort:** 1 hour for Bun + Deno smoke; edge harder.
**Non-breaking:** ✅.

**Fix.** Add a `runtime-alt` matrix lane (single ubuntu) running the test
suite under Bun + Deno via `oven-sh/setup-bun` and `denoland/setup-deno`.
For edge: a small `tests/dist/edge.test.ts` through
`@cloudflare/vitest-pool-workers`. Start with Bun + Deno (80% of the
non-Node claim). Alternative: remove the multi-runtime claim from README
until it's tested.

---

### Gap 13 — `docs:check` runs typedoc 9× then `docs.yml` runs it again

`ci.yml:46-47` runs `pnpm run docs:check` (`typedoc --emit none`) on every
matrix combo. `docs.yml` then runs `pnpm run docs` (full emit) on push to
main. After Gap 3 (collapse static checks to one job), the parse runs once
in `static`. Further: `static` could emit the docs site as an artifact and
`docs.yml` could just `download-artifact + deploy`.

**Severity:** low (coupled with Gap 3). **Effort:** 30 min on top of Gap 3.
**Non-breaking:** ✅.

---

### Gap 14 — Badge fatigue: 5 today, room for 2 more

`README.md:7-11` has npm version, bundle size, types, license, CI — all
load-bearing. Fatigue threshold ~7. Add: **OpenSSF Scorecard** (auto-
generated) and **Codecov** (after Gap 2). Skip: OpenSSF Best Practices
(not yet registered), Stand With Ukraine (off-topic), "Made with TS"
(redundant), npm downloads (low signal for a 2-week-old package).

**Severity:** low (cosmetic). **Effort:** 5 min. **Non-breaking:** ✅.

Visual narrative: published → tested → safe → small.

---

### Gap 15 — Build reproducibility unverified

`tsup` is deterministic in principle (esbuild + identical inputs = identical
output). Not verified. Per the supply-chain audit, v1.0 dropped sourcemaps
to shrink the tarball — and as a side benefit removed the largest
non-determinism vector (sourcemap paths embedded in JS).

**Severity:** low (future-perfect — unlocks SLSA L3 evaluator confidence).
**Effort:** 1 hour to verify, 2–4 hours to fix any divergence.
**Non-breaking:** ✅.

**Fix.** Manual-dispatch `verify-reproducible.yml`: input `version`, check
out tag, install + build, `npm pack`, compute tarball SHA, compare to
`npm view nationid@$VERSION dist.shasum`. Emit ✅ or a `dist/` diff.

---

### Gap 16 — Refine Dependabot grouping

Memory `project_nationid.md` shows weekly grouped Dependabot is working.
Today's grouping (`dependabot.yml:14-18`) is `dev-dependencies` +
`production-dependencies`. Production deps are zero, so that group never
fires.

**Severity:** low. **Effort:** 10 min. **Non-breaking:** ✅.

**Fix.** Group by `update-types` instead: one group for `minor`+`patch`
(batch-merge, low review cost), a separate group for `major` (stay
individual, more likely to break, deserve triage). Renovate would offer
more flexibility but is overkill at 16 deps.

---

### Gap 17 — `BENCHMARKS.md` is stale-by-construction

9.5 KB, last touched 2026-05-09. v1.0 + v1.1 shipped since; benches were
never re-run. Couples with Gap 6. Until Gap 6 ships, add a "Last measured"
header line and update on minor+ releases by hand.

**Severity:** low. **Effort:** 20 min manual; auto-maintained after Gap 6.
**Non-breaking:** ✅.

---

### Gap 18 — `prepublishOnly: pnpm verify` is slow on manual publish but should stay

`package.json:293` runs full `pnpm verify` before any local `npm publish`.
Adds 3–4 min of local wall time even when CI just verified 60 s ago. **Do
not change.** The cost of an emergency manual publish (npm working but
`changesets/action` hung, CVE patch in flight) shipping with a regression
is much higher than 3 min of wait.

**Severity:** very low. **Effort:** N/A. **Recommendation:** keep as is.

---

### Gap 19 — No SBOM attached to GitHub Releases

Cross-reference to `02-supply-chain-security.md`. CI side: after publish,
emit `nationid-sbom.json` via `@cyclonedx/cyclonedx-npm` and upload via
`softprops/action-gh-release` with `.sha256` checksums. Do not duplicate;
cited for cross-link completeness.

---

### Gap 20 — `release.yml` does not export `published` + `version` as job outputs

Blocker for Gap 1's post-publish job. `changesets/action` exposes
`steps.changesets.outputs.published` and `publishedPackages`. Reflect them
as job outputs so a downstream job in the same workflow file can `needs:`
the release job and read them.

**Severity:** low (enabler). **Effort:** 5 min when Gap 1 ships.
**Non-breaking:** ✅.

---

## CI feedback-loop optimization

Per-job timing on the fastest matrix combo (`ubuntu + node 22`):

| Step                | Wall      | Parallelizable | Cache  | Notes                            |
| ------------------- | --------: | -------------- | ------ | -------------------------------- |
| checkout            |       3 s | no             | n/a    | Fixed cost                       |
| pnpm/action-setup   |       4 s | no             | yes    | Via setup-node `cache: pnpm`     |
| setup-node          |       2 s | no             | yes    | Key on `pnpm-lock.yaml` SHA      |
| pnpm install        |    10–20 s | no             | partial | Cold 35 s; warm 12 s            |
| pnpm lint           |       3 s | via split      | n/a    | Platform-invariant, runs 9×      |
| pnpm typecheck      |    15–20 s | via split      | partial | `tsbuildinfo` cache, not uploaded |
| pnpm test           |     127 s | shard          | n/a    | 6488 tests, one worker per lane  |
| pnpm run docs:check |    10–15 s | via split      | n/a    | Typedoc parse, no emit           |
| pnpm build          |    12–18 s | via split      | partial | tsup full build                  |
| pnpm test:dist      |    25–35 s | runtime-bound  | n/a    | Resolves through `exports` map   |
| pnpm size           |       8 s | n/a            | partial | Only on `ubuntu + 22`            |

Current per-lane wall: ~3 min ubuntu/22, ~4 min windows-latest (slow FS
for `pnpm install`). Total "all green" parallel max ≈ 4–5 min.

After Gaps 3 + 4 + 8: `static` ≈ 90 s sequential, `runtime` critical path
≈ 50 s (sharded), `runtime-alt` ≈ 30 s parallel. **Total "all green" ≈
90–110 s.** 60–70% reduction on the slowest lane.

---

## Release engineering checklist

### Today (verified from `release.yml`)

1. Merge feature PRs to `main`, each carrying a `.changeset/*.md`. ✅
2. `release.yml` triggers on push to `main`. ✅
3. `pnpm install --frozen-lockfile`. ✅
4. `pnpm verify` (lint + typecheck + test + build + test:dist). ✅
5. `changesets/action` either opens/updates a release PR or, if the
   release PR was just merged, runs `pnpm release` (= `pnpm build &&
   changeset publish`) and pushes git tags. ✅
6. `npm publish --provenance` signs with Sigstore + emits SLSA v1
   attestation. ✅
7. Workflow exits. ❌ no post-publish verification.

### Ideal end-state (additions only, no removals)

Steps 1–6 unchanged. Add:

7. **Reflect** `published` + `version` from `changesets/action` as job
   outputs (Gap 20).
8. **Post-publish job** (Gap 1): poll `npm view`; install into `/tmp/smoke`;
   run `pnpm test:dist` against the installed copy; `npm audit signatures`.
9. **Tag GitHub Release**: `gh release create v$VERSION` with CHANGELOG
   section as body, attach tarball + `.sha256` + SBOM (Gap 19).
10. **Repo dispatch** to `nationid_example` (Gap 10) so the showcase
    deploys against the new version within an hour.
11. **Smoke alert**: failures in 8/9/10 page the maintainer via a
    `release-incident` GH Issue + email.

### Pre-publish checklist after fixes

- [ ] All changesets authored
- [ ] `pnpm verify` green in CI (replaces honor-system local check)
- [ ] Coverage non-regressing (Codecov PR check — Gap 2)
- [ ] Bundle size deltas ≤ +5% per entry (Gap 5)
- [ ] Bench non-regressing (Gap 6 dashboard)
- [ ] No open critical Scorecard findings (separate audit)

---

## Top 10 recommendations

Ranked by impact per hour of work; bracketed numbers are gap IDs.

1. **Post-publish validation job (~2 h, [1+20])** — install from npm,
   re-run `test:dist`, `npm audit signatures`. Single biggest gap; first
   real consumer break ships otherwise.
2. **Wire coverage to CI + Codecov (~45 min, [2])** — thresholds already
   exist, surface them. Adds a credible badge.
3. **Split `ci.yml` into `static` + `runtime` (~1 h, [3])** — stop running
   lint/typecheck/build 9 times. 30–40% wall-time win.
4. **`concurrency: cancel-in-progress` on `ci.yml` (~5 min, [8])** — stop
   wasting compute on superseded pushes.
5. **Shard vitest 4× (~1.5 h, [4])** — drops 6488-test wall from ~127 s
   to ~35 s critical path.
6. **size-limit-action PR comments (~20 min, [5])** — culture-shifts size
   from gatekeeper to visible delta.
7. **`workflow_dispatch` on `release.yml` (~15 min, [7])** — manual retry
   for the 1-in-50 mid-flight failure.
8. **Refine Dependabot grouping major-vs-rest (~10 min, [16])** — fewer
   noisy PRs, clearer review queue.
9. **Bun + Deno smoke lane (~1 h, [12])** — verify the multi-runtime claim
   before someone reports it broken.
10. **Document prerelease/canary in `docs/RELEASING.md` (~30 min, [11])**
    — needed before the v2.0 dev cycle starts.

Cumulative effort: ~8 hours. Score lift: 7.5 → 9. Beyond that, Gaps 6
(bench), 10 (showcase wiring), 15 (reproducibility) are quarterly-cadence
improvements.

---

## Bottom line

**`nationid@1.1.0` already does the load-bearing work**: SHA-pinned actions,
least-privilege tokens, `--frozen-lockfile`, 3×3 matrix, `test:dist` against
the packaged `exports`, `pnpm verify` gating both CI and `prepublishOnly`,
OIDC provenance, release concurrency, grouped Dependabot, `size-limit` with
11 budgets. None of this is accidental.

What is missing is **the discipline layer** that turns a working pipeline
into one a second maintainer (or 3 a.m. you) can trust without re-reading:
post-publish verification, coverage as a public signal, bundle deltas on
PRs, benches enforced, prerelease channel documented. Every fix is
**additive** — no workflow changes semantics; only new jobs and a small
reshape of `ci.yml`.

The single most consequential change is **Gap 1 (post-publish validation).**
The library has shipped 8 stable versions; the 9th will be the first one
where someone notices a missing-file-in-tarball or `exports` break by
opening an issue, because nothing else is looking. Spending 2 hours there
raises the floor from "hope-driven" to "evidence-driven" and unlocks the
rest of the roadmap.

After the top-5 fixes ship, this pipeline is upper-decile public-npm OSS
for solo-maintainer projects. After all 10 ship, it is ahead of most
multi-maintainer projects — none of it requires changing how the library
is written, only how the bytes get from `git push` to `npm view`.

**Current score: 7.5 / 10.** Post-top-10: **9 / 10.**
