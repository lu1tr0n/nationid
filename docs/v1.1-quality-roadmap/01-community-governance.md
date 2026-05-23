# v1.1 Quality Roadmap — Community & Governance

> Read-only audit of how `nationid@1.1.0` invites, structures, and protects contribution. Scope: everything around the code — not the code itself. Counterpart to the v1.1 functional audit at `docs/v1.1-functional-audit/00-SYNTHESIS.md`.

## Current state: 7.5 / 10

For a library that has been public for two weeks and is operated by a single maintainer, `nationid` already presents most of the artifacts a credible OSS project is expected to ship: a Contributor Covenant 2.1 `CODE_OF_CONDUCT.md`, a `SECURITY.md` that wires GitHub Security Advisories as the preferred private channel, three issue templates that are *technically opinionated* (synthetic-only test vectors, official-source citations required for algorithm corrections), a `GOVERNANCE.md` that distinguishes the pre-1.0 from post-1.0 decision model, a `THIRD_PARTY.md` that defuses the LGPL `python-stdnum` cross-reference question pre-emptively, six MADR-format ADRs, and a `CITATION.cff` that makes the library citable from academic work. This is materially better than the median npm package at v1.1.

The gap between today's posture and a fully credible community project is not the *presence* of artifacts — it is **internal consistency** (multiple documents reference files that do not exist on disk), **GitHub-side settings that contradict the documentation** (Discussions linked from `ISSUE_TEMPLATE/config.yml` but `has_discussions: false` at the repository level), and **first-contributor mechanics that do not yet exist** (no `good first issue` label curated, no translation contribution path for READMEs, no MAINTAINERS file, no community chat or async forum). The posture today is "polished one-person project with the right files in the right places"; the smallest credible step toward "community OSS that a second contributor would actually land in" is fixing the broken cross-links and turning Discussions on so the existing routing actually works.

## What exists and works

Verified by reading the source files; cited by path so this audit is reproducible.

- **`CODE_OF_CONDUCT.md`** is adapted from Contributor Covenant 2.1 (`CODE_OF_CONDUCT.md:3`), names a single reporting email (`luis.navarro.alvarez.1991@gmail.com`, line 21), commits to confidentiality, and is short enough that someone will actually read it. Posture: appropriate for project size.
- **`SECURITY.md`** is one of the strongest files in the repo: it names a preferred channel (GHSA private advisory at `SECURITY.md:9`), an alternative channel with a subject prefix (`[nationid security]`, line 13), a defined acknowledgement SLA (3 business days, line 23), a supported-versions table (line 29), explicit in-scope/out-of-scope definitions (lines 36–46), a coordinated-disclosure clause (line 49), and a verification recipe for npm provenance attestations (line 56). This is materially above industry baseline for a solo project.
- **`CONTRIBUTING.md`** (root) walks the new contributor through clone → install → `pnpm verify` → workflow per change type → commit conventions → license consent (`CONTRIBUTING.md:13-118`). It documents the 10-step new-country workflow concretely (lines 58–69) — far better than the generic "send a PR" boilerplate most libraries ship.
- **`docs/GOVERNANCE.md`** explicitly distinguishes pre-1.0 from post-1.0 decision models (lines 11–25), commits to a 7-day window for breaking-change RFCs, a 30-day window for major releases (`docs/GOVERNANCE.md:31`), and names the conflict-resolution escalation path including the outsider-arbitrator fallback if the disagreement involves the owner (line 42). The post-1.0 lazy-consensus rule (line 22) is unusually well-specified for a pre-community project.
- **Three opinionated issue templates** under `.github/ISSUE_TEMPLATE/`:
  - `bug_report.yml` requires lib version, country, document code, runtime, expected/actual, and forces a `synthetic-numbers-only` checkbox (lines 92–96).
  - `country_request.yml` forces an ISO code, official source URLs, and asks the requester whether they intend to PR (lines 47–56) — this is a smart self-triage signal.
  - `algorithm_correction.yml` requires an official-source URL and at least 2 vectors that prove the current code is wrong (lines 26–46) — exactly the right friction for a correctness-critical library.
