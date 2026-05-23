# v1.1 Quality Roadmap — Supply chain & security standards

> Read-only audit of `nationid@1.1.0` against modern OSS supply-chain standards
> (SLSA, OpenSSF Best Practices, Scorecard, Sigstore, SBOM, reproducible
> builds). Counterpart to `01-community-governance.md`. Runtime input safety,
> ReDoS, `pii.hash` timing, and NFC handling are covered in the v1.1 functional
> audit (`docs/v1.1-functional-audit/`) and are not duplicated here.

## Current score: 7.5 / 10

For a two-week-old solo-maintainer npm package, the supply-chain posture is
already top decile: SHA-pinned actions, least-privilege workflow tokens,
weekly CodeQL `security-and-quality`, grouped Dependabot, MIT, zero runtime
dependencies, GHSA wired with a 3-day SLA, repo-level secret scanning + push
protection, and — the load-bearing achievement — every npm publish carries a
Sigstore-Fulcio-signed **SLSA Provenance v1** attestation re-verifiable via
`npm audit signatures`. Tarball is co-signed by the npm registry
(`keyid SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`, two attestations
on file at `registry.npmjs.org/-/npm/v1/attestations/nationid@1.1.0`: npm
publish v0.1 + slsa.dev/provenance/v1).

The live OpenSSF [Scorecard score is **6.8 / 10**](https://api.securityscorecards.dev/projects/github.com/lu1tr0n/nationid)
at commit `05771ec` (2026-05-22). Aggregate is dragged down by three checks
at 0 for fixable, not substantive, reasons:

- **Branch-Protection 0/10** — the existing ruleset only blocks `deletion` +
  `non_fast_forward`. No required reviews, status checks, or signed-commits.
- **Code-Review 0/10** — 0/3 approved changesets (solo self-merge).
- **CII-Best-Practices 0/10** — not registered on `bestpractices.dev`
  (verified empty: `bestpractices.dev/projects.json?q=nationid` → `[]`).

Every other Scorecard signal is 9 or 10. Two checks return `-1` (Packaging,
Signed-Releases) because the heuristic doesn't see the changesets pattern —
the package is in fact signed and published. The cheapest path to a credible
**8.5+ Scorecard** is: register at `bestpractices.dev` (~1 hour), add a real
branch ruleset (~15 min), attach SBOM + tarball + `.sha256` to GH Releases
(one new job). Past that, the remaining gaps are SLSA L3 claim documentation
and migration from `NPM_TOKEN` to npm Trusted Publishing (OIDC) — the latter
is the single most consequential change in this whole audit.

---

## Achievements to preserve

Verified by reading the file paths listed; each is easy to regress in a
careless refactor.

- **Sigstore SLSA provenance on every publish.** `package.json:319-321`
  (`publishConfig.provenance: true`) + `release.yml:22` (`id-token: write`).
  `npm view nationid dist`:
  `attestations.provenance.predicateType = https://slsa.dev/provenance/v1`,
  registry signature present.
- **SHA-pinned actions across all workflows.** Scorecard: 15/15 GH-owned +
  5/5 third-party. Spot-checked: `actions/checkout@de0fac2e…` (v6.0.2),
  `setup-node@48b55a01…` (v6.4.0), `pnpm/action-setup@739bfe42…` (v6.0.7),
  `changesets/action@63a615b9…` (v1.8.0), `github/codeql-action@68bde559…`
  (v4.35.4), `ossf/scorecard-action@4eaacf05…` (v2.4.3). The `# vN.N.N`
  comment beside each SHA is what lets Dependabot bump it without losing
  the human anchor.
- **Least-privilege `permissions:` everywhere.** `ci.yml:9`
  `contents: read`. `codeql.yml:11-23` `contents: read` + per-job
  `security-events: write`. `docs.yml:8-11` `contents: read, pages: write,
  id-token: write`. `release.yml:9-22` `contents: read` top + per-job
  `contents: write, pull-requests: write, id-token: write` with an inline
  comment explaining each. `scorecard.yml:10` `permissions: read-all`
  (correct for that action's needs).
- **CodeQL `security-and-quality` weekly + on push.** `codeql.yml:8-9` cron
  `0 6 * * 1` + push + PR. The `security-and-quality` query pack (line 37)
  is the wider pack — 200+ JS/TS queries beyond default.
- **Dependabot grouped weekly.** `.github/dependabot.yml:14-18` separates
  dev vs prod deps; `America/El_Salvador` timezone (line 9) lands PRs at
  6am local. PR limit 5 per group.
- **`secret_scanning + push_protection` enabled.** Verified via
  `gh api repos/lu1tr0n/nationid`:
  `secret_scanning.status = enabled`,
  `secret_scanning_push_protection.status = enabled`. GitHub refuses pushes
  containing known-format secrets before they hit the remote.
- **Zero runtime dependencies.** `package.json:295-314` lists 16
  devDependencies and zero `dependencies`. Single biggest supply-chain risk
  reducer the project has — no transitive surface inherited by consumers.
- **`prepublishOnly: pnpm verify`.** `package.json:293` ensures lint +
  typecheck + test + build + dist-test pass before any publish, including
  a manual one from the maintainer's laptop. Last-line defence against
  compromised CI.
- **Signed commits already in use.** `git log --show-signature` confirms
  every recent commit (incl. `github-actions[bot]` release commits) is
  GPG-signed (RSA key `B5690EEEBB952194`). Maintainer is already doing the
  work — Gap 4 just enforces it at the rule level.
- **Repo ruleset blocks `deletion` + `non_fast_forward`.** Stolen PAT
  cannot silently delete or force-push `main`. See Gap 4 for how to
  strengthen without breaking the solo workflow.

---

## OpenSSF Scorecard — current state (verified live)

Pulled from `api.securityscorecards.dev` for commit `05771ec` on 2026-05-22.

| Check                    | Score | Why                                                                                          | Fix |
|--------------------------|------:|----------------------------------------------------------------------------------------------|-----|
| Pinned-Dependencies      |    10 | 15/15 GH-owned + 5/5 third-party pinned                                                      | Keep |
| Token-Permissions        |    10 | All workflows declare `permissions:` top + per-job                                           | Keep |
| Dependency-Update-Tool   |    10 | Dependabot @ `.github/dependabot.yml:1`                                                      | Keep |
| Security-Policy          |    10 | `SECURITY.md` w/ disclosure + timelines                                                      | Keep |
| Binary-Artifacts         |    10 | No binaries committed (`.gitignore`/`.gitattributes` clean)                                  | Keep |
| License                  |    10 | MIT, OSI-recognized                                                                          | Keep |
| Fuzzing                  |    10 | `tests/property/*.test.ts` counted as TypeScriptPropertyBasedTesting                         | Keep; consider Gap 7 |
| Dangerous-Workflow       |    10 | No `pull_request_target` + checkout-untrusted, no script injection                           | Keep |
| Vulnerabilities          |     9 | 1 advisory `GHSA-jxxr-4gwj-5jf2` (transitive dev-only)                                       | Track upstream |
| SAST                     |     9 | CodeQL configured; 25/30 commits scanned                                                     | Required check (Gap 4) |
| CI-Tests                 |     6 | 9/13 merged PRs had CI checks (early Dependabot auto-merges)                                 | Required check (Gap 4) |
| Maintained               |     0 | Repo < 90 days old                                                                           | Time gate (auto on 2026-08-08) |
| **Branch-Protection**    | **0** | No protection rule on `main`                                                                 | **Gap 4** |
| **Code-Review**          | **0** | 0/3 approved changesets (solo self-merge)                                                    | **Gap 4** |
| **CII-Best-Practices**   | **0** | Not registered at `bestpractices.dev`                                                        | **Gap 1** |
| Contributors             |     0 | <2 contributing orgs                                                                         | By design (solo) |
| Packaging                |    -1 | Heuristic missed the changesets-publish pattern                                              | Gap 3 |
| Signed-Releases          |    -1 | Same heuristic — no GH Release assets to inspect                                             | Gap 3 |

Three of the four 0-scoring checks are real and fixable. Doing Gaps 1, 3,
and 4 lifts aggregate from **6.8 → ~9.0** by my arithmetic.

---

## OpenSSF Best Practices badge — current state

Not registered (verified). Reading the [Passing criteria](https://www.bestpractices.dev/en/criteria/0)
against the repo, **`nationid` would pass Passing today on registration**.
The form is ~67 questions, ~50 auto-answer from `README.md`, `LICENSE`,
`SECURITY.md`, `CONTRIBUTING.md`; the remaining 17 are 2-line free-text
quotable from the README.

Silver adds ~35 criteria. The only ones `nationid` does not currently
satisfy:

- **Reproducible-build documentation** — Gap 5.
- **Verifiable 2FA on all committers with write access** — for a personal
  repo this is unverifiable from the outside; mitigated by Gap 2 (Trusted
  Publishing makes the `NPM_TOKEN` automation-token 2FA-bypass moot).

Gold requires multi-party governance — unreachable for a solo project, by
design, not a gap.

---

## Gaps ranked by impact

### Gap 1 — Register on bestpractices.dev (CII badge)

**Standard:** OpenSSF Best Practices / Scorecard `CII-Best-Practices`.
**Severity:** medium (Scorecard 0 → 10).
**Effort:** ~1 hour. **Non-breaking.**

Single lowest-cost score lift in the audit. Visit
`https://www.bestpractices.dev/en/projects/new`, sign in with GitHub, set
project URL = `https://github.com/lu1tr0n/nationid`. Submit. Add the badge
URL to `README.md`, `README.es.md`, `README.pt.md` (i18n rule — all three
locales). Scorecard's next weekly run (Mon 06:30 UTC per `scorecard.yml:6`)
flips the check.

---

### Gap 2 — Migrate to npm Trusted Publishing (OIDC) — eliminate `NPM_TOKEN`

**Standard:** npm Trusted Publishing (GA 2025) / SLSA L3 "parameterless
build". **Severity:** high (only long-lived secret in the threat model).
**Effort:** ~30 min. **Non-breaking** — produces the same attestation.

`release.yml:56-57` passes `NPM_TOKEN` to changesets. That's an *automation*
token on the maintainer's npm account: bypasses 2FA, valid for years,
single-leak compromise = arbitrary `nationid` publish. Per project memory,
this migration was already intended.

Trusted Publishing replaces the token with a 5-minute OIDC token minted at
publish time, scoped to **one** package + **one** workflow file + **one**
repo. No long-lived secret.

**Fix.**
1. On `npmjs.com/package/nationid/access` → Trusted Publisher → Add →
   GitHub Actions; owner `lu1tr0n`, repo `nationid`, workflow `release.yml`,
   environment blank.
2. In `release.yml`: remove `NPM_TOKEN` + `NODE_AUTH_TOKEN` env entries
   (lines 56-57). Keep `id-token: write` (line 22).
3. Delete the `NPM_TOKEN` repo secret. Revoke the matching automation
   token at `npmjs.com/settings/<user>/tokens`.
4. Dry-run via `pnpm changeset --empty` + merge release PR.

**Verification.** `npm view nationid dist.attestations.provenance.predicateType`
still returns `https://slsa.dev/provenance/v1`. The provenance
`buildDefinition.externalParameters.workflow.path` is unchanged
(`.github/workflows/release.yml`); `internalParameters` now carries OIDC
issuer claims.

---

### Gap 3 — SBOM + tarball + `.sha256` as GitHub Release assets

**Standard:** NTIA SBOM minimum elements / SLSA L1+ provenance subject /
Scorecard `Signed-Releases`+`Packaging`. **Severity:** medium (B2B/gov
procurement signal; flips two Scorecard `-1`s positive). **Effort:** ~1
hour for the new job. **Non-breaking** — purely additive.

US EO 14028 and EU procurement processes increasingly require SBOM. Even
with zero runtime deps, *consumers* still need machine-readable "this is
exactly what is in the tarball".

**Fix.** Add steps to `release.yml` after `pnpm build`:

```yaml
- name: SBOM (CycloneDX)
  run: pnpm dlx @cyclonedx/cdxgen@^11 -o sbom.cdx.json -t npm .
- name: SBOM (SPDX)
  run: pnpm dlx @cyclonedx/cdxgen@^11 -o sbom.spdx.json -t npm --spec-version 2.3 --format spdx .
- name: Attest SBOM (Sigstore)
  uses: actions/attest-sbom@<sha>  # pin
  with:
    subject-path: dist/index.js
    sbom-path: sbom.cdx.json
```

Then a follow-up job conditioned on the changesets `published` output
that runs `pnpm pack`, `sha256sum nationid-*.tgz > *.sha256`, and
`softprops/action-gh-release@<sha>` uploads tarball + sha256 + both
SBOMs to the release.

**Verification.** `gh release view v1.2.0 --json assets` lists 4 files.
Scorecard `Signed-Releases`+`Packaging` flip from `-1` to positive.

---

### Gap 4 — Branch-protection ruleset (required reviews + signed commits + required checks)

**Standard:** Scorecard `Branch-Protection`+`Code-Review`. **Severity:**
medium (two 0-scores → ~8/10 simultaneously). **Effort:** ~15 min via
`gh api`. **Non-breaking** — solo workflow uses admin-bypass-but-logged.

Current ruleset `16148027` only blocks `deletion`+`non_fast_forward`. A
compromised PAT with `repo` scope can push directly to `main` without any
CI running.

**Fix.** Update ruleset to add:

- `required_signatures: true` (already happening; just enforce).
- `pull_request`: `required_approving_review_count: 1`,
  `dismiss_stale_reviews_on_push: true`, `require_code_owner_review: true`
  (CODEOWNERS routes to `@lu1tr0n` — Scorecard rewards this once 30 days
  of merge history under the rule accumulate).
- `required_status_checks` (`strict: true`): ubuntu/macos/windows × Node
  22, ubuntu × Node 24, CodeQL `Analyze (javascript-typescript)`.
- Keep `deletion`+`non_fast_forward`.

For the solo workflow set `current_user_can_bypass: pull_requests` so the
admin can bypass *review* but **not** signed-commits or required-checks;
every bypass is in the audit log.

**Verification.** `gh api repos/lu1tr0n/nationid/branches/main/protection`
returns 200 instead of 404. Unsigned-commit push to `main` is rejected.
Scorecard next run flips both checks.

---

### Gap 5 — Reproducible-build documentation + verification

**Standard:** reproducible-builds.org / SLSA L3 "hermetic / parameterless"
/ OpenSSF Silver gate. **Severity:** medium. **Effort:** ~2 hours.
**Non-breaking.**

Likely-deterministic given `tsup.config.ts:53-83` uses no timestamps, no
random IDs, `sourcemap: false`. `.gitattributes:8-9` forces LF so Windows
CRLF doesn't break repro. Unknown: esbuild ordering across patch versions
of `tsup ^8.3.0`. Verify before claiming:

```bash
# Machine A and Machine B both:
git checkout v1.1.0
corepack enable && corepack use pnpm@9
pnpm install --frozen-lockfile
pnpm build
find dist -type f \( -name '*.js' -o -name '*.cjs' -o -name '*.d.ts' \) | xargs sha256sum | sort > build.hashes
```

If `build.hashes` matches byte-for-byte across two machines, document the
recipe in `docs/REPRODUCIBLE-BUILD.md` and link from `README.md` +
`SECURITY.md` ("Supply-chain hardening" section, already on line 53).
Optionally add a CI job that builds twice on the same runner and asserts
identical hashes — catches non-deterministic regressions.

---

### Gap 6 — Enable Dependabot security updates

**Standard:** Scorecard `Dependency-Update-Tool` (already 10/10 for the
*tool* config; this is the separate setting for CVE-triggered auto-PRs).
**Severity:** low (mitigated today by weekly Dependabot + prompt review).
**Effort:** 1 click. **Non-breaking.**

`gh api repos/lu1tr0n/nationid | jq .security_and_analysis.dependabot_security_updates.status`
returns `"disabled"`. Settings → Security → "Dependabot security updates"
→ Enable. Independent of `.github/dependabot.yml`; creates PRs only when a
direct or transitive dep ships a CVE patch.

---

### Gap 7 — Native fuzzing (`@jazzer.js/core`) for extractor + regex paths

**Standard:** OpenSSF Scorecard `Fuzzing` (already 10/10 via fast-check —
this gap is real coverage, not score). **Severity:** low-medium.
**Effort:** ~4 hours. **Non-breaking.**

The v1.1 functional audit covers ReDoS statically; runtime fuzzing finds
what static analysis misses. The extractor at `src/extract/` is the prime
target — it walks arbitrary input applying *all* country regex patterns,
worst-case pathological-input scenario.

```typescript
// tests/fuzz/extract.fuzz.ts
import { FuzzedDataProvider } from '@jazzer.js/core';
import { extract } from '../../src/extract';

export function fuzz(data: Buffer) {
  const p = new FuzzedDataProvider(data);
  const input = p.consumeString(p.consumeIntegralInRange(0, 4096));
  const t0 = performance.now();
  try { extract(input); } catch { /* validation errors expected */ }
  if (performance.now() - t0 > 50) {
    throw new Error(`Slow extract: input len ${input.length}`);
  }
}
```

CI: 60s/harness on PR, 10min/harness weekly. Per-country harnesses follow
the same pattern. Crashes → issue with input as reproducer.

---

### Gap 8 — Document SLSA Build Level 3 claim + consumer verification recipe

**Standard:** SLSA v1.0 Build L3. **Severity:** low (substance present,
documentation absent). **Effort:** ~30 min. **Non-breaking.**

`nationid` is *substantively* at SLSA Build L3:

| L3 requirement                                                      | Status |
|---------------------------------------------------------------------|:------:|
| Provenance generated (`slsa.dev/provenance/v1` predicate)           |   ✓   |
| Hosted, isolated, ephemeral build runners                           |   ✓ (GH-hosted) |
| Provenance unforgeable from build platform                          |   ✓ (Sigstore Fulcio + Rekor) |
| Parameterless / no user-injected input                              |   ✓ (no `pull_request_target` + checkout-untrusted) |
| Build script identity in provenance (workflow SHA)                  |   ✓ |
| Verifiable by consumer                                              |   ✗ (Gap) |

**Fix.** Append to `SECURITY.md` under "Supply-chain hardening":

```markdown
### SLSA Build Level 3

`nationid` releases meet [SLSA Build L3](https://slsa.dev/spec/v1.0/levels#build-l3):
hosted ephemeral runners; the release workflow accepts no untrusted input
(only `push: branches: [main]`); all actions SHA-pinned + Dependabot-bumped;
provenance names the exact workflow + commit SHA + Node version.

Verify with `npm audit signatures` or
`npx slsa-verifier verify-npm-package nationid-1.1.0.tgz --builder-id github`.
```

L4 ("two-party review of build script changes") is unreachable for a solo
project — by design, not a gap.

---

### Gap 9 — Pin `pnpm dlx` / `npx` invocations introduced by new workflow steps

**Standard:** Scorecard `Pinned-Dependencies` (currently covers Actions
only; npm-CLI surface is the next frontier). **Severity:** low.
**Effort:** 5 min per workflow.

When implementing Gap 3, prefer `pnpm dlx @cyclonedx/cdxgen@^11` over
`npx --yes @cyclonedx/cdxgen@latest`. Better yet, `pnpm add -D
@cyclonedx/cdxgen` and run via `pnpm exec cdxgen` — that pins the
exact version through the lockfile. `latest`-tag in a workflow lets a
compromised future cdxgen release pollute the SBOM at release time.

---

## Path to OpenSSF Silver

| Silver gate                                                  | Status | Fix |
|--------------------------------------------------------------|:------:|-----|
| CII Passing badge                                            |   —    | Gap 1 |
| 2FA on all committers with write access                      |   ?    | Verify; Gap 2 makes the npm side moot |
| All commits cryptographically signed                         |   ✓    | Enforce via Gap 4 |
| Documented governance per role                               |   ✓    | `GOVERNANCE.md` |
| Documented secure-coding processes                           |   ✓    | `CONTRIBUTING.md` + `SECURITY.md` |
| Static analysis                                              |   ✓    | CodeQL `security-and-quality` |
| Dynamic analysis OR memory-safe language                     |   ✓    | TypeScript + fast-check |
| Test coverage > 80%                                          |   ✓    | `pnpm test:coverage` |
| Vuln-handling process documented                             |   ✓    | `SECURITY.md` |
| Reproducible-build documentation                             |   ✗    | Gap 5 |
| Critical vulns patched within 60 days                        |   ✓    | Dependabot weekly + manual review |

**Realistic Silver in one quarter** if Gaps 1, 2, 4, 5 ship.

---

## Top 10 recommendations

1. **Register on bestpractices.dev** — 1h, +0.4 Scorecard, badge in 3
   READMEs *(Gap 1)*.
2. **Migrate to npm Trusted Publishing** — 30m, eliminates the only
   long-lived secret in the threat model *(Gap 2)*.
3. **Branch-protection ruleset (required reviews + signed commits +
   required checks)** — 15m, +1.6 Scorecard (two 0s flip) *(Gap 4)*.
4. **SBOM (CycloneDX + SPDX) + tarball + `.sha256` on GH Releases** —
   1h, B2B/gov procurement signal *(Gap 3)*.
5. **Document + verify reproducible build** — 2h, Silver gate *(Gap 5)*.
6. **Enable Dependabot security updates** — 1 click *(Gap 6)*.
7. **Native fuzzing via `@jazzer.js/core` for `extract/` + per-country
   regex paths** — 4h, real security coverage *(Gap 7)*.
8. **Document SLSA L3 claim + `slsa-verifier` recipe in `SECURITY.md`** —
   30m *(Gap 8)*.
9. **Prefer `pnpm exec` (lockfile-pinned) over `pnpm dlx`/`npx --yes` in
   any future CI step** — 5m *(Gap 9)*.
10. **Mirror every README change across `es`/`en`/`pt`** — i18n rule;
    applies to the badge insertion in Gap 1.

Doing 1-6 lifts Scorecard **6.8 → ~9.0** and gets the project to
**OpenSSF Silver candidate** in a weekend.

---

## Bottom line

`nationid@1.1.0` is already top decile for supply-chain hygiene: SLSA
provenance-attested publishes, signed commits, SHA-pinned actions,
least-privilege workflow tokens, secret scanning + push protection, zero
runtime deps, weekly CodeQL + Scorecard + Dependabot, an exemplary
`SECURITY.md`, and a `prepublishOnly` gate. The Scorecard **6.8**
undersells the posture because three high-leverage checks
(Branch-Protection, Code-Review, CII-Best-Practices) are at 0 for fixable
reasons rather than substantive gaps.

The cheapest path to "fintech-grade" credibility is the ordered list
above: a weekend of work lifts the project to OpenSSF Silver candidate,
SLSA L3 documented, Scorecard 9+, zero long-lived publish secrets.
**The single most important change** is **Gap 2 — Trusted Publishing**:
removing the long-lived `NPM_TOKEN` is the only fix in this audit with
a non-cosmetic impact on the worst-case incident scenario.
