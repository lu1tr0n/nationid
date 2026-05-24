# v1.0 release plan — synthesis of 6 audits

**Date:** 2026-05-21 · **Baseline:** v0.6.0 · **Target:** v1.0.0

## Audit verdicts in one table

| Area | Verdict | Effort to v1.0 bar |
|---|---|---|
| API surface (01) | ✅ substantially ready (5 polish Qs, 2 doc-only) | ~1h |
| TS inference (02) | ⚠️ 5/10 — 161 dead casts + missing narrowing | ~4h mechanical + 1 design |
| JSDoc (03) | ⚠️ 15.1% coverage — heavy work | ~8h focused |
| Bundle (04) | ⚠️ root entry has 14× tax — sourcemaps 73% of tarball | ~2h optimization |
| Test coverage (05) | ✅ 96.45% line — 2 micro-fixes (mod11 tests + RFC clock) | ~30min |
| Confidence (06) | ✅ 58/60 high verified — 2 demote (CA/ES passport) + README rewording | ~15min |

Total estimated work: **~16 hours** for v1.0-ready. Spread across waves with parallel agents → ~6-8h wallclock.

## Breaking changes window

Bumping to 1.0.0 lets us batch documented breakings now. Three intentional minor breaks:

1. **`mask()` asymmetry fix (Q3 from 01)** — currently `lastN`/`hash` accept unknown codes without throwing while `mask` throws. Align: all 3 throw on unknown code. Migration: catch the error, or check with `getSpec(code)` first.
2. **`./*` resolution deny (Q5 from 01)** — add `"./*": null` to package.json exports to prevent users importing from non-documented subpaths like `nationid/core/normalize`. Defensive.
3. **Confidence demotes** — `CA_PASAPORTE` and `ES_PASAPORTE` move from `high` to `moderate`. Behaviour unchanged (informational), but users reading the field for trust decisions notice.

Everything else is non-breaking polish.

## Execution plan (3 waves)

### Wave A — Docs + low risk (parallel)
- A1: JSDoc for root API + algorithms + extract + pii + i18n + catalog (agent typescript-specialist or technical-writer)
- A2: JSDoc bulk pass for 34 country barrels (parallel agent, split in 2 if needed)
- A3: README refresh (22 → 34 countries, v1.0 confidence claim rewording, root-vs-subpath import guidance)
- A4: TypeDoc `entryPoints` expansion (add extract/pii/i18n/catalog) + `notDocumented: true` for CI
- Test gate: `pnpm test` from repo root must stay green (no source changes that could break)

### Wave B — TS types + bundle (parallel)
- B1: Delete 161 dead `as DocumentTypeCode` + 6 `as unknown as number[]` casts (mechanical agent)
- B2: Constrain `extract` helpers via mapped types over `SUPPORT_TABLE` (agent typescript-specialist)
- B3: Switch 34 country bundles from `: CountryDocumentBundle` to `as const satisfies CountryDocumentBundle`
- B4: Parametrize `parse()` and `getSpec()` over `<C extends DocumentTypeCode>` for narrowing
- B5: tsup `sourcemap: false` (zero-risk)
- B6: Refactor `extract/pii/catalog` internals to bypass root `getSpec` (90% bundle reduction)
- Test gate: `pnpm test` from repo root + `pnpm typecheck` + bundle measure (must shrink, not grow)

### Wave C — Intentional breaking + governance
- C1: `mask()` asymmetry fix — throw on unknown code from `lastN`/`hash`
- C2: `"./*": null` in package.json exports
- C3: CA_PASAPORTE + ES_PASAPORTE demote `high` → `moderate`
- C4: New `tests/governance/confidence-citations.test.ts` (fails CI if "high" lacks issuer URL)
- C5: New `tests/algorithms/mod11.test.ts` (close 47% → ~95% coverage gap)
- C6: Inject clock into `src/extract/mx/rfc.ts` to kill 2056 time bomb
- Test gate: full `pnpm test` from repo root + `pnpm test:coverage` (line ≥96%, branch ≥87%)

### Post-implement — release
- D1: MIGRATION.md v1.0 section (3 breaking changes documented with examples)
- D2: CHANGELOG.md major changeset entry
- D3: `pnpm build` + measure dist/ vs baseline (proves bundle improvement)
- D4: Branch `release/v1.0` → push → PR with full body
- D5: Wait for CI green
- D6: Manual review → merge → changeset bot release PR → merge → npm publish
- D7: Verify `npm view nationid@1.0.0` after publish
- D8: Update showcase repo if depended-on API touched
- D9: Bitácora Notion + memory update

## Tests-after-each-wave protocol

After each Wave:
1. `pnpm test` from the repo root (must pass)
2. `pnpm typecheck` (must pass)
3. `pnpm lint` (must pass)
4. If any of the 3 fail → STOP, fix, retry. Don't move to next Wave.

After Wave B + Wave C also:
5. `pnpm build` (must succeed, dist/ generated)
6. `pnpm test:dist` (smoke test against built artifact)

## Don't do in v1.0 (deferred)

- Mutation testing (Stryker) → v1.1
- Lazify REGISTRY at root (architectural change) → v1.1 or v2.0
- Property tests for mod11/luhn (already have fast-check infra) → v1.1
- React package (`@nationid/react`) → v1.1
- Asia coverage (IN/CN/JP/KR/...) → v1.1 or v2.0

## Confidence in plan

Each finding cited from the 6 audit reports under `docs/v1-audit/0[1-6]-*.md`. Effort estimates are anchored to LOC + file count from each audit, not guesses. Plan is conservative — could ship in fewer hours by skipping JSDoc bulk pass and accepting 15% coverage, but user explicitly said "API stability + audit" which implies a polished v1.0.
