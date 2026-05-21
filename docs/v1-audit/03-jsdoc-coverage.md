# v1.0 audit — JSDoc coverage

Audit date: 2026-05-20 · package version: `nationid@0.6.0`

Scope: every symbol exported from the public barrels — root `src/index.ts`, the
six subpath barrels (`algorithms`, `extract`, `pii`, `i18n`, `i18n/locales/*`,
`catalog`), and the 34 per-country index files (`src/countries/<cc>/index.ts`).

Per-symbol spec files under `src/countries/<cc>/<doc>.ts` (e.g. `dui.ts`,
`curp.ts`) are *re-exported* from the country barrels; their file headers are
rich and well-cited (issuer, source URL, algorithm, confidence), so they are
treated as adequately documented even where the exported `Spec` const itself
has no JSDoc block immediately above it.

## Stats

| Metric | Count | % |
|---|---:|---:|
| Public exports (barrel files) | 378 | 100% |
| With any JSDoc block | 57 | 15.1% |
| With `@example` | 4 | 1.1% |
| With `@param` | 0 | 0.0% |
| With `@returns` | 0 | 0.0% |
| With `@throws` | 1 | 0.3% |
| With `@since` | 0 | 0.0% |
| With `@deprecated` | 0 | 0.0% |
| With `@internal` | 0 | 0.0% |
| TypeDoc configured | yes | — |
| TypeDoc build script | yes (`pnpm docs`) | — |
| `@packageDocumentation` blocks | 3 (root, `extract`, `i18n`) | — |

The 15.1% number understates the situation slightly: every spec const in
`src/countries/<cc>/<doc>.ts` carries a long header comment, but TypeDoc
attributes those comments to the *file*, not to the re-exported symbol. So
typedoc output for `duiSpec` (re-exported from `nationid/sv`) currently shows
no description even though `dui.ts` has 18 lines of context.

### Per-file breakdown

| File | Symbols | With JSDoc |
|---|---:|---:|
| `src/index.ts` | 8 | 7 |
| `src/algorithms/index.ts` | 8 | 4 |
| `src/extract/index.ts` | 8 | 4 |
| `src/pii/index.ts` | 5 | 1 |
| `src/i18n/index.ts` | 5 | 3 |
| `src/i18n/locales/{es,en,pt}.ts` | 9 | 6 |
| `src/catalog/index.ts` | 7 | 3 |
| `src/countries/<cc>/index.ts` (×34) | 328 | 29 |
| **Totals** | **378** | **57** |

Country barrel pattern (consistent across 31 of 34 files): the helper that
gets a one-liner is always `validate`. `format`, `normalize`, `parse`, the
`xxBundle` const, and the per-country `XXDocumentType` union have no
JSDoc. The remaining 3 country barrels (`ch`, `dk`, `fi`, `no`, `pl` — five,
not three) have no helper-level JSDoc at all; only the file header.

## TypeDoc setup

Already configured — `typedoc.json` exists, `pnpm docs` produces
`docs-site/index.html`, GitHub Pages is wired (`hideGenerator`, `githubPages`,
`navigationLinks` to GitHub + npm). Entry points cover root + algorithms +
all country barrels. Subpaths `extract`, `pii`, `i18n`, `catalog` are
**missing** from `entryPoints` — only their reachable symbols leak into the
generated site through transitive references. That is a real coverage gap.

Validation flags `notDocumented: false`, so missing JSDoc never fails the
build. Should be flipped to `true` (or a warn-only intermediate step) before
v1.0.

Current `typedoc.json` `entryPoints`:

```json
["src/index.ts", "src/algorithms/index.ts", "src/countries/*/index.ts"]
```

Missing: `src/extract/index.ts`, `src/pii/index.ts`, `src/i18n/index.ts`,
`src/i18n/locales/*.ts`, `src/catalog/index.ts`.

## Critical gaps (v1.0 blockers)

Each item below is a public API symbol on the top level of a published
subpath. v1.0 cannot ship without at least a one-paragraph description and
one minimal runnable `@example` per item.

### 1. Root API — `validate`, `format`, `normalize`, `parse`, `getSpec`

`src/index.ts:132,150,157,165,172`

