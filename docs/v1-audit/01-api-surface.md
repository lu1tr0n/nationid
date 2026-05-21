# v1.0 audit — API surface

> Source-of-truth: `package.json@0.6.0` `exports` field, all 44 entries verified
> against `src/`. Audited 2026-05-20 against `main`. Read-only audit; no source
> file was modified during this pass.

## Summary

| Bucket | Count |
|---|---|
| Total subpath entries in `package.json` `exports` | 44 |
| Stable at v1.0 (KEEP) | 43 functional + 1 `./package.json` |
| To make internal before v1.0 (BREAKING) | 0 |
| Already deprecated, remove at v1.0 (BREAKING) | 0 |
| Open questions | 5 |

The library has **zero `@deprecated`, `@internal`, `@experimental`, `@beta`, or
`@alpha` JSDoc tags anywhere in `src/`**. Every public subpath maps cleanly to
a `src/<area>/index.ts` and every re-export from those barrels is intentional.
The 44 exports break down as:

- 1 root (`.`) → `src/index.ts`
- 1 algorithms (`./algorithms`) → `src/algorithms/index.ts`
- 34 country subpaths (`./<cc>`) → `src/countries/<cc>/index.ts`
- 1 extract (`./extract`) → `src/extract/index.ts`
- 1 pii (`./pii`) → `src/pii/index.ts`
- 1 i18n core (`./i18n`) → `src/i18n/index.ts`
- 3 i18n locales (`./i18n/{es,en,pt}`) → `src/i18n/locales/{es,en,pt}.ts`
- 1 catalog (`./catalog`) → `src/catalog/index.ts`
- 1 package.json passthrough (`./package.json`)

Total = 1 + 1 + 34 + 1 + 1 + 1 + 3 + 1 + 1 = **44**. No discrepancy.

## Public exports map

### Root + cross-cutting

| Subpath | Source | Status v1.0 | Notes |
|---|---|---|---|
| `nationid` | `src/index.ts` | KEEP | Core registry API. 6 functions (`validate`, `normalize`, `format`, `parse`, `getSpec`, `listSupportedCodes`, `listSupportedCountries`) + 8 type re-exports from `core/types.ts`. |
| `nationid/algorithms` | `src/algorithms/index.ts` | KEEP | Pure math primitives: `mrzCharValue`, `mrzCheckDigit`, `toMrzField9`, `validateMrzNumber`, `luhnValid`, `luhnCheckDigit`, `mod11WeightedSum`, `cycleWeights`. Documented as a tree-shakable subpath. |
| `nationid/extract` | `src/extract/index.ts` | KEEP | 4 fns (`supports`, `extractDOB`, `extractSex`, `extractRegion`) + 4 types (`DateOfBirth`, `ExtractKind`, `Region`, `Sex`). Switch-dispatched, never throws, returns `null` for unsupported. |
| `nationid/pii` | `src/pii/index.ts` | KEEP | 3 fns (`mask`, `lastN`, `hash`) + 2 types (`HashAlgorithm`, `HashOptions`). Internal helpers from `pii/mask.ts` (`applyMaskWithReveal`, `computeRevealCount`, `countPlaceholders`) are correctly NOT re-exported. |
| `nationid/i18n` | `src/i18n/index.ts` | KEEP | 2 fns (`getErrorMessage`, `getErrorTemplate`) + 1 type (`Locale`) + 2 consts (`SUPPORTED_LOCALES`, `DEFAULT_LOCALE`). |
| `nationid/i18n/es` | `src/i18n/locales/es.ts` | KEEP — see Q1 | 2 consts (`errors`, `neutralDocument`) + 1 type (`ErrorTemplates`). Importing the raw `errors` const lets callers bypass the locale-fallback logic in `getErrorMessage`; intentional for bundle-shaving but it locks in the shape of those constants. |
| `nationid/i18n/en` | `src/i18n/locales/en.ts` | KEEP — see Q1 | Same shape as `es`. |
| `nationid/i18n/pt` | `src/i18n/locales/pt.ts` | KEEP — see Q1 | Same shape as `es`. |
| `nationid/catalog` | `src/catalog/index.ts` | KEEP | 3 fns (`listDocuments`, `getDocumentInfo`, `listDocumentsByPurpose`) + 4 types (`DocumentInfo`, `DocumentPurpose`, `Locale`, `LocaleStrings`). |
| `nationid/package.json` | `package.json` | KEEP | Conventional Node ecosystem passthrough (bundlers, version detection). |

