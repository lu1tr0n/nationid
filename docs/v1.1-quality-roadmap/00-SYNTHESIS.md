# v1.1 Quality Roadmap — Synthesis

> Additive, non-breaking improvements to take `nationid@1.1.0` from polished one-person project to credible community OSS. 5 parallel audits covering community, supply chain, CI/CD, code quality tooling, adoption.

## Overall posture: 6.6 / 10

The four code-side audits (community/governance, supply chain, CI/CD, code-quality tooling) all converged at **7.5/10**. The adoption audit landed at **4/10**. Weighting:

| Dimension | Score | Weight | Weighted |
|---|---:|---:|---:|
| Community & Governance | 7.5 | 20% | 1.50 |
| Supply chain & security | 7.5 | 20% | 1.50 |
| CI/CD & release engineering | 7.5 | 20% | 1.50 |
| Code quality tooling | 7.5 | 15% | 1.13 |
| Community resources & adoption | 4.0 | 25% | 1.00 |
| **Total** | | **100%** | **6.63** |

Why adoption is 25% (the largest weight): the four code-side dimensions are *prerequisites* for credibility, but credibility without discoverability is a tree falling in an empty forest. nationid has shipped 1.1.0 with 1,201 monthly downloads. The single structural problem at this stage is not "is the library good" (it demonstrably is) — it is "does anyone find out". A library that scores 9/9/9/9/4 still grows like a 4. A library that scores 7/7/7/7/8 grows. The 4/10 cannot be smoothed away by averaging the four 7.5s.

That said — the four code-side audits clustering at exactly 7.5 is suspicious and deserves a sanity check. Reading them side-by-side: each agent independently described the same shape of story — "exemplary baseline, 6–10 small mechanical gaps, each fixable in <2 hours, each non-breaking". The 7.5 is real but it is not the same 7.5 in each dimension; it is four parallel "polished but not yet enforced" assessments. The good news: the fixes interlock. Sprint 1 below collapses ~40% of all four scores' gap to ceiling with one evening of work.

## Per-dimension scorecard

| Dimension | Score | Standout | Biggest gap |
|---|---:|---|---|
| Community & Governance | 7.5/10 | `SECURITY.md` with 3-day SLA, 6 MADR ADRs, three opinionated issue templates, `THIRD_PARTY.md` pre-empting LGPL question | Broken cross-links in `CONTRIBUTING.md:11`, `SECURITY.md:45`, `docs/GOVERNANCE.md:21`; Discussions linked but disabled |
| Supply chain & security | 7.5/10 | SLSA v1 provenance on every publish, signed commits, SHA-pinned actions, zero runtime deps, `prepublishOnly: pnpm verify` | Long-lived `NPM_TOKEN` in `release.yml:56-57`; Scorecard 6.8 dragged by 3 fixable 0-scores (Branch-Protection, Code-Review, CII-Best-Practices) |
| CI/CD & release engineering | 7.5/10 | `test:dist` against built tarball via `exports` map; release concurrency; `pnpm verify` gating both CI and `prepublishOnly` | Zero post-publish validation; coverage thresholds defined but never invoked in CI; 9-combo matrix runs platform-invariant work 9× |
| Code quality tooling | 7.5/10 | `vitest.dist.config.ts` runs suite against built artifact; TypeScript max-strictness + documented `verbatimModuleSyntax`; per-subpath `size-limit` budgets | No pre-commit hook; no `attw`/`publint` in `prepublishOnly`; no type-level tests locking in v1.0 narrowing wins; Biome 2 `assist.organizeImports` not enabled (silent drift) |
| Community resources & adoption | 4.0/10 | npm metadata + keywords solid; trilingual READMEs; showcase ships 8 examples + 34 country panels + 6 routes | `HashRouter` makes 100% of showcase content invisible to crawlers; GitHub repo description still advertises v0.1 (13 countries); no OG card; zero launch announcements across 5 releases |

## What the audits agree on (themes flagged by 2+ agents)

### Theme 1 — Stale GitHub repo description and topics are the #1 first-impression failure