- **`.github/ISSUE_TEMPLATE/config.yml`** disables blank issues (line 1) and provides two contact links (Discussions and SECURITY) — the right pattern, even though one of the two links is currently broken (see Gap 1).
- **`.github/PULL_REQUEST_TEMPLATE.md`** asks for type, checklist (tests, `pnpm verify`, bundle budget, sources cited, synthetic vectors, changeset, per-country doc, README update), sources list, and a breaking-change checkbox (`PULL_REQUEST_TEMPLATE.md:1-36`). The synthetic-vectors and sources prompts are non-generic and aligned with the library's correctness posture.
- **`.github/CODEOWNERS`** routes every PR to `@lu1tr0n` (line 2), with commented-out per-country slots ready to activate when reviewers join (lines 5–6) — a documented plan for the multi-maintainer transition.
- **`.github/dependabot.yml`** runs weekly grouped updates for `npm` + `github-actions` in a `America/El_Salvador` timezone window the maintainer actually wakes up to. PR limit 5 each (lines 10, 27) — sensible for solo review capacity.
- **`THIRD_PARTY.md`** pre-empts the LGPL `python-stdnum` license-compatibility question by documenting that algorithms were re-implemented from primary sources rather than transpiled (lines 43–51, 94–98). Few OSS libraries do this proactively.
- **`CITATION.cff`** is wired for academic citation (line 1) — irrelevant for npm consumers but valuable signal to government / public-sector evaluators that the library aspires to be cited.
- **`docs/adr/`** — six accepted MADR-format ADRs covering the most contested decisions (validate-accepts-formatted, parse-discriminated-union, low-confidence-no-warning, BR_CNPJ alphanumeric transition, MX_CURP Ñ policy, MX_RFC forbidden prefixes), with an `adr/README.md` that defines when an ADR is required (lines 8–24) and an authoring flow (lines 52–58). This is *senior-engineer-level governance* for a solo project.
- **`docs/STYLE_GUIDE.md`** and **`docs/I18N.md`** document contribution conventions for code and error-string translators respectively — the latter at unusual depth for a five-string corpus.
- **`LICENSE`** is canonical MIT with a fresh 2026 copyright (`LICENSE:3`); `package.json#license: "MIT"` matches; `CITATION.cff#license: MIT` matches. Three-way consistency check passes.

## Gaps with concrete additive fixes

Every gap below is **non-breaking** by construction (governance/community changes do not affect library behavior). Severity is calibrated to "what a first-time contributor experiences" and "what an evaluator looking at the repo for 10 minutes will conclude about maturity."

### Gap 1 — Broken cross-references on the contribution path

Three documents reference files or settings that do not exist:

1. `CONTRIBUTING.md:11` links to `[docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)` as "Detailed contributor guide." That file does not exist (`find /docs -maxdepth 2 -name CONTRIBUTING.md` returns nothing). A reader following the link gets a 404 on github.com.
2. `SECURITY.md:45` links to `[docs/PII_GUIDANCE.md](./docs/PII_GUIDANCE.md)` for the PII-out-of-scope rationale. The file does not exist; the documented PII helpers live in `docs/PII.md` instead. This causes a 404 from inside the security policy — the worst possible doc to break.
3. `docs/GOVERNANCE.md:21` references `.github/MAINTAINERS.md` as the future home of the maintainer team. The file does not exist. This is forward-looking so less severe, but the post-1.0 governance plan does not parse without a stub.
4. `.github/ISSUE_TEMPLATE/config.yml:4` routes the "Question or discussion" contact link to `https://github.com/lu1tr0n/nationid/discussions` — but the GitHub repository setting is `has_discussions: false` (verified via `gh api`). The link silently redirects to a "Discussions are not enabled" page.

**Fix:** (a) edit `CONTRIBUTING.md:11` to remove the dangling link OR create a stub `docs/CONTRIBUTING.md` that simply re-points; (b) edit `SECURITY.md:45` to link to `docs/PII.md` (the file that exists) or create `docs/PII_GUIDANCE.md` as a short consumer-facing pointer to `docs/PII.md`; (c) create a one-paragraph `.github/MAINTAINERS.md` listing the current sole maintainer with a "team grows via lazy consensus per GOVERNANCE.md" pointer; (d) enable Discussions via repo Settings or remove the contact link.