### Country subpaths (34)

Every country `index.ts` follows the same pattern: re-exports its `*Spec`
constants, exports `validate / format / normalize / parse` (overloaded to
accept both fully-qualified codes and short aliases), exports a `<CC>DocumentType`
type alias, and exports a `<cc>Bundle: CountryDocumentBundle`. Four countries
ship a documented extra helper.

| Subpath | Source | Spec exports | Extras | Status v1.0 |
|---|---|---|---|---|
| `nationid/sv` | `src/countries/sv/index.ts` | `duiSpec`, `nitSpec`, `passportSpec` | — | KEEP |
| `nationid/mx` | `src/countries/mx/index.ts` | `claveElectorSpec`, `curpSpec`, `nssSpec`, `passportSpec`, `rfcPfSpec`, `rfcPmSpec` | `INE` alias for `CLAVE_ELECTOR` in resolver | KEEP |
| `nationid/co` | `src/countries/co/index.ts` | `ccSpec`, `ceSpec`, `nitSpec`, `pasaporteSpec`, `pepSpec`, `pptSpec`, `tiSpec` | — | KEEP |
| `nationid/br` | `src/countries/br/index.ts` | `cnhSpec`, `cnpjSpec`, `cpfSpec`, `passportSpec`, `pisSpec`, `tituloEleitorSpec` | — | KEEP |
| `nationid/pe` | `src/countries/pe/index.ts` | `ceSpec`, `dniSpec`, `passportSpec`, `rucSpec` | — | KEEP |
| `nationid/ar` | `src/countries/ar/index.ts` | `cdiSpec`, `cuilSpec`, `cuitSpec`, `dniSpec`, `passportSpec` | — | KEEP |
| `nationid/cl` | `src/countries/cl/index.ts` | `passportSpec`, `rutSpec` | — | KEEP |
| `nationid/do` | `src/countries/do/index.ts` | `cedulaSpec`, `passportSpec`, `rncSpec` | — | KEEP |
| `nationid/gt` | `src/countries/gt/index.ts` | `dpiSpec`, `nitSpec`, `passportSpec` | — | KEEP |
| `nationid/hn` | `src/countries/hn/index.ts` | `dniSpec`, `passportSpec`, `rtnSpec` | — | KEEP |
| `nationid/cr` | `src/countries/cr/index.ts` | `cedulaFisicaSpec`, `cedulaJuridicaSpec`, `dimexSpec`, `passportSpec` | — | KEEP |
| `nationid/es` | `src/countries/es/index.ts` | `dniSpec`, `nieSpec`, `nifPjSpec`, `nussSpec`, `passportSpec` | — | KEEP |
| `nationid/us` | `src/countries/us/index.ts` | `einSpec`, `itinSpec`, `passportSpec`, `ssnSpec` | — | KEEP |
| `nationid/bo` | `src/countries/bo/index.ts` | `ciSpec`, `nitSpec`, `passportSpec` | — | KEEP |
| `nationid/ec` | `src/countries/ec/index.ts` | `cedulaSpec`, `passportSpec`, `rucSpec` | — | KEEP |
| `nationid/py` | `src/countries/py/index.ts` | `ciSpec`, `passportSpec`, `rucSpec` | — | KEEP |
| `nationid/ni` | `src/countries/ni/index.ts` | `cedulaSpec`, `passportSpec`, `rucSpec` | — | KEEP |
| `nationid/pa` | `src/countries/pa/index.ts` | `cedulaSpec`, `passportSpec`, `rucSpec` | — | KEEP |
| `nationid/uy` | `src/countries/uy/index.ts` | `ciSpec`, `passportSpec`, `rutSpec` | — | KEEP |
| `nationid/ca` | `src/countries/ca/index.ts` | `bnSpec`, `passportSpec`, `sinSpec` | `isTemporaryResidentSIN(input)` — see below | KEEP |
| `nationid/pt` | `src/countries/pt/index.ts` | `ccSpec`, `nifSpec`, `passportSpec` | `nifHolderType(input)` + `type NIFHolderType` — see below | KEEP |
| `nationid/ve` | `src/countries/ve/index.ts` | `cedulaSpec`, `passportSpec`, `rifSpec` | `rifHolderType(input)` + `type RIFHolderType` — see below | KEEP |
| `nationid/gb` | `src/countries/gb/index.ts` | `nhsSpec`, `ninoSpec`, `utrSpec`, `vatSpec` | — | KEEP |
| `nationid/fr` | `src/countries/fr/index.ts` | `nirSpec`, `sirenSpec`, `siretSpec`, `tvaSpec` | — | KEEP |
| `nationid/de` | `src/countries/de/index.ts` | `steuerIdSpec`, `steuernummerSpec`, `ustidSpec` | — | KEEP |
| `nationid/it` | `src/countries/it/index.ts` | `cfSpec`, `pivaSpec` | — | KEEP |
| `nationid/nl` | `src/countries/nl/index.ts` | `bsnSpec`, `btwSpec` | — | KEEP |
| `nationid/be` | `src/countries/be/index.ts` | `btwSpec`, `nrnSpec` | — | KEEP |
| `nationid/ch` | `src/countries/ch/index.ts` | `ahvSpec`, `mwstSpec`, `uidSpec` | — | KEEP |
| `nationid/pl` | `src/countries/pl/index.ts` | `nipSpec`, `peselSpec`, `regonSpec` | — | KEEP |
| `nationid/se` | `src/countries/se/index.ts` | `orgnrSpec`, `personnummerSpec`, `vatSpec` | — | KEEP |
| `nationid/no` | `src/countries/no/index.ts` | `dnrSpec`, `fnrSpec`, `mvaSpec`, `orgnrSpec` | — | KEEP |
| `nationid/dk` | `src/countries/dk/index.ts` | `cprSpec`, `cvrSpec`, `vatSpec` | `cprMod11Legacy(input)` — see below | KEEP |
| `nationid/fi` | `src/countries/fi/index.ts` | `hetuSpec`, `vatSpec`, `ytunnusSpec` | — | KEEP |