Flagged by both `01-community-governance.md` (Gap 9) and `05-adoption-resources.md` (Gap 2). The repo description currently reads *"Type-safe identity document validation for 13 countries (LATAM, ES, US). 38+ specs, zero deps, tree-shakable."* — that is the v0.1 description from two weeks ago. v1.1 ships 34 countries and ~120 specs. This is the single piece of text that appears under the repo name in GitHub search, in npm page proxies, in Discord/Slack/Twitter unfurls, and in third-party "best validator libraries" scrapers. A 2-minute edit corrects every downstream discovery surface simultaneously. The community audit also flags missing topics (`tax-id`, `national-id`, `iso-3166`, `cldr`, `kyc-compliance`). This is the cheapest credibility lift in the entire roadmap.

### Theme 2 — Branch protection is off, and three audits care

Flagged by `01-community-governance.md` (Gap 15), `02-supply-chain-security.md` (Gap 4), and indirectly by `03-cicd-release.md` (no required-checks gate). `gh api repos/lu1tr0n/nationid/branches/main/protection` returns 404. The existing ruleset only blocks `deletion` + `non_fast_forward`. Scorecard scores Branch-Protection 0/10 and Code-Review 0/10 (two of the three fixable zeros pulling the aggregate down to 6.8). The supply-chain audit's proposed fix is the right one: require signed commits (already happening, just enforce), require status checks (CI, CodeQL), allow admin bypass for *review* only (`current_user_can_bypass: pull_requests`) so solo hotfixes still work. 15 minutes via `gh api`, two Scorecard checks flip simultaneously, real risk surface reduction.

### Theme 3 — The library claims a security/supply-chain posture it does not yet enforce

Flagged by `02-supply-chain-security.md` (Gap 2 — Trusted Publishing) and `04-code-quality-tooling.md` (Gap 13 — `attw + publint` in `prepublishOnly`). The library ships SLSA v1 provenance, signed commits, and `prepublishOnly: pnpm verify` — top-decile posture. But (a) the publish is gated by a long-lived `NPM_TOKEN` automation token in `release.yml:56-57` that bypasses 2FA and lives in CI, and (b) `prepublishOnly` does not run `attw --pack . && publint`, which is the single check that catches the most common publish-time bug for a dual-ESM/CJS library shipping 30+ subpath exports. Together these two fixes (~1 hour) remove the only long-lived secret from the threat model and add the missing pre-publish gate for the failure mode this library is most likely to ship.

### Theme 4 — Discoverability is bottlenecked by one architectural choice in the showcase

Flagged solely by `05-adoption-resources.md` (Gaps 1, 4, 5, 6, 11, 12 — six of the top adoption gaps trace to the same root). `nationid_example/src/App.tsx:16` uses `<HashRouter>`. Every route — playground, countries, examples, passports, MRZ — lives under `/#/…`. Search engines do not index hash-fragment routes. The 34 country panels, 8 code examples, and MRZ demo are *all* invisible to crawlers. Until this changes, per-country SEO pages cannot exist, comparison pages cannot rank, the cookbook cannot rank, framework-integration pages cannot rank. Six adoption gaps collapse into one architectural migration. Recommended target: Astro static export (Vite-compatible, ships zero JS by default, supports React islands so existing components port directly).

### Theme 5 — Solo-maintainer realities are repeatedly under-acknowledged in the *project's own documentation*

Flagged by `01-community-governance.md` (Gap 8 — bus-factor 1 undocumented) and by `05-adoption-resources.md` (Gap 9 — `Used by` section absent despite 4 known production users). The library is materially used in Marcly, JustSV, Emiso, MH Reminder — all operated by the maintainer, all with paying customers. Today an evaluator reads README → "where is this used?" → no answer → assumes "weekend project". Meanwhile the bus-factor question is left implicit. Both fixes are 1-hour edits to README and convert silent liabilities into honest signals (bus-factor as funding/governance ask; existing usage as social proof).

### Theme 6 — Test surface protects runtime behavior but not the marketed type-level behavior

Flagged by `04-code-quality-tooling.md` (Gap 3 — no `expect-type` tests) and indirectly by `03-cicd-release.md` (coverage thresholds set, never invoked). The v1.0 audit landed the headline narrowing wins: `parse<C extends DocumentTypeCode>(code: C, input: string): ParseResult<C>` and `getSpec<C>(...)`. The README *markets* these. The test suite does not assert them — TypeScript erases the types so the runtime tests stay green even if a future refactor silently widens. Adding `expect-type` is a 1-hour addition; ~50 LOC locks in the headline feature against regression.

### Theme 7 — Internal artifacts already exist for half the unshipped content