These are the five functions every consumer reaches first. Today only
`validate` has an `@example` (two lines, no expected output), and only
`getSpec` has `@throws`. None document parameters, return types, or expected
output for the example.

Suggested for `validate`:

```ts
/**
 * Validate `input` against the document type identified by `code`.
 *
 * Normalizes the input first (strips separators, uppercases) then runs both
 * the format regex and the check-digit algorithm. Returns `true` only if both
 * pass. Never throws on input errors — only on an unregistered `code`.
 *
 * @param code - Stable document-type code, e.g. `"SV_DUI"`, `"BR_CPF"`.
 * @param input - User-supplied string. Whitespace and separators are tolerated.
 * @returns `true` if `input` is a valid document of type `code`.
 * @throws if `code` is not a registered `DocumentTypeCode`.
 * @example
 * import { validate } from "nationid";
 *
 * validate("SV_DUI", "04567890-3");      // → true
 * validate("BR_CPF", "111.444.777-35");  // → true
 * validate("BR_CPF", "111.111.111-11");  // → false (repdigit guard)
 * @since 0.1.0
 */
```

Apply the same shape (`@param` / `@returns` / `@example` with `→` output / `@since`)
to `format`, `normalize`, `parse`, `getSpec`, `listSupportedCodes`,
`listSupportedCountries`.

### 2. `parse` — needs an `@example` that shows the `ParseResult` shape

`src/index.ts:172`

`parse` is the only entry point that does not throw and the only one that
exposes the `ParseError` discriminator. Without an example, consumers do not
discover that `result.ok` narrows the shape.

```ts
/**
 * @example
 * const r = parse("BR_CPF", "111.111.111-11");
 * if (!r.ok) {
 *   r.reason.kind;  // "invalid_checksum"
 * }
 */
```

### 3. PII subpath — `lastN`, `hash` have no JSDoc on the exported function

`src/pii/last-n.ts:15`, `src/pii/hash.ts:46`

`mask` is documented with example. `lastN` is a one-liner (the file header
explains it, but TypeDoc attributes that to the module not the function).
`hash` has a description but no `@example` and no warning about the
production-salt requirement at the symbol level (the salt warning lives in
the file header and the `HashOptions.salt` JSDoc, both of which TypeDoc may
display far from the call site).

Suggested for `hash`:

```ts
/**
 * @example
 * const fingerprint = await hash("BR_CPF", "111.444.777-35", {
 *   salt: process.env.TENANT_SALT,   // REQUIRED in production
 *   algorithm: "SHA-256",
 * });
 * // → "9f1d…" (64 hex chars)
 *
 * @remarks
 * **Never call `hash` without a salt in production.** Raw SHA-256 of an
 * 11-digit CPF is rainbow-table-trivial. Use a per-tenant or per-user salt.
 */
```

Suggested for `lastN`:

```ts
/**
 * Returns the last `n` chars of the canonical normalized form.
 *
 * Useful for storing `last4`-style search-friendly indexes alongside an
 * encrypted full document. Because the input is normalized first,
 * `"12.345.678/0001-90"` and `"12345678000190"` produce the same result.
 *
 * @example
 * lastN("BR_CNPJ", "12.345.678/0001-90");      // → "0190"
 * lastN("SV_DUI",  "012345678", 3);            // → "678"
 * @since 0.3.0
 */
```

### 4. Algorithms subpath — half of the exports have no JSDoc

`src/algorithms/index.ts:7-9`

`mrzCharValue`, `toMrzField9`, `validateMrzNumber`, `mrzCheckDigit`,
`luhnValid`, `luhnCheckDigit`, `cycleWeights`, `mod11WeightedSum` — eight
exports total. Four are documented in their source files; **none** carries an
`@example`. These are the most reusable primitives in the package and are
the symbols an OSS consumer is likeliest to import individually.

Suggested for `luhnValid`:

```ts
/**
 * @example
 * luhnValid("79927398713");  // → true  (canonical Wikipedia specimen)
 * luhnValid("79927398710");  // → false
 * @since 0.1.0
 */
```

Suggested for `mod11WeightedSum`:

