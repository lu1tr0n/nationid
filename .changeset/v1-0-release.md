---
"nationid": major
---

# v1.0 — API stability + cited confidence

Mark the public API as stable and ship the v0.6 → v1.0 polish from the
release audit. See `MIGRATION.md` §0 for breaking-change details and the
`docs/v1-audit/` reports for the full rationale.

## Breaking changes (3, all small)

- **`pii.mask` throws on unknown codes.** Aligns with `pii.hash` and
  `pii.lastN`. The previous soft fallback (returning `input` unchanged)
  is removed.
- **`package.json` `exports` denies undocumented subpaths** via
  `"./*": null`. Only the documented entries resolve. Importing from
  private internals like `nationid/core/normalize` is no longer permitted.
- **`CA_PASAPORTE` and `ES_PASAPORTE` confidence demote** from `"high"`
  to `"moderate"`. Runtime behaviour unchanged — informational only.

## Headline polish

- TypeScript inference: `parse()` and `getSpec()` now parametrize over
  `<C extends DocumentTypeCode>`. `parse("MX_CURP", x).code` infers the
  literal `"MX_CURP"`, not the 124-member union. Default type param keeps
  every existing `: DocumentSpec` / `: ParseResult` annotation working.
- `nationid/extract` helpers (`extractDOB`, `extractSex`, `extractRegion`)
  constrain their first argument to the codes that actually encode each
  kind, via mapped types over `SUPPORT_TABLE`. Autocomplete now offers
  only the relevant codes; passing an unsupported code is a compile error.
- Country bundles use `as const satisfies CountryDocumentBundle`. Per-
  country imports infer literal types (`mxBundle.country` is `"MX"`,
  not `CountryCode`).
- 161 dead `as DocumentTypeCode | as CountryCode | …` casts deleted
  across `src/countries/**`. 6 `as unknown as number[]` double casts
  deleted from the mod-11 country files. The defensive
  `(error as { kind: string })` cast in i18n removed.

## Bundle size

- `npm pack` tarball: **1.7 MB → 413 KB** (-76%).
- `unpacked` size: **11.5 MB → 2.7 MB** (-76%).
- `nationid/extract` subpath: 241 KB → 24 KB (-90% raw, -85% gzip).
- `nationid/pii` + `nationid/catalog` no longer transitively pull the
  root REGISTRY IIFE (architectural fix; full pii/catalog tree-shake
  deferred to v1.x because `mask`/`lastN`/`hash` accept any
  `DocumentTypeCode`).
- Source maps no longer shipped to npm. Available in GitHub releases if
  needed for downstream debugging.

## New tests

- `tests/algorithms/mod11.test.ts` — direct unit coverage for
  `mod11WeightedSum` and `cycleWeights` (closes 47% → 95% coverage gap).
- `tests/extract/mx-rfc-clock.test.ts` — pins the RFC PF
  century-disambiguation behaviour across 2025/2055/2056/2057 via an
  injected `Clock` parameter. The 100-year wraparound is documented;
  consumers reading legacy data can now pin a historical "now".
- `tests/governance/confidence-citations.test.ts` — fails CI if any
  spec declaring `confidence: "high"` lacks a first-party citation
  (issuer-TLD URL or recognized legal statute) in its JSDoc header.

## What did NOT change

- Public function signatures for `validate`, `format`, `normalize`.
- Country bundle shapes and contents.
- 34 country subpaths and their entry points.
- All three locale bundles (`en`, `es`, `pt`).
- Runtime behaviour of every validator, formatter, and parser.