**Severity:** high — a first-time contributor's path through `CONTRIBUTING.md → docs/CONTRIBUTING.md` 404s on step 1, and the SECURITY policy 404 is the wrong link to break.
**Effort:** 30 minutes total.

### Gap 2 — Discussions are linked but not enabled

`has_discussions: false` at the GitHub repo level (verified via `gh api repos/lu1tr0n/nationid`), but the issue-template config (`.github/ISSUE_TEMPLATE/config.yml:3-5`) and `docs/GOVERNANCE.md:13` both treat Discussions as an active channel. `README.md` does not mention Discussions at all. Net effect: there is no functional Q&A or show-and-tell space, despite the project being set up to route to one.

**Fix:** enable Discussions (Settings → General → Features → Discussions). Create three categories: `Q&A` (with answer marking), `Ideas`, `Show and tell`. Add a single pinned welcome thread that links to CONTRIBUTING, SECURITY, and the country-request template, and writes the three-sentence sole-maintainer expectation: "I review within 7 days; algorithm corrections jump the queue if they cite an official source." Add a `> Questions: please use Discussions` line to README §Contributing.
**Severity:** medium — friction is invisible (a confused user opens an issue or silently leaves) so it does not feel urgent, but enabling Discussions is the highest-ROI 5-minute lever for community formation.
**Effort:** 15 minutes including pinned thread.

### Gap 3 — FUNDING.yml is entirely commented out

`.github/FUNDING.yml` currently reads as two comment lines (`# Configure once you have GitHub Sponsors enabled, or remove this file.`). GitHub interprets this as "no sponsor button." The library is materially valuable infrastructure for fintech / KYC use cases — there is no commercial signal that says "if your company depends on this, you can support it."

**Fix:** decide once whether to wire GitHub Sponsors. If yes (recommended given the audience), enable Sponsors at the GitHub user level, then uncomment `github: lu1tr0n` in `FUNDING.yml`. If declining sponsorship for now, delete the file outright — the commented version is worse than its absence because it advertises indecision. Optional secondary platforms: Polar (newer, OSS-native), Open Collective (if/when a team forms). BuyMeACoffee is fine for personal projects but less serious for B2B fintech libraries.
**Severity:** medium — affects funding optionality and the signal that the maintainer takes the project seriously enough to accept support.
**Effort:** 15 minutes if Sponsors profile already exists, 1 hour if creating from scratch.

### Gap 4 — No `good first issue` curation

CONTRIBUTING.md describes how to add a country, fix an algorithm, and fix a bug — but does not provide an entry path for a contributor who has 1 hour, wants to help, and does not yet know the library. There is no `good first issue` or `help wanted` mention anywhere (`grep -i "good first issue" CONTRIBUTING.md README.md docs/GOVERNANCE.md` returns empty). The 11 EU codes with missing `extract` and the 8 documentation parity fixes flagged in `docs/v1.1-functional-audit/00-SYNTHESIS.md` Theme 5 are *natural* good-first-issue material — but they are not labelled or surfaced.

**Fix:** create three GitHub labels (`good first issue`, `help wanted`, `documentation`), open 5–8 starter issues today by copy-pasting from the v1.1 functional-audit findings (each one a single concrete deliverable with file paths), and add a "First-time contributor?" section to CONTRIBUTING.md pointing to the label filter URL: `https://github.com/lu1tr0n/nationid/issues?q=is:open+label:%22good+first+issue%22`. Mentor offer: "Tag @lu1tr0n in the issue before opening a PR and I will pre-review your approach within 7 days."
**Severity:** high for community growth, low for current operation — the project will not get its first regular contributor without this.
**Effort:** 1 hour (5–8 issues × ~7 minutes each).

### Gap 5 — Translation contribution path covers strings but not READMEs

`docs/I18N.md:118-135` is exemplary on how to add a *runtime error-string* locale (5 strings + 1 neutral noun + tests). But the project also ships `README.md`, `README.es.md`, `README.pt.md` — three full-length user-facing documents in three languages — and there is no documented path for a community contributor to propose a fourth language (French, German, etc.) or to fix parity drift across the existing three (which the functional audit Theme 5 flags as already happening).