### Country-specific extras (intentional)

- `nationid/ca → isTemporaryResidentSIN(input: string): boolean`
  (`src/countries/ca/sin.ts:105`). Documented JSDoc. Returns whether the SIN's
  leading digit is `9` (temporary-resident range). Stable and well-scoped.
- `nationid/dk → cprMod11Legacy(input: string): boolean`
  (`src/countries/dk/cpr.ts:117`). Documented JSDoc. Returns the pre-2007
  mod-11 result. Not used by `validate()`. Useful for callers that want to
  flag pre-2007 numbers; stable.
- `nationid/pt → nifHolderType(input: string): NIFHolderType` + `type NIFHolderType`
  (`src/countries/pt/nif.ts:113-123`). Derives holder category from NIF
  prefix. The literal union has 8 members; adding members later is a
  potentially-breaking change (consumers that did exhaustive `switch`/`never`
  checks will start emitting warnings) — see Q2.
- `nationid/ve → rifHolderType(input: string): RIFHolderType` + `type RIFHolderType`
  (`src/countries/ve/rif.ts:126-135`). Same shape and same Q2 concern.

## Symbols to hide before v1.0

**None.** Every symbol re-exported through a published subpath is intentional.

Internal helpers that *exist* in `src/` but are NOT exposed (verified) include:

- `src/core/normalize.ts` — `stripAndUpper`, `stripNonDigits`, `allSameDigit`.
  Not in `tsup` entries, not in `package.json` `exports`. Internal-only.
- `src/core/types.ts` — only re-exported types are in `src/index.ts`. Module
  itself is not a subpath.
- `src/pii/mask.ts` — `applyMaskWithReveal`, `computeRevealCount`,
  `countPlaceholders`. Used internally by `pii/index.ts::mask` only.