```ts
/**
 * @example
 * // CO NIT check digit: weights [3,7,13,17,19,23,29,37,41,43,47,53,59,67,71]
 * const weights = [41, 37, 29, 23, 19, 17, 13, 7, 3];
 * mod11WeightedSum("900123456", weights);  // → 123 (caller does 11 - n % 11)
 * @since 0.1.0
 */
```

### 5. Catalog subpath — no `@example` on individual functions

`src/catalog/index.ts:74,90,102`

There is one `@example` on the `@packageDocumentation` block at the top of
the file, but `listDocuments`, `getDocumentInfo`, and `listDocumentsByPurpose`
each need their own.

Suggested for `listDocuments`:

```ts
/**
 * @example
 * import { listDocuments } from "nationid/catalog";
 *
 * const options = listDocuments("MX", "es");
 * // → [
 * //     { code: "MX_CURP", displayName: "CURP", longName: "Clave Única…", … },
 * //     { code: "MX_RFC_PF", displayName: "RFC (Persona Física)", … },
 * //     …
 * //   ]
 * @since 0.3.0
 */
```

### 6. Extract subpath — all four functions are one-liners

`src/extract/index.ts:47,54,67,82`

`supports`, `extractDOB`, `extractSex`, `extractRegion` each have a single
sentence. None carries an example. Extract is the v0.3 feature that needs the
strongest "here is the discriminated return" demo in TypeDoc, because the
fact that all extractors return `null` on validation failure is surprising.

```ts
/**
 * @example
 * extractDOB("MX_CURP", "GOMC850315HDFRRR07");
 * // → { year: 1985, month: 3, day: 15 }
 *
 * extractDOB("MX_CURP", "INVALID");
 * // → null  (parse failed; never see an unverified body)
 *
 * extractDOB("SV_DUI", "04567890-3");
 * // → null  (DUI does not encode DOB)
 * @since 0.3.0
 */
```

### 7. i18n subpath — `SUPPORTED_LOCALES` and `DEFAULT_LOCALE` have no JSDoc

`src/i18n/index.ts:26,28`

These are the two consts a consumer imports to render a locale switcher.
`Locale` has a doc; the consts do not. `getErrorTemplate` lacks an
`@example`. `getErrorMessage` has good examples but no `@since`.

```ts
/**
 * The locales `nationid` ships error-message translations for.
 *
 * Use this to render a "language" selector or to validate user-supplied
 * locale strings before forwarding them to {@link getErrorMessage}.
 *
 * @example
 * <select>
 *   {SUPPORTED_LOCALES.map(l => <option key={l} value={l}>{l}</option>)}
 * </select>
 * @since 0.3.0
 */
```

### 8. Country barrels — `format`, `normalize`, `parse`, `xxBundle`, `XXDocumentType`