**Fix:** add a "Translating the README" section to `docs/I18N.md` (~150 words) with three parts: (a) checklist of all three current files and what must stay in sync, (b) the parity-drift hit list (e.g. "if you change country count, update all three"), (c) review requirement ("a native or near-native speaker must review before merge — same rule as error strings"). Cross-link from CONTRIBUTING.md §Workflow as a fourth common-contribution type.
**Severity:** medium — affects future scalability of the multi-lingual posture the project is already advertising.
**Effort:** 30 minutes.

### Gap 6 — No community communication channel announced

README does not mention Discord, Matrix, Slack, Telegram, or any synchronous chat. The only documented channels are GitHub issues, GitHub Discussions (currently disabled — see Gap 2), and the maintainer email for security/CoC. This is *defensible* for a solo project (a Discord with zero activity is worse than no Discord), but the silence creates ambiguity: a potential contributor cannot tell whether the project welcomes informal questions.

**Fix:** option A — explicitly state in CONTRIBUTING.md "Async-first: use Discussions for questions and Issues for bugs. There is no chat channel; the maintainer reviews weekly." Option B — create a public Telegram channel or a private-by-invite Discord and link it. Recommendation: Option A. Setting expectations beats setting up infrastructure that does not get maintained.
**Severity:** low.
**Effort:** 10 minutes (one-paragraph addition).

### Gap 7 — Roadmap lives in README, not as a public artifact

The roadmap (`README.md:209-218`) is a static list inside the README. It updates only when someone edits README.md and pushes. There is no way for a community member to subscribe to roadmap changes, propose roadmap items as a first-class artifact, or see which roadmap items have open issues / draft PRs. `docs/GOVERNANCE.md:34-37` says "the roadmap lives in README.md" — a deliberate choice, but limiting.

**Fix:** create a single GitHub Project (beta) titled "nationid roadmap" with columns: `v1.2`, `v1.3`, `v2.0`, `Backlog`, `Shipped`. Move the existing README list items into it as cards. Pin a README link to the project URL: `> Live roadmap: https://github.com/users/lu1tr0n/projects/<n>`. Keep the README list as a high-level summary that auto-stays-current because it now points to the Project. Alternative lower-effort version: open one tracking issue per remaining roadmap line (`v1.1+ — Asia phase 1`, `v1.1+ — @nationid/react`, etc.) with the `roadmap` label, and pin those issues.
**Severity:** medium — affects "credibility of stated roadmap" for evaluators.
**Effort:** 1 hour for the Project version, 20 minutes for the pinned-issues version.

### Gap 8 — Bus-factor 1 is real but undocumented

The project has exactly one publish credential, one CoC contact, one security contact, one CODEOWNERS line. This is the reality for almost all solo OSS — but it is not stated anywhere as an awareness signal. A KYC fintech evaluating whether to depend on `nationid` will derive bus-factor from `gh api repos/lu1tr0n/nationid/contributors` and notice; better to address it head-on.

**Fix:** add a "Maintenance" section to README (or to GOVERNANCE.md, lower-visibility), four sentences: "nationid is currently maintained by a single person. If you are evaluating it for production use, sponsorship via GitHub Sponsors directly funds maintenance time. If you are a regular contributor and would like to be invited as a co-maintainer, open a Discussion — the criteria are documented in GOVERNANCE.md." This *converts* the bus-factor signal from an unspoken liability into an honest funding/governance ask.
**Severity:** medium — affects enterprise-evaluation outcomes specifically.
**Effort:** 15 minutes.

### Gap 9 — Repo description and homepage drift

`gh api repos/lu1tr0n/nationid` returns `description: "Type-safe identity document validation for 13 countries (LATAM, ES, US). 38+ specs, zero deps, tree-shakable."` while README ships 34 countries and ~120 specs. The repo homepage points to the showcase site, which is correct, but the description below the repo title on github.com is materially stale.