- `src/extract/{ar,gt,mx,pe}/*.ts` — per-spec extractors. Reachable only via
  the `extract/index.ts` dispatchers.
- `src/countries/<cc>/<spec>.ts` per-spec source files — `co/shared.ts::computeDianDV`,
  `ar/shared.ts::computeCuitDV`, `ar/shared.ts::CUIT_PREFIXES / CUIL_PREFIXES / CDI_PREFIXES`,
  `no/orgnr.ts::checkOrgnr`, `no/fnr.ts::checkFnrDigits`. These are exported
  inside the file with `export const|function` (used by sibling tests and by
  the country index), but the per-spec file is not a tsup entry and has no
  subpath in `package.json`. Consumers cannot reach them via a documented import.
  No action required for v1.0.

> ⚠️ Caveat: a consumer *could* deep-import from `nationid/dist/.../shared.js`
> with a relative path-style import or by patching `exports`. That is outside
> the documented surface and would not be a SemVer commitment. The audit
> recommends adding a Node `exports` `"./*": null` line OR documenting
> explicitly in `README.md` that anything not listed in `package.json.exports`
> is internal — see Q5.

## Symbols to deprecate at v1.0 (mark, remove at v2.0)

**None.** No symbol in the current surface should ship to v1.0 already
deprecated. The repo has no pre-existing `@deprecated` tags either.

## SemVer red flags

Pre-v1.0 signature review across every public function. Findings:

### Hard blockers — none

No public function signature accepts or returns `any` or bare `unknown`.

The 6 `as unknown as number[]` casts found in `src/countries/{dk,fi,no}/...`
(`dk/cvr.ts:85`, `dk/cpr.ts:120`, `fi/ytunnus.ts:89`, `no/fnr.ts:116`,
`no/fnr.ts:121`, `no/orgnr.ts:89`) are local-only and feed into the internal
`mod11WeightedSum(digits, weights: ReadonlyArray<number>)` primitive. Public
signatures are unaffected. Cleanup is hygiene, not blocking.

### Soft notes

1. **`getSpec(code) throws on unknown code`** (`src/index.ts:132`). Documented
   in JSDoc. Every other public top-level function (`validate`, `normalize`,
   `format`, `parse`) calls `getSpec` synchronously and therefore inherits
   the throw. Since `DocumentTypeCode` is a string literal union, the throw
   only triggers when a JS caller (or a TS caller that has cast) passes
   something off-union. This is the same contract the catalog and pii
   helpers already document. **No change required**, but worth surfacing in
   the v1.0 README as the one documented exception.

2. **`hash()` is async and throws when `crypto.subtle` is missing**
   (`src/pii/hash.ts:46`). Engines field already requires Node ≥ 20. Safe.

3. **`mask()` returns the raw input unchanged when `code` is unknown**
   (`src/pii/index.ts:43`). Asymmetric with `lastN()` / `hash()` which call
   `getSpec()` and therefore throw on unknown code. Q3 below.

4. **Locale literal unions are open for additive growth**. Both `Locale` in
   `src/i18n/index.ts:24` (`"es" | "en" | "pt"`) and `Locale` in
   `src/catalog/types.ts:11` (same shape) are duplicated, not shared. Adding
   `"fr"` later in a minor would technically be additive but consumers who
   typed against one of the two `Locale` aliases will hit drift. Q4 below.

5. **No `satisfies` discipline on the `BUNDLES` array** (`src/index.ts:72`).
   The array is `ReadonlyArray<CountryDocumentBundle>`, which is fine, but
   if a new country bundle is added with a typo in `defaultPersonal`, the
   widening hides the bug at compile time. Recommend `satisfies
   ReadonlyArray<CountryDocumentBundle>` in v1.0 hygiene pass — does not
   affect public surface.

## Open questions for human input

1. **Q1 — i18n raw template subpaths**: Should `nationid/i18n/es` continue to
   expose the raw `errors` const, or hide it behind the helper API? Exposing
   it commits to keeping a `Record<ParseError["kind"], string>` shape forever.
   If `ParseError["kind"]` gains a new variant in v1.x, every `errors` const
   must grow that key in the SAME minor or we break consumers using the
   bare const. Recommendation: keep public (bundle-shaving win for SSR users),
   but add a doc note pinning the shape.