Flagged by `05-adoption-resources.md` repeatedly. `docs/countries/<cc>.md` exists for all 34 countries with cited algorithm prose. `README.md:197-208` ships a 4-column comparison table. The showcase already has 8 example components. The CHANGELOG is auto-generated. The labels `good first issue` + `help wanted` already exist. None of these are *missing* — they are *unsurfaced*. The fix shape is identical across them: take an existing artifact, route it through a crawlable URL.

## Critical findings (must-fix this week)

None of the 5 audits flag any "severity:critical" gap that breaks the library or exposes users to harm. The closest things to critical are:

1. **`NPM_TOKEN` is the only long-lived secret in the threat model** (`02-supply-chain-security.md` Gap 2, marked high severity). Single-leak compromise = arbitrary `nationid` publish. Mitigated today by 2FA-bypass *not* being widely known to attackers and by the maintainer's prompt response posture — but a stolen-laptop / GitHub-compromise scenario has no second line of defence.
2. **`SECURITY.md:45` 404s to `docs/PII_GUIDANCE.md`** (`01-community-governance.md` Gap 1). The wrong doc to break — security policy with a broken link to its own PII rationale. Fix is editing one path.
3. **Repo description sells a 60%-smaller library than what shipped** (`01` Gap 9 + `05` Gap 2). Not a security issue, but every share from a Discord post to a CFP description is currently mis-positioned. 2-minute fix.

None of these require a hotfix release. All three can be addressed in Sprint 1.

## The unified 90-day quality push

Three tiers, each ordered by impact × inverse-effort. Every deliverable is non-breaking and cites file paths or concrete artifacts to produce.

### Sprint 1 — "credibility patch" (this week, ~6 hours)

The smallest set that converts the broken-window signals into fixed-window signals. After this sprint every external evaluator's 10-minute pass through the repo lands on consistent artifacts.