**Fix:** edit the repo description via Settings → General → Description to read approximately: "Type-safe national identity and tax-document validation for 34 countries (~120 codes). Zero dependencies, tree-shakable per country, TypeScript-first, MIT." Also add missing topics: `tax-id`, `national-id`, `iso-3166`, `cldr`, `kyc-compliance`, `oss`, `governance`. Current topics are LATAM-focused and miss the EU expansion (`gh api` shows `["argentina","brazil","chile","colombia","compliance","el-salvador","fintech","guatemala","identity-documents","kyc","latam","mexico","nodejs","peru","spain","tree-shakable","typescript","validation","zero-dependencies"]`).
**Severity:** medium — this is the single first impression for someone landing on the github.com page from a search engine.
**Effort:** 5 minutes (web UI), or via `gh api -X PATCH repos/lu1tr0n/nationid -f description="..."`.

### Gap 10 — Disabled GitHub features that should be on, enabled features that are dead weight

Three GitHub repo settings from `gh api`:

- `dependabot_security_updates: status: "disabled"` — automatic security PRs from Dependabot are off. Only the *manual* dependabot.yml (scheduled npm + actions updates) runs. Security-specific updates require a separate toggle.
- `has_wiki: true` — Wiki is enabled but nothing references it (`grep -i "wiki" README.md CONTRIBUTING.md docs/*.md` returns nothing). An enabled-but-empty wiki is a confusion vector ("is the real docs in here?").
- `delete_branch_on_merge: false` — merged PR branches accumulate on the fork. Cosmetic but reflects on hygiene.

**Fix:** enable `dependabot_security_updates` (Settings → Security → Dependabot security updates), disable Wiki (Settings → General → Features → Wikis off), enable "Automatically delete head branches" (Settings → General → Pull Requests).
**Severity:** medium for security-updates (real risk surface), low for the other two.
**Effort:** 3 minutes total.

### Gap 11 — No `discussion`/`question` issue template fallback

`.github/ISSUE_TEMPLATE/config.yml:1` sets `blank_issues_enabled: false`. The only templates are bug / country / algorithm. A contributor with a *design question* ("should v1.2 add `detect()` or wait?") cannot open an issue at all — they must use Discussions, which is currently disabled (Gap 2). Once Discussions is enabled this gap dissolves automatically, but until then the project has a hard 404 on its question routing.

**Fix:** prioritise Gap 2 (enable Discussions). Alternatively or additionally, add a fourth template `question.yml` that opens to `labels: ["question", "needs-triage"]` with a single textarea — costs nothing if Discussions is later enabled because the templates can coexist.
**Severity:** medium until Gap 2 is fixed, then disappears.
**Effort:** absorbed into Gap 2.

### Gap 12 — CHANGELOG is the only release-announcement signal

The project has a `CHANGELOG.md` (29 KB, healthy) and ships per-release CHANGESETs in `.changeset/`, but there is no documented release-announcement habit: no Discussions release post, no Twitter/Mastodon thread, no Hacker News submission, no Show HN / r/typescript heads-up. v1.0 and v1.1 both shipped without a public announcement thread referenced from the repo.

**Fix:** create a one-page `docs/RELEASE_PROCESS.md` that documents (for future-self memory and any future co-maintainer): (a) ship CHANGELOG via changesets workflow, (b) cut GitHub Release with `gh release create` referencing the CHANGELOG anchor, (c) open a Discussions thread under `Announcements` category linking to the GitHub Release and CHANGELOG anchor, (d) optional: tweet / mastodon / Show HN. The point is not to *force* an announcement habit but to make it a 1-command step instead of a deliberation each time.
**Severity:** low.
**Effort:** 30 minutes.

### Gap 13 — License compliance is fine but unaudited per file

`LICENSE` exists (MIT, 2026, Luis Navarro). `package.json#license: "MIT"`. `CITATION.cff#license: MIT`. `THIRD_PARTY.md` proactively documents the LGPL `python-stdnum` boundary. The only soft gap: source files do not carry SPDX headers (`grep -E "SPDX|License-Identifier" src/index.ts src/core/types.ts` returns empty). This is *not* required for MIT compliance and many libraries skip it, but the REUSE specification (a widely-followed SPDX best practice) recommends it. For a library that wants to be cited and adopted in regulated industries (KYC, fintech) the SPDX header is a slight credibility lift.