2. **Q2 — `NIFHolderType` / `RIFHolderType` open unions**: These holder-type
   string unions feel like they will grow. If someone does
   `switch (nifHolderType(x)) { case "...": ... default: assertNever(x); }`,
   adding a member is breaking for them. Two paths:
   - (a) Document the union as growable; consumers MUST handle a `default`.
   - (b) Add `"_future_"` placeholder or widen to `string`.
   Recommendation: (a) + add `@remarks This union is open and may grow in
   minor releases` to JSDoc.

3. **Q3 — `mask()` vs `lastN()`/`hash()` unknown-code asymmetry**:
   `mask(unknownCode, input)` returns `input` unchanged; `lastN`/`hash` throw
   via `getSpec`. Pick one contract for v1.0:
   - (a) All three throw → consistent with root API.
   - (b) All three soft-fall through → safer for "unknown code" paths.
   Current type signatures use `DocumentTypeCode` which TS narrows, so the
   asymmetry only matters when a string is cast. Recommendation: (a) — throw
   in `mask()` too, document in `MIGRATION.md`. Cheap breaking change to bundle
   into 1.0.

4. **Q4 — Duplicate `Locale` definitions**. `i18n` and `catalog` both define
   `export type Locale = "es" | "en" | "pt"`. They happen to match today.
   Either:
   - (a) Centralize in `core/types.ts` and re-export from both.
   - (b) Rename them to disambiguate (`I18nLocale`, `CatalogLocale`).
   Recommendation: (a). Re-exporting the same identifier name is non-breaking;
   it ensures both grow together when v1.x adds new locales.

5. **Q5 — Subpath enforcement**: Should `package.json.exports` add a sentinel
   `"./*": null` (Node ≥ 16 feature) to actively block `import "nationid/dist/..."`
   deep-import escape hatches? Currently nothing prevents
   `import { computeDianDV } from "nationid/dist/countries/co/shared.js"`.
   Recommendation: yes for v1.0 — turns the "internal" contract into one the
   resolver enforces, not just one we hope for. Low risk because all advertised
   subpaths are explicitly listed.

## Recommendation

v1.0 API surface is **substantially ready**. The pre-v1.0 freeze is a
high-confidence one because every single subpath is explicitly enumerated in
`package.json.exports`, every barrel only re-exports intentional symbols, and
there are no lifecycle JSDoc tags (`@internal` / `@deprecated` / `@experimental`)
to reconcile. There is **zero "breaking-removal" work** required to ship 1.0.

The minimum changes I recommend folding into the 1.0 release (low scope, all
hygiene + one cheap breaking align):

1. **Resolve Q3**: make `mask(unknownCode, input)` throw via `getSpec()` for
   consistency with `lastN` / `hash`. Bundle in `MIGRATION.md`. This is the
   single cheapest API alignment we can do "for free" while we still have the
   freedom of pre-1.0.
2. **Resolve Q4**: centralize `Locale` in `core/types.ts` (or a new
   `core/locale.ts`) and re-export from both `i18n/index.ts` and `catalog/index.ts`.
   Non-breaking when done with re-exports under the same name.
3. **Resolve Q5**: add `"./*": null` to `package.json.exports`. Cheap, enforces
   our internal/external contract via the resolver.
4. **Annotate Q1 and Q2** with `@remarks` JSDoc about union/shape stability.
   No code change, just docs.
5. **Hygiene pass** (not required for 1.0 correctness, recommended): delete
   the stale `TODO(v0.X-integration)` comments and the
   `as CountryCode | DocumentTypeCode | CountryDocumentBundle["…"]` casts in
   the v0.4/v0.5/v0.6 country files now that those code literals all live in
   `core/types.ts`. Replace the 6 `as unknown as number[]` casts in the
   mod-11 callers by typing the local `W` arrays as `readonly number[]` at
   their declaration site. Pure cleanup.

After 1, 2, 3, 4 the v1.0 surface is a documented, frozen contract that
matches what's already shipped. After 5 the source code matches the maturity
of that contract.