34 files × 5 symbols each = **170 undocumented public symbols**, all
following the identical pattern. Only `validate` gets a one-liner ("Country-
scoped validate: pass either `XX_FOO` or just `FOO`."). `format` /
`normalize` / `parse` need the same one-liner, and the bundle / type need a
short description.

Mechanical fix — a single search/replace per country can add:

```ts
/** Country-scoped format: accepts `XX_FOO` or `FOO`. */
export function format(...) { ... }

/** Country-scoped normalize: accepts `XX_FOO` or `FOO`. */
export function normalize(...) { ... }

/** Country-scoped parse: accepts `XX_FOO` or `FOO`. Never throws on input errors. */
export function parse(...) { ... }

/** Bundle of every {@link DocumentSpec} for {country}. Used by the root registry. */
export const xxBundle: CountryDocumentBundle = { … };
```

And country-level `@example` (one per country bundle is enough — it is what
appears on the per-country TypeDoc page):

```ts
/**
 * @example
 * import { validate, format } from "nationid/sv";
 *
 * validate("DUI", "04567890-3");       // → true
 * format("DUI", "045678903");          // → "04567890-3"
 * validate("NIT", "06141505851012");   // → true
 * @since 0.1.0
 */
```

### 9. Five v0.6 country barrels missing helper-level JSDoc entirely

`src/countries/{ch,dk,fi,no,pl}/index.ts`

The file header is present, but none of `validate`, `format`, `normalize`,
`parse` have the one-liner the other 29 countries have. Easy fix during the
mass pass in item 8.

## Lower-priority gaps

Aggregate counts. These are visible in TypeDoc but unlikely to confuse a
consumer:

- **i18n/locales: `ErrorTemplates` type alias** in each of `es.ts`, `en.ts`,
  `pt.ts` (3 symbols) — derived type, never referenced by external consumers.
  One-line JSDoc each.
- **Country `XXDocumentType` unions** (34 symbols) — generated from `keyof
  typeof SPECS`. A single-sentence "Discriminated union of {country}
  document codes" suffices.
- **Per-country re-exported `*Spec` consts** (~118 symbols) — documented at
  the source file level. TypeDoc *should* surface the source comment via
  `@inheritDoc`, but this needs verification. If TypeDoc does not, a one-line
  `/** {country} {document} spec — see source file for algorithm details. */`
  above each re-export line is the cheapest fix.
- **`CountryDocumentBundle.{personal,tax,defaultPersonal,defaultTax}`
  members** — interface members, documented on the interface. TypeDoc
  propagates them; no action needed.

## TypeDoc setup recommendations

The existing config is solid. Three changes for v1.0:

1. **Add missing entry points** so the subpaths actually render:
   ```json
   "entryPoints": [
     "src/index.ts",
     "src/algorithms/index.ts",
     "src/extract/index.ts",
     "src/pii/index.ts",
     "src/i18n/index.ts",
     "src/i18n/locales/es.ts",
     "src/i18n/locales/en.ts",
     "src/i18n/locales/pt.ts",
     "src/catalog/index.ts",
     "src/countries/*/index.ts"
   ]
   ```

2. **Phase in `notDocumented: true`** as a build gate. Two-step:
   - Step 1 (this PR): set `notDocumented: true`, `treatWarningsAsErrors: false`,
     run `pnpm docs:check` in CI to surface the warning count without failing.
   - Step 2 (after the bulk JSDoc pass): flip `treatWarningsAsErrors: true`.

3. **Add `categoryOrder`** so the navigation matches the README layout
   (`Root`, `Algorithms`, `Extract`, `PII`, `i18n`, `Catalog`, `Countries`).
   Plus a small README badge linking to the deployed Pages site for
   discoverability.

Optional but valuable:

- Add `"@category"` tags to each export so TypeDoc groups consistently.
- Add `"@group"` tags on the country barrel functions
  (`validate`/`format`/`normalize`/`parse` → group "Operations"; `xxBundle` →
  group "Registry").
- Enable `searchInComments` for richer search results.

## Recommendation

Five bullets, ordered by ROI.

1. **One-day bulk pass on the country barrels.** A scripted template +
   review can add the one-liner JSDoc to all 170 missing symbols
   (`format`/`normalize`/`parse`/`xxBundle`/`XXDocumentType` × 34) plus one
   `@example` per country. Estimate: **4 hours** including manual review.
   Lifts coverage from 15% to ~60% in one PR.

2. **Half-day pass on the public sub-API barrels.** Adds `@example`,
   `@param`, `@returns`, `@since` to the 30-ish functions in
   `index.ts`, `algorithms`, `extract`, `pii`, `i18n`, `catalog`.
   Estimate: **3 hours**. Lifts coverage to ~85%.

3. **Add the missing TypeDoc entry points** (15 minutes) and run
   `pnpm docs:check` to surface the remaining gaps with line numbers.

4. **Adopt `@since` everywhere in the same pass.** v0.1.0, v0.3.0, v0.4.0,
   v0.5.0, v0.6.0 are all easy to assign from `CHANGELOG.md`. Marginal cost
   on top of the bulk passes: **30 minutes**.

5. **Flip `notDocumented: true` and add `pnpm docs:check` to `pnpm verify`**
   so JSDoc gaps are caught before publish. The hook is already a one-liner
   in `package.json` (currently runs `lint && typecheck && test && build &&
   test:dist`).

**Total effort to reach v1.0 documentation bar: roughly 8 hours of focused
work** (one working day). After that, the docs site at the configured
`docs-site/` will render every public symbol with description + example +
version, and `pnpm verify` will block any regression.