**Fix:** optional — add a one-line SPDX header to every source file: `// SPDX-License-Identifier: MIT`. This can be auto-applied via a Biome rule or a one-time script and enforced in CI. Skip if maintainer prefers minimalism — the current state is fully compliant.
**Severity:** low — purely a polish/credibility lift.
**Effort:** 1 hour for the one-time script + CI rule.

### Gap 14 — `docs/GOVERNANCE.md` is not linked from README

`README.md:220-222` (the Contributing section) links to `CONTRIBUTING.md` but not to `GOVERNANCE.md`, `CODE_OF_CONDUCT.md`, or `SECURITY.md`. A reader who lands on README and wants to understand "who runs this, how decisions get made" has to guess. The links exist *inside* `CONTRIBUTING.md` (lines 7–10) but that is one click deeper than ideal.

**Fix:** rewrite README's Contributing section to four lines:

```markdown
## Contributing

- New to the codebase? Start with [CONTRIBUTING.md](./CONTRIBUTING.md) and pick a [good first issue](https://github.com/lu1tr0n/nationid/labels/good%20first%20issue).
- How decisions get made: [GOVERNANCE.md](./docs/GOVERNANCE.md).
- Community standards: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
- Found a vulnerability? See [SECURITY.md](./SECURITY.md) — do not open a public issue.
```

**Severity:** medium — affects first-impression for an evaluator skimming README in 90 seconds.
**Effort:** 5 minutes.

### Gap 15 — Branch protection on `main` is off

`gh api repos/lu1tr0n/nationid/branches/main/protection` returns `404 Branch not protected`. Solo-maintainer realities make this defensible (the maintainer needs to be able to push hotfixes without a second approver), but the choice is *invisible*: an evaluator running scorecard tools will flag `main` as unprotected and conclude lower maturity.

**Fix:** enable minimum branch protection that does not block solo work: require status checks to pass (CI, CodeQL), disallow force-pushes, disallow deletion. Skip "require pull request" since solo maintainers legitimately push to main for hotfixes — but document the choice explicitly. Add a short note to `docs/GOVERNANCE.md` post-1.0 section: "Branch protection is intentionally minimal pre-1.0 to allow hotfix velocity; required reviews will be enabled when 2+ maintainers join."
**Severity:** medium — affects supply-chain scorecard ratings even if substantively low risk.
**Effort:** 10 minutes.

## Ranked priority list (top 12)

Ordered by *return per hour of maintainer time*. All items are non-breaking.

1. **Fix broken cross-links (Gap 1)** — 30 min. The SECURITY.md 404 to `PII_GUIDANCE.md` and the CONTRIBUTING.md 404 to `docs/CONTRIBUTING.md` are the single most damaging artifact-consistency issues. Worst possible doc to break is the security policy.
2. **Enable Discussions + fix the contact-link 404 (Gap 2)** — 15 min. Unlocks Q&A category, makes the existing issue-template routing functional, lays groundwork for release announcements (Gap 12).
3. **Enable Dependabot security updates + delete branch on merge + disable Wiki (Gap 10)** — 3 min. Three GitHub settings, real security uplift on the first.
4. **Update repo description and topics (Gap 9)** — 5 min. Single biggest first-impression lift; current description undersells the library by 60% of its surface.
5. **Promote GOVERNANCE / CoC / SECURITY links to README (Gap 14)** — 5 min. Free credibility for evaluators.
6. **Create `good first issue` label and seed 5–8 starter issues (Gap 4)** — 1 hour. The single highest-impact lever for first regular contributor.
7. **Enable minimum branch protection on `main` (Gap 15)** — 10 min. Free scorecard lift; document the choice in GOVERNANCE.md.
8. **Wire FUNDING.yml or delete it (Gap 3)** — 15–60 min depending on Sponsors setup. Resolves a visible indecision signal.
9. **Add Maintenance / bus-factor section to README (Gap 8)** — 15 min. Converts a silent liability into a funding/governance ask.
10. **Add "Translating the README" section to docs/I18N.md (Gap 5)** — 30 min. Catches a real future-contributor question already implied by the trilingual README.
11. **Stand up a GitHub Project for the roadmap or seed pinned roadmap issues (Gap 7)** — 20–60 min. Makes the existing roadmap a navigable artifact.
12. **Write `docs/RELEASE_PROCESS.md` (Gap 12)** — 30 min. Future-self memory + future-co-maintainer onboarding artifact; first announcement habit.