1. **(5 min) Fix the GitHub repo description and topics.** Settings → Description: *"TypeScript-first validator for national ID and tax documents — 34 countries, cited high-confidence specs, zero deps, tree-shakable, ICAO 9303 MRZ."* Add topics: `tax-id`, `national-id`, `iso-3166`, `cldr`, `kyc-compliance`. Mirror identical wording on the `nationid_example` repo description. *Source: `01` Gap 9, `05` Gap 2.*
2. **(30 min) Fix the broken cross-links.** Edit `CONTRIBUTING.md:11` to drop the dead `docs/CONTRIBUTING.md` link. Edit `SECURITY.md:45` to point at `docs/PII.md` instead of `docs/PII_GUIDANCE.md`. Create stub `.github/MAINTAINERS.md` (one paragraph: sole maintainer, lazy-consensus per GOVERNANCE.md). *Source: `01` Gap 1.*
3. **(3 min) Three GitHub settings.** Settings → Security → enable Dependabot security updates. Settings → General → disable Wiki. Settings → General → enable "Automatically delete head branches". *Source: `01` Gap 10.*
4. **(15 min) Enable Discussions + pinned welcome thread.** Settings → General → Features → Discussions on. Create three categories: Q&A (with answer marking), Ideas, Announcements. Pin one welcome thread linking to CONTRIBUTING, SECURITY, the country-request template. Add `> Questions: please use Discussions` to README §Contributing. *Source: `01` Gap 2.*
5. **(5 min) Promote governance links to README.** Rewrite README §Contributing to surface `GOVERNANCE.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` directly (4 bullets, see `01` Gap 14 for verbatim copy). *Source: `01` Gap 14.*
6. **(15 min) Branch ruleset on `main`.** Via `gh api`: require status checks (CI, CodeQL `Analyze (javascript-typescript)`), require signed commits (already happening — enforce), `current_user_can_bypass: pull_requests` so solo hotfixes still work. Note the choice in `docs/GOVERNANCE.md` post-1.0 section. *Source: `01` Gap 15, `02` Gap 4.*
7. **(60 min) Register on bestpractices.dev.** Visit `https://www.bestpractices.dev/en/projects/new`, sign in, submit GitHub URL. Form is ~67 questions, ~50 auto-answer from README/LICENSE/SECURITY.md/CONTRIBUTING.md. Add the badge URL to README.md, README.es.md, README.pt.md (i18n rule). *Source: `02` Gap 1.*
8. **(30 min) Migrate to npm Trusted Publishing (OIDC).** Configure trusted publisher on npmjs.com (owner `lu1tr0n`, repo `nationid`, workflow `release.yml`). Remove `NPM_TOKEN` + `NODE_AUTH_TOKEN` from `release.yml:56-57`. Delete the `NPM_TOKEN` repo secret and revoke the automation token. The single most consequential change in the entire roadmap — eliminates the only long-lived publish secret. *Source: `02` Gap 2.*
9. **(30 min) Add `attw + publint` to `prepublishOnly`.** Add to devDeps, extend `package.json#scripts.verify` to: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:dist && pnpm exec attw --pack . && pnpm exec publint`. *Source: `04` Gap 13.*
10. **(10 min) Enable Biome 2 `assist.organizeImports`.** Add the `assist` block to `biome.json` (verbatim config in `04` Gap 2). Run `pnpm exec biome check --write .` once to land canonical sort as a single commit. *Source: `04` Gap 2.*
11. **(5 min) Add `concurrency: cancel-in-progress` to `ci.yml`.** Grouped on `${{ github.workflow }}-${{ github.ref }}`, gated to `pull_request` events so main-branch runs still complete. *Source: `03` Gap 8.*
12. **(10 min) Update `ci.yml` to run coverage once on the ubuntu/node 22 lane.** Pipe to Codecov via `codecov/codecov-action@<sha>` with `fail_ci_if_error: false` initially. Add badge to README. *Source: `03` Gap 2.*

**Total: ~3.5 hours of actual mechanical work, plus ~1.5 hours of waiting on bestpractices.dev review.** After Sprint 1: OpenSSF Scorecard projects ~9.0 (from 6.8), Best Practices badge pending, no long-lived publish secret, `attw + publint` catching subpath-export bugs at publish, every external evaluator sees consistent artifacts.

**The single highest-leverage deliverable in Sprint 1 is item 8 (Trusted Publishing).** It is the only fix in the entire roadmap whose worst-case avoided incident is "arbitrary malicious `nationid@1.x.y` publish to npm". Everything else is credibility and discoverability.

### Sprint 2 — "credible OSS" (next 2 weeks, ~20 hours)

Takes the four code-side dimensions from 7.5 to ~9 each. Concrete deliverables, ordered:

1. **(2 h) Post-publish validation job in `release.yml`.** Reflect `published` + `version` from `changesets/action` as job outputs. Add a `post-publish` job gated on `published == 'true'`: poll `npm view nationid@$VERSION version` for 60 s, install into `/tmp/smoke`, run `pnpm test:dist` against the installed copy, run `npm audit signatures`. On failure: open a `release-incident` issue. *Source: `03` Gap 1, Gap 20.*
2. **(2 h) Add SBOM + tarball + `.sha256` as GitHub Release assets.** After `pnpm build`: `pnpm dlx @cyclonedx/cdxgen` → `sbom.cdx.json`, `sbom.spdx.json`. `pnpm pack`, `sha256sum`. `softprops/action-gh-release` uploads 4 files. Flips two Scorecard `-1`s positive. *Source: `02` Gap 3.*
3. **(1 h) Split `ci.yml` into `static` + `runtime` jobs.** `static` (one ubuntu-22 lane) runs lint, typecheck, docs:check, build, size, coverage; uploads `dist/` as artifact. `runtime` (`needs: static`, matrix 3×3) downloads artifact and runs only `pnpm test` + `pnpm test:dist`. *Source: `03` Gap 3.*
4. **(1.5 h) Shard vitest 4× in the `runtime` matrix.** Add `shard: [1, 2, 3, 4]` to matrix. 6488 tests at ~127 s on one worker → ~32 s critical path with 4 shards. *Source: `03` Gap 4.*
5. **(30 min) Pre-commit hook via `simple-git-hooks` + lint-staged.** Stage Biome check + conditional typecheck on staged `.ts`. `--no-verify` bypass documented in CONTRIBUTING.md. *Source: `04` Gap 1.*
6. **(1 h) `expect-type` type-level tests for v1.0 narrowing.** Drop ~50 LOC into `tests/types/narrowing.test-d.ts` asserting `parse("MX_CURP", x).code` is literal `"MX_CURP"`, `getSpec("BR_CPF").code` is literal, etc. Locks in the README-marketed feature. *Source: `04` Gap 3.*
7. **(2 h) `knip` for dead-code detection.** Initial soft-warn pass (`|| true`); promote to hard fail after first cleanup commit. Configure entrypoints to mirror `tsup` entries. Also catches i18n locale drift. *Source: `04` Gap 4.*
8. **(45 min) Add `madge --circular` + `size-limit --why` + `size-limit-action` PR comments.** Three small additions, all complementary to existing tooling. *Source: `04` Gap 8, Gap 12; `03` Gap 5.*
9. **(15 min) Add `workflow_dispatch` to `release.yml`.** Manual restart path for mid-flight `changesets/action` failures. *Source: `03` Gap 7.*
10. **(15 min) Refine Dependabot grouping.** Group by `update-types` (minor+patch batched, major individual) instead of dev vs prod (zero prod deps today). *Source: `03` Gap 16.*
11. **(15 min) `.editorconfig` + `.vscode/extensions.json`.** Remove `.vscode/` from `.gitignore`, commit minimal recommended-extensions + format-on-save config. *Source: `04` Gap 5.*
12. **(1 h) `good first issue` curation.** Open 5–8 issues from `docs/v1.1-functional-audit/00-SYNTHESIS.md` Theme 5 (11 EU `extract` gaps + 8 doc parity fixes) + 4 i18n locale stubs (fr/de/it/fr-CA). Tag with `good first issue` + `help wanted`. Submit to `up-for-grabs.net`. Add "First-time contributor?" section to CONTRIBUTING.md. *Source: `01` Gap 4, `05` Gap 13, Gap 16.*
13. **(1 h) Bun + Deno smoke lane.** README claims multi-runtime — add `runtime-alt` matrix lane on ubuntu running the test suite under Bun + Deno via `oven-sh/setup-bun` and `denoland/setup-deno`. *Source: `03` Gap 12.*
14. **(1 h) Biome lint rule additions.** Enable `useExhaustiveSwitchCases`, `useImportType`, `noConsole` (scoped to `src/**`), `noFloatingPromises`, `useThrowOnlyError`. Audit existing for false positives. *Source: `04` Gap 7.*
15. **(2 h) Document SLSA L3 claim + reproducible-build recipe.** Append to `SECURITY.md`. Verify byte-for-byte reproducibility on two machines per `02` Gap 5. *Source: `02` Gap 5, Gap 8.*
16. **(30 min) Wire FUNDING.yml.** Enable GitHub Sponsors, uncomment `github: lu1tr0n`. *Source: `01` Gap 3.*
17. **(15 min) Add `## Used by` section to README.** Marcly, JustSV, Emiso, MH Reminder. Closing line "open a PR to add yours" converts every adoption into a backlink. Mirror to README.es.md and README.pt.md. *Source: `05` Gap 9.*
18. **(15 min) Add `## Maintenance` section to README.** Four sentences: solo-maintainer, sponsorship funds time, co-maintainer invitation via Discussion. Converts bus-factor from silent liability into honest ask. *Source: `01` Gap 8.*

**After Sprint 2:** Scorecard ~9.0, OpenSSF Best Practices Silver candidate, post-publish smoke catches first consumer-only break, type-level safety net locked in, pre-commit hook closes the first-contributor friction. Four code-side dimensions move from 7.5 to ~9 each.

### Sprint 3 — "discoverable" (next 30–60 days)

The adoption push. This is where the 4/10 changes. Nothing in Sprint 3 works without Sprints 1 and 2 — the static-export migration needs the corrected repo description to share well, the per-country pages need OG cards, the launch posts need the credibility patch already applied so the link doesn't show a broken description.

1. **(1 day) Migrate `nationid_example` from `HashRouter` to Astro static export.** Convert `src/App.tsx:16` from `<HashRouter>` to Astro routes. Existing React components port to React islands. Add `<link rel="canonical">` per page. This single change unlocks every other Sprint 3 deliverable. *Source: `05` Gap 1.*
2. **(3 days) Generate per-country static landing pages.** `/countries/<cc>/` for all 34 countries. H1: *"Validate \<doc list\> from \<Country\> in TypeScript"*. Source content from `docs/countries/<cc>.md` (already exists). Embed interactive validator below the fold. Install snippet for `nationid/<cc>` subpath. Each page = one country-scoped commercial-intent query. *Source: `05` Gap 4.*
3. **(half day) OG / Twitter / Schema.org markup + a real social card.** 1200×630 PNG: logo + wordmark + "34 countries · cited specs · zero deps" + flag row. Per-country OG cards via `@vercel/og` or `satori`. Add `SoftwareSourceCode` JSON-LD. *Source: `05` Gap 3.*
4. **(half day) `/compare/` pages.** Four pages: `/compare/validator-js`, `/compare/cpf-cnpj-validator`, `/compare/rut-js`, `/compare/python-stdnum`. Source content from `README.md:197-208` (already exists, just bury-reverse). Crosspost each to Dev.to with canonical → showcase. *Source: `05` Gap 5.*
5. **(2 weeks part-time) Cookbook section.** 10 recipes: React Hook Form + zod refinement, Next.js Server Action, Stripe webhook + masking, Postgres column design (hash + last_4 + masked), React Native Expo, Astro form, SvelteKit form, Remix loader, multi-tenant defaulting, bulk CSV import. Crosspost each. *Source: `05` Gap 6.*
6. **(1 day) Framework integration pages.** `/integrations/{nextjs,remix,sveltekit,astro,nuxt,react-native,tanstack-start,react-router}`. Templated — same shape per page. Submit each to corresponding `awesome-X` repo. *Source: `05` Gap 11, Gap 12, Gap 19.*
7. **(half day) Launch sequence for v1.2.** Stage as a real event: Show HN Monday 9am PT; Dev.to post (canonical = permalink); Twitter/Bluesky/LinkedIn threads with new OG card; Spanish-language post on elsolitario.org leveraging existing audience + multi-channel distribution. *Source: `05` Gap 7, Gap 8.*
8. **(3 hours) Slow-burn backlinks.** Submit to `sindresorhus/awesome`, `sindresorhus/awesome-nodejs`, `dzharii/awesome-typescript`, `humiaozuzu/awesome-fintech`, `up-for-grabs.net`. Open Zenodo-GitHub integration; tag next release for DOI. *Source: `05` Gap 18, Gap 19.*
9. **(1 hour) Customize TypeDoc theme.** Add top banner with positioning sentence + install snippet + showcase link via `navigationLinks`. Closes the bounce loop for TypeDoc-ranked search hits. *Source: `05` Gap 14.*
10. **(2 h) Native fuzzing via `@jazzer.js/core` for `src/extract/`.** Real security coverage on the extractor's pathological-input surface. *Source: `02` Gap 7.*

**After Sprint 3:** 42 new crawlable pages, 4 comparison pages capturing "X vs Y" queries, 10 cookbook recipes hitting Integration-funnel queries, real launch event for v1.2, established backlink network. Adoption score moves from 4 → ~7. Compound-growth path established.

## What NOT to do (anti-patterns spotted)

Multiple agents independently rejected the same set of "looks like serious OSS but breaks a solo maintainer" patterns:

- **Discord / Slack / Matrix chat** (`01` Gap 6 + anti-patterns, `05` Gap 10). An empty chat with the maintainer as the only active member is worse than no chat. Defer to ~10k monthly downloads.
- **CLA requirement** (`01` anti-patterns). For an MIT library, a DCO sign-off is enough if anything is needed. CLAs raise barrier-to-contribution and signal corporate paranoia.
- **All-contributors bot / emoji-react credit tables** (`01` anti-patterns). Bots that maintain contributor tables are net-negative until ~20 regular contributors. Hand-credit in CHANGELOG as `CONTRIBUTING.md:117` already commits to.
- **Translating GOVERNANCE.md / CONTRIBUTING.md / ADRs to ES/PT** (`01` anti-patterns). READMEs are the cover page and warrant translation; governance docs are read by contributors who can read English.
- **Code Climate / Codacy / SonarCloud third-party dashboards** (`01` anti-patterns). The Scorecard workflow already in the repo is sufficient.
- **Mandating multi-reviewer policy now** (`01` Gap 15 + anti-patterns). Branch protection that requires reviewers is appropriate at 2+ maintainers, not at 1. Current CODEOWNERS routing to `@lu1tr0n` is sufficient.
- **TypeScript project references** (`04` Gap 9, severity:very low). Not a real bottleneck at 187 files. Defer past ~500 files or >10s typecheck.
- **Setting up Open Collective / Polar fiscal host** (`01` anti-patterns). GitHub Sponsors is sufficient until sponsorship revenue justifies operational overhead.
- **Auto-closing stale issues** (`01` anti-patterns). With 4 open issues and weekly maintainer presence, stale-bots are theatre. Revisit at >50 open issues.
- **Dedicated project social account (@nationid_dev / @nationid.bsky.social)** (`05` Gap 10). An empty project account hurts more than helps. Use the maintainer's personal handle as project voice until ~10k monthly downloads.
- **CI cache for `.tsbuildinfo` / Biome internal cache** (`04` Gap 15, severity:very low). Current CI is ~2 minutes. Cache-key stamping complexity exceeds the ~30s save until CI > 5 minutes.

## How the 5 dimensions interlock

**Sprint 1 unblocks Sprint 2.** Item 6 (branch ruleset) creates the `required_status_checks` gate that Sprint 2's split `ci.yml` (item 3) and sharded vitest (item 4) need to be meaningful — required checks on `main` only matter once Scorecard counts them. Item 8 (Trusted Publishing) removes the secret that Sprint 2's post-publish smoke (item 1) would otherwise still rely on. Item 7 (bestpractices.dev) registers the project on the badge surface so Sprint 2's SLSA L3 documentation (item 15) has somewhere to be reflected. The credibility patch is the *prerequisite* — without it, the discipline layer in Sprint 2 enforces nothing because there is no signal anyone checks.

**Sprint 2 unblocks Sprint 3.** The post-publish smoke (item 1) gives launch confidence — Sprint 3's v1.2 launch (item 7) cannot ship Monday morning HN without a verified-from-npm smoke that ran the previous Friday. The `Used by` and Maintenance README sections (items 17, 18) become the social proof that Sprint 3's per-country pages (item 2) and comparison pages (item 4) cross-link to. The seeded `good first issue` set (item 12) becomes the inbound funnel that Sprint 3's awesome-list submissions (item 8) bring traffic to. Without Sprint 2's discipline layer, Sprint 3's content layer ships to a repo that still looks like "weekend project" under any evaluator inspection — and the launch event is the worst possible time for that mismatch.

**Sprint 3 closes the loop back to Sprint 1.** Per-country pages (item 2) drive search-engine traffic to a repo whose description is correct (Sprint 1 item 1) and whose `Used by` section gives them a reason to stay (Sprint 2 item 17). The cookbook (item 5) drives the per-recipe stars and the framework-community links that get the maintainer's first regular contributor — at which point the `good first issue` work from Sprint 2 item 12 + the `.devcontainer/` work from Sprint 2 (deferred to Sprint 3 as it makes more sense alongside the static-export migration) means the new contributor can land in <30 minutes. Trusted Publishing from Sprint 1 means that contributor's PR can ship a release without the maintainer being the only person with the credentials to publish. The flywheel only spins if all three are present.

## Bottom line for the maintainer

`nationid@1.1.0` is a 7.5/7.5/7.5/7.5/4 library: four dimensions of senior-engineer infrastructure work and one dimension of weekend-engineer adoption surface. The structural problem is not the code — the v1.1 functional audit already concluded it ships above its peers — it is the mismatch between what is built and what is discoverable. **The single highest-leverage deliverable to ship tomorrow is the 2-minute GitHub repo description fix** (Sprint 1 item 1); it touches every share, every search hit, every aggregator scrape simultaneously, and it is the only fix in the entire roadmap where the cost-benefit ratio is sub-second. **The single most consequential change in the next 7 days is migrating to npm Trusted Publishing** (Sprint 1 item 8); it removes the only long-lived secret from the supply-chain threat model. **The long game is Sprint 3**: the static-export migration of `nationid_example` is the architectural choice on which 6 of the 7 highest-impact adoption gaps depend; until it ships, the 4/10 adoption score is a structural ceiling that no amount of Sprint 1/2 work can move. **Honest assessment of the gap**: the 4/10 is real, the four 7.5s are also real, and weighting adoption at 25% gives an honest 6.6/10 aggregate that does not flatter the project. The library has earned the right to be discovered; what is left is the unglamorous content and configuration work that makes the discovery actually happen.

## Metadata

- Audit date: 2026-05-23
- Library version: nationid@1.1.0
- Agents: 5 parallel (community, supply chain, CI/CD, tooling, adoption) + 1 synthesizer
- Total report words: ~16,000 across the 5 inputs
- Reports under `docs/v1.1-quality-roadmap/0[1-5]-*.md`
- Sibling audit: `docs/v1.1-functional-audit/00-SYNTHESIS.md` (functional/code quality of the library itself, weighted 8.03/10)
- Out-of-scope (deferred to a future audit): pricing/monetization strategy, telemetry/observability of consumer usage, paid-marketing experiments, conference talk pipeline beyond CFP submission