**Items 1–5 combined ≈ 60 minutes** and constitute a credible single-evening sprint that takes community posture from 7.5 to ~8.5.

**Items 1–12 combined ≈ 1 working day** and take the project to roughly 9.0.

Out-of-band / nice-to-haves (Gaps 6, 11, 13) are explicitly not in the top 12 — they are absorbed by other fixes or are stylistic.

## Anti-patterns to avoid

The audit deliberately does **not** propose any of the following, because each is incompatible with solo-maintainer realities or would create ceremony that cannot be sustained:

- **Mandating multi-reviewer policy now.** Branch protection that requires reviewers is appropriate at 2+ maintainers, not at 1. The current CODEOWNERS file (already routing to `@lu1tr0n`) is sufficient.
- **Standing up a Discord / Slack now.** A chat channel with the maintainer as the only active member is worse than no chat channel. Defer until there is sustained Discussions traffic.
- **Promising a public office-hours / live triage schedule.** Solo maintainers should under-promise; the existing SECURITY.md SLA (3-day acknowledgement, 7-day initial assessment) is calibrated correctly and replicable. Avoid adding more.
- **Setting up a Code Climate / Codacy / SonarCloud / etc. third-party governance dashboard.** Adds another credential to manage, another bot to ignore, another email channel. The OSSF Scorecard workflow already lives in the repo; that is enough.
- **Requiring a CLA.** For an MIT library with country contributions, a Developer Certificate of Origin signoff is enough if anything is needed at all. CLAs raise barrier-to-contribution and signal corporate paranoia.
- **Translating ADRs / GOVERNANCE.md / CONTRIBUTING.md to Spanish and Portuguese.** READMEs are translated because they are the cover page. Governance documents are read by *contributors*, who can read English. Translating them creates a maintenance burden the project cannot service.
- **Creating a Code Owners team / Outside Collaborators / Triage role.** Premature org structure. CODEOWNERS as-is supports the transition when it actually happens.
- **Auto-closing stale issues.** With 4 open issues and weekly maintainer presence, stale-bots are theatre. Revisit at >50 open issues.
- **Setting up an Open Collective / Polar fiscal host.** GitHub Sponsors is sufficient infrastructure for the current scale. Add only when sponsorship revenue justifies the operational overhead.
- **Adding emoji-react contribution recognition / all-contributors bot.** Solo maintainer can credit by hand in CHANGELOG (which CONTRIBUTING.md:117 already commits to). Bots that maintain a contributor table are net-negative until ~20 regular contributors.

## Bottom line

`nationid` is unusually well-equipped on the governance dimension for a two-week-old single-maintainer project: the SECURITY.md, ADRs, GOVERNANCE.md, opinionated issue templates, and THIRD_PARTY.md are *better* than most npm packages with 10x the download count. The score of 7.5 is a function of two specific issues — **broken internal cross-references that 404 the contribution path** (Gap 1) and **Discussions linked but not enabled** (Gap 2) — plus a cluster of small misalignments between what the docs claim and what the GitHub repo settings actually expose (Gaps 9, 10, 15).

The smallest credible upgrade is the **60-minute Tier-1 sprint** (Gaps 1, 2, 9, 10, 14 + branch protection): fix the doc links, enable Discussions, update the repo description and topics, promote governance links to README, enable Dependabot security updates and minimum branch protection. Net result is a project that scans as 8.5/10 on every external evaluator's quick pass, with zero behavior change in the library.

The next plateau — getting to genuine community-OSS posture at 9+ — requires **a one-day investment**: standing up `good first issue` curation with 5–8 seeded starter issues (Gap 4), wiring or removing FUNDING.yml (Gap 3), the bus-factor section in README (Gap 8), and the roadmap Project (Gap 7). After that, the next step is structurally *not* more documentation — it is landing the first community PR, learning from where the contributor got stuck, and iterating on CONTRIBUTING.md from real friction rather than imagined friction.

Until then, every gap above is fixable in additive form, with no breaking changes to the library and no commitments the maintainer cannot keep.
